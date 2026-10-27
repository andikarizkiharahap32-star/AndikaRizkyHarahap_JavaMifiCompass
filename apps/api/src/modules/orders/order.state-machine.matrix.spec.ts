import {
  canTransitionOrder,
  determineFulfillmentType,
  isOrderExpired,
  OrderStatus,
  ALLOWED_TRANSITIONS,
} from './order.state-machine';

describe('Order State Machine - Complete Transition Matrix & Invalidation Proofs', () => {
  describe('Invalid state skips (Enforcing Strict Lifecycle)', () => {
    it('blocks jumping directly from DRAFT to PAID (must pass through PENDING_PAYMENT)', () => {
      const result = canTransitionOrder('DRAFT', 'PAID', 'DIGITAL');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Invalid transition from DRAFT to PAID');
    });

    it('blocks jumping from DRAFT directly to FULFILLED or SHIPPED', () => {
      expect(canTransitionOrder('DRAFT', 'FULFILLED', 'DIGITAL').allowed).toBe(false);
      expect(canTransitionOrder('DRAFT', 'SHIPPED', 'PHYSICAL').allowed).toBe(false);
    });

    it('blocks unpaid order from skipping to physical SHIPPED or DELIVERED', () => {
      expect(canTransitionOrder('PENDING_PAYMENT', 'SHIPPED', 'PHYSICAL').allowed).toBe(false);
      expect(canTransitionOrder('PENDING_PAYMENT', 'DELIVERED', 'PHYSICAL').allowed).toBe(false);
    });

    it('blocks premature deposit refund before return and inspection', () => {
      // In-use directly to deposit refunded
      const inUseToRefund = canTransitionOrder('IN_USE', 'DEPOSIT_REFUNDED', 'PHYSICAL');
      expect(inUseToRefund.allowed).toBe(false);

      // Returned directly to deposit refunded without inspection
      const returnedToRefund = canTransitionOrder('RETURNED', 'DEPOSIT_REFUNDED', 'PHYSICAL');
      expect(returnedToRefund.allowed).toBe(false);
      expect(returnedToRefund.error).toContain('Invalid transition from RETURNED to DEPOSIT_REFUNDED');

      // Paid directly to deposit refund
      expect(canTransitionOrder('PAID', 'DEPOSIT_REFUNDED', 'PHYSICAL').allowed).toBe(false);
    });

    it('allows deposit refund only after INSPECTED state for physical devices', () => {
      const inspectToRefund = canTransitionOrder('INSPECTED', 'DEPOSIT_REFUNDED', 'PHYSICAL');
      expect(inspectToRefund.allowed).toBe(true);

      const refundToComplete = canTransitionOrder('DEPOSIT_REFUNDED', 'COMPLETED', 'PHYSICAL');
      expect(refundToComplete.allowed).toBe(true);
    });
  });

  describe('Expiry handling & Terminal State Immutability', () => {
    it('blocks paying or reviving an EXPIRED order', () => {
      const reviveResult = canTransitionOrder('EXPIRED', 'PAID', 'DIGITAL');
      expect(reviveResult.allowed).toBe(false);
      expect(reviveResult.error).toContain('Invalid transition from EXPIRED to PAID');

      const rePendingResult = canTransitionOrder('EXPIRED', 'PENDING_PAYMENT', 'DIGITAL');
      expect(rePendingResult.allowed).toBe(false);
    });

    it('enforces terminal states: CANCELLED, COMPLETED, EXPIRED, and REFUNDED have no outgoing transitions', () => {
      const terminalStates: OrderStatus[] = ['CANCELLED', 'COMPLETED', 'EXPIRED', 'REFUNDED'];
      const allStatuses: OrderStatus[] = Object.keys(ALLOWED_TRANSITIONS) as OrderStatus[];

      for (const terminal of terminalStates) {
        expect(ALLOWED_TRANSITIONS[terminal]).toEqual([]);
        for (const target of allStatuses) {
          const res = canTransitionOrder(terminal, target, 'DIGITAL');
          expect(res.allowed).toBe(false);
        }
      }
    });

    it('correctly calculates 24-hour expiration threshold', () => {
      const now = new Date();
      const justCreated = new Date(now.getTime() - 1000 * 60 * 30); // 30 mins ago
      const halfDayOld = new Date(now.getTime() - 1000 * 60 * 60 * 12); // 12 hours ago
      const expiredOrder = new Date(now.getTime() - 1000 * 60 * 60 * 24.5); // 24.5 hours ago

      expect(isOrderExpired(justCreated, 24)).toBe(false);
      expect(isOrderExpired(halfDayOld, 24)).toBe(false);
      expect(isOrderExpired(expiredOrder, 24)).toBe(true);
    });
  });

  describe('Fulfillment Type Boundaries (Digital vs Physical Guardrails)', () => {
    it('prevents digital eSIM orders from entering any physical logistics states', () => {
      const physicalLogisticsStates: OrderStatus[] = [
        'SHIPPED',
        'DELIVERED',
        'RETURN_PENDING',
        'RETURNED',
        'INSPECTED',
        'DEPOSIT_REFUNDED',
      ];

      for (const target of physicalLogisticsStates) {
        const result = canTransitionOrder('FULFILLING', target, 'DIGITAL');
        expect(result.allowed).toBe(false);
        if (target === 'SHIPPED') {
          expect(result.error).toContain('Digital eSIM orders do not go through physical logistics step');
        }
      }
    });

    it('prevents physical Pocket WiFi orders from bypassing shipment with digital FULFILLED', () => {
      const skipToFulfilled = canTransitionOrder('FULFILLING', 'FULFILLED', 'PHYSICAL');
      expect(skipToFulfilled.allowed).toBe(false);
      expect(skipToFulfilled.error).toContain('Physical WiFi orders must be SHIPPED');
    });

    it('identifies hybrid orders requiring both digital and physical workflows', () => {
      const items = [
        { productType: 'ESIM' },
        { productType: 'WIFI_RENTAL' },
      ];
      expect(determineFulfillmentType(items)).toBe('HYBRID');
    });
  });
});
