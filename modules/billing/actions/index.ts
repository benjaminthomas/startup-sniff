'use server';

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/modules/auth/services/jwt';
import { createServerAdminClient } from '@/modules/supabase';
import {
  createSubscription as createRazorpaySubscription,
  cancelSubscription as cancelRazorpaySubscription,
  updateSubscription as updateRazorpaySubscription,
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

    const missingServerKeys = !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;
    if (missingServerKeys) {
      return {
        error: 'Razorpay API keys are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment.'
      };
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
        plan_type: plan.id as unknown as 'free' | 'pro_monthly' | 'pro_yearly',
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
    let errorMessage = 'Failed to create subscription';

    if (typeof error === 'object' && error !== null && 'error' in error) {
      const razorpayError = (error as { error?: { description?: string; reason?: string } }).error;
      if (razorpayError?.description) {
        errorMessage = `Razorpay error: ${razorpayError.description}`;
      } else if (razorpayError?.reason) {
        errorMessage = `Razorpay error: ${razorpayError.reason}`;
      }
    } else if (error instanceof Error && error.message) {
      errorMessage = error.message;
    }

    if (errorMessage.includes('Plan') || errorMessage.includes('plan')) {
      errorMessage += ' — confirm that the Razorpay plan IDs for each paid tier are set to your test-mode plans.';
    }

    return { error: errorMessage };
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
        plan_type: newPlan.id as unknown as 'free' | 'pro_monthly' | 'pro_yearly'
      } as never)
      .eq('id', subscription.id);

    // Update user's plan type
    await supabase
      .from('users')
      .update({ plan_type: newPlan.id as unknown as 'free' | 'pro_monthly' | 'pro_yearly' } as never)
      .eq('id', session.userId);

    // Update usage limits
    await supabase
      .from('usage_limits')
      .update({
        plan_type: newPlan.id as unknown as 'free' | 'pro_monthly' | 'pro_yearly',
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
