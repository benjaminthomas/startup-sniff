#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Generating Supabase types...');

try {
  // Generate types using Supabase CLI
  const result = execSync('npx supabase gen types --local', { 
    encoding: 'utf8',
    cwd: process.cwd() 
  });
  
  // Write to types file
  const typesPath = path.join(process.cwd(), 'types', 'supabase.ts');
  fs.writeFileSync(typesPath, result);
  
  console.log('✅ Types generated successfully at types/supabase.ts');
} catch (error) {
  console.error('❌ Error generating types:', error.message);
  console.log('💡 Make sure you have run the database setup script in Supabase first');
  process.exit(1);
}