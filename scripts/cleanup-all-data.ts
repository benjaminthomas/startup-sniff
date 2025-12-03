import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanupAllData() {
  console.log('🧹 CLEANING UP ALL DATABASE DATA\n');
  console.log('=' .repeat(80));
  console.log('\n⚠️  WARNING: This will delete ALL data from the database!');
  console.log('\n🗑️  Tables to be cleared:');
  console.log('  • webhook_events');
  console.log('  • payment_transactions');
  console.log('  • subscriptions');
  console.log('  • generated_content');
  console.log('  • messages');
  console.log('  • reddit_contacts');
  console.log('  • startup_ideas');
  console.log('  • analytics_events');
  console.log('  • email_logs');
  console.log('  • reddit_posts');
  console.log('  • usage_limits');
  console.log('  • user_sessions');
  console.log('  • users (and all related data via CASCADE)');
  console.log('\n' + '=' .repeat(80));

  console.log('\n⏳ Starting cleanup in 3 seconds...');
  console.log('   Press Ctrl+C to cancel!\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const deletionOrder = [
      'webhook_events',
      'payment_transactions',
      'subscriptions',
      'generated_content',
      'messages',
      'reddit_contacts',
      'email_logs',
      'analytics_events',
      'startup_ideas',
      'reddit_posts',
      'usage_limits',
      'user_sessions',
      'users' // Last - CASCADE will clean up remaining references
    ];

    const results: Record<string, number> = {};

    for (const table of deletionOrder) {
      console.log(`🗑️  Deleting from ${table}...`);

      const { error, count } = await supabase
        .from(table as any)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        console.error(`   ❌ Error deleting from ${table}:`, error.message);
        results[table] = 0;
      } else {
        console.log(`   ✅ Deleted ${count || 0} rows from ${table}`);
        results[table] = count || 0;
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log('\n✅ DATABASE CLEANUP COMPLETE!\n');
    console.log('📊 Deletion Summary:');

    let totalDeleted = 0;
    for (const [table, count] of Object.entries(results)) {
      console.log(`   • ${table.padEnd(30)} ${count} rows`);
      totalDeleted += count;
    }

    console.log(`\n   📍 Total rows deleted: ${totalDeleted}`);
    console.log('\n💡 Database is now empty and ready for fresh data!\n');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupAllData().catch(console.error);
