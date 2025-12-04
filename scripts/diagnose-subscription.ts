/**
 * Subscription Diagnostic Tool
 * Checks database state to identify subscription activation issues
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

async function diagnoseSubscription(userEmail: string) {
  console.log('🔍 Diagnosing subscription issue for:', userEmail);
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Check user
    console.log('👤 Checking User Status...');
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
    console.log('  Plan Type:', user.plan_type || 'null');
    console.log('  Subscription Status:', user.subscription_status || 'null');
    console.log('  Razorpay Customer ID:', user.razorpay_customer_id || 'null');
    console.log('  Created:', new Date(user.created_at).toLocaleString());
    console.log('');

    // 2. Check subscriptions
    console.log('📋 Checking Subscriptions Table...');
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (subsError) {
      console.error('❌ Error fetching subscriptions:', subsError.message);
    } else if (!subscriptions || subscriptions.length === 0) {
      console.log('  ⚠️  No subscriptions found');
    } else {
      subscriptions.forEach((sub, index) => {
        console.log(`  Subscription ${index + 1}:`);
        console.log(`    ID: ${sub.id}`);
        console.log(`    Razorpay Sub ID: ${sub.razorpay_subscription_id || 'null'}`);
        console.log(`    Status: ${sub.status || 'null'}`);
        console.log(`    Plan Type: ${sub.plan_type || 'null'}`);
        console.log(`    Current Period: ${sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString() : 'null'} - ${sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'null'}`);
        console.log(`    Created: ${new Date(sub.created_at).toLocaleString()}`);
        console.log('');
      });
    }

    // 3. Check payments
    console.log('💳 Checking Payment Transactions...');
    const { data: payments, error: paymentsError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError.message);
    } else if (!payments || payments.length === 0) {
      console.log('  ⚠️  No payment transactions found');
    } else {
      payments.forEach((payment, index) => {
        console.log(`  Payment ${index + 1}:`);
        console.log(`    Payment ID: ${payment.razorpay_payment_id}`);
        console.log(`    Subscription ID: ${payment.razorpay_subscription_id || 'null'}`);
        console.log(`    Status: ${payment.status}`);
        console.log(`    Amount: ₹${(payment.amount / 100).toFixed(2)}`);
        console.log(`    Method: ${payment.payment_method || 'unknown'}`);
        console.log(`    Created: ${new Date(payment.created_at).toLocaleString()}`);
        console.log(`    Captured: ${payment.captured_at ? new Date(payment.captured_at).toLocaleString() : 'null'}`);
        console.log('');
      });
    }

    // 4. Check usage limits
    console.log('📊 Checking Usage Limits...');
    const { data: limits, error: limitsError } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (limitsError) {
      console.error('❌ Error fetching usage limits:', limitsError.message);
    } else if (limits) {
      console.log(`  Plan Type: ${limits.plan_type}`);
      console.log(`  Monthly Limit Ideas: ${limits.monthly_limit_ideas}`);
      console.log(`  Monthly Limit Validations: ${limits.monthly_limit_validations}`);
      console.log(`  Ideas Generated: ${limits.ideas_generated || 0}`);
      console.log(`  Validations Completed: ${limits.validations_completed || 0}`);
      console.log('');
    }

    // 5. Check webhook events
    console.log('🔔 Checking Recent Webhook Events...');
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhook_events')
      .select('*')
      .ilike('event_type', 'subscription.%')
      .order('created_at', { ascending: false })
      .limit(15);

    if (webhooksError) {
      console.error('❌ Error fetching webhooks:', webhooksError.message);
    } else if (!webhooks || webhooks.length === 0) {
      console.log('  ⚠️  No subscription webhook events found');
    } else {
      webhooks.forEach((webhook, index) => {
        console.log(`  Webhook ${index + 1}:`);
        console.log(`    Event: ${webhook.event_type}`);
        console.log(`    Event ID: ${webhook.event_id}`);
        console.log(`    Processed: ${webhook.processed ? '✅ Yes' : '❌ No'}`);
        console.log(`    Error: ${webhook.error_message || 'None'}`);
        console.log(`    Retry Count: ${webhook.retry_count || 0}`);
        console.log(`    Created: ${new Date(webhook.created_at).toLocaleString()}`);
        console.log('');
      });
    }

    // 6. Diagnosis
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 DIAGNOSIS & RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════\n');

    const hasSuccessfulPayment = payments?.some(p => p.status === 'captured' || p.status === 'verified');
    const hasActiveSubscription = subscriptions?.some(s => s.status === 'active');
    const hasSubscriptionActivatedWebhook = webhooks?.some(w => w.event_type === 'subscription.activated' && w.processed);

    if (user.plan_type === 'free' && hasSuccessfulPayment) {
      console.log('❌ ISSUE CONFIRMED: Payment captured but subscription not activated\n');

      if (!hasSubscriptionActivatedWebhook) {
        console.log('📌 ROOT CAUSE: subscription.activated webhook never processed');
        console.log('   Possible reasons:');
        console.log('   - Webhook not sent by Razorpay');
        console.log('   - Webhook processing failed');
        console.log('   - Webhook endpoint was down\n');
      } else if (!hasActiveSubscription) {
        console.log('📌 ROOT CAUSE: Webhook processed but subscription not created/activated');
        console.log('   Possible reasons:');
        console.log('   - Database update failed');
        console.log('   - Missing user_id in webhook notes');
        console.log('   - Plan mapping issue\n');
      } else {
        console.log('📌 ROOT CAUSE: Subscription active but user plan_type not updated');
        console.log('   Possible reasons:');
        console.log('   - users table update failed in webhook');
        console.log('   - Transaction rolled back\n');
      }

      console.log('✅ RECOMMENDED FIX:');
      console.log('   Run: npx tsx scripts/fix-subscription-activation.ts\n');

      console.log('💡 ALTERNATIVE:');
      console.log('   1. Check Razorpay Dashboard for failed webhooks');
      console.log('   2. Replay subscription.activated webhook if available');
      console.log('   3. Or manually update database with fix script\n');

    } else if (user.plan_type !== 'free') {
      console.log('✅ USER PLAN IS CORRECT: plan_type =', user.plan_type);
      console.log('   The database shows the user has a paid plan.\n');

      console.log('📌 POSSIBLE ISSUE: Frontend cache or session');
      console.log('   Solutions:');
      console.log('   1. User should hard refresh (Ctrl+Shift+R or Cmd+Shift+R)');
      console.log('   2. User should log out and log back in');
      console.log('   3. Clear browser cache\n');

    } else if (!hasSuccessfulPayment) {
      console.log('⚠️  NO SUCCESSFUL PAYMENT FOUND');
      console.log('   The user may not have completed the payment');
      console.log('   Or payment is still processing\n');

    } else {
      console.log('✅ Everything looks normal');
      console.log('   User has free plan and no successful payments\n');
    }

    // 7. Quick action commands
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🛠️  QUICK ACTIONS');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (user.plan_type === 'free' && hasSuccessfulPayment) {
      console.log('To fix this user\'s subscription, run:');
      console.log(`\nnpx tsx scripts/fix-subscription-activation.ts ${user.email}\n`);
    }

    console.log('To check Razorpay webhook logs:');
    console.log('https://dashboard.razorpay.com/app/webhooks\n');

    console.log('To check subscription in Razorpay:');
    if (subscriptions?.[0]?.razorpay_subscription_id) {
      console.log(`https://dashboard.razorpay.com/app/subscriptions/${subscriptions[0].razorpay_subscription_id}\n`);
    } else {
      console.log('(No Razorpay subscription ID found)\n');
    }

  } catch (error) {
    console.error('❌ Fatal error during diagnosis:', error);
    process.exit(1);
  }
}

// Get email from command line args
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Usage: npx tsx scripts/diagnose-subscription.ts <user-email>');
  console.error('Example: npx tsx scripts/diagnose-subscription.ts user@example.com');
  process.exit(1);
}

diagnoseSubscription(userEmail)
  .then(() => {
    console.log('✅ Diagnosis complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
