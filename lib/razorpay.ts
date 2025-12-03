import Razorpay from 'razorpay';
import crypto from 'crypto';

// Handle missing environment variables gracefully during build time
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

// Only check for required environment variables at runtime, not build time
function checkRazorpayCredentials() {
  if ((!razorpayKeyId || !razorpayKeySecret) && process.env.NODE_ENV === 'production') {
    throw new Error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variable in production');
  }
}

// Use placeholder keys during build time if not available
export const razorpay = new Razorpay({
  key_id: razorpayKeyId || 'rzp_test_placeholder',
  key_secret: razorpayKeySecret || 'placeholder_secret',
});

export interface RazorpayOrderParams {
  amount: number; // in smallest currency unit (paise for INR)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface RazorpaySubscriptionParams {
  plan_id: string;
  customer_notify?: 0 | 1;
  quantity?: number;
  notes?: Record<string, string>;
  total_count?: number;
}

export const createOrder = async ({
  amount,
  currency = 'INR',
  receipt,
  notes,
}: RazorpayOrderParams) => {
  checkRazorpayCredentials();

  return await razorpay.orders.create({
    amount,
    currency,
    receipt: receipt || `order_${Date.now()}`,
    notes,
  });
};

export const createSubscription = async ({
  plan_id,
  customer_notify = 1,
  quantity = 1,
  notes,
  total_count,
}: RazorpaySubscriptionParams) => {
  checkRazorpayCredentials();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionData: any = {
    plan_id,
    customer_notify,
    quantity,
    notes,
  };

  if (total_count !== undefined) {
    subscriptionData.total_count = total_count;
  }

  return await razorpay.subscriptions.create(subscriptionData);
};

export const createOrGetCustomer = async (email: string, name?: string) => {
  checkRazorpayCredentials();

  try {
    // Try to find existing customer by email
    const customers = await razorpay.customers.all({
      email: email,
      count: 1
    });

    if (customers.items && customers.items.length > 0) {
      return customers.items[0];
    }

    // Create new customer if not found
    return await razorpay.customers.create({
      email: email,
      name: name || email.split('@')[0],
      fail_existing: '0' // Don't fail if customer already exists
    });
  } catch (error: any) {
    console.error('[Razorpay] Customer creation failed:', error);
    throw new Error(`Failed to create customer: ${error.message}`);
  }
};

export const cancelSubscription = async (subscriptionId: string) => {
  checkRazorpayCredentials();

  return await razorpay.subscriptions.cancel(subscriptionId);
};

export const updateSubscription = async (
  subscriptionId: string,
  updates: {
    plan_id?: string;
    quantity?: number;
    schedule_change_at?: 'now' | 'cycle_end';
  }
) => {
  checkRazorpayCredentials();

  return await razorpay.subscriptions.update(subscriptionId, updates);
};

export const fetchSubscription = async (subscriptionId: string) => {
  checkRazorpayCredentials();

  return await razorpay.subscriptions.fetch(subscriptionId);
};

export const fetchPayment = async (paymentId: string) => {
  checkRazorpayCredentials();

  return await razorpay.payments.fetch(paymentId);
};

// Webhook verification
export const verifyWebhookSignature = (
  body: string,
  signature: string,
  secret?: string
): boolean => {
  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing RAZORPAY_WEBHOOK_SECRET environment variable');
    }
    // During build time, return false gracefully
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
};

// Verify payment signature (for payment confirmation on frontend)
export const verifyPaymentSignature = ({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean => {
  if (!razorpayKeySecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RAZORPAY_KEY_SECRET is required for signature verification');
    }
    // During build time, return false gracefully
    return false;
  }

  const text = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(text)
    .digest('hex');

  return expectedSignature === signature;
};

// Helper to convert amount to paise (smallest unit)
export const toPaise = (amountInRupees: number): number => {
  return Math.round(amountInRupees * 100);
};

// Helper to convert paise to rupees
export const toRupees = (amountInPaise: number): number => {
  return amountInPaise / 100;
};
