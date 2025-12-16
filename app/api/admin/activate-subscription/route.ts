/**
 * Admin API: Manually Activate Subscription
 * Temporary endpoint to activate subscription when webhook fails
 * SECURED: Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/features/supabase/server';
import { verifyAdminAuth, isAuthError } from '@/lib/middleware/admin-auth';
import { validateRequestBody, activateSubscriptionSchema } from '@/lib/validation/api-schemas';
import { log } from '@/lib/logger';
import type { User } from '@/types/database';

export async function POST(request: NextRequest) {
  // ✅ SECURITY: Verify admin authentication
  const authResult = await verifyAdminAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { user: adminUser } = authResult;

  try {
    // ✅ VALIDATION: Validate and parse request body
    const { email, planType } = await validateRequestBody(request, activateSubscriptionSchema);

    log.info(`Admin ${adminUser.email} activating ${planType} for ${email}`);

    // Create Supabase admin client (bypasses RLS)
    const supabase = createServerAdminClient();

    // 1. Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    const typedUser = user as User | null

    if (userError || !typedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 2. Check if payment exists
    const { data: payment } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', typedUser.id)
      .eq('status', 'captured')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const typedPayment = payment as { razorpay_subscription_id: string | null; razorpay_payment_id: string } | null

    if (!typedPayment) {
      return NextResponse.json(
        { error: 'No captured payment found for this user' },
        { status: 404 }
      );
    }

    // 3. Get plan details
    const planDetails: Record<string, {
      name: string;
      limits: { ideas: number; validations: number };
      periodDays: number;
    }> = {
      pro_monthly: {
        name: 'Pro Monthly',
        limits: { ideas: 999999, validations: 999999 },
        periodDays: 30,
      },
      pro_yearly: {
        name: 'Pro Yearly',
        limits: { ideas: 999999, validations: 999999 },
        periodDays: 365,
      },
    };

    const plan = planDetails[planType];
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + plan.periodDays);

    // 4. Check if subscription already exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', typedUser.id)
      .maybeSingle();

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions' as never)
        .update({
          status: 'active',
          plan_type: planType,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        } as never)
        .eq('user_id', typedUser.id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update subscription: ' + updateError.message },
          { status: 500 }
        );
      }
    } else {
      // Create new subscription
      const razorpayPlanId = planType === 'pro_monthly'
        ? process.env.NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID
        : process.env.NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID;

      if (!razorpayPlanId) {
        return NextResponse.json(
          { error: 'Razorpay plan ID not configured for ' + planType },
          { status: 500 }
        );
      }

      const { error: insertError } = await supabase
        .from('subscriptions' as never)
        .insert({
          user_id: typedUser.id,
          razorpay_subscription_id: typedPayment.razorpay_subscription_id || `manual_${typedPayment.razorpay_payment_id}`,
          razorpay_plan_id: razorpayPlanId,
          stripe_price_id: razorpayPlanId, // Legacy field
          status: 'active',
          plan_type: planType,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        } as never);

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create subscription: ' + insertError.message },
          { status: 500 }
        );
      }
    }

    // 5. Update user plan
    const { error: userUpdateError } = await supabase
      .from('users' as never)
      .update({
        plan_type: planType,
        subscription_status: 'active',
      } as never)
      .eq('id', typedUser.id);

    if (userUpdateError) {
      return NextResponse.json(
        { error: 'Failed to update user: ' + userUpdateError.message },
        { status: 500 }
      );
    }

    // 6. Update usage limits - check if exists first
    const { data: existingLimits } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('user_id', typedUser.id)
      .maybeSingle();

    if (existingLimits) {
      // Update existing limits
      await supabase
        .from('usage_limits' as never)
        .update({
          plan_type: planType,
          monthly_limit_ideas: plan.limits.ideas,
          monthly_limit_validations: plan.limits.validations,
        } as never)
        .eq('user_id', typedUser.id);
    } else {
      // Insert new limits
      await supabase
        .from('usage_limits' as never)
        .insert({
          user_id: typedUser.id,
          plan_type: planType,
          monthly_limit_ideas: plan.limits.ideas,
          monthly_limit_validations: plan.limits.validations,
          ideas_generated: 0,
          validations_completed: 0,
        } as never);
    }

    // Log admin action
    log.info(`✅ Admin ${adminUser.email} activated ${planType} for ${email}`, {
      userId: typedUser.id,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully!',
      user: {
        email: typedUser.email,
        planType,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
      activatedBy: adminUser.email
    });

  } catch (error: unknown) {
    log.error('Error activating subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}
