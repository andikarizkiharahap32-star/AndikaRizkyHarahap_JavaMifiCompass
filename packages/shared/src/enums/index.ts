// ─────────────────────────────────────────────────────────────
// Enums — all domain enumerations for the JavaMifi platform
// ─────────────────────────────────────────────────────────────

/** Lifecycle states of an order from creation to completion. */
export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  FULFILLING = 'FULFILLING',
  FULFILLED = 'FULFILLED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  IN_USE = 'IN_USE',
  RETURN_PENDING = 'RETURN_PENDING',
  RETURNED = 'RETURNED',
  INSPECTED = 'INSPECTED',
  DEPOSIT_REFUNDED = 'DEPOSIT_REFUNDED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
}

/** Payment transaction states. */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

/** Supported payment methods. */
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  E_WALLET = 'E_WALLET',
  QR_CODE = 'QR_CODE',
  CONVENIENCE_STORE = 'CONVENIENCE_STORE',
  MOCK = 'MOCK',
}

/** Types of products available in the catalog. */
export enum ProductType {
  WIFI_RENTAL = 'WIFI_RENTAL',
  ESIM = 'ESIM',
  SIM_CARD = 'SIM_CARD',
  PRO_SUBSCRIPTION = 'PRO_SUBSCRIPTION',
}

/** Physical device lifecycle states. */
export enum DeviceStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  PREPARED = 'PREPARED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  IN_USE = 'IN_USE',
  RETURN_PENDING = 'RETURN_PENDING',
  RETURNED = 'RETURNED',
  INSPECTED = 'INSPECTED',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

/** CMS content lifecycle states. */
export enum ContentStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/** User roles for RBAC. */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  EDITOR = 'EDITOR',
  OPS = 'OPS',
  FINANCE = 'FINANCE',
  SUPPORT = 'SUPPORT',
  CUSTOMER = 'CUSTOMER',
}

/** Support ticket priority levels. */
export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/** Support ticket states. */
export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

/** How an order is fulfilled. */
export enum FulfillmentType {
  DIGITAL = 'DIGITAL',
  PHYSICAL = 'PHYSICAL',
  HYBRID = 'HYBRID',
}

/** Product recommendation categories for the planner. */
export enum RecommendationType {
  WIFI_RENTAL = 'WIFI_RENTAL',
  ESIM = 'ESIM',
  SIM_CARD = 'SIM_CARD',
}

/** Traveler data usage profiles. */
export enum UsageProfile {
  LIGHT = 'LIGHT',
  MODERATE = 'MODERATE',
  HEAVY = 'HEAVY',
  WORK = 'WORK',
}

/** Payment gateway operating mode. */
export enum GatewayMode {
  MOCK = 'MOCK',
  MIDTRANS_SANDBOX = 'MIDTRANS_SANDBOX',
  MIDTRANS_PRODUCTION = 'MIDTRANS_PRODUCTION',
}

/** eSIM provider operating mode. */
export enum EsimProviderMode {
  MOCK = 'MOCK',
  AIRALO_SANDBOX = 'AIRALO_SANDBOX',
  AIRALO_PRODUCTION = 'AIRALO_PRODUCTION',
}

/** Channels through which notifications can be sent. */
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  SLACK = 'SLACK',
  TELEGRAM = 'TELEGRAM',
  IN_APP = 'IN_APP',
}

/** Audit trail action types. */
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  STATUS_CHANGE = 'STATUS_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
}
