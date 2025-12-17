/**
 * Manual Subscription Activation
 * Activates a subscription for a user based on completed payment
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function activateSubscription(email: string, planType: string) {
  console.log('🔄 Activating subscription...\n');

  try {
    // 1. Validate plan type
    const validPlans = ['pro_monthly', 'pro_yearly'];
    if (!validPlans.includes(planType)) {
      console.error('❌ Invalid plan type:', planType);
      console.error('   Valid options:', validPlans.join(', '));
      process.exit(1);
    }

    // 2. Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError?.message);
      process.exit(1);
    }

    console.log('👤 User:', user.email);
    console.log('   Current plan:', user.plan_type);
    console.log('   New plan:', planType);

    // 3. Check if payment exists
    const { data: payment } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'captured')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!payment) {
      console.error('❌ No captured payment found for this user');
      process.exit(1);
    }

    console.log('   Payment ID:', payment.razorpay_payment_id);
    console.log('   Amount: ₹' + payment.amount / 100);
    console.log('   Status:', payment.status);

    // 4. Get plan details
    const planDetails: Record<string, any> = {
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

    // 5. Create or update subscription
    console.log('\n📦 Creating subscription record...');

    // Check if subscription already exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingSub) {
      console.log('   Updating existing subscription...');

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          plan_type: planType,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ Error updating subscription:', updateError.message);
      } else {
        console.log('✅ Subscription updated');
      }
    } else {
      console.log('   Creating new subscription...');

      const razorpayPlanId = planType === 'pro_monthly'
        ? process.env.NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID
        : process.env.NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID;

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          razorpay_subscription_id: payment.razorpay_subscription_id || `manual_${payment.razorpay_payment_id}`,
          razorpay_plan_id: razorpayPlanId,
          status: 'active',
          plan_type: planType,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        });

      if (insertError) {
        console.error('❌ Error creating subscription:', insertError.message);
      } else {
        console.log('✅ Subscription created');
      }
    }

    // 6. Update user plan
    console.log('\n👤 Updating user account...');

    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        plan_type: planType,
        subscription_status: 'active',
      })
      .eq('id', user.id);

    if (userUpdateError) {
      console.error('❌ Error updating user:', userUpdateError.message);
    } else {
      console.log('✅ User plan updated');
    }

    // 7. Update usage limits
    console.log('\n📊 Updating usage limits...');

    const { error: limitsError } = await supabase
      .from('usage_limits')
      .upsert({
        user_id: user.id,
        plan_type: planType,
        monthly_limit_ideas: plan.limits.ideas,
        monthly_limit_validations: plan.limits.validations,
        ideas_generated: 0,
        validations_completed: 0,
      }, {
        onConflict: 'user_id'
      });

    if (limitsError) {
      console.error('❌ Error updating limits:', limitsError.message);
    } else {
      console.log('✅ Usage limits updated (unlimited)');
    }

    // 8. Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('⚠️  IMPORTANT: MANUAL SUBSCRIPTION CREATED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n⚠️  Manual Subscription Limitations:');
    console.log('   • Cannot be managed through Razorpay dashboard');
    console.log('   • No automatic billing/renewal');
    console.log('   • Upgrades will charge full amount (no proration)');
    console.log('   • Use webhooks for production subscriptions!');
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ SUBSCRIPTION ACTIVATED!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📧 Email: ${user.email}`);
    console.log(`📦 Plan: ${plan.name}`);
    console.log(`🔄 Status: active`);
    console.log(`📅 Period: ${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`);
    console.log(`💳 Payment: ₹${payment.amount / 100}`);
    console.log(`🎯 Limits: Unlimited ideas & validations`);
    console.log('\n💡 Next steps:');
    console.log('   1. User should log out and log back in');
    console.log('   2. Or hard refresh the page (Ctrl+Shift+R)');
    console.log('   3. Sidebar should now show "Growth" badge');
    console.log('   4. Conversations feature should be unlocked');
    console.log('   5. No "Upgrade" button in sidebar\n');

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Get arguments
const email = process.argv[2];
const planType = process.argv[3];

if (!email || !planType) {
  console.error('❌ Usage: npx tsx scripts/manual-activate-subscription.ts <email> <plan_type>');
  console.error('');
  console.error('Examples:');
  console.error('  npx tsx scripts/manual-activate-subscription.ts user@example.com pro_monthly');
  console.error('  npx tsx scripts/manual-activate-subscription.ts user@example.com pro_yearly');
  process.exit(1);
}

activateSubscription(email, planType);
