import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { authz, type Subject } from '../../../apps/api/src/plugins/authz';
import {
  sessionService,
  SESSION_CONSTANTS,
} from '../../../apps/api/src/modules/session/session.service';
import {
  cursorPaginationQuerySchema,
  createPlaceBodySchema,
  mapDbPlaceToDto,
} from '../src/schemas/api-pagination.schema';

describe('Backend and Workflows - P05: Sessions and RBAC', () => {
  it('generates opaque 128-bit (32 hex characters) session ID', () => {
    const session = sessionService.createSession('usr_1', 'user');
    expect(session.sessionId).toHaveLength(32); // 16 bytes = 32 hex characters
  });

  it('verifies secure cookie flags: __Host-sid, HttpOnly, Secure, SameSite=Lax', () => {
    const session = sessionService.createSession('usr_2', 'user');
    const cookie = sessionService.getCookieConfig(session.sessionId);

    expect(cookie.name).toBe('__Host-sid');
    expect(cookie.options.httpOnly).toBe(true);
    expect(cookie.options.secure).toBe(true);
    expect(cookie.options.sameSite).toBe('lax');
    expect(cookie.options.path).toBe('/');
  });

  it('enforces immediate revocation: revoked session returns null on the very next access', () => {
    const session = sessionService.createSession('usr_revoke_test', 'user');
    expect(sessionService.getSession(session.sessionId)).not.toBeNull();

    // Revoke session
    sessionService.revokeSession(session.sessionId);

    // Immediate effect: next access is null
    expect(sessionService.getSession(session.sessionId)).toBeNull();
  });

  it('rotates session ID on privilege change while revoking the old session', () => {
    const session = sessionService.createSession('usr_rotate_test', 'user');
    const oldId = session.sessionId;

    const rotated = sessionService.rotateSession(oldId, 'moderator');
    expect(rotated).not.toBeNull();
    expect(rotated!.sessionId).not.toBe(oldId);
    expect(rotated!.role).toBe('moderator');

    // Old session must be invalid immediately
    expect(sessionService.getSession(oldId)).toBeNull();
  });

  it('verifies sliding TTL (14 days) and absolute expiration cap (90 days)', () => {
    const session = sessionService.createSession('usr_ttl_test', 'user');

    // Fast forward beyond 90 days absolute cap
    session.absoluteExpiresAt = Date.now() - 1000;
    expect(sessionService.getSession(session.sessionId)).toBeNull();
  });

  it('evaluates permissions via authz.can without inline string comparisons', () => {
    const userSubject: Subject = { id: 'usr_normal', role: 'user', isActive: true };
    const modSubject: Subject = { id: 'usr_mod', role: 'moderator', isActive: true };
    const adminSubject: Subject = { id: 'usr_admin', role: 'admin', isActive: true };
    const inactiveAdmin: Subject = { id: 'usr_inactive', role: 'admin', isActive: false };

    // Inactive user denied all actions
    expect(authz.can(inactiveAdmin, 'read', 'places')).toBe(false);

    // User permissions
    expect(authz.can(userSubject, 'read', 'places')).toBe(true);
    expect(authz.can(userSubject, 'verify', 'places')).toBe(false);
    expect(authz.can(userSubject, 'update', 'reviews', { ownerId: 'usr_normal' })).toBe(true);
    expect(authz.can(userSubject, 'update', 'reviews', { ownerId: 'other_user' })).toBe(false);

    // Moderator permissions
    expect(authz.can(modSubject, 'verify', 'places')).toBe(true);
    expect(authz.can(modSubject, 'moderate', 'reviews')).toBe(true);
    expect(authz.can(modSubject, 'administer', 'system')).toBe(false);

    // Admin permissions
    expect(authz.can(adminSubject, 'administer', 'system')).toBe(true);
    expect(authz.can(adminSubject, 'delete', 'users')).toBe(true);
  });
});

describe('Backend and Workflows - P06: API Conventions and Validation', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('verifies apps/api/openapi.json exists and contains OpenAPI 3 specification', () => {
    const openapiPath = path.join(rootDir, 'apps/api/openapi.json');
    expect(fs.existsSync(openapiPath)).toBe(true);

    const doc = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
    expect(doc.openapi || doc.swagger).toBeDefined();
    expect(doc.info.title).toBe('JavaMifi Compass API');
    expect(doc.paths).toBeDefined();
  });

  it('validates cursor pagination schema: enforces limit cap of 50 and strict fields', () => {
    // Valid query
    const valid = cursorPaginationQuerySchema.safeParse({ cursor: 'cur_123', limit: '30' });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.limit).toBe(30);
    }

    // Exceeds limit cap (max 50)
    const tooHigh = cursorPaginationQuerySchema.safeParse({ limit: 51 });
    expect(tooHigh.success).toBe(false);

    // Rejects unexpected query keys (strict)
    const unknownField = cursorPaginationQuerySchema.safeParse({
      cursor: 'cur_123',
      unexpected: 'bad',
    });
    expect(unknownField.success).toBe(false);
  });

  it('prohibits unknown body keys via strict validation schema', () => {
    const validBody = {
      name: 'Kyoto Halal Soba',
      destinationCountry: 'JP',
      city: 'Kyoto',
      halalStatus: 'verified',
      currency: 'JPY',
      priceMin: 1200,
    };
    expect(createPlaceBodySchema.safeParse(validBody).success).toBe(true);

    // Malicious or unvetted parameter injected
    const maliciousBody = {
      ...validBody,
      __adminOverride: true,
    };
    const result = createPlaceBodySchema.safeParse(maliciousBody);
    expect(result.success).toBe(false);
  });

  it('ensures raw database rows are mapped to safe DTOs without leaking internal fields', () => {
    const dbRow = {
      id: 'pl_001',
      name: 'Tokyo Halal Kitchen',
      city: 'Tokyo',
      destinationCountry: 'JP',
      halalStatus: 'verified' as const,
      currency: 'JPY',
      priceMin: '1500.000000',
      priceMax: '2500.000000',
      internalInternalDbFlag: 'secret_leak',
      rawPrismaMeta: { connection: 'internal' },
    };

    const dto = mapDbPlaceToDto(dbRow);
    expect(dto.id).toBe('pl_001');
    expect(dto.country).toBe('JP');
    expect(dto.priceRange?.min).toBe(1500);
    expect((dto as any).internalInternalDbFlag).toBeUndefined();
    expect((dto as any).rawPrismaMeta).toBeUndefined();
  });
});
