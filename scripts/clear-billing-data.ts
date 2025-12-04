/**
 * Clear Billing Data Script
 * Removes all billing and payment data for testing purposes
 * WARNING: This will delete payment transactions and subscriptions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearBillingData() {
  console.log('🧹 Starting billing data cleanup...\n');

  try {
    // 1. Clear payment transactions
    console.log('Deleting payment transactions...');
    const { error: txError, count: txCount } = await supabase
      .from('payment_transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (txError) {
      console.error('Error deleting payment transactions:', txError);
    } else {
      console.log(`✅ Deleted ${txCount || 0} payment transactions\n`);
    }

    // 2. Clear subscriptions
    console.log('Deleting subscriptions...');
    const { error: subError, count: subCount } = await supabase
      .from('subscriptions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (subError) {
      console.error('Error deleting subscriptions:', subError);
    } else {
      console.log(`✅ Deleted ${subCount || 0} subscriptions\n`);
    }

    // 3. Reset user subscription status
    console.log('Resetting user subscription status...');
    const { error: userError, count: userCount } = await supabase
      .from('users')
      .update({
        subscription_status: null,
        plan_type: 'free',
        razorpay_customer_id: null,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    if (userError) {
      console.error('Error resetting users:', userError);
    } else {
      console.log(`✅ Reset ${userCount || 0} users to free plan\n`);
    }

    // 4. Reset usage limits to free plan
    console.log('Resetting usage limits...');
    const { error: limitsError, count: limitsCount } = await supabase
      .from('usage_limits')
      .update({
        plan_type: 'free',
        monthly_limit_ideas: 3,
        monthly_limit_validations: 3,
      })
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Update all

    if (limitsError) {
      console.error('Error resetting usage limits:', limitsError);
    } else {
      console.log(`✅ Reset ${limitsCount || 0} usage limits to free plan\n`);
    }

    // 5. Clear webhook events (optional - for clean slate)
    console.log('Deleting webhook events...');
    const { error: webhookError, count: webhookCount } = await supabase
      .from('webhook_events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (webhookError) {
      console.error('Error deleting webhook events:', webhookError);
    } else {
      console.log(`✅ Deleted ${webhookCount || 0} webhook events\n`);
    }

    console.log('✨ Billing data cleanup complete!\n');
    console.log('Summary:');
    console.log(`- Payment transactions: ${txCount || 0} deleted`);
    console.log(`- Subscriptions: ${subCount || 0} deleted`);
    console.log(`- Users reset: ${userCount || 0}`);
    console.log(`- Usage limits reset: ${limitsCount || 0}`);
    console.log(`- Webhook events: ${webhookCount || 0} deleted`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
clearBillingData()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
