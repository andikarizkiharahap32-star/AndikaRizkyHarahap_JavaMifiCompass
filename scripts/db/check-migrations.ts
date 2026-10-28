import * as fs from 'fs';
import * as path from 'path';

export interface MigrationCheckResult {
  migrationFile: string;
  hasLockTimeout: boolean;
  hasDestructiveDrop: boolean;
  isValid: boolean;
}

export function checkMigrations(drizzleDir?: string): MigrationCheckResult[] {
  const dir = drizzleDir || path.resolve(__dirname, '../../apps/api/drizzle');
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql'));
  const results: MigrationCheckResult[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Rule: Every migration MUST set lock_timeout
    const hasLockTimeout = /SET\s+lock_timeout/i.test(content);

    // Rule: Expand-contract prohibits abrupt DROP COLUMN in production migrations without staged releases
    const hasDestructiveDrop = /ALTER\s+TABLE\s+.*\s+DROP\s+COLUMN/i.test(content);

    results.push({
      migrationFile: file,
      hasLockTimeout,
      hasDestructiveDrop,
      isValid: hasLockTimeout && !hasDestructiveDrop,
    });
  }

  return results;
}

if (require.main === module) {
  const results = checkMigrations();
  console.log(`[Migration Check] Validating ${results.length} migration file(s)...`);
  let hasFailure = false;

  for (const r of results) {
    if (!r.isValid) {
      console.error(`❌ Migration failed checks: ${r.migrationFile}`);
      if (!r.hasLockTimeout) console.error('   Missing SET lock_timeout statement.');
      if (r.hasDestructiveDrop)
        console.error('   Contains unapproved DROP COLUMN without expand-contract.');
      hasFailure = true;
    } else {
      console.log(`✓ ${r.migrationFile}: Valid (lock_timeout enforced, zero-downtime safe)`);
    }
  }

  if (hasFailure) {
    process.exit(1);
  }
}
