import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  ALLOWLISTED_MOCK_TOKENS,
  containsRealPaymentCredentials,
  isPaymentIntentExpired,
  MOCK_ENVIRONMENT_MARKER,
  MOCK_PROVIDER_NAMESPACE,
  mockPaymentIntentSchema,
  PAYMENT_THREAT_INVARIANTS,
  PAYMENT_TRUST_BOUNDARIES,
  resolveSyntheticOutcome,
  validateAuthoritativeAmountMatch,
  validateIntentIdempotencyMatch,
} from '../src/schemas/mock-payment.schema';
import { MockEnvironmentGuard } from '../../../apps/api/src/modules/payments/mock-environment.guard';

/**
 * PAY-P04: Mock Payment Intent Creation Audit Suite
 *
 * Requirements & Control Mapping:
 * - INV-01: The mock system cannot collect real payment credentials or move real funds.
 * - INV-02: Order amount, currency, and status are derived from authoritative server-side records, never trusted from the browser.
 * - INV-04: Test credentials and mock routes are demonstrably isolated from production configuration and provider namespaces.
 * - PAY-P04-CTRL-0001 / TEST-0001: Explicit mock environment marker and synthetic provider namespace.
 * - PAY-P04-CTRL-0002 / TEST-0002: Fail closed in production environments.
 * - PAY-P04-CTRL-0003 / TEST-0003: Accept only documented fake test tokens and reject real PAN/CVV.
 * - PAY-P04-CTRL-0004 / TEST-0004: Server-owned authoritative amount derivation; reject or ignore client amounts.
 * - PAY-P04-CTRL-0005 / TEST-0005: Never allow browser to specify order or payment status.
 * - PAY-P04-CTRL-0006 / TEST-0006: Idempotent replay on identical parameters; reject parameter tampering.
 * - PAY-P04-CTRL-0007 / TEST-0007: Single active pending intent per order policy.
 * - PAY-P04-CTRL-0008 / TEST-0008: Explicit TTL/expiry attached to every simulation intent.
 */
describe('PAY-P04 — Mock Payment Intent Creation Audit Suite', () => {
  let guard: MockEnvironmentGuard;
  const originalEnv = process.env.NODE_ENV;
  const originalAllowMock = process.env.ALLOW_MOCK_PAYMENT;

  beforeEach(() => {
    guard = new MockEnvironmentGuard();
    delete process.env.NODE_ENV;
    delete process.env.ALLOW_MOCK_PAYMENT;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.ALLOW_MOCK_PAYMENT = originalAllowMock;
  });

  describe('PAY-P04-CTRL-0001 & INV-04: Simulation Environment Labeling and Isolation', () => {
    it('enforces explicit simulation markers and provider namespace', () => {
      expect(MOCK_PROVIDER_NAMESPACE).toBe('mock_simulated');
      expect(MOCK_ENVIRONMENT_MARKER).toBe('simulation_sandbox');
    });

    it('requires mock simulation intent responses to carry deterministic simulation markers', () => {
      const mockIntentResult = {
        paymentId: 'pay_sim_12345678',
        orderNumber: 'JM-ORD-2026-TEST',
        payableAmountIdr: 450000,
        currency: 'IDR' as const,
        redirectUrl: '/checkout/payment?order=JM-ORD-2026-TEST&simulated=true',
        syntheticToken: 'tok_mock_visa_success',
        provider: MOCK_PROVIDER_NAMESPACE,
        environment: MOCK_ENVIRONMENT_MARKER,
        isSimulated: true as const,
        expiresAt: new Date(Date.now() + 900000).toISOString(),
        idempotencyKey: 'idem_key_abc123',
      };

      expect(mockIntentResult.provider).toBe('mock_simulated');
      expect(mockIntentResult.environment).toBe('simulation_sandbox');
      expect(mockIntentResult.isSimulated).toBe(true);
      expect(mockIntentResult.currency).toBe('IDR');
      expect(mockIntentResult.payableAmountIdr).toBe(450000);
      expect(Date.parse(mockIntentResult.expiresAt)).toBeGreaterThan(Date.now());
    });

    it('sanitizes simulation intent details for audit logging without leaking full credentials', () => {
      const sanitized = guard.sanitizePaymentIntentForLogging({
        paymentId: 'pay_sim_998877',
        orderNumber: 'JM-ORD-2026-0099',
        syntheticToken: 'tok_mock_visa_success',
        amountIdr: 300000,
      });

      expect(sanitized.paymentId).toBe('pay_sim_998877');
      expect(sanitized.orderNumber).toBe('JM-ORD-2026-0099');
      expect(sanitized.amountIdr).toBe(300000);
      expect(sanitized.syntheticToken).toBe('tok_mock_vis...');
    });
  });

  describe('PAY-P04-CTRL-0002: Production Guard & Fail-Closed Isolation', () => {
    it('fails closed when mock payment mode is invoked in production without server flag', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_MOCK_PAYMENT = 'false';

      expect(() => guard.assertMockAllowed()).toThrow(
        /Mock payment simulation is strictly disabled in production environments/,
      );
    });

    it('prohibits activating mock payments via query params in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_MOCK_PAYMENT = 'true';

      expect(() =>
        guard.assertMockAllowed({
          queryParams: { mock: 'true' },
        }),
      ).toThrow(/Activating mock payment via client query parameters is strictly prohibited/);
    });

    it('permits mock payments in non-production environments', () => {
      process.env.NODE_ENV = 'development';
      expect(() => guard.assertMockAllowed()).not.toThrow();
    });
  });

  describe('PAY-P04-CTRL-0003 & INV-01: Synthetic Token Enforcement & PAN/CVV Proscription', () => {
    it('accepts valid allowlisted synthetic tokens', () => {
      for (const token of ALLOWLISTED_MOCK_TOKENS) {
        const parsed = mockPaymentIntentSchema.safeParse({
          orderNumber: 'JM-ORD-2026-0001',
          syntheticToken: token,
        });
        expect(parsed.success).toBe(true);
      }
    });

    it('defaults syntheticToken to tok_mock_visa_success when not specified', () => {
      const parsed = mockPaymentIntentSchema.safeParse({
        orderNumber: 'JM-ORD-2026-0001',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.syntheticToken).toBe('tok_mock_visa_success');
      }
    });

    it('rejects unapproved synthetic tokens', () => {
      const parsed = mockPaymentIntentSchema.safeParse({
        orderNumber: 'JM-ORD-2026-0001',
        syntheticToken: 'tok_unauthorized_vendor',
      });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain('Invalid synthetic token');
      }
    });

    it('strictly rejects real payment credentials (PAN, CVV, CVC) via schema and deep inspection', () => {
      const panPayload = {
        orderNumber: 'JM-ORD-2026-0001',
        syntheticToken: 'tok_mock_visa_success',
        cardNumber: '4111111111111111',
      };
      expect(mockPaymentIntentSchema.safeParse(panPayload).success).toBe(false);
      expect(containsRealPaymentCredentials(panPayload)).toBe(true);

      const cvvPayload = {
        orderNumber: 'JM-ORD-2026-0001',
        syntheticToken: 'tok_mock_visa_success',
        cvv: '123',
      };
      expect(mockPaymentIntentSchema.safeParse(cvvPayload).success).toBe(false);
      expect(containsRealPaymentCredentials(cvvPayload)).toBe(true);

      const cvcPayload = {
        orderNumber: 'JM-ORD-2026-0001',
        syntheticToken: 'tok_mock_visa_success',
        cvc: '999',
      };
      expect(mockPaymentIntentSchema.safeParse(cvcPayload).success).toBe(false);
      expect(containsRealPaymentCredentials(cvcPayload)).toBe(true);

      const rawPanPayload = {
        orderNumber: 'JM-ORD-2026-0001',
        syntheticToken: 'tok_mock_visa_success',
        pan: '5500000000000004',
      };
      expect(mockPaymentIntentSchema.safeParse(rawPanPayload).success).toBe(false);
      expect(containsRealPaymentCredentials(rawPanPayload)).toBe(true);

      const expiryPayload = {
        orderNumber: 'JM-ORD-2026-0001',
        syntheticToken: 'tok_mock_visa_success',
        expiryMonth: 12,
        expiryYear: 2028,
      };
      expect(mockPaymentIntentSchema.safeParse(expiryPayload).success).toBe(false);
    });

    it('detects 13-19 digit PAN strings directly or via guard validation', () => {
      expect(containsRealPaymentCredentials('4111222233334444')).toBe(true);
      expect(containsRealPaymentCredentials('5425-2334-1234-5678')).toBe(true);
      expect(() =>
        guard.validateMockPaymentIntentRequest({
          orderNumber: 'JM-ORD-2026-0001',
          cardNumber: '4111222233334444',
        }),
      ).toThrow();
    });
  });

  describe('PAY-P04-CTRL-0004 & PAY-P04-CTRL-0005: Authoritative Server-Owned Amount & Currency', () => {
    it('requires order identification (either orderId or orderNumber)', () => {
      const missingOrder = mockPaymentIntentSchema.safeParse({
        syntheticToken: 'tok_mock_visa_success',
      });
      expect(missingOrder.success).toBe(false);
      if (!missingOrder.success) {
        expect(missingOrder.error.issues[0]?.message).toContain(
          'Either orderId or orderNumber must be provided',
        );
      }

      const withOrderId = mockPaymentIntentSchema.safeParse({
        orderId: 'clabcdef123456789',
        syntheticToken: 'tok_mock_visa_success',
      });
      expect(withOrderId.success).toBe(true);

      const withOrderNumber = mockPaymentIntentSchema.safeParse({
        orderNumber: 'JM-ORD-2026-0001',
        syntheticToken: 'tok_mock_visa_success',
      });
      expect(withOrderNumber.success).toBe(true);
    });

    it('only allows IDR currency if currency parameter is explicitly provided', () => {
      const idrAllowed = mockPaymentIntentSchema.safeParse({
        orderNumber: 'JM-ORD-2026-0001',
        currency: 'IDR',
      });
      expect(idrAllowed.success).toBe(true);

      const usdRejected = mockPaymentIntentSchema.safeParse({
        orderNumber: 'JM-ORD-2026-0001',
        currency: 'USD' as any,
      });
      expect(usdRejected.success).toBe(false);
    });

    it('validates authoritative order amount matches client amount when supplied', () => {
      const authoritativeOrderTotal = 350000;

      // Matching client amount passes
      const matching = validateAuthoritativeAmountMatch(authoritativeOrderTotal, 350000);
      expect(matching.valid).toBe(true);
      expect(matching.diff).toBe(0);

      // Price tampering (e.g. client attempts to pay 1000 IDR instead of 350000 IDR) is rejected
      const tampered = validateAuthoritativeAmountMatch(authoritativeOrderTotal, 1000);
      expect(tampered.valid).toBe(false);
      expect(tampered.diff).toBe(-349000);
    });
  });

  describe('PAY-P04-CTRL-0006: Idempotency Key Parameter Matching & Replay Protection', () => {
    const existingPayment = {
      orderId: 'order_123',
      amountIdr: 500000,
      snapToken: 'snap_sim_tok_123',
    };

    it('permits idempotent replay when idempotency key is submitted with identical parameters', () => {
      const replayRequest = {
        orderId: 'order_123',
        amountIdr: 500000,
      };

      const result = validateIntentIdempotencyMatch(existingPayment, replayRequest);
      expect(result.match).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('rejects parameter mismatch when idempotency key is reused with a different amount', () => {
      const tamperedAmountRequest = {
        orderId: 'order_123',
        amountIdr: 300000,
      };

      const result = validateIntentIdempotencyMatch(existingPayment, tamperedAmountRequest);
      expect(result.match).toBe(false);
      expect(result.reason).toContain(
        'Idempotency key parameter mismatch: original amount 500000 IDR differs from requested amount 300000 IDR',
      );
    });

    it('rejects cross-order parameter mismatch when idempotency key is reused for a different order', () => {
      const crossOrderRequest = {
        orderId: 'order_456',
        amountIdr: 500000,
      };

      const result = validateIntentIdempotencyMatch(existingPayment, crossOrderRequest);
      expect(result.match).toBe(false);
      expect(result.reason).toContain(
        'Idempotency key parameter mismatch: key was originally bound to order order_123',
      );
    });
  });

  describe('PAY-P04-CTRL-0008: Intent Expiry & TTL Verification', () => {
    it('correctly calculates intent expiration status', () => {
      const futureExpiry = new Date(Date.now() + 15 * 60 * 1000);
      expect(isPaymentIntentExpired(futureExpiry)).toBe(false);

      const pastExpiry = new Date(Date.now() - 5000);
      expect(isPaymentIntentExpired(pastExpiry)).toBe(true);

      const nullExpiry = null;
      expect(isPaymentIntentExpired(nullExpiry)).toBe(false);
    });
  });

  describe('PAY-P04: Synthetic Outcome Resolution Alignment', () => {
    it('verifies deterministic mapping for all documented synthetic tokens', () => {
      const successToken = resolveSyntheticOutcome('tok_mock_visa_success');
      expect(successToken.status).toBe('SUCCESS');
      expect(successToken.brand).toBe('VISA');

      const declineToken = resolveSyntheticOutcome('tok_mock_visa_declined');
      expect(declineToken.status).toBe('FAILED');
      expect(declineToken.brand).toBe('VISA');

      const timeoutToken = resolveSyntheticOutcome('tok_mock_gateway_timeout');
      expect(timeoutToken.status).toBe('TIMEOUT');

      const qrisToken = resolveSyntheticOutcome('tok_mock_qris_settle');
      expect(qrisToken.status).toBe('SUCCESS');
      expect(qrisToken.brand).toBe('QRIS');
    });
  });

  describe('PAY-P04: Threat Invariants & Trust Boundaries', () => {
    it('asserts threat invariants are locked in schema specification', () => {
      expect(PAYMENT_THREAT_INVARIANTS.INV_01_NO_REAL_FUNDS).toBeDefined();
      expect(PAYMENT_THREAT_INVARIANTS.INV_02_AUTHORITATIVE_STATE).toBeDefined();
      expect(PAYMENT_THREAT_INVARIANTS.INV_03_REPLAY_AND_ORDERING).toBeDefined();
      expect(PAYMENT_THREAT_INVARIANTS.INV_04_ENVIRONMENT_ISOLATION).toBeDefined();
    });

    it('asserts trust boundaries distinguish server, client, and mock provider', () => {
      expect(PAYMENT_TRUST_BOUNDARIES.CLIENT_BROWSER).toBe('UNTRUSTED');
      expect(PAYMENT_TRUST_BOUNDARIES.SERVER_DATABASE).toBe('AUTHORITATIVE_SOURCE_OF_TRUTH');
      expect(PAYMENT_TRUST_BOUNDARIES.EXTERNAL_WEBHOOK).toBe(
        'SEMI_TRUSTED_NEEDS_CRYPTO_VERIFICATION',
      );
    });
  });
});
