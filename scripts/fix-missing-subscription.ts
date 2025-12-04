/**
 * Fix Missing Subscription Record
 * Inserts missing subscription record for manually activated users
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingSubscription(userEmail: string) {
  console.log('🔧 Fixing missing subscription record for:', userEmail);
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Get user
    console.log('👤 Fetching user...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError?.message);
      process.exit(1);
    }

    console.log('  Email:', user.email);
    console.log('  User ID:', user.id);
    console.log('  Plan Type:', user.plan_type);
    console.log('  Subscription Status:', user.subscription_status);
    console.log('');

    // 2. Check if subscription already exists
    console.log('📋 Checking for existing subscription...');
    const { data: existingSub, error: existingSubError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSub) {
      console.log('  ⚠️  Subscription already exists:');
      console.log('     ID:', existingSub.id);
      console.log('     Status:', existingSub.status);
      console.log('     Plan Type:', existingSub.plan_type);
      console.log('     Razorpay Subscription ID:', existingSub.razorpay_subscription_id);
      console.log('\n✅ No fix needed - subscription record already exists!');
      process.exit(0);
    }

    console.log('  ✓ No subscription found, will create one\n');

    // 3. Get payment transaction
    console.log('💳 Fetching payment transaction...');
    const { data: payment, error: paymentError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'captured')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error('❌ No captured payment found for this user');
      console.error('   The user may not have completed payment successfully');
      process.exit(1);
    }

    console.log('  Payment ID:', payment.razorpay_payment_id);
    console.log('  Amount: ₹' + payment.amount / 100);
    console.log('  Status:', payment.status);
    console.log('  Date:', new Date(payment.created_at).toLocaleString());
    console.log('');

    // 4. Determine plan type
    const planType = user.plan_type || 'pro_monthly';

    if (planType === 'free') {
      console.error('❌ User plan is free, cannot create paid subscription');
      console.error('   Update users.plan_type first before running this script');
      process.exit(1);
    }

    console.log('📦 Creating subscription record...');
    console.log('   Plan Type:', planType);

    // 5. Calculate subscription period
    const periodStart = new Date();
    const periodEnd = new Date();

    if (planType === 'pro_monthly') {
      periodEnd.setDate(periodEnd.getDate() + 30); // Monthly plan
    } else if (planType === 'pro_yearly') {
      periodEnd.setDate(periodEnd.getDate() + 365); // Yearly plan
    }

    console.log('   Period Start:', periodStart.toLocaleDateString());
    console.log('   Period End:', periodEnd.toLocaleDateString());

    // 6. Get plan ID from environment
    const razorpayPlanId = planType === 'pro_monthly'
      ? process.env.NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID
      : process.env.NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID;

    if (!razorpayPlanId) {
      console.error(`❌ Environment variable not set for ${planType}`);
      console.error('   Set NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID or NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID');
      process.exit(1);
    }

    console.log('   Razorpay Plan ID:', razorpayPlanId);
    console.log('');

    // 7. Insert subscription record
    const { data: newSub, error: insertError} = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        razorpay_subscription_id: `manual_${payment.razorpay_payment_id}`,
        razorpay_plan_id: razorpayPlanId,
        stripe_price_id: razorpayPlanId, // Legacy field - still has NOT NULL constraint
        status: 'active',
        plan_type: planType,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create subscription:', insertError.message);
      console.error('   Error details:', insertError);
      process.exit(1);
    }

    console.log('✅ Subscription record created successfully!');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 SUBSCRIPTION DETAILS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ID:', newSub.id);
    console.log('  User ID:', newSub.user_id);
    console.log('  Razorpay Subscription ID:', newSub.razorpay_subscription_id);
    console.log('  Razorpay Plan ID:', newSub.razorpay_plan_id);
    console.log('  Status:', newSub.status);
    console.log('  Plan Type:', newSub.plan_type);
    console.log('  Period:', new Date(newSub.current_period_start).toLocaleDateString(), '-', new Date(newSub.current_period_end).toLocaleDateString());
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ FIX COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. User can now upgrade from monthly to yearly');
    console.log('   2. Subscription management operations will work');
    console.log('   3. Run diagnostic: npm run webhook:diagnose', userEmail);
    console.log('');

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    console.error('   Stack trace:', error.stack);
    process.exit(1);
  }
}

// Get email from command line
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Usage: npx tsx scripts/fix-missing-subscription.ts <user-email>');
  console.error('Example: npx tsx scripts/fix-missing-subscription.ts user@example.com');
  process.exit(1);
}

fixMissingSubscription(userEmail);
