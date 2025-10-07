'use server';

import { redirect } from 'next/navigation';
import { createServerAdminClient } from '@/lib/auth/supabase-server';
import { getCurrentSession } from '@/lib/auth/jwt';
import {
  razorpay,
  createSubscription as createRazorpaySubscription,
  cancelSubscription as cancelRazorpaySubscription,
  updateSubscription as updateRazorpaySubscription,
  toPaise
} from '@/lib/razorpay';
import { PRICING_PLANS } from '@/constants';

export async function createSubscription(planId: string) {
  const session = await getCurrentSession();

  if (!session) {
    return { error: 'User not authenticated' };
  }

  const supabase = createServerAdminClient();

  try {
    // Find the plan details
    const plan = PRICING_PLANS.find(p => p.id === planId);
    if (!plan) {
      return { error: 'Invalid plan selected' };
    }

    // Create Razorpay subscription
    const subscription = await createRazorpaySubscription({
      plan_id: plan.priceId, // Using priceId as Razorpay plan_id
      customer_notify: 1,
      quantity: 1,
      total_count: plan.id === 'pro_yearly' ? 1 : 12, // 1 year for yearly, 12 months for monthly (or use 0 for unlimited)
      notes: {
        user_id: session.userId,
        user_email: session.email,
        plan_type: plan.id
      },
    });

    // Store subscription details in database
    await supabase
      .from('subscriptions')
      .insert({
        user_id: session.userId,
        razorpay_subscription_id: subscription.id,
        razorpay_plan_id: plan.priceId,
        plan_type: plan.id as unknown as 'explorer' | 'founder' | 'growth',
        status: subscription.status as 'trial' | 'active' | 'inactive' | 'cancelled',
      } as never);

    // Return subscription details for frontend to complete payment
    return {
      success: true,
      subscriptionId: subscription.id,
      planId: plan.priceId
    };
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

  // Razorpay doesn't have a built-in billing portal like Stripe
  // Redirect to the billing page where users can manage subscriptions
  redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`);
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
      .eq('razorpay_subscription_id', subscriptionId)
      .single();

    if (!subscription) {
      return { error: 'Subscription not found' };
    }

    // Cancel subscription in Razorpay
    await cancelRazorpaySubscription(subscriptionId);

    // Update subscription in database
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true
      })
      .eq('razorpay_subscription_id', subscriptionId);

    return { success: true, message: 'Subscription cancelled successfully' };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { error: 'Failed to cancel subscription' };
  }
}

export async function updateSubscription(newPlanId: string) {
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

    if (!subscription || !(subscription as unknown as { razorpay_subscription_id?: string }).razorpay_subscription_id) {
      return { error: 'No active subscription found' };
    }

    // Find the new plan details
    const newPlan = PRICING_PLANS.find(plan => plan.id === newPlanId);

    if (!newPlan) {
      return { error: 'Invalid plan selected' };
    }

    // Update subscription in Razorpay
    const razorpaySubId = (subscription as unknown as { razorpay_subscription_id?: string }).razorpay_subscription_id!;
    await updateRazorpaySubscription(razorpaySubId, {
      plan_id: newPlan.priceId,
      schedule_change_at: 'now'
    });

    // Update subscription in database
    await supabase
      .from('subscriptions')
      .update({
        razorpay_plan_id: newPlan.priceId,
        plan_type: newPlan.id as unknown as 'explorer' | 'founder' | 'growth'
      } as never)
      .eq('id', subscription.id);

    // Update user's plan type
    await supabase
      .from('users')
      .update({ plan_type: newPlan.id as unknown as 'explorer' | 'founder' | 'growth' } as never)
      .eq('id', session.userId);

    // Update usage limits
    await supabase
      .from('usage_limits')
      .update({
        plan_type: newPlan.id as unknown as 'explorer' | 'founder' | 'growth',
        monthly_limit_ideas: newPlan.limits.ideas,
        monthly_limit_validations: newPlan.limits.validations
      } as never)
      .eq('user_id', session.userId);

    return { success: true, message: 'Subscription updated successfully' };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { error: 'Failed to update subscription' };
  }
}