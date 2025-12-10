/**
 * Admin API: Manually Activate Subscription
 * Temporary endpoint to activate subscription when webhook fails
 * SECURED: Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth, isAuthError } from '@/lib/middleware/admin-auth';
import { validateRequestBody, activateSubscriptionSchema } from '@/lib/validation/api-schemas';

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

    console.log(`Admin ${adminUser.email} activating ${planType} for ${email}`);

    // Create Supabase admin client (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 2. Check if payment exists
    const { data: payment } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'captured')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!payment) {
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
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          plan_type: planType,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        })
        .eq('user_id', user.id);

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

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          razorpay_subscription_id: payment.razorpay_subscription_id || `manual_${payment.razorpay_payment_id}`,
          razorpay_plan_id: razorpayPlanId,
          stripe_price_id: razorpayPlanId, // Legacy field
          status: 'active',
          plan_type: planType,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        });

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create subscription: ' + insertError.message },
          { status: 500 }
        );
      }
    }

    // 5. Update user plan
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        plan_type: planType,
        subscription_status: 'active',
      })
      .eq('id', user.id);

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
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingLimits) {
      // Update existing limits
      await supabase
        .from('usage_limits')
        .update({
          plan_type: planType,
          monthly_limit_ideas: plan.limits.ideas,
          monthly_limit_validations: plan.limits.validations,
        })
        .eq('user_id', user.id);
    } else {
      // Insert new limits
      await supabase
        .from('usage_limits')
        .insert({
          user_id: user.id,
          plan_type: planType,
          monthly_limit_ideas: plan.limits.ideas,
          monthly_limit_validations: plan.limits.validations,
          ideas_generated: 0,
          validations_completed: 0,
        });
    }

    // Log admin action
    console.log(`✅ Admin ${adminUser.email} activated ${planType} for ${email}`, {
      userId: user.id,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully!',
      user: {
        email: user.email,
        planType,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
      activatedBy: adminUser.email
    });

  } catch (error: unknown) {
    console.error('Error activating subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}
