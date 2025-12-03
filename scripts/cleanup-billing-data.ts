import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanupBillingData() {
  console.log('🧹 CLEANING UP BILLING & PAYMENT DATA\n');
  console.log('=' .repeat(80));
  console.log('\n⚠️  This will delete:');
  console.log('  • All webhook events');
  console.log('  • All payment transactions');
  console.log('  • All subscriptions');
  console.log('  • Razorpay customer IDs from users');
  console.log('\n🔒 This will NOT delete:');
  console.log('  • User accounts');
  console.log('  • Startup ideas');
  console.log('  • Reddit data');
  console.log('  • Messages');
  console.log('\n' + '=' .repeat(80));

  // Confirm with a simple check
  console.log('\n⏳ Starting cleanup in 2 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Step 1: Delete webhook_events
    console.log('1️⃣  Deleting webhook_events...');
    const { error: webhookError, count: webhookCount } = await supabase
      .from('webhook_events' as any)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (webhookError) {
      console.error('   ❌ Error:', webhookError.message);
    } else {
      console.log(`   ✅ Deleted ${webhookCount || 0} webhook events`);
    }

    // Step 2: Delete payment_transactions
    console.log('2️⃣  Deleting payment_transactions...');
    const { error: paymentError, count: paymentCount } = await supabase
      .from('payment_transactions' as any)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (paymentError) {
      console.error('   ❌ Error:', paymentError.message);
    } else {
      console.log(`   ✅ Deleted ${paymentCount || 0} payment transactions`);
    }

    // Step 3: Delete subscriptions
    console.log('3️⃣  Deleting subscriptions...');
    const { error: subError, count: subCount } = await supabase
      .from('subscriptions' as any)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (subError) {
      console.error('   ❌ Error:', subError.message);
    } else {
      console.log(`   ✅ Deleted ${subCount || 0} subscriptions`);
    }

    // Step 4: Clear Razorpay customer IDs from users
    console.log('4️⃣  Clearing Razorpay customer IDs from users...');
    const { error: userError, count: userCount } = await supabase
      .from('users' as any)
      .update({ razorpay_customer_id: null })
      .not('razorpay_customer_id', 'is', null);

    if (userError) {
      console.error('   ❌ Error:', userError.message);
    } else {
      console.log(`   ✅ Cleared customer IDs from ${userCount || 0} users`);
    }

    // Step 5: Reset plan_type to free for all users
    console.log('5️⃣  Resetting all users to free plan...');
    const { error: planError, count: planCount } = await supabase
      .from('users' as any)
      .update({
        plan_type: 'free',
        subscription_status: 'trial'
      })
      .neq('plan_type', 'free');

    if (planError) {
      console.error('   ❌ Error:', planError.message);
    } else {
      console.log(`   ✅ Reset ${planCount || 0} users to free plan`);
    }

    // Step 6: Reset usage limits to free tier
    console.log('6️⃣  Resetting usage limits to free tier...');
    const { error: limitError, count: limitCount } = await supabase
      .from('usage_limits' as any)
      .update({
        plan_type: 'free',
        monthly_limit_ideas: 3,
        monthly_limit_validations: 5,
        current_period_ideas: 0,
        current_period_validations: 0
      })
      .neq('plan_type', 'free');

    if (limitError) {
      console.error('   ❌ Error:', limitError.message);
    } else {
      console.log(`   ✅ Reset ${limitCount || 0} usage limits`);
    }

    console.log('\n' + '=' .repeat(80));
    console.log('\n✅ BILLING DATA CLEANUP COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   • Webhook events deleted: ${webhookCount || 0}`);
    console.log(`   • Payment transactions deleted: ${paymentCount || 0}`);
    console.log(`   • Subscriptions deleted: ${subCount || 0}`);
    console.log(`   • User customer IDs cleared: ${userCount || 0}`);
    console.log(`   • Users reset to free: ${planCount || 0}`);
    console.log(`   • Usage limits reset: ${limitCount || 0}`);
    console.log('\n💡 You can now test subscriptions from scratch!\n');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupBillingData().catch(console.error);
