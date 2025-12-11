/**
 * Sync Payment from Razorpay API
 * Fetches payment and subscription from Razorpay and updates database
 */

import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Type for Razorpay payment object
interface RazorpayPayment {
  id: string;
  email?: string;
  amount: number;
  status: string;
  method?: string;
  created_at: number;
  order_id?: string;
  currency: string;
}

// Type for Razorpay subscription object
interface RazorpaySubscription {
  id: string;
  customer_id: string;
  status: string;
  plan_id: string;
  current_start?: number;
  current_end?: number;
}

async function syncFromRazorpay(customerEmail: string) {
  console.log('🔄 Syncing payment data from Razorpay...\n');

  try {
    // 1. Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', customerEmail)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError?.message);
      process.exit(1);
    }

    console.log('👤 User found:', user.email);
    console.log('   Customer ID:', user.razorpay_customer_id);

    if (!user.razorpay_customer_id) {
      console.error('❌ No Razorpay customer ID found');
      process.exit(1);
    }

    // 2. Fetch subscriptions from Razorpay
    console.log('\n📋 Fetching subscriptions from Razorpay...');

    const subscriptions = await razorpay.subscriptions.all({
      count: 10,
    });

    // Filter subscriptions for this customer
    const userSubscriptions = (subscriptions.items as RazorpaySubscription[]).filter(
      (sub) => sub.customer_id === user.razorpay_customer_id
    );

    if (userSubscriptions.length === 0) {
      console.log('⚠️  No subscriptions found for this customer\n');
      console.log('Possible reasons:');
      console.log('  1. Payment completed but subscription not created');
      console.log('  2. Using different Razorpay account (test vs live)');
      console.log('  3. Customer ID mismatch\n');

      // Try to fetch payments instead
      console.log('🔍 Fetching payments from Razorpay...');
      const payments = await razorpay.payments.all({
        count: 10,
      });

      const userPayments = (payments.items as RazorpayPayment[]).filter(
        (payment) => payment.email === customerEmail
      );

      if (userPayments.length === 0) {
        console.log('❌ No payments found for this email');
        console.log('\n💡 Please check Razorpay dashboard:');
        console.log(`https://dashboard.razorpay.com/app/customers/${user.razorpay_customer_id}`);
        process.exit(1);
      }

      console.log(`\n✅ Found ${userPayments.length} payment(s):\n`);

      userPayments.forEach((payment, idx: number) => {
        console.log(`Payment ${idx + 1}:`);
        console.log(`  ID: ${payment.id}`);
        console.log(`  Amount: ₹${payment.amount / 100}`);
        console.log(`  Status: ${payment.status}`);
        console.log(`  Method: ${payment.method}`);
        console.log(`  Created: ${new Date(payment.created_at * 1000).toLocaleString()}\n`);
      });

      // Use the most recent captured payment
      const capturedPayment = userPayments.find((p) => p.status === 'captured') || userPayments[0];

      if (capturedPayment.status !== 'captured') {
        console.log('⚠️  No captured payment found');
        console.log('   The payment may not have been completed successfully');
        process.exit(1);
      }

      console.log('🔧 Using payment:', capturedPayment.id);
      console.log('   Status:', capturedPayment.status);
      console.log('   Amount: ₹' + capturedPayment.amount / 100);

      // Create payment transaction record
      console.log('\n💾 Creating payment transaction record...');

      const { error: txError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          razorpay_payment_id: capturedPayment.id,
          razorpay_order_id: capturedPayment.order_id,
          razorpay_subscription_id: null,
          amount: capturedPayment.amount,
          currency: capturedPayment.currency,
          status: capturedPayment.status,
          payment_method: capturedPayment.method,
          captured_at: new Date(capturedPayment.created_at * 1000).toISOString(),
        });

      if (txError) {
        console.error('❌ Error creating transaction:', txError.message);
      } else {
        console.log('✅ Payment transaction created');
      }

      // Ask user which plan to activate
      console.log('\n⚠️  Cannot determine plan from payment alone');
      console.log('Please manually specify which plan to activate:');
      console.log('  - pro_monthly (₹3,588/month)');
      console.log('  - pro_yearly (₹35,880/year)\n');
      console.log('Run: npx tsx scripts/manual-activate-subscription.ts <email> <plan_type>');

      return;
    }

    console.log(`✅ Found ${userSubscriptions.length} subscription(s)\n`);

    // Use the most recent active subscription
    const activeSubscription = userSubscriptions.find((s) => s.status === 'active') || userSubscriptions[0];

    console.log('📦 Subscription Details:');
    console.log(`   ID: ${activeSubscription.id}`);
    console.log(`   Status: ${activeSubscription.status}`);
    console.log(`   Plan ID: ${activeSubscription.plan_id}`);
    if (activeSubscription.current_start && activeSubscription.current_end) {
      console.log(`   Current Period: ${new Date(activeSubscription.current_start * 1000).toLocaleDateString()} - ${new Date(activeSubscription.current_end * 1000).toLocaleDateString()}\n`);
    } else {
      console.log('   Current Period: Not available\n');
    }

    // 3. Map plan ID to our plan type
    const planMapping: Record<string, string> = {
      [process.env.NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID!]: 'pro_monthly',
      [process.env.NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID!]: 'pro_yearly',
    };

    const planType = planMapping[activeSubscription.plan_id];

    if (!planType) {
      console.error('❌ Unknown plan ID:', activeSubscription.plan_id);
      console.error('   Expected:', process.env.NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID, 'or', process.env.NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID);
      process.exit(1);
    }

    console.log('✅ Mapped to plan type:', planType);

    // 4. Create subscription record
    console.log('\n💾 Creating subscription record...');

    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        razorpay_subscription_id: activeSubscription.id,
        razorpay_plan_id: activeSubscription.plan_id,
        status: activeSubscription.status,
        plan_type: planType,
        current_period_start: activeSubscription.current_start
          ? new Date(activeSubscription.current_start * 1000).toISOString()
          : null,
        current_period_end: activeSubscription.current_end
          ? new Date(activeSubscription.current_end * 1000).toISOString()
          : null,
      });

    if (subError) {
      console.error('❌ Error creating subscription:', subError.message);
    } else {
      console.log('✅ Subscription record created');
    }

    // 5. Fetch payments for this subscription
    console.log('\n💳 Fetching payments...');

    const payments = await razorpay.payments.all({
      count: 10,
    });

    const subscriptionPayments = payments.items.filter(
      (payment: any) => payment.subscription_id === activeSubscription.id
    );

    console.log(`✅ Found ${subscriptionPayments.length} payment(s)`);

    for (const payment of subscriptionPayments) {
      console.log(`   Creating payment record: ${payment.id} (${payment.status})`);

      const { error: txError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          razorpay_payment_id: payment.id,
          razorpay_order_id: payment.order_id,
          razorpay_subscription_id: activeSubscription.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          payment_method: payment.method,
          captured_at: payment.status === 'captured' ? new Date(payment.created_at * 1000).toISOString() : null,
        });

      if (txError) {
        console.error(`   ❌ Error: ${txError.message}`);
      } else {
        console.log(`   ✅ Payment transaction created`);
      }
    }

    // 6. Update user plan
    console.log('\n👤 Updating user plan...');

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
      console.log('✅ User plan updated to:', planType);
    }

    // 7. Update usage limits
    console.log('\n📊 Updating usage limits...');

    const { error: limitsError } = await supabase
      .from('usage_limits')
      .update({
        plan_type: planType,
        monthly_limit_ideas: 999999, // Unlimited
        monthly_limit_validations: 999999, // Unlimited
      })
      .eq('user_id', user.id);

    if (limitsError) {
      console.error('❌ Error updating limits:', limitsError.message);
    } else {
      console.log('✅ Usage limits updated to unlimited');
    }

    // 8. Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ SYNC COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📧 Email: ${user.email}`);
    console.log(`📦 Plan: ${planType}`);
    console.log(`🔄 Status: active`);
    console.log(`💳 Payments: ${subscriptionPayments.length} synced`);
    console.log('\n💡 Next steps:');
    console.log('   1. User should log out and log back in');
    console.log('   2. Or hard refresh the page (Ctrl+Shift+R)');
    console.log('   3. Verify sidebar shows correct plan');
    console.log('   4. Verify conversations are unlocked\n');

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    if (error.error) {
      console.error('   Razorpay error:', error.error);
    }
    process.exit(1);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: npx tsx scripts/sync-from-razorpay.ts <email>');
  console.error('Example: npx tsx scripts/sync-from-razorpay.ts user@example.com');
  process.exit(1);
}

syncFromRazorpay(email);
