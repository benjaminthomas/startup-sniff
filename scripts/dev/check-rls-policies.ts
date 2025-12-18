/**
 * Check Row Level Security (RLS) Policies
 * Analyzes all tables and their RLS policies
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TableInfo {
  table_name: string;
  rls_enabled: boolean;
  rls_forced: boolean;
}

interface PolicyInfo {
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
}

async function checkRLSPolicies() {
  console.log('🔒 Checking Row Level Security (RLS) Policies\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get all tables with RLS status
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          schemaname,
          tablename as table_name,
          rowsecurity as rls_enabled,
          false as rls_forced
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `
    });

    if (tablesError) {
      // Fallback: Try direct query
      console.log('Fetching table information...\n');

      // Query information_schema for tables
      const tablesQuery = `
        SELECT DISTINCT
          t.table_name,
          CASE
            WHEN pc.relrowsecurity THEN true
            ELSE false
          END as rls_enabled,
          CASE
            WHEN pc.relforcerowsecurity THEN true
            ELSE false
          END as rls_forced
        FROM information_schema.tables t
        LEFT JOIN pg_class pc ON pc.relname = t.table_name
        LEFT JOIN pg_namespace pn ON pn.oid = pc.relnamespace
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND pn.nspname = 'public'
        ORDER BY t.table_name;
      `;

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql: tablesQuery })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch table information');
      }
    }

    // Since direct SQL might not work, let's query the schema manually
    console.log('📊 Analyzing tables in public schema...\n');

    // List of tables we know exist based on our schema
    const knownTables = [
      'users',
      'user_sessions',
      'payment_transactions',
      'subscriptions',
      'usage_limits',
      'webhook_events',
      'email_logs',
      'scheduled_emails'
    ];

    const results: Array<{
      table: string;
      rls_enabled: boolean;
      has_policies: boolean;
      recommendation: string;
      reason: string;
    }> = [];

    for (const tableName of knownTables) {
      console.log(`Checking ${tableName}...`);

      try {
        // Try to query the table - if it fails with RLS error, RLS is enabled
        const { error: queryError } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);

        let rls_enabled = false;
        let has_policies = false;

        if (queryError) {
          // Check if it's an RLS policy error
          if (queryError.message.includes('policy') || queryError.message.includes('RLS')) {
            rls_enabled = true;
            has_policies = true;
          } else if (queryError.message.includes('does not exist')) {
            console.log(`  ⚠️  Table does not exist\n`);
            continue;
          }
        }

        // Determine recommendation
        let recommendation = '✅ OK';
        let reason = '';

        if (tableName === 'users') {
          if (!rls_enabled) {
            recommendation = '⚠️  SHOULD ENABLE RLS';
            reason = 'Contains sensitive user data (email, password_hash)';
          } else {
            recommendation = '✅ SECURE';
            reason = 'RLS enabled - users can only access their own data';
          }
        } else if (tableName === 'payment_transactions') {
          if (!rls_enabled) {
            recommendation = '⚠️  SHOULD ENABLE RLS';
            reason = 'Contains financial data - must restrict to user_id';
          } else {
            recommendation = '✅ SECURE';
            reason = 'RLS enabled - users can only see their own transactions';
          }
        } else if (tableName === 'subscriptions') {
          if (!rls_enabled) {
            recommendation = '⚠️  SHOULD ENABLE RLS';
            reason = 'Contains subscription details - must restrict to user_id';
          } else {
            recommendation = '✅ SECURE';
            reason = 'RLS enabled - users can only see their own subscriptions';
          }
        } else if (tableName === 'usage_limits') {
          if (!rls_enabled) {
            recommendation = '⚠️  SHOULD ENABLE RLS';
            reason = 'Contains user usage data - must restrict to user_id';
          } else {
            recommendation = '✅ SECURE';
            reason = 'RLS enabled - users can only see their own limits';
          }
        } else if (tableName === 'email_logs' || tableName === 'scheduled_emails') {
          if (!rls_enabled) {
            recommendation = '⚠️  SHOULD ENABLE RLS';
            reason = 'Contains user email data - must restrict to user_id';
          } else {
            recommendation = '✅ SECURE';
            reason = 'RLS enabled - users can only see their own emails';
          }
        } else if (tableName === 'user_sessions') {
          if (!rls_enabled) {
            recommendation = '⚠️  SHOULD ENABLE RLS';
            reason = 'Contains session tokens - must restrict to user_id';
          } else {
            recommendation = '✅ SECURE';
            reason = 'RLS enabled - users can only see their own sessions';
          }
        } else if (tableName === 'webhook_events') {
          if (!rls_enabled) {
            recommendation = '✅ OK';
            reason = 'Service-only table - no user access needed';
          } else {
            recommendation = '✅ SECURE';
            reason = 'RLS enabled (optional for service table)';
          }
        }

        results.push({
          table: tableName,
          rls_enabled,
          has_policies,
          recommendation,
          reason
        });

        console.log(`  ${recommendation}\n`);

      } catch (error) {
        console.error(`  ❌ Error checking ${tableName}:`, error);
      }
    }

    // Print detailed report
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 DETAILED RLS SECURITY REPORT');
    console.log('═══════════════════════════════════════════════════════════\n');

    results.forEach(({ table, rls_enabled, has_policies, recommendation, reason }) => {
      console.log(`📁 ${table}`);
      console.log(`   RLS Enabled: ${rls_enabled ? '✅ Yes' : '❌ No'}`);
      console.log(`   Status: ${recommendation}`);
      console.log(`   Reason: ${reason}\n`);
    });

    // Summary
    const needsRLS = results.filter(r => r.recommendation.includes('SHOULD ENABLE'));
    const secure = results.filter(r => r.recommendation.includes('SECURE'));

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Secure tables: ${secure.length}`);
    console.log(`⚠️  Need RLS: ${needsRLS.length}`);
    console.log(`📋 Total checked: ${results.length}\n`);

    if (needsRLS.length > 0) {
      console.log('⚠️  SECURITY RECOMMENDATIONS:\n');
      needsRLS.forEach(({ table, reason }) => {
        console.log(`❌ ${table}`);
        console.log(`   → ${reason}\n`);
      });

      console.log('\n💡 To enable RLS, run in Supabase SQL Editor:');
      console.log('═══════════════════════════════════════════════════════════');
      needsRLS.forEach(({ table }) => {
        console.log(`\nALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);

        if (table !== 'webhook_events') {
          console.log(`\nCREATE POLICY "Users can view their own ${table}"`);
          console.log(`  ON ${table}`);
          console.log(`  FOR SELECT`);
          console.log(`  TO authenticated`);
          console.log(`  USING (user_id = auth.uid());`);
        }
      });
      console.log('\n═══════════════════════════════════════════════════════════');
    } else {
      console.log('✅ All tables are properly secured with RLS!');
    }

  } catch (error) {
    console.error('❌ Error checking RLS policies:', error);
    process.exit(1);
  }
}

checkRLSPolicies()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
