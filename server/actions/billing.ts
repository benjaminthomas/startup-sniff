'use server';

import { redirect } from 'next/navigation';
import { createServerAdminClient } from '@/lib/auth/supabase-server';
import { getCurrentSession } from '@/lib/auth/jwt';
import { 
  stripe, 
  getStripeCustomerId, 
  createCheckoutSession, 
  createBillingPortalSession 
} from '@/lib/stripe';
import { PRICING_PLANS } from '@/constants';

export async function createSubscription(priceId: string) {
  const session = await getCurrentSession();

  if (!session) {
    return { error: 'User not authenticated' };
  }

  const supabase = createServerAdminClient();

  try {
    // Get or create Stripe customer
    const customerId = await getStripeCustomerId(session.userId, session.email);

    // Update user with Stripe customer ID if not exists
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', session.userId)
      .single();

    if (!profile?.stripe_customer_id) {
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', session.userId);
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
      userId: session.userId,
    });

    redirect(checkoutSession.url!);
  } catch (error) {
    console.error('Error creating subscription:', error);
    return { error: 'Failed to create subscription' };
  }
}

export async function manageBilling() {
  const session = await getCurrentSession();

  if (!session) {
    return { error: 'User not authenticated' };
  }

  const supabase = createServerAdminClient();

  try {
    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', session.userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return { error: 'No billing information found' };
    }

    // Create billing portal session
    const billingSession = await createBillingPortalSession(
      profile.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
    );

    redirect(billingSession.url);
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return { error: 'Failed to access billing portal' };
  }
}

export async function cancelSubscription(subscriptionId: string) {
  const session = await getCurrentSession();

  if (!session) {
    return { error: 'User not authenticated' };
  }

  const supabase = createServerAdminClient();

  try {
    // Verify the subscription belongs to this user
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.userId)
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (!subscription) {
      return { error: 'Subscription not found' };
    }

    // Cancel subscription in Stripe
    await stripe.subscriptions.cancel(subscriptionId);

    // Update subscription in database
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancel_at_period_end: true 
      })
      .eq('stripe_subscription_id', subscriptionId);

    return { success: true, message: 'Subscription cancelled successfully' };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { error: 'Failed to cancel subscription' };
  }
}

export async function updateSubscription(newPriceId: string) {
  const session = await getCurrentSession();

  if (!session) {
    return { error: 'User not authenticated' };
  }

  const supabase = createServerAdminClient();

  try {
    // Get current active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.userId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      return { error: 'No active subscription found' };
    }

    // Update subscription in Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id!);
    
    await stripe.subscriptions.update(subscription.stripe_subscription_id!, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    // Find the plan type for the new price
    const newPlan = PRICING_PLANS.find(plan => plan.priceId === newPriceId);
    
    if (newPlan) {
      // Update subscription in database
      await supabase
        .from('subscriptions')
        .update({ 
          stripe_price_id: newPriceId,
          plan_type: newPlan.id
        })
        .eq('id', subscription.id);

      // Update user's plan type
      await supabase
        .from('users')
        .update({ plan_type: newPlan.id })
        .eq('id', session.userId);

      // Update usage limits
      await supabase
        .from('usage_limits')
        .update({
          plan_type: newPlan.id,
          monthly_limit_ideas: newPlan.limits.ideas,
          monthly_limit_validations: newPlan.limits.validations
        })
        .eq('user_id', session.userId);
    }

    return { success: true, message: 'Subscription updated successfully' };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { error: 'Failed to update subscription' };
  }
}