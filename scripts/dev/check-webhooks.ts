import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkWebhooks() {
  console.log('🔔 Checking all webhook events...\n');

  const { data: webhooks, error } = await supabase
    .from('webhook_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!webhooks || webhooks.length === 0) {
    console.log('⚠️  No webhook events found in database\n');
    console.log('This means:');
    console.log('  - Webhooks are not reaching your application');
    console.log('  - Check Razorpay webhook configuration');
    console.log('  - Verify webhook URL is correct');
    console.log('  - Check if app is running and accessible\n');
  } else {
    console.log(`Found ${webhooks.length} webhook events:\n`);
    webhooks.forEach((wh, idx) => {
      console.log(`${idx + 1}. ${wh.event_type}`);
      console.log(`   Event ID: ${wh.event_id}`);
      console.log(`   Processed: ${wh.processed ? '✅' : '❌'}`);
      console.log(`   Error: ${wh.error_message || 'None'}`);
      console.log(`   Created: ${new Date(wh.created_at).toLocaleString()}\n`);
    });
  }

  // Check customer
  const { data: customer } = await supabase
    .from('users')
    .select('razorpay_customer_id')
    .eq('email', 'benji_thomas@live.com')
    .single();

  console.log('Customer ID in database:', customer?.razorpay_customer_id);
  console.log('\n🔗 Check Razorpay Dashboard:');
  console.log(`https://dashboard.razorpay.com/app/customers/${customer?.razorpay_customer_id}`);
}

checkWebhooks();
