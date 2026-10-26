export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'FULFILLING'
  | 'FULFILLED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'IN_USE'
  | 'RETURN_PENDING'
  | 'RETURNED'
  | 'INSPECTED'
  | 'DEPOSIT_REFUNDED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

export type FulfillmentType = 'DIGITAL' | 'PHYSICAL' | 'HYBRID';

export interface StateTransitionResult {
  allowed: boolean;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  reason?: string;
  error?: string;
}

/**
 * Valid transitions by current state and fulfillment type.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAID', 'EXPIRED', 'CANCELLED'],
  PAID: ['FULFILLING', 'REFUNDED'],
  FULFILLING: ['FULFILLED', 'SHIPPED', 'CANCELLED', 'REFUNDED'],
  // Digital only: from FULFILLED directly to IN_USE
  FULFILLED: ['IN_USE', 'COMPLETED', 'REFUNDED'],
  // Physical device path:
  SHIPPED: ['DELIVERED', 'RETURN_PENDING'],
  DELIVERED: ['IN_USE'],
  IN_USE: ['RETURN_PENDING', 'COMPLETED'],
  RETURN_PENDING: ['RETURNED'],
  RETURNED: ['INSPECTED'],
  INSPECTED: ['DEPOSIT_REFUNDED', 'COMPLETED'],
  DEPOSIT_REFUNDED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
  REFUNDED: [],
};

/**
 * Evaluates whether an order can transition from current status to target status.
 */
export function canTransitionOrder(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  fulfillmentType: FulfillmentType,
): StateTransitionResult {
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

  if (!allowedNext.includes(targetStatus)) {
    return {
      allowed: false,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      error: `Invalid transition from ${currentStatus} to ${targetStatus}`,
    };
  }

  // Type-specific guards:
  // 1. Digital eSIM orders should NOT go through SHIPPED, DELIVERED, RETURNED, or DEPOSIT_REFUNDED
  if (fulfillmentType === 'DIGITAL') {
    const physicalOnlyStatuses: OrderStatus[] = [
      'SHIPPED',
      'DELIVERED',
      'RETURN_PENDING',
      'RETURNED',
      'INSPECTED',
      'DEPOSIT_REFUNDED',
    ];
    if (physicalOnlyStatuses.includes(targetStatus)) {
      return {
        allowed: false,
        fromStatus: currentStatus,
        toStatus: targetStatus,
        error: `Digital eSIM orders do not go through physical logistics step: ${targetStatus}`,
      };
    }
  }

  // 2. Physical WiFi orders should NOT go directly from FULFILLING to FULFILLED (they must go through SHIPPED)
  if (fulfillmentType === 'PHYSICAL') {
    if (currentStatus === 'FULFILLING' && targetStatus === 'FULFILLED') {
      return {
        allowed: false,
        fromStatus: currentStatus,
        toStatus: targetStatus,
        error: `Physical WiFi orders must be SHIPPED, not marked directly as digital FULFILLED`,
      };
    }
  }

  return {
    allowed: true,
    fromStatus: currentStatus,
    toStatus: targetStatus,
  };
}

/**
 * Determines fulfillment type from items
 */
export function determineFulfillmentType(
  items: Array<{ productType: 'WIFI_RENTAL' | 'ESIM' | 'SIM_CARD' | 'PRO_SUBSCRIPTION' | string }>,
): FulfillmentType {
  const hasDigital = items.some((i) => i.productType === 'ESIM');
  const hasPhysical = items.some((i) => i.productType === 'WIFI_RENTAL' || i.productType === 'SIM_CARD');

  if (hasDigital && hasPhysical) return 'HYBRID';
  if (hasPhysical) return 'PHYSICAL';
  return 'DIGITAL';
}

/**
 * Checks if an unpaid order has exceeded the 24-hour expiry threshold
 */
export function isOrderExpired(createdAt: Date | string, expiryHours = 24): boolean {
  const createdTime = new Date(createdAt).getTime();
  const maxAgeMs = expiryHours * 60 * 60 * 1000;
  return Date.now() - createdTime > maxAgeMs;
}
