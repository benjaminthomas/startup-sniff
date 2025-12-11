/**
 * Clear Database Script
 * WARNING: This will delete ALL data from the database
 * Use only for development/testing
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function clearDatabase() {
  console.log('⚠️  WARNING: This will delete ALL data from the database!');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Delete in order respecting foreign key constraints
    const tables = [
      'webhook_events',
      'messages',
      'reddit_contacts',
      'reddit_posts',
      'payment_transactions',
      'subscriptions',
      'usage_limits',
      'users'
    ];

    for (const table of tables) {
      console.log(`🗑️  Clearing ${table}...`);

      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (error) {
        console.error(`❌ Error clearing ${table}:`, error.message);
      } else {
        console.log(`✅ Cleared ${table}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Database cleared successfully!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('💡 Next steps:');
    console.log('   1. Go to /auth/signup to create a new account');
    console.log('   2. Test the complete subscription flow');
    console.log('   3. Make a payment and verify webhook handling');
    console.log('');

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

clearDatabase();
