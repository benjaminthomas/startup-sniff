import Stripe from 'stripe';

// Handle missing environment variables gracefully during build time
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable in production');
}

// Use a placeholder key during build time if not available
export const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

export const getStripeCustomerId = async (userId: string, email: string): Promise<string> => {
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for Stripe operations');
  }

  // Check if customer already exists in Stripe
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  });

  return customer.id;
};

export const createCheckoutSession = async ({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  userId,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
}) => {
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for Stripe operations');
  }

  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
      },
    },
  });
};

export const createBillingPortalSession = async (customerId: string, returnUrl: string) => {
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for Stripe operations');
  }

  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
};

export const cancelSubscription = async (subscriptionId: string) => {
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for Stripe operations');
  }

  return await stripe.subscriptions.cancel(subscriptionId);
};

export const updateSubscription = async (subscriptionId: string, priceId: string) => {
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for Stripe operations');
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });
};

// Webhook verification
export const verifyWebhookSignature = (body: string, signature: string): Stripe.Event => {
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is required for Stripe operations');
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }

  return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
};