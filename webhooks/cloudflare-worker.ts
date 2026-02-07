/**
 * Cloudflare Worker Webhook Handler
 * FOR THE KIDS Platform - Gospel V1.4.1 SURVIVAL MODE
 *
 * Alternative deployment option for webhook handling using Cloudflare Workers.
 * Provides edge-based webhook processing with global low latency.
 *
 * Deploy with: wrangler deploy
 */

/**
 * Environment bindings for Cloudflare Worker
 */
interface Env {
  // Stripe secrets
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_SECRET_KEY: string;

  // Square secrets
  SQUARE_WEBHOOK_SIGNATURE_KEY: string;
  SQUARE_WEBHOOK_URL: string;

  // Optional: KV namespace for webhook event deduplication
  WEBHOOK_EVENTS?: KVNamespace;

  // Optional: Durable Object for event processing
  WEBHOOK_PROCESSOR?: DurableObjectNamespace;
}

/**
 * Webhook event structure
 */
interface WebhookResult {
  success: boolean;
  eventId: string;
  eventType: string;
  provider: string;
  error?: string;
}

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify Stripe webhook signature using Web Crypto API
 *
 * Stripe signature format: t=timestamp,v1=signature
 */
async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance: number = 300 // 5 minutes
): Promise<boolean> {
  const parts = signature.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.slice(2);
  const v1Signature = parts.find(p => p.startsWith('v1='))?.slice(3);

  if (!timestamp || !v1Signature) {
    return false;
  }

  // Check timestamp tolerance
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > tolerance) {
    console.log('[Stripe] Signature timestamp outside tolerance');
    return false;
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );

  const expectedSignature = bufferToHex(signatureBuffer);

  // Constant-time comparison
  return expectedSignature === v1Signature;
}

/**
 * Verify Square webhook signature using Web Crypto API
 *
 * Square formula: Base64(HMAC-SHA256(notificationUrl + rawBody, signatureKey))
 */
async function verifySquareSignature(
  notificationUrl: string,
  rawBody: string,
  signature: string,
  signatureKey: string
): Promise<boolean> {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signatureKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(notificationUrl + rawBody)
  );

  // Convert to base64
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  return expectedSignature === signature;
}

/**
 * Handle Stripe webhook
 */
async function handleStripeWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await request.text();

  const isValid = await verifyStripeSignature(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const event = JSON.parse(rawBody);

    // Check for duplicate events using KV
    if (env.WEBHOOK_EVENTS) {
      const existing = await env.WEBHOOK_EVENTS.get(`stripe:${event.id}`);
      if (existing) {
        console.log('[Stripe] Duplicate event:', event.id);
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Store event ID with 24h TTL
      await env.WEBHOOK_EVENTS.put(`stripe:${event.id}`, 'processed', {
        expirationTtl: 86400,
      });
    }

    console.log('[Stripe] Processing event:', event.type, event.id);

    // Process event based on type
    const result = await processStripeEvent(event);

    return new Response(JSON.stringify({
      received: true,
      eventId: event.id,
      eventType: event.type,
      ...result,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const error = err as Error;
    console.error('[Stripe] Error:', error.message);
    return new Response(JSON.stringify({ error: 'Processing error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Process Stripe event
 */
async function processStripeEvent(event: any): Promise<Record<string, unknown>> {
  switch (event.type) {
    case 'checkout.session.completed':
      console.log('[Stripe] Checkout completed:', event.data.object.id);
      return { processed: true, type: 'checkout' };

    case 'payment_intent.succeeded':
      console.log('[Stripe] Payment succeeded:', event.data.object.id);
      return { processed: true, type: 'payment' };

    case 'payment_intent.payment_failed':
      console.error('[Stripe] Payment failed:', event.data.object.id);
      return { processed: true, type: 'payment_failed' };

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      console.log('[Stripe] Subscription event:', event.type);
      return { processed: true, type: 'subscription' };

    case 'charge.refunded':
      console.log('[Stripe] Refund:', event.data.object.id);
      return { processed: true, type: 'refund' };

    case 'charge.dispute.created':
      console.error('[Stripe] DISPUTE:', event.data.object.id);
      return { processed: true, type: 'dispute' };

    default:
      console.log('[Stripe] Unhandled event:', event.type);
      return { processed: false, unhandled: true };
  }
}

/**
 * Handle Square webhook
 */
async function handleSquareWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  const signature = request.headers.get('x-square-hmacsha256-signature');

  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.SQUARE_WEBHOOK_SIGNATURE_KEY || !env.SQUARE_WEBHOOK_URL) {
    return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await request.text();

  const isValid = await verifySquareSignature(
    env.SQUARE_WEBHOOK_URL,
    rawBody,
    signature,
    env.SQUARE_WEBHOOK_SIGNATURE_KEY
  );

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const event = JSON.parse(rawBody);

    // Check for duplicate events using KV
    if (env.WEBHOOK_EVENTS) {
      const existing = await env.WEBHOOK_EVENTS.get(`square:${event.event_id}`);
      if (existing) {
        console.log('[Square] Duplicate event:', event.event_id);
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      await env.WEBHOOK_EVENTS.put(`square:${event.event_id}`, 'processed', {
        expirationTtl: 86400,
      });
    }

    console.log('[Square] Processing event:', event.type, event.event_id);

    // Process event based on type
    const result = await processSquareEvent(event);

    return new Response(JSON.stringify({
      received: true,
      eventId: event.event_id,
      eventType: event.type,
      ...result,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const error = err as Error;
    console.error('[Square] Error:', error.message);
    return new Response(JSON.stringify({ error: 'Processing error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Process Square event
 */
async function processSquareEvent(event: any): Promise<Record<string, unknown>> {
  switch (event.type) {
    case 'payment.completed':
      console.log('[Square] Payment completed:', event.data.id);
      return { processed: true, type: 'payment' };

    case 'payment.created':
      console.log('[Square] Payment created:', event.data.id);
      return { processed: true, type: 'payment_created' };

    case 'refund.created':
    case 'refund.updated':
      console.log('[Square] Refund:', event.data.id);
      return { processed: true, type: 'refund' };

    case 'dispute.created':
    case 'dispute.state.changed':
      console.error('[Square] DISPUTE:', event.data.id);
      return { processed: true, type: 'dispute' };

    case 'order.created':
    case 'order.updated':
      console.log('[Square] Order:', event.type);
      return { processed: true, type: 'order' };

    case 'invoice.payment_made':
      console.log('[Square] Invoice paid:', event.data.id);
      return { processed: true, type: 'invoice' };

    default:
      console.log('[Square] Unhandled event:', event.type);
      return { processed: false, unhandled: true };
  }
}

/**
 * Handle health check
 */
function handleHealthCheck(): Response {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    runtime: 'cloudflare-workers',
    version: 'Gospel V1.4.1 SURVIVAL MODE',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Main fetch handler for Cloudflare Worker
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, stripe-signature, x-square-hmacsha256-signature',
        },
      });
    }

    // Route handling
    try {
      // Health check
      if (path === '/health' && request.method === 'GET') {
        return handleHealthCheck();
      }

      // Root endpoint
      if (path === '/' && request.method === 'GET') {
        return new Response(JSON.stringify({
          name: 'FOR THE KIDS Platform - Webhook Service',
          version: 'Gospel V1.4.1 SURVIVAL MODE',
          runtime: 'cloudflare-workers',
          endpoints: {
            health: '/health',
            stripeWebhook: '/webhooks/stripe',
            squareWebhook: '/webhooks/square',
          },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Stripe webhook
      if (path === '/webhooks/stripe' && request.method === 'POST') {
        return handleStripeWebhook(request, env);
      }

      // Square webhook
      if (path === '/webhooks/square' && request.method === 'POST') {
        return handleSquareWebhook(request, env);
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: `Route ${request.method} ${path} not found`,
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      const error = err as Error;
      console.error('[Worker] Unhandled error:', error.message);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

/**
 * Wrangler configuration (wrangler.toml)
 *
 * name = "forthekids-webhooks"
 * main = "webhooks/cloudflare-worker.ts"
 * compatibility_date = "2024-01-01"
 *
 * [vars]
 * # Non-sensitive vars can go here
 *
 * # Secrets (set via wrangler secret put):
 * # - STRIPE_WEBHOOK_SECRET
 * # - STRIPE_SECRET_KEY
 * # - SQUARE_WEBHOOK_SIGNATURE_KEY
 * # - SQUARE_WEBHOOK_URL
 *
 * # Optional KV namespace for deduplication
 * # [[kv_namespaces]]
 * # binding = "WEBHOOK_EVENTS"
 * # id = "your-kv-namespace-id"
 */
