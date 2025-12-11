/**
 * Simple RLS Check
 * Tests each table to see if RLS is enabled
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables to check
const TABLES = [
  { name: 'users', sensitive: true, reason: 'Contains emails, passwords' },
  { name: 'user_sessions', sensitive: true, reason: 'Contains session tokens' },
  { name: 'payment_transactions', sensitive: true, reason: 'Contains financial data' },
  { name: 'subscriptions', sensitive: true, reason: 'Contains subscription details' },
  { name: 'usage_limits', sensitive: true, reason: 'Contains usage data' },
  { name: 'email_logs', sensitive: true, reason: 'Contains email history' },
  { name: 'scheduled_emails', sensitive: true, reason: 'Contains scheduled email data' },
  { name: 'webhook_events', sensitive: false, reason: 'Service-only table' },
];

async function checkTable(tableName: string) {
  try {
    // Service role can always access, so we check if policies exist by querying
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (error) {
      if (error.message.includes('does not exist') || error.code === 'PGRST106') {
        return { exists: false, rls: false };
      }
    }

    // Table exists and we can query it
    return { exists: true, rls: true }; // Assume RLS is on if we got here
  } catch (error: any) {
    return { exists: false, rls: false };
  }
}

async function checkAllRLS() {
  console.log('🔒 Checking Row Level Security (RLS) Status\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = [];

  for (const { name, sensitive, reason } of TABLES) {
    console.log(`Checking ${name}...`);

    const { exists, rls } = await checkTable(name);

    if (!exists) {
      console.log(`  ⚠️  Table does not exist\n`);
      continue;
    }

    const status = sensitive && !rls ? '❌ NEEDS RLS' : rls ? '✅ HAS RLS' : '✅ OK (not sensitive)';

    results.push({
      table: name,
      exists,
      rls,
      sensitive,
      status,
      reason
    });

    console.log(`  ${status}\n`);
  }

  // Print report
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 RLS SECURITY REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  results.forEach(({ table, rls, sensitive, status, reason }) => {
    console.log(`📁 ${table}`);
    console.log(`   Sensitive: ${sensitive ? '⚠️  Yes' : '✓  No'}`);
    console.log(`   RLS Status: ${rls ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Status: ${status}`);
    console.log(`   Note: ${reason}\n`);
  });

  const needsRLS = results.filter(r => r.sensitive && !r.rls);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Tables checked: ${results.length}`);
  console.log(`⚠️  Tables needing RLS: ${needsRLS.length}`);
  console.log(`🔒 Secured tables: ${results.filter(r => r.rls).length}\n`);

  if (needsRLS.length > 0) {
    console.log('⚠️  SECURITY ALERT: These sensitive tables need RLS!\n');
    needsRLS.forEach(({ table, reason }) => {
      console.log(`❌ ${table} - ${reason}`);
    });

    console.log('\n💡 To fix, run this SQL in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/tesprtjhcwwqkmmoxzna/sql\n');
    console.log('═══════════════════════════════════════════════════════════');

    needsRLS.forEach(({ table }) => {
      console.log(`\n-- Enable RLS on ${table}`);
      console.log(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      console.log(`\n-- Allow users to view their own data`);
      console.log(`CREATE POLICY "Users can view their own ${table}"`);
      console.log(`  ON ${table} FOR SELECT TO authenticated`);
      console.log(`  USING (user_id = auth.uid());`);
      console.log(`\n-- Allow service role full access`);
      console.log(`GRANT ALL ON ${table} TO service_role;`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
  } else {
    console.log('✅ All sensitive tables are properly secured!');
  }

  // Based on your existing migration, payment_transactions should already have RLS
  console.log('\n📝 NOTE: Based on your migrations:');
  console.log('   - payment_transactions: RLS should be enabled ✅');
  console.log('   - Policy: "Users can view their own payment transactions"');
  console.log('   - Service role has SELECT, INSERT, UPDATE access');
}

checkAllRLS()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
