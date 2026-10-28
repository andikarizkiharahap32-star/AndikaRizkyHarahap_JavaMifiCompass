import { describe, it, expect } from 'vitest';
import {
  ALLOWLISTED_MOCK_TOKENS,
  SYNTHETIC_FIXTURES,
  resolveSyntheticOutcome,
  mockPaymentSimulateRequestSchema,
  mockWebhookSimulationPayloadSchema,
  containsRealPaymentCredentials,
  MOCK_PROVIDER_NAMESPACE,
  MOCK_ENVIRONMENT_MARKER,
} from '../src/schemas/mock-payment.schema';
import { generateHmacSha256, constantTimeCompare } from '../src/helpers/crypto';

describe('PAY-P02 Audit: Request Schema & Synthetic Fixtures', () => {
  describe('Synthetic Fixtures Catalog & Brand Mapping', () => {
    it('defines allowlisted synthetic tokens for all major payment schemes and scenarios', () => {
      expect(ALLOWLISTED_MOCK_TOKENS).toContain('tok_mock_visa_success');
      expect(ALLOWLISTED_MOCK_TOKENS).toContain('tok_mock_visa_declined');
      expect(ALLOWLISTED_MOCK_TOKENS).toContain('tok_mock_mastercard_success');
      expect(ALLOWLISTED_MOCK_TOKENS).toContain('tok_mock_mastercard_declined');
      expect(ALLOWLISTED_MOCK_TOKENS).toContain('tok_mock_jcb_success');
      expect(ALLOWLISTED_MOCK_TOKENS).toContain('tok_mock_amex_success');
      expect(ALLOWLISTED_MOCK_TOKENS).toContain('tok_mock_qris_settle');
      expect(ALLOWLISTED_MOCK_TOKENS).toContain('tok_mock_qris_expired');
      expect(ALLOWLISTED_MOCK_TOKENS).toContain('tok_mock_insufficient_funds');
      expect(ALLOWLISTED_MOCK_TOKENS).toContain('tok_mock_suspected_fraud');
      expect(ALLOWLISTED_MOCK_TOKENS).toContain('tok_mock_gateway_timeout');
      expect(ALLOWLISTED_MOCK_TOKENS).toContain('tok_mock_network_error');
    });

    it('asserts synthetic card fixtures never contain raw PAN or CVV', () => {
      for (const [key, fixture] of Object.entries(SYNTHETIC_FIXTURES)) {
        expect(containsRealPaymentCredentials(fixture)).toBe(false);
        // Only safe 4-digit last4 or scheme markers
        expect(fixture.last4.length).toBeLessThanOrEqual(4);
        expect(fixture.token.startsWith('tok_mock_')).toBe(true);
      }
    });
  });

  describe('Deterministic Simulation Outcome Resolution', () => {
    it('resolves success outcomes deterministically for Visa, Mastercard, JCB, AMEX, and QRIS', () => {
      const visaSuccess = resolveSyntheticOutcome('tok_mock_visa_success');
      expect(visaSuccess.status).toBe('SUCCESS');
      expect(visaSuccess.statusCode).toBe('200');
      expect(visaSuccess.transactionStatus).toBe('settlement');
      expect(visaSuccess.brand).toBe('VISA');

      const mcSuccess = resolveSyntheticOutcome('tok_mock_mastercard_success');
      expect(mcSuccess.status).toBe('SUCCESS');
      expect(mcSuccess.brand).toBe('MASTERCARD');

      const qrisSettle = resolveSyntheticOutcome('tok_mock_qris_settle');
      expect(qrisSettle.status).toBe('SUCCESS');
      expect(qrisSettle.brand).toBe('QRIS');
    });

    it('resolves failure, decline, and fraud outcomes with explicit machine-readable reasons', () => {
      const decline = resolveSyntheticOutcome('tok_mock_visa_declined');
      expect(decline.status).toBe('FAILED');
      expect(decline.statusCode).toBe('402');
      expect(decline.transactionStatus).toBe('deny');
      expect(decline.reason).toBe('card_declined');

      const funds = resolveSyntheticOutcome('tok_mock_insufficient_funds');
      expect(funds.status).toBe('FAILED');
      expect(funds.reason).toBe('insufficient_funds');

      const fraud = resolveSyntheticOutcome('tok_mock_suspected_fraud');
      expect(fraud.status).toBe('FAILED');
      expect(fraud.statusCode).toBe('403');
      expect(fraud.reason).toBe('suspected_fraud');
    });

    it('resolves expiration and timeout simulation scenarios', () => {
      const expired = resolveSyntheticOutcome('tok_mock_qris_expired');
      expect(expired.status).toBe('EXPIRED');
      expect(expired.statusCode).toBe('408');
      expect(expired.transactionStatus).toBe('expire');

      const timeout = resolveSyntheticOutcome('tok_mock_gateway_timeout');
      expect(timeout.status).toBe('TIMEOUT');
      expect(timeout.statusCode).toBe('504');
      expect(timeout.transactionStatus).toBe('timeout');
    });

    it('throws when encountering an unauthorized or non-synthetic token', () => {
      expect(() => resolveSyntheticOutcome('tok_live_real_card_123')).toThrow('Unrecognized synthetic token');
      expect(() => resolveSyntheticOutcome('4532111122223333')).toThrow('Unrecognized synthetic token');
    });
  });

  describe('Strict Simulation Request Schema (mockPaymentSimulateRequestSchema)', () => {
    it('accepts valid synthetic payment request', () => {
      const valid = {
        orderNumber: 'JMF-ORDER-999',
        syntheticToken: 'tok_mock_visa_success' as const,
        idempotencyKey: 'idem-key-12345',
      };
      const parsed = mockPaymentSimulateRequestSchema.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it('strictly rejects requests containing real card PANs or CVVs', () => {
      const withPan = {
        orderNumber: 'JMF-ORDER-999',
        syntheticToken: 'tok_mock_visa_success',
        cardNumber: '4532111122223333',
      };
      const parsedPan = mockPaymentSimulateRequestSchema.safeParse(withPan);
      expect(parsedPan.success).toBe(false);

      const withCvv = {
        orderNumber: 'JMF-ORDER-999',
        syntheticToken: 'tok_mock_visa_success',
        cvv: '123',
      };
      const parsedCvv = mockPaymentSimulateRequestSchema.safeParse(withCvv);
      expect(parsedCvv.success).toBe(false);
    });

    it('rejects unsupported or arbitrary synthetic tokens', () => {
      const invalidToken = {
        orderNumber: 'JMF-ORDER-999',
        syntheticToken: 'tok_mock_unknown_scheme',
      };
      const parsed = mockPaymentSimulateRequestSchema.safeParse(invalidToken);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Strict Mock Webhook Simulation Payload Schema', () => {
    it('validates a complete synthetic webhook event payload', () => {
      const payload = {
        orderNumber: 'JMF-ORDER-888',
        statusCode: '200',
        grossAmount: '250000',
        signatureKey: 'mock-valid-signature-sha256',
        transactionStatus: 'settlement' as const,
        transactionId: 'mock-tx-123456',
        syntheticToken: 'tok_mock_visa_success' as const,
        paymentType: 'MOCK_VISA',
        isMock: true as const,
        provider: MOCK_PROVIDER_NAMESPACE,
        environment: MOCK_ENVIRONMENT_MARKER,
        timestamp: Date.now(),
      };

      const parsed = mockWebhookSimulationPayloadSchema.safeParse(payload);
      expect(parsed.success).toBe(true);
    });

    it('rejects webhook payload lacking explicit simulation environment markers', () => {
      const invalidMarker = {
        orderNumber: 'JMF-ORDER-888',
        statusCode: '200',
        grossAmount: '250000',
        signatureKey: 'mock-sig',
        transactionStatus: 'settlement',
        transactionId: 'tx-123',
        isMock: false, // Prohibited: mock webhook must be marked isMock: true
        provider: 'midtrans', // Prohibited: mock webhook must have MOCK_PROVIDER_NAMESPACE
        environment: 'production',
      };

      const parsed = mockWebhookSimulationPayloadSchema.safeParse(invalidMarker);
      expect(parsed.success).toBe(false);
    });

    it('rejects webhook payload containing real credit card data', () => {
      const dirtyPayload = {
        orderNumber: 'JMF-ORDER-888',
        statusCode: '200',
        grossAmount: '250000',
        signatureKey: 'mock-sig',
        transactionStatus: 'settlement' as const,
        transactionId: 'tx-123',
        isMock: true as const,
        provider: MOCK_PROVIDER_NAMESPACE,
        environment: MOCK_ENVIRONMENT_MARKER,
        cardNumber: '4532111122223333',
      };

      const parsed = mockWebhookSimulationPayloadSchema.safeParse(dirtyPayload);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Cryptographic Signature Verification for Synthetic Payloads', () => {
    const testSecret = 'sk_test_mock_secret_key_12345';

    it('generates and verifies HMAC-SHA256 signature for synthetic events cleanly', () => {
      const orderNumber = 'JMF-SYNTH-001';
      const statusCode = '200';
      const grossAmount = '350000';
      const payloadString = `${orderNumber}:${statusCode}:${grossAmount}`;

      const signature = generateHmacSha256(payloadString, testSecret);
      expect(signature).toBeDefined();
      expect(signature.length).toBe(64); // SHA-256 hex string

      // Verification succeeds
      const calculated = generateHmacSha256(payloadString, testSecret);
      expect(constantTimeCompare(calculated, signature)).toBe(true);
    });

    it('fails verification if amount or orderNumber is tampered in synthetic event', () => {
      const orderNumber = 'JMF-SYNTH-001';
      const statusCode = '200';
      const grossAmount = '350000';
      const signature = generateHmacSha256(`${orderNumber}:${statusCode}:${grossAmount}`, testSecret);

      // Tampered amount (price tampering attack)
      const tamperedPayload = `${orderNumber}:${statusCode}:1000`;
      const tamperedCalc = generateHmacSha256(tamperedPayload, testSecret);
      expect(constantTimeCompare(tamperedCalc, signature)).toBe(false);
    });
  });
});
