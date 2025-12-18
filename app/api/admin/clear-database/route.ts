/**
 * Admin API: Clear Database
 * WARNING: This will delete ALL data from the database
 * Use only for development/testing
 * SECURED: Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/features/supabase/server';
import { verifyAdminAuth, isAuthError } from '@/lib/middleware/admin-auth';
import { validateRequestBody, clearDatabaseSchema } from '@/lib/validation/api-schemas';
import { log } from '@/lib/logger'

export async function POST(request: NextRequest) {
  // ✅ SECURITY: Disable in production (VULN-004)
  if (process.env.NODE_ENV === 'production') {
    log.warn('⚠️  Attempted to access clear-database endpoint in production');
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  // ✅ SECURITY: Verify admin authentication
  const authResult = await verifyAdminAuth();
  if (isAuthError(authResult)) {
    return authResult;
  }

  const { user } = authResult;

  try {
    // ✅ VALIDATION: Validate request body
    const { confirm, tables } = await validateRequestBody(request, clearDatabaseSchema);

    if (!confirm) {
      return NextResponse.json(
        { error: 'Database clearing must be explicitly confirmed' },
        { status: 400 }
      );
    }

    log.info(`⚠️  WARNING: Admin ${user.email} is clearing database...`);

    // Create Supabase admin client
    const supabase = createServerAdminClient();

    // Delete in order respecting foreign key constraints
    const tablesToClear = tables || [
      'webhook_events',
      'messages',
      'reddit_contacts',
      'reddit_posts',
      'payment_transactions',
      'subscriptions',
      'usage_limits',
      'users'
    ];

    const results: Record<string, { success: boolean; error?: string; rowsDeleted?: number }> = {};

    for (const table of tablesToClear) {
      log.info(`🗑️  Clearing ${table}...`);

      const { error, count } = await supabase
        .from(table as never) // Type assertion needed for dynamic table names
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (error) {
        log.error(`❌ Error clearing ${table}:`, error.message);
        results[table] = { success: false, error: error.message };
      } else {
        log.info(`✅ Cleared ${table} (${count || 0} rows deleted)`);
        results[table] = { success: true, rowsDeleted: count || 0 };
      }
    }

    const allSuccess = Object.values(results).every(r => r.success);

    // Log admin action
    log.info(`✅ Database clearing completed by admin: ${user.email}`, {
      tables: tablesToClear,
      results
    });

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess ? 'Database cleared successfully!' : 'Some tables failed to clear',
      admin: user.email,
      results,
      nextSteps: [
        'Go to /auth/signup to create a new account',
        'Test the complete subscription flow',
        'Make a payment and verify webhook handling'
      ]
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('❌ Database clearing failed:', errorMessage);
    return NextResponse.json(
      { error: 'Database clearing failed: ' + errorMessage },
      { status: 500 }
    );
  }
}
