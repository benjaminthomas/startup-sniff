/**
 * Clear Complete Database Script
 * ⚠️  WARNING: This will DELETE ALL DATA from the database!
 * Only use this for development/testing purposes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearCompleteDatabase() {
  console.log('⚠️  WARNING: This will DELETE ALL DATA from your database!');
  console.log('🧹 Starting complete database cleanup...\n');

  const results: Record<string, number> = {};

  try {
    // 1. Clear webhook events first (no dependencies)
    console.log('🗑️  Clearing webhook_events...');
    const { error: webhookError, count: webhookCount } = await supabase
      .from('webhook_events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    results['webhook_events'] = webhookCount || 0;
    if (webhookError) {
      console.error('Error:', webhookError.message);
    } else {
      console.log(`✅ Deleted ${webhookCount || 0} webhook events\n`);
    }

    // 2. Clear payment transactions (depends on users)
    console.log('🗑️  Clearing payment_transactions...');
    const { error: txError, count: txCount } = await supabase
      .from('payment_transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    results['payment_transactions'] = txCount || 0;
    if (txError) {
      console.error('Error:', txError.message);
    } else {
      console.log(`✅ Deleted ${txCount || 0} payment transactions\n`);
    }

    // 3. Clear subscriptions (depends on users)
    console.log('🗑️  Clearing subscriptions...');
    const { error: subError, count: subCount } = await supabase
      .from('subscriptions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    results['subscriptions'] = subCount || 0;
    if (subError) {
      console.error('Error:', subError.message);
    } else {
      console.log(`✅ Deleted ${subCount || 0} subscriptions\n`);
    }

    // 4. Clear email logs (depends on users)
    console.log('🗑️  Clearing email_logs...');
    const { error: emailError, count: emailCount } = await supabase
      .from('email_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    results['email_logs'] = emailCount || 0;
    if (emailError) {
      console.error('Error:', emailError.message);
    } else {
      console.log(`✅ Deleted ${emailCount || 0} email logs\n`);
    }

    // 5. Clear scheduled emails (depends on users)
    console.log('🗑️  Clearing scheduled_emails...');
    const { error: scheduledError, count: scheduledCount } = await supabase
      .from('scheduled_emails')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    results['scheduled_emails'] = scheduledCount || 0;
    if (scheduledError) {
      console.error('Error:', scheduledError.message);
    } else {
      console.log(`✅ Deleted ${scheduledCount || 0} scheduled emails\n`);
    }

    // 6. Clear saved startups/ideas
    console.log('🗑️  Clearing saved_startups...');
    const { error: startupsError, count: startupsCount } = await supabase
      .from('saved_startups')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    results['saved_startups'] = startupsCount || 0;
    if (startupsError) {
      console.error('Error:', startupsError.message);
    } else {
      console.log(`✅ Deleted ${startupsCount || 0} saved startups\n`);
    }

    // 7. Clear market validations
    console.log('🗑️  Clearing market_validations...');
    const { error: validationsError, count: validationsCount } = await supabase
      .from('market_validations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    results['market_validations'] = validationsCount || 0;
    if (validationsError) {
      console.error('Error:', validationsError.message);
    } else {
      console.log(`✅ Deleted ${validationsCount || 0} market validations\n`);
    }

    // 8. Clear reddit messages
    console.log('🗑️  Clearing reddit_messages...');
    const { error: messagesError, count: messagesCount } = await supabase
      .from('reddit_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    results['reddit_messages'] = messagesCount || 0;
    if (messagesError) {
      console.error('Error:', messagesError.message);
    } else {
      console.log(`✅ Deleted ${messagesCount || 0} reddit messages\n`);
    }

    // 9. Clear usage limits (depends on users)
    console.log('🗑️  Clearing usage_limits...');
    const { error: limitsError, count: limitsCount } = await supabase
      .from('usage_limits')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    results['usage_limits'] = limitsCount || 0;
    if (limitsError) {
      console.error('Error:', limitsError.message);
    } else {
      console.log(`✅ Deleted ${limitsCount || 0} usage limits\n`);
    }

    // 10. Clear user sessions/refresh tokens
    console.log('🗑️  Clearing user_sessions...');
    const { error: sessionsError, count: sessionsCount } = await supabase
      .from('user_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    results['user_sessions'] = sessionsCount || 0;
    if (sessionsError) {
      console.error('Error:', sessionsError.message);
    } else {
      console.log(`✅ Deleted ${sessionsCount || 0} user sessions\n`);
    }

    // 11. Clear password reset tokens
    console.log('🗑️  Clearing password_reset_tokens...');
    const { error: resetError, count: resetCount } = await supabase
      .from('password_reset_tokens')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    results['password_reset_tokens'] = resetCount || 0;
    if (resetError) {
      console.error('Error:', resetError.message);
    } else {
      console.log(`✅ Deleted ${resetCount || 0} password reset tokens\n`);
    }

    // 12. Clear email verification tokens
    console.log('🗑️  Clearing email_verification_tokens...');
    const { error: verifyError, count: verifyCount } = await supabase
      .from('email_verification_tokens')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    results['email_verification_tokens'] = verifyCount || 0;
    if (verifyError) {
      console.error('Error:', verifyError.message);
    } else {
      console.log(`✅ Deleted ${verifyCount || 0} verification tokens\n`);
    }

    // 13. Finally, clear users (this will cascade delete most things)
    console.log('🗑️  Clearing users...');
    const { error: usersError, count: usersCount } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    results['users'] = usersCount || 0;
    if (usersError) {
      console.error('Error:', usersError.message);
    } else {
      console.log(`✅ Deleted ${usersCount || 0} users\n`);
    }

    // Print summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ DATABASE CLEANUP COMPLETE!\n');
    console.log('📊 Summary:');
    console.log('═══════════════════════════════════════════════════════════');

    const totalDeleted = Object.values(results).reduce((sum, count) => sum + count, 0);

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

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    process.exit(1);
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
