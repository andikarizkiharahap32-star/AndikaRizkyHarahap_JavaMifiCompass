import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { envSchema, parseEnv } from '../../../apps/api/src/config/env';
import * as dbSchema from '../../../apps/api/src/db/schema/core';

describe('Backend and Workflows - P01: Configuration and Environment Management', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const apiDir = path.join(rootDir, 'apps/api');

  it('parses valid environment variables and freezes the returned config', () => {
    const raw = {
      NODE_ENV: 'test',
      PORT: '3001',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test_db',
      JWT_SECRET: 'test-secret-key-32-chars-long-minimum',
    };
    const parsed = parseEnv(raw);
    expect(parsed.PORT).toBe(3001);
    expect(parsed.NODE_ENV).toBe('test');
    expect(Object.isFrozen(parsed)).toBe(true);
  });

  it('fails fast on boot when required configuration is invalid', () => {
    const invalidRaw = {
      NODE_ENV: 'not-an-env' as any,
      PORT: 'not-a-number' as any,
    };
    expect(() => parseEnv(invalidRaw)).toThrow(/Environment validation failed fast/);
  });

  it('enforces production security guardrail: refuses development fallback JWT_SECRET in production', () => {
    const prodWithDevSecret = {
      NODE_ENV: 'production',
      JWT_SECRET: 'development-jwt-secret-not-for-production',
    };
    expect(() => parseEnv(prodWithDevSecret)).toThrow(
      /JWT_SECRET cannot use development fallback in production/,
    );
  });

  it('verifies apps/api/.env.example covers every schema key in env.ts', () => {
    const envExamplePath = path.join(apiDir, '.env.example');
    expect(fs.existsSync(envExamplePath)).toBe(true);
    const content = fs.readFileSync(envExamplePath, 'utf8');

    const schemaKeys = Object.keys(envSchema.shape);
    for (const key of schemaKeys) {
      expect(content).toContain(key);
    }
  });
});

describe('Backend and Workflows - P02: Database Schema Core', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const apiDir = path.join(rootDir, 'apps/api');

  it('verifies apps/api/drizzle.config.ts exists and configures postgresql dialect', () => {
    const drizzleConfigPath = path.join(apiDir, 'drizzle.config.ts');
    expect(fs.existsSync(drizzleConfigPath)).toBe(true);
    const content = fs.readFileSync(drizzleConfigPath, 'utf8');
    expect(content).toContain("dialect: 'postgresql'");
    expect(content).toContain('schema:');
  });

  it('verifies all 10 required core tables are defined in db/schema/core.ts', () => {
    const requiredTables = [
      'users',
      'sessions',
      'places',
      'placeSources',
      'placeHalalEvidence',
      'reviews',
      'favorites',
      'fxRates',
      'paymentIntents',
      'auditLog',
    ];

    for (const tableName of requiredTables) {
      expect((dbSchema as any)[tableName]).toBeDefined();
    }
  });

  it('verifies strict prohibition: no boolean is_halal flag exists in schema (must be evidence-backed enum)', () => {
    const schemaFile = path.join(apiDir, 'src/db/schema/core.ts');
    const content = fs.readFileSync(schemaFile, 'utf8');
    expect(content).not.toMatch(/boolean\(['"]is_halal['"]\)/);
    expect(dbSchema.halalStatusEnum).toBeDefined();
    expect(dbSchema.halalStatusEnum.enumValues).toEqual([
      'verified',
      'self_declared',
      'unverified',
      'disputed',
    ]);
  });

  it('verifies money is stored as numeric(20,6) and currency as char(3) in places and paymentIntents', () => {
    const schemaFile = path.join(apiDir, 'src/db/schema/core.ts');
    const content = fs.readFileSync(schemaFile, 'utf8');
    expect(content).toContain("numeric('price_min', { precision: 20, scale: 6 })");
    expect(content).toContain("numeric('amount', { precision: 20, scale: 6 })");
    expect(content).toContain("char('currency', { length: 3 })");
  });

  it('verifies every foreign key relationship has an explicit index configured', () => {
    const schemaFile = path.join(apiDir, 'src/db/schema/core.ts');
    const content = fs.readFileSync(schemaFile, 'utf8');
    expect(content).toContain("index('idx_sessions_user_id')");
    expect(content).toContain("index('idx_place_sources_place_id')");
    expect(content).toContain("index('idx_place_halal_evidence_place_id')");
    expect(content).toContain("index('idx_reviews_place_id')");
    expect(content).toContain("index('idx_reviews_user_id')");
    expect(content).toContain("index('idx_favorites_user_id')");
    expect(content).toContain("index('idx_favorites_place_id')");
    expect(content).toContain("index('idx_payment_intents_user_id')");
    expect(content).toContain("index('idx_audit_log_actor_id')");
  });
});
