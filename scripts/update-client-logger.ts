import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

async function updateClientComponents() {
  const files = await glob('components/**/*.tsx', {
    cwd: process.cwd(),
  });

  let updated = 0;

  for (const file of files) {
    const fullPath = path.join(process.cwd(), file);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Check if it's a client component
    if (!content.startsWith("'use client'") && !content.startsWith('"use client"')) {
      continue;
    }

    // Check if it uses the logger
    if (!content.includes("from '@/lib/logger'")) {
      continue;
    }

    // Replace the import
    const newContent = content.replace(
      /from '@\/lib\/logger'/g,
      "from '@/lib/logger/client'"
    );

    if (newContent !== content) {
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log(`✅ Updated: ${file}`);
      updated++;
    }
  }

  console.log(`\n✅ Updated ${updated} client components`);
}

updateClientComponents().catch(console.error);
