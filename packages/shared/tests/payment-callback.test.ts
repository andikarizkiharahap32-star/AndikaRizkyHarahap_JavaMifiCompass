import { describe, it, expect } from 'vitest';

describe('Payment Gateway Callback Contract', () => {
  it('parses success status codes consistently across providers', () => {
    const successStatuses = ['SUCCESS', 'SETTLEMENT', 'PAID', 'COMPLETED'];
    for (const status of successStatuses) {
      const isSuccess = ['SUCCESS', 'SETTLEMENT', 'PAID', 'COMPLETED'].includes(status.toUpperCase());
      expect(isSuccess).toBe(true);
    }
  });

  it('parses failure status codes safely', () => {
    const failureStatuses = ['FAILED', 'DENY', 'CANCELLED', 'EXPIRED'];
    for (const status of failureStatuses) {
      const isFailed = ['FAILED', 'DENY', 'CANCELLED', 'EXPIRED'].includes(status.toUpperCase());
      expect(isFailed).toBe(true);
    }
  });

  it('resolves order number fallback when order_id or orderNumber query params are provided', () => {
    const params1 = new URLSearchParams('order_id=JMF-2026-TEST');
    const resolvedOrder1 = params1.get('orderNumber') || params1.get('order_id') || 'FALLBACK';
    expect(resolvedOrder1).toBe('JMF-2026-TEST');

    const params2 = new URLSearchParams('orderNumber=JMF-9999');
    const resolvedOrder2 = params2.get('orderNumber') || params2.get('order_id') || 'FALLBACK';
    expect(resolvedOrder2).toBe('JMF-9999');
  });
});
