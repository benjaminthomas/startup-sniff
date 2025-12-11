/**
 * Process Expired Subscriptions
 * This script should be run as a cron job (daily or hourly)
 * Finds subscriptions that are active with cancel_at_period_end=true and past their period end
 * Marks them as cancelled and updates user plan to free
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function processExpiredSubscriptions() {
  console.log('🔄 Processing expired subscriptions...\n');

  try {
    const now = new Date().toISOString();

    // Find all active subscriptions that are marked for cancellation and past their period end
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*, users!inner(id, email, full_name)')
      .eq('status', 'active')
      .eq('cancel_at_period_end', true)
      .lt('current_period_end', now);

    if (fetchError) {
      console.error('❌ Error fetching expired subscriptions:', fetchError.message);
      process.exit(1);
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      console.log('✅ No expired subscriptions to process');
      process.exit(0);
    }

    console.log(`📋 Found ${expiredSubscriptions.length} expired subscription(s) to process\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const subscription of expiredSubscriptions) {
      const user = (subscription as any).users;
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Processing: ${user.email}`);
      console.log(`  User ID: ${subscription.user_id}`);
      console.log(`  Subscription ID: ${subscription.razorpay_subscription_id}`);
      console.log(`  Plan: ${subscription.plan_type}`);
      console.log(`  Period Ended: ${new Date(subscription.current_period_end).toLocaleString()}`);

      try {
        // 1. Update subscription status to cancelled
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
          })
          .eq('id', subscription.id);

        if (subError) {
          throw new Error(`Failed to update subscription: ${subError.message}`);
        }

        // 2. Update user plan to free
        const { error: userError } = await supabase
          .from('users')
          .update({
            plan_type: 'free',
            subscription_status: 'inactive',
          })
          .eq('id', subscription.user_id);

        if (userError) {
          throw new Error(`Failed to update user: ${userError.message}`);
        }

        // 3. Update usage limits to free tier
        const { error: limitsError } = await supabase
          .from('usage_limits')
          .upsert(
            {
              user_id: subscription.user_id,
              plan_type: 'free',
              monthly_limit_ideas: 5, // Free tier limits
              monthly_limit_validations: 3,
              ideas_generated: 0,
              validations_completed: 0,
            },
            { onConflict: 'user_id' }
          );

        if (limitsError) {
          throw new Error(`Failed to update limits: ${limitsError.message}`);
        }

        console.log(`  ✅ Successfully expired subscription`);
        console.log(`  → Subscription status: cancelled`);
        console.log(`  → User plan: free`);
        console.log(`  → User retains read-only access to generated ideas`);

        successCount++;
      } catch (error: any) {
        console.error(`  ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('\n📊 Summary');
    console.log(`  Total Processed: ${expiredSubscriptions.length}`);
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some subscriptions failed to process. Check logs above.');
      process.exit(1);
    } else {
      console.log('\n✅ All expired subscriptions processed successfully');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  processExpiredSubscriptions();
}

export { processExpiredSubscriptions };
