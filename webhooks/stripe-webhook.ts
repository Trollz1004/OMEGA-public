/**
 * Stripe Webhook Handler
 * FOR THE KIDS Platform - Gospel V1.4.1 SURVIVAL MODE
 *
 * CRITICAL: This handler requires RAW BODY for signature verification.
 * Use express.raw({ type: 'application/json' }) middleware on webhook routes.
 */

import Stripe from 'stripe';
import { Request, Response } from 'express';

// Initialize Stripe with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * Stripe Event Types we handle
 */
export const STRIPE_EVENTS = {
  // Checkout events
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  CHECKOUT_EXPIRED: 'checkout.session.expired',
  CHECKOUT_ASYNC_PAYMENT_SUCCEEDED: 'checkout.session.async_payment_succeeded',
  CHECKOUT_ASYNC_PAYMENT_FAILED: 'checkout.session.async_payment_failed',

  // Payment Intent events
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
  PAYMENT_INTENT_CANCELED: 'payment_intent.canceled',
  PAYMENT_INTENT_CREATED: 'payment_intent.created',

  // Subscription events
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  SUBSCRIPTION_TRIAL_ENDING: 'customer.subscription.trial_will_end',

  // Invoice events
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  INVOICE_UPCOMING: 'invoice.upcoming',

  // Refund events
  CHARGE_REFUNDED: 'charge.refunded',
  CHARGE_DISPUTE_CREATED: 'charge.dispute.created',
} as const;

/**
 * Payment record structure for database storage
 */
export interface PaymentRecord {
  id: string;
  provider: 'stripe';
  eventType: string;
  customerId?: string;
  customerEmail?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded' | 'disputed';
  metadata: Record<string, unknown>;
  createdAt: Date;
  rawEvent: Stripe.Event;
}

/**
 * Verify Stripe webhook signature and construct event
 *
 * @param rawBody - Raw request body (Buffer or string)
 * @param signature - Stripe-Signature header value
 * @param webhookSecret - Webhook endpoint secret from Stripe Dashboard
 * @returns Constructed Stripe Event or throws error
 */
export function verifyStripeSignature(
  rawBody: Buffer | string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    throw new Error(`Stripe signature verification failed: ${error.message}`);
  }
}

/**
 * Process checkout.session.completed event
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<PaymentRecord> {
  // Retrieve full session with line items if needed
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items', 'customer'],
  });

  const record: PaymentRecord = {
    id: session.id,
    provider: 'stripe',
    eventType: STRIPE_EVENTS.CHECKOUT_COMPLETED,
    customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
    customerEmail: session.customer_details?.email || undefined,
    amount: session.amount_total || 0,
    currency: session.currency || 'usd',
    status: 'succeeded',
    metadata: {
      paymentIntent: session.payment_intent,
      subscriptionId: session.subscription,
      mode: session.mode,
      lineItems: fullSession.line_items?.data,
    },
    createdAt: new Date(session.created * 1000),
    rawEvent: {} as Stripe.Event, // Will be set by handler
  };

  // TODO: Save to database
  console.log('[Stripe] Checkout completed:', record.id);

  return record;
}

/**
 * Process payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<PaymentRecord> {
  const record: PaymentRecord = {
    id: paymentIntent.id,
    provider: 'stripe',
    eventType: STRIPE_EVENTS.PAYMENT_INTENT_SUCCEEDED,
    customerId: typeof paymentIntent.customer === 'string'
      ? paymentIntent.customer
      : paymentIntent.customer?.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: 'succeeded',
    metadata: {
      paymentMethod: paymentIntent.payment_method,
      receiptEmail: paymentIntent.receipt_email,
      description: paymentIntent.description,
      ...paymentIntent.metadata,
    },
    createdAt: new Date(paymentIntent.created * 1000),
    rawEvent: {} as Stripe.Event,
  };

  // TODO: Save to database
  console.log('[Stripe] Payment succeeded:', record.id, record.amount / 100, record.currency.toUpperCase());

  return record;
}

/**
 * Process payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<PaymentRecord> {
  const record: PaymentRecord = {
    id: paymentIntent.id,
    provider: 'stripe',
    eventType: STRIPE_EVENTS.PAYMENT_INTENT_FAILED,
    customerId: typeof paymentIntent.customer === 'string'
      ? paymentIntent.customer
      : paymentIntent.customer?.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: 'failed',
    metadata: {
      lastError: paymentIntent.last_payment_error,
      failureCode: paymentIntent.last_payment_error?.code,
      failureMessage: paymentIntent.last_payment_error?.message,
    },
    createdAt: new Date(paymentIntent.created * 1000),
    rawEvent: {} as Stripe.Event,
  };

  // TODO: Save to database and trigger failure notification
  console.error('[Stripe] Payment failed:', record.id, paymentIntent.last_payment_error?.message);

  return record;
}

/**
 * Process subscription events
 */
async function handleSubscriptionEvent(
  subscription: Stripe.Subscription,
  eventType: string
): Promise<PaymentRecord> {
  const record: PaymentRecord = {
    id: subscription.id,
    provider: 'stripe',
    eventType,
    customerId: typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id,
    amount: subscription.items.data[0]?.price?.unit_amount || 0,
    currency: subscription.currency,
    status: subscription.status === 'active' ? 'succeeded' : 'pending',
    metadata: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      items: subscription.items.data.map(item => ({
        priceId: item.price?.id,
        productId: typeof item.price?.product === 'string'
          ? item.price.product
          : item.price?.product?.id,
        quantity: item.quantity,
      })),
    },
    createdAt: new Date(subscription.created * 1000),
    rawEvent: {} as Stripe.Event,
  };

  // TODO: Save to database
  console.log('[Stripe] Subscription event:', eventType, record.id);

  return record;
}

/**
 * Process charge.refunded event
 */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<PaymentRecord> {
  const record: PaymentRecord = {
    id: charge.id,
    provider: 'stripe',
    eventType: STRIPE_EVENTS.CHARGE_REFUNDED,
    customerId: typeof charge.customer === 'string' ? charge.customer : charge.customer?.id,
    amount: charge.amount_refunded,
    currency: charge.currency,
    status: 'refunded',
    metadata: {
      originalAmount: charge.amount,
      refundedAmount: charge.amount_refunded,
      refunded: charge.refunded,
      paymentIntent: charge.payment_intent,
    },
    createdAt: new Date(charge.created * 1000),
    rawEvent: {} as Stripe.Event,
  };

  // TODO: Save to database and handle refund logic
  console.log('[Stripe] Charge refunded:', record.id);

  return record;
}

/**
 * Process charge.dispute.created event
 */
async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<PaymentRecord> {
  const record: PaymentRecord = {
    id: dispute.id,
    provider: 'stripe',
    eventType: STRIPE_EVENTS.CHARGE_DISPUTE_CREATED,
    amount: dispute.amount,
    currency: dispute.currency,
    status: 'disputed',
    metadata: {
      chargeId: dispute.charge,
      reason: dispute.reason,
      status: dispute.status,
      evidenceDueBy: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000)
        : null,
    },
    createdAt: new Date(dispute.created * 1000),
    rawEvent: {} as Stripe.Event,
  };

  // TODO: Save to database and alert team about dispute
  console.error('[Stripe] DISPUTE CREATED:', record.id, dispute.reason);

  return record;
}

/**
 * Main Stripe webhook handler
 *
 * CRITICAL: Requires raw body for signature verification
 * Configure your Express app with:
 *   app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
 */
export async function handleStripeWebhook(
  req: Request,
  res: Response
): Promise<Response> {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    console.error('[Stripe] Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  if (!webhookSecret) {
    console.error('[Stripe] STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    event = verifyStripeSignature(req.body, sig, webhookSecret);
  } catch (err) {
    const error = err as Error;
    console.error('[Stripe] Webhook signature verification failed:', error.message);
    return res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }

  // Log event for debugging
  console.log('[Stripe] Received event:', event.type, event.id);

  try {
    let record: PaymentRecord | null = null;

    switch (event.type) {
      // Checkout events
      case STRIPE_EVENTS.CHECKOUT_COMPLETED:
        record = await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // Payment Intent events
      case STRIPE_EVENTS.PAYMENT_INTENT_SUCCEEDED:
        record = await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case STRIPE_EVENTS.PAYMENT_INTENT_FAILED:
        record = await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      // Subscription events
      case STRIPE_EVENTS.SUBSCRIPTION_CREATED:
      case STRIPE_EVENTS.SUBSCRIPTION_UPDATED:
      case STRIPE_EVENTS.SUBSCRIPTION_DELETED:
      case STRIPE_EVENTS.SUBSCRIPTION_TRIAL_ENDING:
        record = await handleSubscriptionEvent(
          event.data.object as Stripe.Subscription,
          event.type
        );
        break;

      // Invoice events
      case STRIPE_EVENTS.INVOICE_PAID:
        console.log('[Stripe] Invoice paid:', (event.data.object as Stripe.Invoice).id);
        break;

      case STRIPE_EVENTS.INVOICE_PAYMENT_FAILED:
        console.error('[Stripe] Invoice payment failed:', (event.data.object as Stripe.Invoice).id);
        break;

      // Refund and dispute events
      case STRIPE_EVENTS.CHARGE_REFUNDED:
        record = await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case STRIPE_EVENTS.CHARGE_DISPUTE_CREATED:
        record = await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      default:
        console.log('[Stripe] Unhandled event type:', event.type);
    }

    if (record) {
      record.rawEvent = event;
    }

    // Return 200 to acknowledge receipt
    return res.status(200).json({
      received: true,
      eventId: event.id,
      eventType: event.type,
    });
  } catch (err) {
    const error = err as Error;
    console.error('[Stripe] Error processing webhook:', error.message);
    // Return 500 so Stripe will retry
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get Stripe instance for external use
 */
export function getStripeInstance(): Stripe {
  return stripe;
}

export default handleStripeWebhook;
