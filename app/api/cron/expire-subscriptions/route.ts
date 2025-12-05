/**
 * API Route: Expire Subscriptions Cron Job
 * This route can be called by a cron service (Vercel Cron, external cron, etc.)
 * to process expired subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret-here';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date().toISOString();

    // Find all active subscriptions that are marked for cancellation and past their period end
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*, users!inner(id, email)')
      .eq('status', 'active')
      .eq('cancel_at_period_end', true)
      .lt('current_period_end', now);

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch expired subscriptions', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired subscriptions to process',
        processed: 0,
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{
      subscription_id: string;
      user_email?: string;
      error: string;
    }> = [];

    for (const subscription of expiredSubscriptions) {
      try {
        // 1. Update subscription status to cancelled
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', subscription.id);

        // 2. Update user plan to free
        await supabase
          .from('users')
          .update({
            plan_type: 'free',
            subscription_status: 'inactive',
          })
          .eq('id', subscription.user_id);

        // 3. Update usage limits to free tier
        await supabase
          .from('usage_limits')
          .upsert(
            {
              user_id: subscription.user_id,
              plan_type: 'free',
              monthly_limit_ideas: 5,
              monthly_limit_validations: 3,
              ideas_generated: 0,
              validations_completed: 0,
            },
            { onConflict: 'user_id' }
          );

        successCount++;
      } catch (error: unknown) {
        console.error(`Failed to process subscription ${subscription.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errorCount++;
        errors.push({
          subscription_id: subscription.id,
          user_email: subscription.user_id, // Using user_id as identifier instead
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredSubscriptions.length} expired subscription(s)`,
      processed: expiredSubscriptions.length,
      successful: successCount,
      failed: errorCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: unknown) {
    console.error('Fatal error in expire-subscriptions cron:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
