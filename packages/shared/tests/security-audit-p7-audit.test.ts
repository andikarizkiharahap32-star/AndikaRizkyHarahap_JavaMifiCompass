import { describe, it, expect } from 'vitest';
import {
  ApprovedCryptoAlgorithmSchema,
  DEFAULT_SECRET_REQUIREMENTS,
  validateCryptoAlgorithm,
  redactSecretsDeep,
  scanPayloadForSecretLeaks,
  evaluateKeyRotationStatus,
  validateEnvironmentSecrets,
  evaluateSecretsCryptoCompliance,
  ManagedCryptoKey,
} from '../src/schemas/secrets-crypto.schema';

describe('SEC-P07: Secrets & Cryptographic Configuration Verification', () => {
  describe('1. Cryptographic Algorithm Assurance & Deprecation Defense (INV-04, SEC-P07-CTRL-0021)', () => {
    it('approves modern NIST-aligned cryptographic algorithms', () => {
      const modernAlgorithms = [
        'AES-256-GCM',
        'ChaCha20-Poly1305',
        'SHA-256',
        'SHA-512',
        'Argon2id',
        'HMAC-SHA256',
        'Ed25519',
        'RSA-PSS-4096',
        'ECDSA-P256',
      ];

      for (const alg of modernAlgorithms) {
        const res = validateCryptoAlgorithm(alg);
        expect(res.valid).toBe(true);
        expect(res.isDeprecated).toBe(false);
        expect(res.recommended).toBe(true);
      }
    });

    it('strictly rejects obsolete and weak algorithms (release blocker INV-04)', () => {
      const obsoleteAlgorithms = [
        'MD5',
        'SHA-1',
        'SHA1',
        'DES',
        '3DES',
        'RC4',
        'AES-ECB',
        'RSA-1024',
      ];

      for (const alg of obsoleteAlgorithms) {
        const res = validateCryptoAlgorithm(alg);
        expect(res.valid).toBe(false);
        expect(res.isDeprecated).toBe(true);
        expect(res.recommended).toBe(false);
        expect(res.reason).toContain('obsolete');
      }
    });

    it('rejects unverified arbitrary ciphers', () => {
      const res = validateCryptoAlgorithm('UNKNOWN-CIPHER-X');
      expect(res.valid).toBe(false);
      expect(res.isDeprecated).toBe(false);
      expect(res.recommended).toBe(false);
    });

    it('exposes approved algorithms conforming to schema enum', () => {
      const values = Object.values(ApprovedCryptoAlgorithmSchema.Values);
      expect(values).toContain('AES-256-GCM');
      expect(values).toContain('Argon2id');
      expect(values).toContain('HMAC-SHA256');
    });
  });

  describe('2. Secret Redaction & Leakage Defense (INV-01, INV-03, SEC-P07-CTRL-0016)', () => {
    it('redacts sensitive key names in complex nested objects', () => {
      const unredactedObject = {
        transactionId: 'tx-123456',
        user: {
          username: 'johndoe',
          password: 'plain-text-password-here',
          apiKey: 'key-abc-123',
          profile: {
            cardNumber: '4111111111111234',
            cvv: '999',
            pin: '1234',
          },
        },
        meta: {
          authorization: 'Bearer token-secret-xyz',
          clientSecret: 'secret-val-987',
        },
      };

      const redacted = redactSecretsDeep(unredactedObject);

      expect(redacted.transactionId).toBe('tx-123456');
      expect(redacted.user.username).toBe('johndoe');
      expect(redacted.user.password).toBe('[REDACTED_SECRET]');
      expect(redacted.user.apiKey).toBe('[REDACTED_SECRET]');
      expect(redacted.user.profile.cardNumber).toBe('[REDACTED_SECRET]');
      expect(redacted.user.profile.cvv).toBe('[REDACTED_SECRET]');
      expect(redacted.user.profile.pin).toBe('[REDACTED_SECRET]');
      expect(redacted.meta.authorization).toBe('[REDACTED_SECRET]');
      expect(redacted.meta.clientSecret).toBe('[REDACTED_SECRET]');
    });

    it('redacts known credential patterns (JWT, RSA keys, provider tokens) inside strings', () => {
      const errorLog =
        'Error connecting with jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature and midtrans=SB-Mid-server-LIVEKEY123';

      const sanitized = redactSecretsDeep(errorLog);
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1Ni');
      expect(sanitized).toContain('[REDACTED_JWT_TOKEN]');
      expect(sanitized).not.toContain('SB-Mid-server-LIVEKEY123');
      expect(sanitized).toContain('[REDACTED_MIDTRANS_SERVER_KEY]');
    });

    it('scans payloads and detects unredacted secret leaks', () => {
      const leakingPayload = {
        orderId: 'JM-ORD-001',
        payment: {
          rawMidtransKey: 'SB-Mid-server-TEST12345678',
          userPassword: 'raw-password-exposed',
        },
      };

      const scanResult = scanPayloadForSecretLeaks(leakingPayload);
      expect(scanResult.leaksDetected).toBe(true);
      expect(scanResult.findings.length).toBeGreaterThanOrEqual(2);
      expect(scanResult.findings.some((f) => f.patternType === 'MIDTRANS_SERVER_KEY')).toBe(true);
      expect(scanResult.findings.some((f) => f.patternType === 'SENSITIVE_KEY_EXPOSURE')).toBe(true);
    });

    it('confirms clean or redacted payloads pass leak scanner without findings', () => {
      const cleanPayload = {
        orderId: 'JM-ORD-001',
        status: 'PAID',
        user: {
          username: 'johndoe',
          password: '[REDACTED_SECRET]',
        },
      };

      const scanResult = scanPayloadForSecretLeaks(cleanPayload);
      expect(scanResult.leaksDetected).toBe(false);
      expect(scanResult.findings).toHaveLength(0);
    });
  });

  describe('3. Cryptographic Key Lifecycle & Rotation Overlap (INV-02, SEC-P07-CTRL-0022)', () => {
    it('approves active keys within operational validity period', () => {
      const activeKey: ManagedCryptoKey = {
        kid: 'key-2026-auth-01',
        algorithm: 'HMAC-SHA256',
        purpose: 'SESSION_SIGNING',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
        expiresAt: '2026-12-31T23:59:59Z',
      };

      const res = evaluateKeyRotationStatus(activeKey, new Date('2026-06-01T00:00:00Z'));
      expect(res.valid).toBe(true);
      expect(res.isExpired).toBe(false);
      expect(res.usableForSigning).toBe(true);
      expect(res.usableForVerification).toBe(true);
    });

    it('detects expired active key and invalidates signing (rotation required)', () => {
      const expiredKey: ManagedCryptoKey = {
        kid: 'key-2025-auth-01',
        algorithm: 'HMAC-SHA256',
        purpose: 'SESSION_SIGNING',
        status: 'ACTIVE',
        createdAt: '2025-01-01T00:00:00Z',
        expiresAt: '2025-12-31T23:59:59Z',
      };

      const res = evaluateKeyRotationStatus(expiredKey, new Date('2026-06-01T00:00:00Z'));
      expect(res.valid).toBe(false);
      expect(res.isExpired).toBe(true);
      expect(res.usableForSigning).toBe(false);
      expect(res.reason).toContain('passed expiration');
    });

    it('handles ROTATING keys in overlap window (usable for verification, disallowed for new signing)', () => {
      const rotatingKey: ManagedCryptoKey = {
        kid: 'key-2026-auth-phaseout',
        algorithm: 'HMAC-SHA256',
        purpose: 'SESSION_SIGNING',
        status: 'ROTATING',
        createdAt: '2026-01-01T00:00:00Z',
        expiresAt: '2026-12-31T23:59:59Z',
        rotatedAt: '2026-06-01T00:00:00Z',
      };

      const res = evaluateKeyRotationStatus(rotatingKey, new Date('2026-06-02T00:00:00Z'));
      expect(res.valid).toBe(true);
      expect(res.usableForSigning).toBe(false);
      expect(res.usableForVerification).toBe(true);
      expect(res.reason).toContain('overlap window');
    });

    it('strictly forbids use of REVOKED keys for any operations', () => {
      const revokedKey: ManagedCryptoKey = {
        kid: 'key-compromised-01',
        algorithm: 'AES-256-GCM',
        purpose: 'DATABASE_ENCRYPTION',
        status: 'REVOKED',
        createdAt: '2026-01-01T00:00:00Z',
        expiresAt: '2026-12-31T23:59:59Z',
        revokedAt: '2026-03-01T00:00:00Z',
      };

      const res = evaluateKeyRotationStatus(revokedKey, new Date('2026-06-01T00:00:00Z'));
      expect(res.valid).toBe(false);
      expect(res.usableForSigning).toBe(false);
      expect(res.usableForVerification).toBe(false);
      expect(res.reason).toContain('revoked');
    });
  });

  describe('4. Environment Secret Hygiene & Placeholder Defense (INV-04, SEC-P07-CTRL-0023)', () => {
    it('approves environment when all production secrets meet entropy and placeholder rules', () => {
      const validEnv = {
        JWT_SECRET: 'c8f49a21b3e70d5e8a1f4b2c9d0e3a5f7b1c4d2e9a0f3b5c7d1e8a2f4b6c8d0e',
        MIDTRANS_SERVER_KEY: 'Mid-server-live-verified-production-key-abc123456',
        DATABASE_ENCRYPTION_KEY: 'e1a9b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
      };

      const res = validateEnvironmentSecrets(validEnv, 'production');
      expect(res.compliant).toBe(true);
      expect(res.violations).toHaveLength(0);
      expect(res.auditedCount).toBe(DEFAULT_SECRET_REQUIREMENTS.length);
    });

    it('detects insecure default placeholder secrets in production', () => {
      const placeholderEnv = {
        JWT_SECRET: 'jwt_secret', // Forbidden placeholder!
        MIDTRANS_SERVER_KEY: 'SB-Mid-server-test-placeholder', // Forbidden placeholder!
        DATABASE_ENCRYPTION_KEY: 'admin', // Forbidden placeholder!
      };

      const res = validateEnvironmentSecrets(placeholderEnv, 'production');
      expect(res.compliant).toBe(false);
      expect(res.violations.some((v) => v.includes('INSECURE_PLACEHOLDER_SECRET_JWT_SECRET'))).toBe(true);
      expect(res.violations.some((v) => v.includes('INSECURE_PLACEHOLDER_SECRET_MIDTRANS_SERVER_KEY'))).toBe(true);
    });

    it('detects insufficient entropy (short keys) on production secrets', () => {
      const shortKeyEnv = {
        JWT_SECRET: 'short_key', // < 32 bytes
        MIDTRANS_SERVER_KEY: 'valid_length_midtrans_key_here_123',
        DATABASE_ENCRYPTION_KEY: 'short_key_2', // < 32 bytes
      };

      const res = validateEnvironmentSecrets(shortKeyEnv, 'production');
      expect(res.compliant).toBe(false);
      expect(res.violations.some((v) => v.includes('INSUFFICIENT_ENTROPY_JWT_SECRET'))).toBe(true);
      expect(res.violations.some((v) => v.includes('INSUFFICIENT_ENTROPY_DATABASE_ENCRYPTION_KEY'))).toBe(true);
    });
  });

  describe('5. Overall Secrets & Cryptographic Compliance Evaluator (INV-01, INV-02, INV-03, INV-04)', () => {
    it('returns PASS and 100% compliance rate on compliant configuration', () => {
      const report = evaluateSecretsCryptoCompliance({ env: 'production' });

      expect(report.phase).toBe('SEC-P07');
      expect(report.status).toBe('PASS');
      expect(report.totalChecks).toBe(6);
      expect(report.passedChecks).toBe(6);
      expect(report.failedChecks).toBe(0);
      expect(report.complianceRate).toBe(100);

      const invariants = new Set(report.checks.map((c) => c.invariant));
      expect(invariants.has('INV-01')).toBe(true);
      expect(invariants.has('INV-02')).toBe(true);
      expect(invariants.has('INV-03')).toBe(true);
      expect(invariants.has('INV-04')).toBe(true);
    });

    it('returns FAIL if an active cryptographic key is expired', () => {
      const report = evaluateSecretsCryptoCompliance({
        activeKeys: [
          {
            kid: 'key-expired-01',
            algorithm: 'HMAC-SHA256',
            purpose: 'SESSION_SIGNING',
            status: 'ACTIVE',
            createdAt: '2020-01-01T00:00:00Z',
            expiresAt: '2021-01-01T00:00:00Z', // Expired!
          },
        ],
        env: 'production',
      });

      expect(report.status).toBe('FAIL');
      const keyChk = report.checks.find((c) => c.id === 'SEC-P07-CHK-04');
      expect(keyChk?.status).toBe('FAIL');
    });

    it('returns FAIL if environment secrets contain forbidden placeholders', () => {
      const report = evaluateSecretsCryptoCompliance({
        envMap: {
          JWT_SECRET: 'changeme',
          MIDTRANS_SERVER_KEY: 'mock',
          DATABASE_ENCRYPTION_KEY: 'password',
        },
        env: 'production',
      });

      expect(report.status).toBe('FAIL');
      const envChk = report.checks.find((c) => c.id === 'SEC-P07-CHK-05');
      expect(envChk?.status).toBe('FAIL');
    });
  });
});
