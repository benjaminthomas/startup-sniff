'use server';

import { getCurrentSession } from '@/modules/auth/services/jwt';
import { createServerAdminClient } from '@/modules/supabase';
import { createSubscription as createRazorpaySubscription, cancelSubscription as cancelRazorpaySubscription } from '@/lib/razorpay';
import { PRICING_PLANS } from '@/constants';
import { calculateMonthlyToYearlyProration } from '@/lib/proration';
import { log } from '@/lib/logger'

export async function upgradeMonthlyToYearly() {
  const session = await getCurrentSession();

  if (!session) {
    return {
      success: false,
      error: 'User not authenticated',
    };
  }

  const supabase = createServerAdminClient();

  try {
    // 1. Get user's current subscription
    // @ts-ignore
    const { data: currentSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.userId)
      .eq('status', 'active')
      .eq('plan_type', 'pro_monthly')
      .single();

    if (subError || !currentSubscription) {
      return {
        success: false,
        error: 'No active monthly subscription found. Please subscribe to monthly plan first.',
      };
    }

    if (!currentSubscription.current_period_end) {
      return {
        success: false,
        error: 'Current subscription is missing billing period information.',
      };
    }

    if (!currentSubscription.razorpay_subscription_id) {
      return {
        success: false,
        error: 'Current subscription is missing Razorpay subscription ID.',
      };
    }

    // 2. Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .single();

    if (!profile) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    // 3. Check if manual subscription (needed for proration and cancellation logic)
    const isManualSubscription = currentSubscription.razorpay_subscription_id.startsWith('manual_');

    // 4. Calculate proration
    const monthlyPlan = PRICING_PLANS.find(p => p.id === 'pro_monthly')!;
    const yearlyPlan = PRICING_PLANS.find(p => p.id === 'pro_yearly')!;

    // For manual subscriptions, don't calculate proration (they didn't pay through Razorpay)
    const proration = isManualSubscription
      ? {
          creditAmount: 0,
          daysRemaining: 0,
          fullYearlyAmount: yearlyPlan.price,
          finalAmount: yearlyPlan.price,
          amountDue: yearlyPlan.price,
          savings: 0,
          message: 'Upgrading from manual subscription. You will pay the full yearly amount.',
        }
      : calculateMonthlyToYearlyProration(
          currentSubscription.current_period_end,
          monthlyPlan.price,
          yearlyPlan.price
        );

    // 5. Cancel current monthly subscription at Razorpay
    if (!isManualSubscription) {
      // Only call Razorpay API for real subscriptions
      try {
        await cancelRazorpaySubscription(currentSubscription.razorpay_subscription_id);
      } catch (cancelError) {
        log.error('Failed to cancel monthly subscription:', cancelError);
        // Continue anyway - we'll mark it cancelled in our DB
      }
    } else {
      log.info('Skipping Razorpay cancellation for manual subscription');
    }

    // 6. Update current subscription status in database (works for both manual and real subscriptions)
    // Mark for cancellation but keep it active until period ends
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
      })
      .eq('id', currentSubscription.id);

    // 7. Create new yearly subscription at Razorpay
    const yearlySubscription = await createRazorpaySubscription({
      plan_id: yearlyPlan.priceId,
      customer_notify: 1,
      quantity: 1,
      total_count: 1200, // Maximum allowed by Razorpay
      notes: {
        user_id: session.userId,
        user_email: session.email || profile.email || '',
        plan_type: 'pro_yearly',
        upgraded_from: 'pro_monthly',
        proration_credit: proration.creditAmount.toString(),
      },
      // Note: Razorpay doesn't support applying credit directly
      // The prorated amount should be handled in the payment flow
    });

    // 8. Create new subscription record in database
    await supabase.from('subscriptions').insert({
      user_id: session.userId,
      razorpay_subscription_id: yearlySubscription.id,
      razorpay_plan_id: yearlyPlan.priceId,
      stripe_price_id: yearlyPlan.priceId, // Legacy field
      status: 'inactive', // Will be activated after payment
      plan_type: 'pro_yearly',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 9. Return subscription details for payment
    return {
      success: true,
      subscriptionId: yearlySubscription.id,
      shortUrl: yearlySubscription.short_url,
      proration,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    };
  } catch (error: unknown) {
    log.error('Upgrade error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upgrade subscription. Please try again.',
    };
  }
}

export async function getUpgradeProration() {
  const session = await getCurrentSession();

  if (!session) {
    return {
      success: false,
      error: 'User not authenticated',
    };
  }

  const supabase = createServerAdminClient();

  try {
    // Get user's current subscription
    // @ts-ignore
    const { data: currentSubscription } = await supabase
      .from('subscriptions')
      .select('current_period_end')
      .eq('user_id', session.userId)
      .eq('status', 'active')
      .eq('plan_type', 'pro_monthly')
      .single();

    if (!currentSubscription) {
      return {
        success: false,
        error: 'No active monthly subscription found',
      };
    }

    if (!currentSubscription.current_period_end) {
      return {
        success: false,
        error: 'Current subscription is missing billing period information.',
      };
    }

    const monthlyPlan = PRICING_PLANS.find(p => p.id === 'pro_monthly')!;
    const yearlyPlan = PRICING_PLANS.find(p => p.id === 'pro_yearly')!;

    const proration = calculateMonthlyToYearlyProration(
      currentSubscription.current_period_end,
      monthlyPlan.price,
      yearlyPlan.price
    );

    return {
      success: true,
      proration,
    };
  } catch (error) {
    log.error('Error calculating proration:', error);
    return {
      success: false,
      error: 'Failed to calculate upgrade cost',
    };
  }
}
