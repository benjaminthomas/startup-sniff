/**
 * Check Recent Payment
 * Quick script to check the most recent payment for a user
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRecentPayment(email: string) {
  console.log('🔍 Checking recent payment for:', email);

  try {
    // 1. Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.error('❌ User not found');
      process.exit(1);
    }

    console.log('\n👤 User Info:');
    console.log('  Email:', user.email);
    console.log('  User ID:', user.id);
    console.log('  Current Plan:', user.plan_type);
    console.log('  Subscription Status:', user.subscription_status);

    // 2. Get recent payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError.message);
      process.exit(1);
    }

    console.log('\n💳 Recent Payments:');
    if (!payments || payments.length === 0) {
      console.log('  No payments found');
    } else {
      payments.forEach((payment, index) => {
        console.log(`\n  Payment ${index + 1}:`);
        console.log('    Payment ID:', payment.razorpay_payment_id);
        console.log('    Subscription ID:', payment.razorpay_subscription_id || 'N/A');
        console.log('    Amount: ₹' + payment.amount / 100);
        console.log('    Status:', payment.status);
        console.log('    Plan Type:', payment.plan_type || 'N/A');
        console.log('    Created:', new Date(payment.created_at).toLocaleString());
        if (payment.captured_at) {
          console.log('    Captured:', new Date(payment.captured_at).toLocaleString());
        }
      });
    }

    // 3. Check existing subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('\n📦 Subscriptions:');
    if (!subscriptions || subscriptions.length === 0) {
      console.log('  No subscriptions found');
    } else {
      subscriptions.forEach((sub, index) => {
        console.log(`\n  Subscription ${index + 1}:`);
        console.log('    ID:', sub.id);
        console.log('    Razorpay Sub ID:', sub.razorpay_subscription_id);
        console.log('    Status:', sub.status);
        console.log('    Plan Type:', sub.plan_type);
        console.log('    Period:', new Date(sub.current_period_start).toLocaleDateString(), '-', new Date(sub.current_period_end).toLocaleDateString());
        console.log('    Cancel at period end:', sub.cancel_at_period_end);
      });
    }

    // 4. Determine what needs to be done
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 RECOMMENDATION:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const latestPayment = payments?.[0];
    const activeSubscription = subscriptions?.find(s => s.status === 'active');

    if (latestPayment && latestPayment.status === 'captured') {
      const planType = latestPayment.plan_type || (latestPayment.amount === 290000 ? 'pro_monthly' : 'pro_yearly');

      if (!activeSubscription || activeSubscription.razorpay_subscription_id !== latestPayment.razorpay_subscription_id) {
        console.log('\n✅ Found captured payment that needs activation!');
        console.log(`   Plan: ${planType}`);
        console.log(`   Amount: ₹${latestPayment.amount / 100}`);
        console.log('\n💡 Run this command to activate:');
        console.log(`   npx tsx scripts/manual-activate-subscription.ts ${email} ${planType}`);
      } else {
        console.log('\n✅ Subscription is already active for this payment');
      }
    } else {
      console.log('\n⚠️  No recent captured payments found');
    }

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('❌ Usage: npx tsx scripts/check-recent-payment.ts <email>');
  process.exit(1);
}

checkRecentPayment(email);
