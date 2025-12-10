/**
 * Admin API: Clear Database
 * WARNING: This will delete ALL data from the database
 * Use only for development/testing
 * SECURED: Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth, isAuthError } from '@/lib/middleware/admin-auth';
import { validateRequestBody, clearDatabaseSchema } from '@/lib/validation/api-schemas';

export async function POST(request: NextRequest) {
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

    console.log(`⚠️  WARNING: Admin ${user.email} is clearing database...`);

    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

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
      console.log(`🗑️  Clearing ${table}...`);

      const { error, count } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (error) {
        console.error(`❌ Error clearing ${table}:`, error.message);
        results[table] = { success: false, error: error.message };
      } else {
        console.log(`✅ Cleared ${table} (${count || 0} rows deleted)`);
        results[table] = { success: true, rowsDeleted: count || 0 };
      }
    }

    const allSuccess = Object.values(results).every(r => r.success);

    // Log admin action
    console.log(`✅ Database clearing completed by admin: ${user.email}`, {
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
    console.error('❌ Database clearing failed:', errorMessage);
    return NextResponse.json(
      { error: 'Database clearing failed: ' + errorMessage },
      { status: 500 }
    );
  }
}
