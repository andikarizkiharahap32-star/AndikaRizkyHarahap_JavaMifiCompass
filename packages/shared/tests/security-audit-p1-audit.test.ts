// ─────────────────────────────────────────────────────────────
// SEC-P01: Defensive Security Audit Roadmap — Asset and Data Inventory
// Verification suite for Invariants INV-01, INV-02, INV-03, INV-04,
// Data Classifications, Trust Anchors, Critical Services, and Data Flow Paths
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  JAVAMIFI_DATA_INVENTORY,
  JAVAMIFI_TRUST_ANCHORS,
  JAVAMIFI_CRITICAL_SERVICES,
  JAVAMIFI_DATA_FLOWS,
  verifyTrustAnchorStrength,
  validateDataFlowBoundary,
  evaluateAssetInventoryCompliance,
  DataInventoryItemSchema,
  TrustAnchorSchema,
  CriticalServiceSchema,
  DataFlowPathSchema,
  AssetInventoryEvaluationReportSchema,
} from '../src/schemas/asset-inventory.schema';

describe('SEC-P01: Asset and Data Inventory Defensive Security Audit', () => {
  describe('1. Core Invariants Verification (INV-01 to INV-04)', () => {
    it('enforces INV-01: untrusted input never crosses trust boundary without validation', () => {
      // Validate schema parsing of valid inventory entries
      for (const item of JAVAMIFI_DATA_INVENTORY) {
        const parsed = DataInventoryItemSchema.safeParse(item);
        expect(parsed.success).toBe(true);
      }

      // Rejects malformed asset schemas crossing boundary
      const invalidAsset = {
        id: 'DATA_INVALID',
        name: 'Untrusted Asset',
        classification: 'UNKNOWN_CLASSIFICATION', // invalid enum
      };
      const parsedInvalid = DataInventoryItemSchema.safeParse(invalidAsset);
      expect(parsedInvalid.success).toBe(false);
    });

    it('enforces INV-02: consumer permissions and ownership boundaries on sensitive data', () => {
      const restrictedPassport = JAVAMIFI_DATA_INVENTORY.find(
        (d) => d.id === 'DATA_01_PASSPORT_PII',
      );
      expect(restrictedPassport).toBeDefined();
      expect(restrictedPassport?.classification).toBe('RESTRICTED');
      // Public or anonymous visitors must NEVER be in permittedConsumers for restricted data
      expect(restrictedPassport?.permittedConsumers).not.toContain('ANONYMOUS_VISITOR');
      expect(restrictedPassport?.permittedConsumers).not.toContain('AUTHENTICATED_TRAVELER');
      expect(restrictedPassport?.permittedConsumers).toContain('SUPPORT_AGENT');

      const publicCatalog = JAVAMIFI_DATA_INVENTORY.find((d) => d.id === 'DATA_07_CATALOG_PUBLIC');
      expect(publicCatalog?.classification).toBe('PUBLIC');
      expect(publicCatalog?.permittedConsumers).toContain('ANONYMOUS_VISITOR');
    });

    it('enforces INV-03: security logs contain enough evidence without secrets or raw PAN/CVV', () => {
      // Scenario A: Flow allows properly redacted payment payload
      const validPayload = {
        orderId: 'JM-ORD-9021',
        paymentToken: '[REDACTED-_xyz]',
        amountIdr: 350000,
        status: 'PENDING',
      };
      const cleanCheck = validateDataFlowBoundary('DFP_01_CHECKOUT_TRANSACTION', validPayload);
      expect(cleanCheck.allowed).toBe(true);

      // Scenario B: Flow strictly detects and blocks raw unmasked credit card PAN
      const rawCardPayload = {
        orderId: 'JM-ORD-9021',
        cardNumber: '4111 1111 1111 1234', // Unmasked 16-digit card
        amountIdr: 350000,
      };
      const cardCheck = validateDataFlowBoundary('DFP_01_CHECKOUT_TRANSACTION', rawCardPayload);
      expect(cardCheck.allowed).toBe(false);
      expect(cardCheck.reason).toBe('RAW_UNMASKED_PAN_DETECTED');
      expect(cardCheck.violationField).toBe('cardNumber');

      // Scenario C: Flow strictly detects and blocks raw unencrypted CVV
      const rawCvvPayload = {
        orderId: 'JM-ORD-9021',
        cvv: '987',
        paymentToken: 'tok_clean',
      };
      const cvvCheck = validateDataFlowBoundary('DFP_01_CHECKOUT_TRANSACTION', rawCvvPayload);
      expect(cvvCheck.allowed).toBe(false);
      expect(cvvCheck.reason).toBe('RAW_UNENCRYPTED_CVV_DETECTED');
      expect(cvvCheck.violationField).toBe('cvv');
    });

    it('enforces INV-04: critical findings remain release blockers until retested or formally accepted', () => {
      // Release Gate with all strong keys passes
      const goodReport = evaluateAssetInventoryCompliance();
      expect(goodReport.status).toBe('PASSED');
      expect(goodReport.criticalReleaseBlockers).toBe(0);
      expect(goodReport.invariants.inv04CriticalFindingsBlockRelease).toBe(true);

      // Release Gate with weak or missing keys is BLOCKED
      const weakKeysReport = evaluateAssetInventoryCompliance({
        JWT_SECRET: 'secret', // weak default key
        PAYMENT_WEBHOOK_SECRET: 'short', // insufficient entropy (< 256 bits)
        MIDTRANS_SERVER_KEY: 'SB-Mid-server-super-secret-key-1234567890',
        DATABASE_URL: 'postgresql://postgres:complex_password_12345@localhost:5432/javamifi',
      });
      expect(weakKeysReport.status).toBe('BLOCKED');
      expect(weakKeysReport.criticalReleaseBlockers).toBe(2);
      expect(weakKeysReport.trustAnchorIntegrity.weakKeysCount).toBe(2);
      expect(weakKeysReport.invariants.inv04CriticalFindingsBlockRelease).toBe(false);

      const parsed = AssetInventoryEvaluationReportSchema.safeParse(weakKeysReport);
      expect(parsed.success).toBe(true);
    });
  });

  describe('2. Data Sensitivity Classification & Retention SLAs', () => {
    it('verifies 7 enterprise data items adhere to strict retention periods', () => {
      expect(JAVAMIFI_DATA_INVENTORY.length).toBe(7);

      // Ephemeral 0-day retention for raw card tokens
      const cardToken = JAVAMIFI_DATA_INVENTORY.find((d) => d.id === 'DATA_02_PAYMENT_TOKENS');
      expect(cardToken?.retentionSLA).toBe('EPHEMERAL_ZERO_DAYS');

      // Operational 90-day retention for customer passport and eSIM ICCIDs
      const passport = JAVAMIFI_DATA_INVENTORY.find((d) => d.id === 'DATA_01_PASSPORT_PII');
      expect(passport?.retentionSLA).toBe('OPERATIONAL_90_DAYS');

      const esim = JAVAMIFI_DATA_INVENTORY.find((d) => d.id === 'DATA_04_ESIM_ICCID_PROFILES');
      expect(esim?.retentionSLA).toBe('OPERATIONAL_90_DAYS');

      // Financial 7-year retention for payment transactions and audit logs
      const ledger = JAVAMIFI_DATA_INVENTORY.find((d) => d.id === 'DATA_03_FINANCIAL_LEDGER');
      expect(ledger?.retentionSLA).toBe('FINANCIAL_7_YEARS');

      const auditLog = JAVAMIFI_DATA_INVENTORY.find((d) => d.id === 'DATA_06_AUDIT_LOG_TRAIL');
      expect(auditLog?.retentionSLA).toBe('FINANCIAL_7_YEARS');
    });

    it('asserts RESTRICTED and CONFIDENTIAL data items require encryption at rest and in transit', () => {
      const sensitiveItems = JAVAMIFI_DATA_INVENTORY.filter((d) =>
        ['RESTRICTED', 'CONFIDENTIAL'].includes(d.classification),
      );
      expect(sensitiveItems.length).toBe(6);
      for (const item of sensitiveItems) {
        expect(item.encryption).toBe('ENCRYPTED_AT_REST_AND_TRANSIT');
      }
    });
  });

  describe('3. Cryptographic Trust Anchors & Entropy Validation', () => {
    it('validates 4 core trust anchors against minimum bit length requirements', () => {
      expect(JAVAMIFI_TRUST_ANCHORS.length).toBe(4);
      for (const anchor of JAVAMIFI_TRUST_ANCHORS) {
        const parsed = TrustAnchorSchema.safeParse(anchor);
        expect(parsed.success).toBe(true);
        expect(anchor.minBitLength).toBeGreaterThanOrEqual(128);
        expect(anchor.rotationCycleDays).toBeLessThanOrEqual(365);
      }
    });

    it('rejects insecure default keys and keys with insufficient entropy', () => {
      const jwtAnchor = JAVAMIFI_TRUST_ANCHORS.find((a) => a.id === 'ANCHOR_01_JWT_SECRET')!;

      // Insecure default rejection
      const defaultCheck = verifyTrustAnchorStrength(jwtAnchor, 'password');
      expect(defaultCheck.valid).toBe(false);
      expect(defaultCheck.reason).toBe('INSECURE_DEFAULT_KEY_DETECTED');

      // Empty string rejection
      const emptyCheck = verifyTrustAnchorStrength(jwtAnchor, '   ');
      expect(emptyCheck.valid).toBe(false);
      expect(emptyCheck.reason).toBe('KEY_VALUE_MISSING_OR_EMPTY');

      // Insufficient entropy rejection (10 chars = 80 bits < 256 bits)
      const shortCheck = verifyTrustAnchorStrength(jwtAnchor, 'short_key!');
      expect(shortCheck.valid).toBe(false);
      expect(shortCheck.reason).toContain('INSUFFICIENT_KEY_ENTROPY');

      // Sufficient entropy key
      const strongCheck = verifyTrustAnchorStrength(
        jwtAnchor,
        'this_is_a_very_secure_high_entropy_secret_key_32_bytes!',
      );
      expect(strongCheck.valid).toBe(true);
      expect(strongCheck.bitLength).toBeGreaterThanOrEqual(256);
    });
  });

  describe('4. Critical Services & Data Flow Paths', () => {
    it('verifies 6 critical services with fail-closed policies for Tier 1 services', () => {
      expect(JAVAMIFI_CRITICAL_SERVICES.length).toBe(6);
      const tier1Services = JAVAMIFI_CRITICAL_SERVICES.filter((s) => s.tier === 'TIER_1_CRITICAL');
      expect(tier1Services.length).toBe(3); // Auth, Orders, Payments
      for (const s of tier1Services) {
        expect(s.failClosedPolicy).toBe(true);
        expect(s.handlesRestrictedData || s.handlesFinancialLedger).toBe(true);
        const parsed = CriticalServiceSchema.safeParse(s);
        expect(parsed.success).toBe(true);
      }
    });

    it('verifies 5 complete data flow paths with 100% transit encryption coverage', () => {
      expect(JAVAMIFI_DATA_FLOWS.length).toBe(5);
      for (const flow of JAVAMIFI_DATA_FLOWS) {
        const parsed = DataFlowPathSchema.safeParse(flow);
        expect(parsed.success).toBe(true);
        expect(flow.encryptionRequired).toBe(true);
        expect(flow.trustBoundaryCrossed).toBeDefined();
        expect(flow.owningService).toBeDefined();
      }

      const report = evaluateAssetInventoryCompliance();
      expect(report.dataFlowCompliance.encryptedTransitCoverage).toBe(100);
      expect(report.dataFlowCompliance.redactionCoverage).toBeGreaterThanOrEqual(60);
    });
  });
});
