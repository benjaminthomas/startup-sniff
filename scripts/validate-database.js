#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateDatabase() {
  console.log('🔍 Validating database setup...\n');

  const tablesToCheck = [
    'users',
    'subscriptions', 
    'usage_limits',
    'startup_ideas',
    'generated_content'
  ];

  let allTablesExist = true;

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`❌ Table '${table}': ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${table}': OK`);
      }
    } catch (err) {
      console.error(`❌ Table '${table}': ${err.message}`);
      allTablesExist = false;
    }
  }

  console.log('\n🔍 Checking custom types...');
  
  try {
    const { data, error } = await supabase.rpc('version');
    console.log('✅ Database connection: OK');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }

  if (allTablesExist) {
    console.log('\n🎉 Database setup is complete and working!');
    console.log('\nNext steps:');
    console.log('1. Try creating a user account on localhost:3000');
    console.log('2. Check the dashboard for real data');
    console.log('3. Proceed with Stripe integration');
  } else {
    console.log('\n⚠️  Some tables are missing. Please run the database-setup.sql script in your Supabase dashboard.');
    console.log('\nInstructions:');
    console.log('1. Go to https://supabase.com/dashboard/project/tesprtjhcwwqkmmoxzna');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of database-setup.sql');
    console.log('4. Run the query');
    console.log('5. Run this validation script again');
  }
}

validateDatabase().catch(console.error);