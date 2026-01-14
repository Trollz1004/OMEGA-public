/**
 * Square Webhook Handler
 * FOR THE KIDS Platform - Gospel V1.4.1 SURVIVAL MODE
 *
 * Square uses HMAC-SHA256 for webhook signature verification.
 * Formula: HMAC-SHA256(notificationUrl + rawBody, signatureKey)
 */

import crypto from 'crypto';
import { Request, Response } from 'express';

/**
 * Square Event Types we handle
 */
export const SQUARE_EVENTS = {
  // Payment events
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_UPDATED: 'payment.updated',
  PAYMENT_COMPLETED: 'payment.completed',

  // Order events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_FULFILLED: 'order.fulfillment.updated',

  // Refund events
  REFUND_CREATED: 'refund.created',
  REFUND_UPDATED: 'refund.updated',

  // Invoice events
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PUBLISHED: 'invoice.published',
  INVOICE_PAYMENT_MADE: 'invoice.payment_made',
  INVOICE_CANCELED: 'invoice.canceled',

  // Subscription events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',

  // Dispute events
  DISPUTE_CREATED: 'dispute.created',
  DISPUTE_STATE_CHANGED: 'dispute.state.changed',

  // Customer events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
} as const;

/**
 * Square webhook event structure
 */
export interface SquareWebhookEvent {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: {
    type: string;
    id: string;
    object: Record<string, unknown>;
  };
}

/**
 * Square payment object structure
 */
export interface SquarePayment {
  id: string;
  created_at: string;
  updated_at: string;
  amount_money: {
    amount: number;
    currency: string;
  };
  status: 'APPROVED' | 'PENDING' | 'COMPLETED' | 'CANCELED' | 'FAILED';
  source_type: string;
  location_id: string;
  order_id?: string;
  customer_id?: string;
  receipt_number?: string;
  receipt_url?: string;
  processing_fee?: Array<{
    effective_at: string;
    type: string;
    amount_money: {
      amount: number;
      currency: string;
    };
  }>;
  note?: string;
  reference_id?: string;
}

/**
 * Payment record structure for database storage
 */
export interface PaymentRecord {
  id: string;
  provider: 'square';
  eventType: string;
  customerId?: string;
  orderId?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded' | 'disputed';
  metadata: Record<string, unknown>;
  createdAt: Date;
  rawEvent: SquareWebhookEvent;
}

/**
 * Verify Square webhook signature using HMAC-SHA256
 *
 * Square's signature formula:
 * signature = Base64(HMAC-SHA256(notificationUrl + rawBody, signatureKey))
 *
 * @param notificationUrl - The full URL that received the webhook (must match exactly)
 * @param rawBody - Raw request body as string
 * @param signature - x-square-hmacsha256-signature header value
 * @param signatureKey - Webhook signature key from Square Dashboard
 * @returns true if signature is valid
 */
export function verifySquareSignature(
  notificationUrl: string,
  rawBody: string,
  signature: string,
  signatureKey: string
): boolean {
  if (!notificationUrl || !rawBody || !signature || !signatureKey) {
    console.error('[Square] Missing parameters for signature verification');
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', signatureKey);
    hmac.update(notificationUrl + rawBody);
    const expectedSignature = hmac.digest('base64');

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (err) {
    const error = err as Error;
    console.error('[Square] Signature verification error:', error.message);
    return false;
  }
}

/**
 * Map Square payment status to normalized status
 */
function mapSquareStatus(status: string): PaymentRecord['status'] {
  switch (status) {
    case 'COMPLETED':
    case 'APPROVED':
      return 'succeeded';
    case 'FAILED':
    case 'CANCELED':
      return 'failed';
    case 'PENDING':
    default:
      return 'pending';
  }
}

/**
 * Process payment.completed event
 */
async function handlePaymentCompleted(
  event: SquareWebhookEvent
): Promise<PaymentRecord> {
  const payment = event.data.object.payment as SquarePayment;

  const record: PaymentRecord = {
    id: payment.id,
    provider: 'square',
    eventType: event.type,
    customerId: payment.customer_id,
    orderId: payment.order_id,
    amount: payment.amount_money.amount,
    currency: payment.amount_money.currency,
    status: mapSquareStatus(payment.status),
    metadata: {
      locationId: payment.location_id,
      sourceType: payment.source_type,
      receiptNumber: payment.receipt_number,
      receiptUrl: payment.receipt_url,
      processingFee: payment.processing_fee,
      note: payment.note,
      referenceId: payment.reference_id,
    },
    createdAt: new Date(payment.created_at),
    rawEvent: event,
  };

  // TODO: Save to database
  console.log('[Square] Payment completed:', record.id, record.amount / 100, record.currency);

  return record;
}

/**
 * Process payment.created event
 */
async function handlePaymentCreated(
  event: SquareWebhookEvent
): Promise<PaymentRecord> {
  const payment = event.data.object.payment as SquarePayment;

  const record: PaymentRecord = {
    id: payment.id,
    provider: 'square',
    eventType: event.type,
    customerId: payment.customer_id,
    orderId: payment.order_id,
    amount: payment.amount_money.amount,
    currency: payment.amount_money.currency,
    status: mapSquareStatus(payment.status),
    metadata: {
      locationId: payment.location_id,
      sourceType: payment.source_type,
    },
    createdAt: new Date(payment.created_at),
    rawEvent: event,
  };

  // TODO: Save to database
  console.log('[Square] Payment created:', record.id);

  return record;
}

/**
 * Process refund events
 */
async function handleRefundEvent(
  event: SquareWebhookEvent
): Promise<PaymentRecord> {
  const refund = event.data.object.refund as {
    id: string;
    payment_id: string;
    amount_money: { amount: number; currency: string };
    status: string;
    created_at: string;
    reason?: string;
  };

  const record: PaymentRecord = {
    id: refund.id,
    provider: 'square',
    eventType: event.type,
    amount: refund.amount_money.amount,
    currency: refund.amount_money.currency,
    status: 'refunded',
    metadata: {
      paymentId: refund.payment_id,
      refundStatus: refund.status,
      reason: refund.reason,
    },
    createdAt: new Date(refund.created_at),
    rawEvent: event,
  };

  // TODO: Save to database
  console.log('[Square] Refund processed:', record.id);

  return record;
}

/**
 * Process dispute events
 */
async function handleDisputeEvent(
  event: SquareWebhookEvent
): Promise<PaymentRecord> {
  const dispute = event.data.object.dispute as {
    id: string;
    dispute_id: string;
    amount_money: { amount: number; currency: string };
    state: string;
    reason: string;
    created_at: string;
    due_at?: string;
  };

  const record: PaymentRecord = {
    id: dispute.dispute_id || dispute.id,
    provider: 'square',
    eventType: event.type,
    amount: dispute.amount_money.amount,
    currency: dispute.amount_money.currency,
    status: 'disputed',
    metadata: {
      state: dispute.state,
      reason: dispute.reason,
      dueAt: dispute.due_at,
    },
    createdAt: new Date(dispute.created_at),
    rawEvent: event,
  };

  // TODO: Save to database and alert team
  console.error('[Square] DISPUTE:', record.id, dispute.reason, dispute.state);

  return record;
}

/**
 * Process order events
 */
async function handleOrderEvent(
  event: SquareWebhookEvent
): Promise<PaymentRecord | null> {
  const order = event.data.object.order as {
    id: string;
    location_id: string;
    customer_id?: string;
    total_money: { amount: number; currency: string };
    state: string;
    created_at: string;
    fulfillments?: Array<{ state: string }>;
  };

  const record: PaymentRecord = {
    id: order.id,
    provider: 'square',
    eventType: event.type,
    customerId: order.customer_id,
    orderId: order.id,
    amount: order.total_money.amount,
    currency: order.total_money.currency,
    status: order.state === 'COMPLETED' ? 'succeeded' : 'pending',
    metadata: {
      locationId: order.location_id,
      state: order.state,
      fulfillments: order.fulfillments,
    },
    createdAt: new Date(order.created_at),
    rawEvent: event,
  };

  // TODO: Save to database
  console.log('[Square] Order event:', event.type, record.id);

  return record;
}

/**
 * Process invoice events
 */
async function handleInvoiceEvent(
  event: SquareWebhookEvent
): Promise<PaymentRecord | null> {
  const invoice = event.data.object.invoice as {
    id: string;
    invoice_number?: string;
    primary_recipient?: { customer_id: string };
    payment_requests?: Array<{
      computed_amount_money: { amount: number; currency: string };
    }>;
    status: string;
    created_at: string;
  };

  const amount = invoice.payment_requests?.[0]?.computed_amount_money?.amount || 0;
  const currency = invoice.payment_requests?.[0]?.computed_amount_money?.currency || 'USD';

  const record: PaymentRecord = {
    id: invoice.id,
    provider: 'square',
    eventType: event.type,
    customerId: invoice.primary_recipient?.customer_id,
    amount,
    currency,
    status: invoice.status === 'PAID' ? 'succeeded' : 'pending',
    metadata: {
      invoiceNumber: invoice.invoice_number,
      status: invoice.status,
    },
    createdAt: new Date(invoice.created_at),
    rawEvent: event,
  };

  // TODO: Save to database
  console.log('[Square] Invoice event:', event.type, record.id);

  return record;
}

/**
 * Main Square webhook handler
 *
 * CRITICAL: Requires raw body for signature verification
 * Configure your Express app with:
 *   app.post('/webhooks/square', express.raw({ type: 'application/json' }), handleSquareWebhook);
 */
export async function handleSquareWebhook(
  req: Request,
  res: Response
): Promise<Response> {
  const signature = req.headers['x-square-hmacsha256-signature'] as string;
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const webhookUrl = process.env.SQUARE_WEBHOOK_URL;

  if (!signature) {
    console.error('[Square] Missing x-square-hmacsha256-signature header');
    return res.status(400).json({ error: 'Missing signature header' });
  }

  if (!signatureKey || !webhookUrl) {
    console.error('[Square] SQUARE_WEBHOOK_SIGNATURE_KEY or SQUARE_WEBHOOK_URL not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  // Get raw body as string
  const rawBody = typeof req.body === 'string'
    ? req.body
    : req.body.toString('utf8');

  // Verify signature
  const isValid = verifySquareSignature(webhookUrl, rawBody, signature, signatureKey);

  if (!isValid) {
    console.error('[Square] Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse the event
  let event: SquareWebhookEvent;
  try {
    event = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : JSON.parse(rawBody);
  } catch (err) {
    console.error('[Square] Failed to parse webhook body');
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Log event for debugging
  console.log('[Square] Received event:', event.type, event.event_id);

  try {
    let record: PaymentRecord | null = null;

    switch (event.type) {
      // Payment events
      case SQUARE_EVENTS.PAYMENT_COMPLETED:
        record = await handlePaymentCompleted(event);
        break;

      case SQUARE_EVENTS.PAYMENT_CREATED:
        record = await handlePaymentCreated(event);
        break;

      case SQUARE_EVENTS.PAYMENT_UPDATED:
        console.log('[Square] Payment updated:', event.data.id);
        break;

      // Refund events
      case SQUARE_EVENTS.REFUND_CREATED:
      case SQUARE_EVENTS.REFUND_UPDATED:
        record = await handleRefundEvent(event);
        break;

      // Order events
      case SQUARE_EVENTS.ORDER_CREATED:
      case SQUARE_EVENTS.ORDER_UPDATED:
      case SQUARE_EVENTS.ORDER_FULFILLED:
        record = await handleOrderEvent(event);
        break;

      // Invoice events
      case SQUARE_EVENTS.INVOICE_CREATED:
      case SQUARE_EVENTS.INVOICE_PUBLISHED:
      case SQUARE_EVENTS.INVOICE_PAYMENT_MADE:
      case SQUARE_EVENTS.INVOICE_CANCELED:
        record = await handleInvoiceEvent(event);
        break;

      // Dispute events
      case SQUARE_EVENTS.DISPUTE_CREATED:
      case SQUARE_EVENTS.DISPUTE_STATE_CHANGED:
        record = await handleDisputeEvent(event);
        break;

      // Customer events
      case SQUARE_EVENTS.CUSTOMER_CREATED:
      case SQUARE_EVENTS.CUSTOMER_UPDATED:
        console.log('[Square] Customer event:', event.type, event.data.id);
        break;

      default:
        console.log('[Square] Unhandled event type:', event.type);
    }

    // Return 200 to acknowledge receipt
    return res.status(200).json({
      received: true,
      eventId: event.event_id,
      eventType: event.type,
    });
  } catch (err) {
    const error = err as Error;
    console.error('[Square] Error processing webhook:', error.message);
    // Return 500 so Square will retry
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default handleSquareWebhook;
