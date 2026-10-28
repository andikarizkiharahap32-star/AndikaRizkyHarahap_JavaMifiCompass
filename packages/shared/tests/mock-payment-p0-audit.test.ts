import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MOCK_PROVIDER_NAMESPACE,
  MOCK_ENVIRONMENT_MARKER,
  ALLOWLISTED_MOCK_TOKENS,
  containsRealPaymentCredentials,
  mockPaymentIntentSchema,
} from '../src/schemas/mock-payment.schema';
import { MockEnvironmentGuard } from '../../../apps/api/src/modules/payments/mock-environment.guard';

describe('Mock Payment Gateway - P0: Mock-only Scope and Environment Isolation', () => {
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

  it('P0-1: Asserts explicit mock environment marker and synthetic provider namespace', () => {
    expect(MOCK_PROVIDER_NAMESPACE).toBe('mock_simulated');
    expect(MOCK_ENVIRONMENT_MARKER).toBe('simulation_sandbox');

    const meta = guard.getSimulationMetadata();
    expect(meta.provider).toBe('mock_simulated');
    expect(meta.environment).toBe('simulation_sandbox');
    expect(meta.isSimulated).toBe(true);
  });

  it('P0-2: Rejects real credit card PANs and CVVs, enforcing synthetic token usage', () => {
    // 1. Real 16-digit Visa PAN
    expect(containsRealPaymentCredentials('4532015012345678')).toBe(true);

    // 2. Real Mastercard PAN formatted with dashes
    expect(containsRealPaymentCredentials('5425-2334-1234-5678')).toBe(true);

    // 3. Object with CVV
    expect(containsRealPaymentCredentials({ cvv: '123' })).toBe(true);
    expect(containsRealPaymentCredentials({ cvc: '4321' })).toBe(true);
    expect(containsRealPaymentCredentials({ cardNumber: '4111111111111111' })).toBe(true);

    // 4. Synthetic mock token: safe and accepted
    expect(containsRealPaymentCredentials('tok_mock_visa_success')).toBe(false);
    expect(containsRealPaymentCredentials({ token: 'tok_mock_visa_success' })).toBe(false);

    // 5. Guard rejects payload containing real card data
    expect(() =>
      guard.validateSyntheticCredentials({
        pan: '4532015012345678',
        cvv: '999',
      })
    ).toThrow(/Real payment credentials .* are strictly prohibited in the mock payment gateway/);
  });

  it('P0-3: Accepts all documented allowlisted synthetic tokens and rejects undocumented tokens', () => {
    expect(ALLOWLISTED_MOCK_TOKENS).toEqual(
      expect.arrayContaining([
        'tok_mock_visa_success',
        'tok_mock_visa_declined',
        'tok_mock_mastercard_success',
        'tok_mock_mastercard_declined',
        'tok_mock_qris_settle',
        'tok_mock_qris_expired',
        'tok_mock_gateway_timeout',
        'tok_mock_insufficient_funds',
      ])
    );

    // Documented token passes validation
    expect(() =>
      guard.validateSyntheticCredentials({
        syntheticToken: 'tok_mock_visa_success',
      })
    ).not.toThrow();

    // Undocumented token throws validation error
    expect(() =>
      guard.validateSyntheticCredentials({
        syntheticToken: 'invalid_unrecognized_token',
      })
    ).toThrow(/Invalid synthetic token.*must start with "tok_mock_"/);
  });

  it('P0-4: Fails closed in production unless explicit server-side ALLOW_MOCK_PAYMENT is enabled', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_MOCK_PAYMENT = 'false';

    // In production without ALLOW_MOCK_PAYMENT, mock mode is forbidden
    expect(() => guard.assertMockAllowed()).toThrow(
      /Mock payment simulation is strictly disabled in production environments/
    );

    // When explicitly enabled on server, mock mode is permitted
    process.env.ALLOW_MOCK_PAYMENT = 'true';
    expect(() => guard.assertMockAllowed()).not.toThrow();
  });

  it('P0-5: Prohibits activating mock payment via client query parameters in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_MOCK_PAYMENT = 'true';

    // Passing ?mock=true or ?isMock=true must be rejected
    expect(() =>
      guard.assertMockAllowed({
        queryParams: { mock: 'true' },
      })
    ).toThrow(/Activating mock payment via client query parameters is strictly prohibited/);

    expect(() =>
      guard.assertMockAllowed({
        queryParams: { mode: 'mock' },
      })
    ).toThrow(/Activating mock payment via client query parameters is strictly prohibited/);
  });

  it('P0-6: Prohibits activating mock payment via client request headers in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_MOCK_PAYMENT = 'true';

    // Passing X-Mock-Mode or X-Payment-Mode header must be rejected
    expect(() =>
      guard.assertMockAllowed({
        headers: { 'x-mock-mode': 'enabled' },
      })
    ).toThrow(/Activating mock payment via client request headers is strictly prohibited/);

    expect(() =>
      guard.assertMockAllowed({
        headers: { 'x-payment-mode': 'mock' },
      })
    ).toThrow(/Activating mock payment via client request headers is strictly prohibited/);
  });

  it('P0-7: Enforces server-side authoritative order amount and rejects client-side tampering', () => {
    const authoritativeOrderTotal = 350000;

    // Matching or omitted amount returns authoritative total
    expect(guard.assertAuthoritativeAmount(authoritativeOrderTotal, 350000)).toBe(350000);
    expect(guard.assertAuthoritativeAmount(authoritativeOrderTotal, undefined)).toBe(350000);

    // Tampered client amount throws error
    expect(() =>
      guard.assertAuthoritativeAmount(authoritativeOrderTotal, 1000)
    ).toThrow(/Payment amount 1000 does not match authoritative order total 350000/);
  });

  it('P0-8: Zod mockPaymentIntentSchema rejects requests containing real card fields', () => {
    const validPayload = {
      orderId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      syntheticToken: 'tok_mock_visa_success' as const,
      idempotencyKey: 'idem_mock_123',
    };

    const parsed = mockPaymentIntentSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);

    // Real card fields injected into payload
    const invalidPayload = {
      ...validPayload,
      cardNumber: '4532015012345678',
      cvv: '123',
    };

    const invalidParse = mockPaymentIntentSchema.safeParse(invalidPayload);
    expect(invalidParse.success).toBe(false);
  });
});
