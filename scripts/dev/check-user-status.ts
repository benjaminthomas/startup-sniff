import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUserStatus() {
  console.log('👤 CHECKING USER STATUS\n');
  console.log('=' .repeat(80));

  const { data: users } = await supabase
    .from('users' as any)
    .select('id, email, full_name, plan_type, subscription_status, razorpay_customer_id');

  if (!users || users.length === 0) {
    console.log('❌ No users found');
    return;
  }

  for (const user of users) {
    console.log('\n📋 User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.full_name || 'Not set'}`);
    console.log(`   Plan: ${user.plan_type}`);
    console.log(`   Status: ${user.subscription_status}`);
    console.log(`   Razorpay Customer ID: ${user.razorpay_customer_id || '❌ Not set (GOOD - can test fresh)'}`);
  }

  // Check subscriptions
  const { data: subs, count: subCount } = await supabase
    .from('subscriptions' as any)
    .select('*', { count: 'exact' });

  console.log('\n📊 Subscriptions:');
  console.log(`   Count: ${subCount || 0}`);

  // Check payment transactions
  const { data: payments, count: paymentCount } = await supabase
    .from('payment_transactions' as any)
    .select('*', { count: 'exact' });

  console.log('\n💳 Payment Transactions:');
  console.log(`   Count: ${paymentCount || 0}`);

  // Check webhook events
  const { data: webhooks, count: webhookCount } = await supabase
    .from('webhook_events' as any)
    .select('*', { count: 'exact' });

  console.log('\n🔔 Webhook Events:');
  console.log(`   Count: ${webhookCount || 0}`);

  console.log('\n' + '=' .repeat(80));
  console.log('\n✅ STATUS CHECK COMPLETE');
  console.log('\n💡 Ready to test payment flow? Your billing data is clean!\n');
}

checkUserStatus().catch(console.error);
