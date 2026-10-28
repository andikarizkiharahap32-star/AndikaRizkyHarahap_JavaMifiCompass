import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { checkMigrations } from '../../../scripts/db/check-migrations';
import {
  runSeed,
  REFERENCE_COUNTRIES,
  CERTIFYING_BODIES,
  DEV_FIXTURES,
} from '../../../apps/api/src/db/seed/seed';
import { passkeyService, ARGON2_CONFIG } from '../../../apps/api/src/modules/auth/passkeys';

describe('Backend and Workflows - P03: Migrations and Seed Data', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const drizzleDir = path.join(rootDir, 'apps/api/drizzle');

  it('verifies initial migration file exists and enforces lock_timeout protection', () => {
    const migrationFile = path.join(drizzleDir, '0000_initial_schema.sql');
    expect(fs.existsSync(migrationFile)).toBe(true);
    const content = fs.readFileSync(migrationFile, 'utf8');
    expect(content).toMatch(/SET\s+lock_timeout\s*=\s*'2s';/i);
  });

  it('verifies checkMigrations audit utility validates all migration files', () => {
    const results = checkMigrations(drizzleDir);
    expect(results.length).toBeGreaterThanOrEqual(1);
    for (const r of results) {
      expect(r.hasLockTimeout).toBe(true);
      expect(r.hasDestructiveDrop).toBe(false);
      expect(r.isValid).toBe(true);
    }
  });

  it('verifies strict seed split: production seeds ONLY reference data (0 fake places)', async () => {
    const prodResult = await runSeed('production');
    expect(prodResult.environment).toBe('production');
    expect(prodResult.seededReference.countries).toEqual(REFERENCE_COUNTRIES);
    expect(prodResult.seededReference.certifyingBodies).toEqual(CERTIFYING_BODIES);
    // Strict Prohibition: NEVER seed fake places in production
    expect(prodResult.seededFixtures).toHaveLength(0);
  });

  it('verifies development seed supplies test fixtures for dining evaluation', async () => {
    const devResult = await runSeed('development');
    expect(devResult.environment).toBe('development');
    expect(devResult.seededFixtures).toEqual(DEV_FIXTURES);
    expect(devResult.seededFixtures.length).toBeGreaterThan(0);
  });
});

describe('Backend and Workflows - P04: Authentication', () => {
  it('verifies passkey registration and authentication options generation', async () => {
    const regOptions = await passkeyService.generatePasskeyRegistrationOptions({
      id: 'usr_test_123',
      email: 'traveler@javamifi.com',
      fullName: 'Budi Traveler',
    });
    expect(regOptions.rp.name).toBe('JavaMifi Compass');
    expect(regOptions.rp.id).toBe('localhost');
    expect(regOptions.challenge).toBeDefined();

    const authOptions = await passkeyService.generatePasskeyAuthenticationOptions();
    expect(authOptions.rpId).toBe('localhost');
    expect(authOptions.challenge).toBeDefined();
  });

  it('verifies magic link token: 32 bytes random, sha-256 hashed at rest, 10 min TTL', () => {
    const { rawToken, record } = passkeyService.generateMagicLink('test@example.com');

    // 32 bytes = 64 hex characters
    expect(rawToken).toHaveLength(64);
    expect(record.tokenHash).toHaveLength(64);
    // Must NOT store raw token in record
    expect((record as any).rawToken).toBeUndefined();

    // TTL is approximately 10 minutes in the future
    const expectedExpiry = Date.now() + 10 * 60 * 1000;
    expect(Math.abs(record.expiresAt.getTime() - expectedExpiry)).toBeLessThan(5000);

    // Verification succeeds with raw token
    const verification = passkeyService.verifyMagicLinkToken(rawToken, record);
    expect(verification.valid).toBe(true);
  });

  it('verifies magic link single-use enforcement: rejects already used tokens', () => {
    const { rawToken, record } = passkeyService.generateMagicLink('test@example.com');
    record.used = true; // Mark as consumed

    const verification = passkeyService.verifyMagicLinkToken(rawToken, record);
    expect(verification.valid).toBe(false);
    expect(verification.reason).toContain('Token already used');
  });

  it('verifies magic link TTL expiration enforcement: rejects expired tokens', () => {
    const { rawToken, record } = passkeyService.generateMagicLink('test@example.com');
    record.expiresAt = new Date(Date.now() - 1000); // 1 second in the past

    const verification = passkeyService.verifyMagicLinkToken(rawToken, record);
    expect(verification.valid).toBe(false);
    expect(verification.reason).toContain('Token expired');
  });

  it('verifies anti-enumeration: uniform generic message returned without leaking user existence', () => {
    const response = passkeyService.getGenericAuthResponse();
    expect(response.status).toBe('success');
    expect(response.message).not.toContain('found');
    expect(response.message).not.toContain('exists');
  });

  it('verifies argon2id parameters match specification: m=64MiB, t=3, p=1', () => {
    expect(ARGON2_CONFIG.memoryCost).toBe(65536); // 64 MiB
    expect(ARGON2_CONFIG.timeCost).toBe(3);
    expect(ARGON2_CONFIG.parallelism).toBe(1);
  });
});
