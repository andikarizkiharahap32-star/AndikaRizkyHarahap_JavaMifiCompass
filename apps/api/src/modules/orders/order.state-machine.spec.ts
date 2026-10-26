import {
  canTransitionOrder,
  determineFulfillmentType,
  isOrderExpired,
} from './order.state-machine';

describe('Order State Machine', () => {
  describe('Digital eSIM transitions', () => {
    it('allows valid digital flow: DRAFT -> PENDING_PAYMENT -> PAID -> FULFILLING -> FULFILLED -> IN_USE -> COMPLETED', () => {
      expect(canTransitionOrder('DRAFT', 'PENDING_PAYMENT', 'DIGITAL').allowed).toBe(true);
      expect(canTransitionOrder('PENDING_PAYMENT', 'PAID', 'DIGITAL').allowed).toBe(true);
      expect(canTransitionOrder('PAID', 'FULFILLING', 'DIGITAL').allowed).toBe(true);
      expect(canTransitionOrder('FULFILLING', 'FULFILLED', 'DIGITAL').allowed).toBe(true);
      expect(canTransitionOrder('FULFILLED', 'IN_USE', 'DIGITAL').allowed).toBe(true);
      expect(canTransitionOrder('IN_USE', 'COMPLETED', 'DIGITAL').allowed).toBe(true);
    });

    it('blocks digital orders from transitioning to physical shipping/return states', () => {
      const shippedCheck = canTransitionOrder('FULFILLING', 'SHIPPED', 'DIGITAL');
      expect(shippedCheck.allowed).toBe(false);
      expect(shippedCheck.error).toContain('Digital eSIM orders do not go through physical logistics');

      const returnCheck = canTransitionOrder('IN_USE', 'RETURN_PENDING', 'DIGITAL');
      expect(returnCheck.allowed).toBe(false);
    });
  });

  describe('Physical Pocket WiFi transitions', () => {
    it('allows full physical logistics flow: PAID -> FULFILLING -> SHIPPED -> DELIVERED -> IN_USE -> RETURN_PENDING -> RETURNED -> INSPECTED -> DEPOSIT_REFUNDED -> COMPLETED', () => {
      expect(canTransitionOrder('PAID', 'FULFILLING', 'PHYSICAL').allowed).toBe(true);
      expect(canTransitionOrder('FULFILLING', 'SHIPPED', 'PHYSICAL').allowed).toBe(true);
      expect(canTransitionOrder('SHIPPED', 'DELIVERED', 'PHYSICAL').allowed).toBe(true);
      expect(canTransitionOrder('DELIVERED', 'IN_USE', 'PHYSICAL').allowed).toBe(true);
      expect(canTransitionOrder('IN_USE', 'RETURN_PENDING', 'PHYSICAL').allowed).toBe(true);
      expect(canTransitionOrder('RETURN_PENDING', 'RETURNED', 'PHYSICAL').allowed).toBe(true);
      expect(canTransitionOrder('RETURNED', 'INSPECTED', 'PHYSICAL').allowed).toBe(true);
      expect(canTransitionOrder('INSPECTED', 'DEPOSIT_REFUNDED', 'PHYSICAL').allowed).toBe(true);
      expect(canTransitionOrder('DEPOSIT_REFUNDED', 'COMPLETED', 'PHYSICAL').allowed).toBe(true);
    });

    it('blocks physical orders from skipping shipping to digital FULFILLED', () => {
      const skipCheck = canTransitionOrder('FULFILLING', 'FULFILLED', 'PHYSICAL');
      expect(skipCheck.allowed).toBe(false);
      expect(skipCheck.error).toContain('must be SHIPPED');
    });
  });

  describe('Expiry and cancellation', () => {
    it('allows pending payment to expire or cancel', () => {
      expect(canTransitionOrder('PENDING_PAYMENT', 'EXPIRED', 'DIGITAL').allowed).toBe(true);
      expect(canTransitionOrder('PENDING_PAYMENT', 'CANCELLED', 'DIGITAL').allowed).toBe(true);
    });

    it('detects orders exceeding 24 hours as expired', () => {
      const now = new Date();
      const recentOrder = new Date(now.getTime() - 1000 * 60 * 60 * 2); // 2 hours ago
      const oldOrder = new Date(now.getTime() - 1000 * 60 * 60 * 25); // 25 hours ago

      expect(isOrderExpired(recentOrder, 24)).toBe(false);
      expect(isOrderExpired(oldOrder, 24)).toBe(true);
    });
  });

  describe('Fulfillment type determination', () => {
    it('accurately identifies DIGITAL, PHYSICAL, and HYBRID orders', () => {
      expect(determineFulfillmentType([{ productType: 'ESIM' }])).toBe('DIGITAL');
      expect(determineFulfillmentType([{ productType: 'WIFI_RENTAL' }])).toBe('PHYSICAL');
      expect(
        determineFulfillmentType([{ productType: 'ESIM' }, { productType: 'WIFI_RENTAL' }]),
      ).toBe('HYBRID');
    });
  });
});
