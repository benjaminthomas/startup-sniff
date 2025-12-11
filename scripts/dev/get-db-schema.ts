import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSchema() {
  console.log('📋 DATABASE SCHEMA ANALYSIS\n');
  console.log('=' .repeat(80));

  // Get all tables by checking known tables
  const tableNames = [
    'users', 'user_sessions', 'subscriptions', 'payment_transactions',
    'webhook_events', 'startup_ideas', 'reddit_contacts', 'reddit_posts',
    'analytics_events', 'messages', 'generated_content', 'usage_limits',
    'rate_limits', 'security_events', 'email_queue', 'email_logs',
    'template_variants', 'reddit_trends', 'reddit_trend_searches',
    'reddit_trend_results'
  ];

  const existingTables = [];
  for (const table of tableNames) {
    const { error } = await supabase.from(table as any).select('id').limit(0);
    if (!error) {
      existingTables.push({ table_name: table });
    }
  }

  const tables = existingTables;
  const error = null;

  if (error) {
    console.error('❌ Failed to get tables:', error);
    return;
  }

  console.log('\n📊 Tables in Database:\n');

  const allTables: string[] = [];
  for (const table of tables || []) {
    const tableName = table.table_name;
    allTables.push(tableName);

    // Get row count
    const { count } = await supabase
      .from(tableName as any)
      .select('*', { count: 'exact', head: true });

    console.log(`  ✓ ${tableName.padEnd(35)} (${count || 0} rows)`);
  }

  console.log('\n' + '=' .repeat(80));
  console.log('\n🔗 Foreign Key Dependencies:\n');

  console.log('  Key Relationships:');
  console.log('  • subscriptions → users (user_id)');
  console.log('  • payment_transactions → users (user_id)');
  console.log('  • startup_ideas → users (user_id)');
  console.log('  • reddit_contacts → users (user_id)');
  console.log('  • messages → users (user_id)');
  console.log('  • analytics_events → users (user_id)');
  console.log('  • generated_content → startup_ideas (idea_id)');
  console.log('  • usage_limits → users (user_id)');
  console.log('  • user_sessions → users (user_id)');

  console.log('\n' + '=' .repeat(80));
  console.log('\n⚠️  DELETION ORDER (respecting FK constraints):\n');
  console.log('  1. webhook_events (no dependencies)');
  console.log('  2. payment_transactions (depends on users)');
  console.log('  3. subscriptions (depends on users)');
  console.log('  4. generated_content (depends on startup_ideas)');
  console.log('  5. messages (depends on users, reddit_contacts)');
  console.log('  6. reddit_contacts (depends on users, reddit_posts)');
  console.log('  7. startup_ideas (depends on users)');
  console.log('  8. analytics_events (depends on users)');
  console.log('  9. email_logs (depends on users)');
  console.log('  10. email_queue (depends on users)');
  console.log('  11. reddit_posts (no user dependency)');
  console.log('  12. reddit_trends, reddit_trend_* (no user dependency)');
  console.log('  13. usage_limits (depends on users)');
  console.log('  14. user_sessions (depends on users)');
  console.log('  15. security_events (depends on users)');
  console.log('  16. rate_limits (depends on users)');
  console.log('  17. users (delete last - CASCADE will handle most)');

  console.log('\n');

  return allTables;
}

getSchema().catch(console.error);
