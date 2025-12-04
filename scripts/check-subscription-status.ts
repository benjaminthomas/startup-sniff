import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSubscriptionStatus() {
  console.log('🔍 Checking subscription status...\n');

  // Get all users with recent activity
  const { data: users } = await supabase
    .from('users')
    .select('id, email, plan_type, subscription_status, razorpay_customer_id')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('📊 Recent Users:');
  console.table(users);

  if (!users || users.length === 0) {
    console.log('No users found');
    return;
  }

  // Check subscriptions
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n💳 Recent Subscriptions:');
  console.table(subscriptions);

  // Check payment transactions
  // @ts-ignore
  const { data: payments } = await supabase
    .from('payment_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\n💰 Recent Payment Transactions:');
  console.table(payments);

  // Check webhook events
  const { data: webhooks } = await supabase
    .from('webhook_events')
    .select('event_id, event_type, processed, error_message, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\n🔔 Recent Webhook Events:');
  console.table(webhooks);
}

checkSubscriptionStatus().catch(console.error);
