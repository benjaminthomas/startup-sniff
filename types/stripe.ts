import Stripe from 'stripe'

// Common Stripe webhook event types we handle
export type StripeEventType =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'checkout.session.completed'

// Extend Stripe types with our custom data
export interface StripeCustomer extends Stripe.Customer {
  metadata: {
    supabase_user_id?: string
  }
}

export interface StripeSubscription extends Stripe.Subscription {
  customer: string | StripeCustomer
  metadata: {
    supabase_user_id?: string
  }
}

export interface StripeInvoice extends Stripe.Invoice {
  customer: string | StripeCustomer
  subscription: string | StripeSubscription
}

export interface StripeCheckoutSession extends Stripe.Checkout.Session {
  customer: string | StripeCustomer
  subscription: string | StripeSubscription
  metadata: {
    supabase_user_id?: string
  }
}

// Webhook event handlers type definitions
export type WebhookHandlers = {
  [K in StripeEventType]: (data: Stripe.Event.Data) => Promise<void>
}

// Plan mapping type
export type StripePlanType = 'explorer' | 'founder' | 'growth'

export interface PlanMapping {
  priceId: string
  planType: StripePlanType
  name: string
  features: string[]
}

// Subscription status mapping
export type SubscriptionStatus = 'trial' | 'active' | 'inactive' | 'cancelled'

export function mapStripeStatusToSupabase(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trial'
    case 'canceled':
    case 'unpaid':
      return 'cancelled'
    case 'incomplete':
    case 'incomplete_expired':
    case 'past_due':
    default:
      return 'inactive'
  }
}

export function getPlanTypeFromPriceId(priceId: string): StripePlanType {
  // Map Stripe price IDs to our plan types
  const priceToType: Record<string, StripePlanType> = {
    'price_explorer': 'explorer',
    'price_founder': 'founder',
    'price_growth': 'growth',
  }

  return priceToType[priceId] || 'explorer'
}