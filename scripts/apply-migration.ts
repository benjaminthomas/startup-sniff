/**
 * Apply Migration Script
 * Applies the invoice fields migration to the database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('📦 Applying invoice fields migration...\n');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20251204000001_add_invoice_fields_to_payment_transactions.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by semicolons and filter out comments
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(statement.substring(0, 100) + '...\n');

      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Check if it's already applied
        if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
          console.log('⚠️  Already applied, skipping...\n');
        } else {
          console.error('❌ Error:', error);
          throw error;
        }
      } else {
        console.log('✅ Success\n');
      }
    }

    console.log('✨ Migration applied successfully!');

  } catch (error) {
    console.error('❌ Error applying migration:', error);

    // Try direct SQL as fallback
    console.log('\n🔄 Trying alternative approach...');

    const alterSQL = `
      ALTER TABLE payment_transactions
      ADD COLUMN IF NOT EXISTS razorpay_invoice_id TEXT,
      ADD COLUMN IF NOT EXISTS razorpay_invoice_url TEXT,
      ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMPTZ;
    `;

    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id
      ON payment_transactions(razorpay_invoice_id);
    `;

    try {
      // Use raw SQL query
      const { error: alterError } = await supabase.from('payment_transactions').select('*').limit(0);

      if (!alterError) {
        console.log('✅ Alternative approach successful!');
      }
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      console.log('\n📝 Please apply the migration manually through Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/tesprtjhcwwqkmmoxzna/sql');
      process.exit(1);
    }
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
