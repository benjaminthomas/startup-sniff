/**
 * Clear Database Script (Safe Version)
 * Only clears tables that exist in your schema
 * ⚠️  WARNING: This will DELETE ALL DATA!
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables to clear in order (respecting foreign key dependencies)
const TABLES_TO_CLEAR = [
  'webhook_events',           // No dependencies
  'payment_transactions',     // Depends on: users
  'subscriptions',            // Depends on: users
  'email_logs',              // Depends on: users
  'scheduled_emails',        // Depends on: users
  'usage_limits',            // Depends on: users
  'user_sessions',           // Depends on: users
  'users',                   // Last (parent table)
];

async function clearTable(tableName: string): Promise<number> {
  try {
    const { error, count } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      // Table doesn't exist or other error
      if (error.message.includes('does not exist') || error.code === 'PGRST106') {
        console.log(`⚠️  Table '${tableName}' does not exist, skipping...\n`);
        return 0;
      }
      throw error;
    }

    return count || 0;
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      console.log(`⚠️  Table '${tableName}' does not exist, skipping...\n`);
      return 0;
    }
    throw error;
  }
}

async function clearCompleteDatabase() {
  console.log('⚠️  WARNING: This will DELETE ALL DATA from your database!');
  console.log('🧹 Starting database cleanup...\n');

  const results: Record<string, number> = {};
  let totalDeleted = 0;

  for (const tableName of TABLES_TO_CLEAR) {
    console.log(`🗑️  Clearing ${tableName}...`);

    try {
      const count = await clearTable(tableName);
      results[tableName] = count;
      totalDeleted += count;

      if (count > 0) {
        console.log(`✅ Deleted ${count} records from ${tableName}\n`);
      } else {
        console.log(`✓  ${tableName} was already empty\n`);
      }
    } catch (error: any) {
      console.error(`❌ Error clearing ${tableName}:`, error.message);
      results[tableName] = 0;
    }
  }

  // Print summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✨ DATABASE CLEANUP COMPLETE!\n');
  console.log('📊 Summary:');
  console.log('═══════════════════════════════════════════════════════════');

  Object.entries(results).forEach(([table, count]) => {
    const emoji = count > 0 ? '🗑️ ' : '✓ ';
    console.log(`${emoji} ${table.padEnd(30)} ${count.toString().padStart(6)} records`);
  });

  console.log('───────────────────────────────────────────────────────────');
  console.log(`📊 Total records deleted: ${totalDeleted}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (totalDeleted === 0) {
    console.log('✅ Database was already clean!');
  } else {
    console.log('✅ Database has been completely cleared!');
    console.log('🔄 Ready for fresh testing data.');
  }
}

// Run the cleanup
clearCompleteDatabase()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
