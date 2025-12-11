import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const USER_EMAIL = 'benji_thomas@live.com';
const SUBSCRIPTION_ID = 'sub_RnAmnBZBD8HStg';
const PAYMENT_ID = 'pay_RnAnSQWWwH4yqU';
const AMOUNT = 2900; // ₹29.00 in paise
const PLAN_TYPE = 'pro_monthly';

async function activateSubscription() {
  console.log('🔧 Manually activating subscription...\n');

  // Get user
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', USER_EMAIL)
    .single();

  if (!user) {
    console.error('❌ User not found');
    return;
  }

  console.log(`✅ Found user: ${user.id}`);

  // 1. Create subscription record
  console.log('\n📝 Creating subscription record...');
  const { error: subError } = await supabase.from('subscriptions').insert({
    user_id: user.id,
    razorpay_subscription_id: SUBSCRIPTION_ID,
    razorpay_plan_id: process.env.NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID,
    stripe_price_id: process.env.NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID, // Legacy field, same value
    status: 'active',
    plan_type: PLAN_TYPE,
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  });

  if (subError) {
    console.error('❌ Failed to create subscription:', subError);
  } else {
    console.log('✅ Subscription record created');
  }

  // 2. Update user's plan_type and subscription_status
  console.log('\n👤 Updating user plan...');
  const { error: userError } = await supabase
    .from('users')
    .update({
      plan_type: PLAN_TYPE,
      subscription_status: 'active',
    })
    .eq('id', user.id);

  if (userError) {
    console.error('❌ Failed to update user:', userError);
  } else {
    console.log('✅ User plan updated to pro_monthly');
  }

  // 3. Update payment_transactions amount
  console.log('\n💰 Updating payment amount...');
  // @ts-ignore
  const { error: paymentError } = await supabase
    .from('payment_transactions')
    .update({
      amount: AMOUNT,
      status: 'captured',
      captured_at: new Date().toISOString(),
    })
    .eq('razorpay_payment_id', PAYMENT_ID);

  if (paymentError) {
    console.error('❌ Failed to update payment:', paymentError);
  } else {
    console.log(`✅ Payment amount updated to ${AMOUNT} paise (₹${AMOUNT / 100})`);
  }

  // 4. Update usage limits
  console.log('\n📊 Updating usage limits...');
  const { error: usageError } = await supabase
    .from('usage_limits')
    .update({
      plan_type: PLAN_TYPE,
      monthly_limit_ideas: 999999, // Unlimited
      monthly_limit_validations: 999999, // Unlimited
    })
    .eq('user_id', user.id);

  if (usageError) {
    console.error('❌ Failed to update usage limits:', usageError);
  } else {
    console.log('✅ Usage limits updated to unlimited');
  }

  console.log('\n✨ Subscription activation complete!');
  console.log('\n📋 Summary:');
  console.log(`- User: ${USER_EMAIL}`);
  console.log(`- Plan: ${PLAN_TYPE}`);
  console.log(`- Status: active`);
  console.log(`- Amount: ₹${AMOUNT / 100}`);
  console.log(`- Subscription ID: ${SUBSCRIPTION_ID}`);
}

activateSubscription().catch(console.error);
