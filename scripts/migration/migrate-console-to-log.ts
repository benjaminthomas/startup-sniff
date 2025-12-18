/**
 * Bulk Console.log Migration Script
 * Migrates console statements to structured logging
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Patterns to migrate
const PATTERNS = [
  {
    // console.log('message') -> log.info('message')
    from: /console\.log\(/g,
    to: 'log.info(',
  },
  {
    // console.error('message', error) -> log.error('message', error)
    from: /console\.error\(/g,
    to: 'log.error(',
  },
  {
    // console.warn('message') -> log.warn('message')
    from: /console\.warn\(/g,
    to: 'log.warn(',
  },
  {
    // console.info('message') -> log.info('message')
    from: /console\.info\(/g,
    to: 'log.info(',
  },
  {
    // console.debug('message') -> log.debug('message')
    from: /console\.debug\(/g,
    to: 'log.debug(',
  },
];

// Files to exclude
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/scripts/**', // Keep scripts as-is (dev tools)
  '**/build.log',
  '**/ARCHITECTURE_REVIEW.md',
  '**/*.md',
];

async function migrateFile(filePath: string): Promise<boolean> {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if file already has logger import
    const hasLoggerImport = content.includes("from '@/lib/logger'");

    // Check if file has console statements
    const hasConsole = /console\.(log|error|warn|info|debug)\(/.test(content);

    if (!hasConsole) {
      return false; // Nothing to migrate
    }

    // Add logger import if not present
    if (!hasLoggerImport) {
      // Find the last import statement
      const importMatch = content.match(/^import .+ from .+$/gm);
      if (importMatch && importMatch.length > 0) {
        const lastImport = importMatch[importMatch.length - 1];
        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
        content =
          content.slice(0, lastImportIndex) +
          "\nimport { log } from '@/lib/logger'" +
          content.slice(lastImportIndex);
        modified = true;
      } else {
        // No imports, add at top after 'use server' or 'use client' if present
        const useDirectiveMatch = content.match(/^['"]use (server|client)['"]$/m);
        if (useDirectiveMatch) {
          const directiveIndex = content.indexOf(useDirectiveMatch[0]) + useDirectiveMatch[0].length;
          content =
            content.slice(0, directiveIndex) +
            "\n\nimport { log } from '@/lib/logger'" +
            content.slice(directiveIndex);
        } else {
          content = "import { log } from '@/lib/logger'\n\n" + content;
        }
        modified = true;
      }
    }

    // Replace console patterns
    for (const pattern of PATTERNS) {
      if (pattern.from.test(content)) {
        content = content.replace(pattern.from, pattern.to);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Migrated: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting console.log migration...\n');

  // Find all TypeScript files
  const files = await glob('**/*.{ts,tsx}', {
    ignore: EXCLUDE_PATTERNS,
    cwd: process.cwd(),
  });

  console.log(`Found ${files.length} TypeScript files\n`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const fullPath = path.join(process.cwd(), file);
    const wasMigrated = await migrateFile(fullPath);

    if (wasMigrated) {
      migratedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log('\n✅ Migration complete!');
  console.log(`Migrated: ${migratedCount} files`);
  console.log(`Skipped: ${skippedCount} files`);
}

main().catch(console.error);
