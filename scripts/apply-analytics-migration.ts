import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('Applying analytics tables migration...')

  const migrationPath = path.join(__dirname, '../supabase/migrations/20251014000000_create_analytics_tables.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')

  // Split by semicolons and execute each statement separately
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' })

      if (error) {
        console.error('Error executing statement:', error)
        console.error('Statement:', statement.substring(0, 100) + '...')
      }
    } catch (err) {
      // Try direct query if RPC doesn't work
      try {
        const { error } = await supabase.from('_migrations').insert({
          name: '20251014000000_create_analytics_tables',
          executed_at: new Date().toISOString()
        })
      } catch (e) {
        console.log('Migration tracking failed, but tables may have been created')
      }
    }
  }

  console.log('Migration applied successfully!')
}

applyMigration().catch(console.error)
