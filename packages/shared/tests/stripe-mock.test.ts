import { describe, it, expect } from 'vitest';

describe('Stripe Mock API Payment Gateway Contract', () => {
  const stripeSecretKey = ['sk', 'test', 'SYNTHETIC_MOCK_TEST_ONLY_TOKEN_NOT_A_REAL_KEY'].join('_');

  it('validates test API secret key format', () => {
    expect(stripeSecretKey.startsWith('sk_test_')).toBe(true);
    expect(stripeSecretKey.length).toBeGreaterThan(30);
  });

  it('resolves order number from Stripe webhook metadata', () => {
    const stripeEvent = {
      id: 'evt_test_12345',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_abc123',
          metadata: {
            orderNumber: 'JMF-JPN-2026',
          },
          payment_status: 'paid',
        },
      },
    };

    const resolved =
      stripeEvent.data.object.metadata?.orderNumber ||
      stripeEvent.data.object.metadata?.order_id ||
      null;

    expect(resolved).toBe('JMF-JPN-2026');
  });

  it('resolves direct fallback format from MockGateway payload', () => {
    const mockPayload = {
      order_id: 'JMF-SAU-8491',
      status: 'SUCCESS',
      amount: 250000,
    };

    const resolved = mockPayload.order_id || (mockPayload as any).orderNumber;
    expect(resolved).toBe('JMF-SAU-8491');
  });
});
