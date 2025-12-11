import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

async function updateAllClientCode() {
  const patterns = [
    'components/**/*.tsx',
    'components/**/*.ts',
    'modules/**/hooks/**/*.ts',
    'app/**/*.tsx'
  ];

  let updated = 0;

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: process.cwd(),
    });

    for (const file of files) {
      const fullPath = path.join(process.cwd(), file);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Check if it's a client component or hook
      const isClientComponent = content.startsWith("'use client'") || content.startsWith('"use client"');
      const isHook = file.includes('/hooks/') || file.includes('\\hooks\\');
      const isClientCode = isClientComponent || isHook;

      // Check if it uses the logger
      if (!content.includes("from '@/lib/logger'")) {
        continue;
      }

      // Skip if already using client logger
      if (content.includes("from '@/lib/logger/client'")) {
        continue;
      }

      // For client code, replace with client logger
      if (isClientCode) {
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
    }
  }

  console.log(`\n✅ Updated ${updated} files to use client logger`);
}

updateAllClientCode().catch(console.error);
