import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function healthCheck() {
  console.log('🏥 SUPABASE HEALTH CHECK\n');
  console.log('=' .repeat(80));

  let allGood = true;

  // 1. Check connection
  console.log('\n1️⃣  Database Connection...');
  try {
    const { data, error } = await supabaseAdmin.from('users' as any).select('count').limit(1);
    if (error) {
      console.log('   ❌ Connection failed:', error.message);
      allGood = false;
    } else {
      console.log('   ✅ Connection successful');
    }
  } catch (e) {
    console.log('   ❌ Connection error:', e);
    allGood = false;
  }

  // 2. Check critical tables exist
  console.log('\n2️⃣  Critical Tables...');
  const criticalTables = [
    'users',
    'subscriptions',
    'payment_transactions',
    'webhook_events',
    'usage_limits'
  ];

  for (const table of criticalTables) {
    const { error } = await supabaseAdmin.from(table as any).select('id').limit(0);
    if (error) {
      console.log(`   ❌ ${table} - MISSING or ERROR`);
      allGood = false;
    } else {
      console.log(`   ✅ ${table}`);
    }
  }

  // 3. Check user data integrity
  console.log('\n3️⃣  User Data Integrity...');
  const { data: users } = await supabaseAdmin
    .from('users' as any)
    .select('id, email, plan_type, subscription_status, razorpay_customer_id');

  if (!users || users.length === 0) {
    console.log('   ⚠️  No users in database');
  } else {
    console.log(`   ✅ ${users.length} user(s) found`);
    for (const user of users) {
      console.log(`      • ${user.email}`);
      console.log(`        Plan: ${user.plan_type || 'not set'}`);
      console.log(`        Status: ${user.subscription_status || 'not set'}`);
      console.log(`        Razorpay Customer: ${user.razorpay_customer_id ? '✅ Set' : '❌ Not set'}`);
    }
  }

  // 4. Check RLS policies
  console.log('\n4️⃣  Row Level Security...');

  // Test webhook_events (should block anon)
  const { error: webhookAnonError } = await supabaseAnon
    .from('webhook_events' as any)
    .select('*')
    .limit(1);

  if (webhookAnonError) {
    console.log('   ✅ webhook_events - RLS blocking anonymous (GOOD)');
  } else {
    console.log('   ⚠️  webhook_events - Anonymous can access (potential issue)');
    allGood = false;
  }

  // Test payment_transactions (should block anon)
  const { data: paymentAnonData } = await supabaseAnon
    .from('payment_transactions' as any)
    .select('*')
    .limit(1);

  if (!paymentAnonData || paymentAnonData.length === 0) {
    console.log('   ✅ payment_transactions - RLS working (no data for anon)');
  } else {
    console.log('   ⚠️  payment_transactions - Anonymous can see data');
    allGood = false;
  }

  // 5. Check migrations applied
  console.log('\n5️⃣  Recent Migrations...');
  const migrationTables = [
    { name: 'webhook_events', migration: '20251203000000' },
    { name: 'payment_transactions', migration: '20251203000001' }
  ];

  for (const { name, migration } of migrationTables) {
    const { error } = await supabaseAdmin.from(name as any).select('id').limit(0);
    if (error) {
      console.log(`   ❌ ${migration} - ${name} not found`);
      allGood = false;
    } else {
      console.log(`   ✅ ${migration} - ${name} created`);
    }
  }

  // 6. Check environment configuration
  console.log('\n6️⃣  Environment Configuration...');

  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID'
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}`);
    } else {
      console.log(`   ❌ ${envVar} - NOT SET`);
      allGood = false;
    }
  }

  // 7. Check billing state
  console.log('\n7️⃣  Billing State...');

  const { count: subCount } = await supabaseAdmin
    .from('subscriptions' as any)
    .select('*', { count: 'exact' });

  const { count: paymentCount } = await supabaseAdmin
    .from('payment_transactions' as any)
    .select('*', { count: 'exact' });

  const { count: webhookCount } = await supabaseAdmin
    .from('webhook_events' as any)
    .select('*', { count: 'exact' });

  console.log(`   Subscriptions: ${subCount || 0}`);
  console.log(`   Payment Transactions: ${paymentCount || 0}`);
  console.log(`   Webhook Events: ${webhookCount || 0}`);

  if ((subCount || 0) === 0 && (paymentCount || 0) === 0 && (webhookCount || 0) === 0) {
    console.log('   ✅ Clean billing state (ready for testing)');
  } else {
    console.log('   ℹ️  Billing data exists (use cleanup script if needed)');
  }

  // Summary
  console.log('\n' + '=' .repeat(80));
  if (allGood) {
    console.log('\n✅ ALL HEALTH CHECKS PASSED!\n');
    console.log('💡 Database is healthy and ready for payment testing.\n');
  } else {
    console.log('\n⚠️  SOME CHECKS FAILED\n');
    console.log('🔧 Please review the errors above and fix as needed.\n');
  }
}

healthCheck().catch(console.error);
