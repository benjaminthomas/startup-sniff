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
    // Try to create customer
    return await razorpay.customers.create({
      email: email,
      name: name || email.split('@')[0],
      fail_existing: 0
    });
  } catch (error: unknown) {
    // Check if error is because customer already exists
    const razorpayError = error as {
      statusCode?: number;
      error?: {
        code?: string;
        description?: string;
      }
    };

    if (
      razorpayError.error?.code === 'BAD_REQUEST_ERROR' &&
      razorpayError.error?.description?.includes('Customer already exists')
    ) {
      // Customer exists, fetch and return it
      console.log('[Razorpay] Customer already exists, fetching existing customer');
      try {
        const customers = await razorpay.customers.all({
          count: 100 // Get up to 100 customers
        });

        // Find customer by email
        const existingCustomer = customers.items?.find(
          (customer: { email?: string }) => customer.email === email
        );

        if (existingCustomer) {
          console.log('[Razorpay] Found existing customer:', existingCustomer.id);
          return existingCustomer;
        }

        // If not found in list, the customer might exist but we can't fetch it
        // This shouldn't happen, but log it for debugging
        console.error('[Razorpay] Customer exists but could not be found in list');
        throw new Error('Customer exists but could not be retrieved. Please contact support.');
      } catch (fetchError) {
        console.error('[Razorpay] Failed to fetch existing customer:', fetchError);
        throw new Error('Failed to retrieve existing customer');
      }
    }

    // For other errors, throw with details
    console.error('[Razorpay] Customer creation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create customer: ${errorMessage}`);
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

// ===== Invoice Management =====

export interface RazorpayInvoiceParams {
  customerId: string;
  amount: number; // in smallest currency unit (paise for INR)
  currency?: string;
  description: string;
  customer_email?: string;
  customer_name?: string;
  payment_id?: string;
}

/**
 * Fetch invoice by ID
 * Returns invoice with short_url for downloading
 */
export const fetchInvoice = async (invoiceId: string) => {
  checkRazorpayCredentials();

  return await razorpay.invoices.fetch(invoiceId);
};

/**
 * Fetch invoices by payment ID
 * Razorpay automatically creates invoices for subscription payments
 */
export const fetchInvoicesByPayment = async (paymentId: string) => {
  checkRazorpayCredentials();

  return await razorpay.invoices.all({ payment_id: paymentId });
};

/**
 * Create and issue a new invoice
 * Returns invoice with short_url for downloading
 */
export const createInvoice = async ({
  customerId,
  amount,
  currency = 'INR',
  description,
  customer_email,
  customer_name,
  payment_id,
}: RazorpayInvoiceParams) => {
  checkRazorpayCredentials();

  // Create invoice (draft state)
  const invoice = await razorpay.invoices.create({
    type: 'invoice',
    customer_id: customerId,
    amount,
    currency,
    description,
    customer: {
      email: customer_email,
      name: customer_name,
    },
    // Link to payment if provided
    ...(payment_id && { payment_id }),
  });

  // Issue the invoice to make it downloadable
  const issuedInvoice = await razorpay.invoices.issue(invoice.id);

  return issuedInvoice;
};
