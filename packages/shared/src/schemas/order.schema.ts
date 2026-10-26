// ─────────────────────────────────────────────────────────────
// Order schemas
// ─────────────────────────────────────────────────────────────
import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '../enums/index.js';
import { idSchema, moneySchema, emailSchema, phoneSchema } from './index.js';

/** Create a new order (manual / admin). */
export const createOrderSchema = z.object({
  customerId: idSchema,
  items: z
    .array(
      z.object({
        planId: idSchema,
        quantity: z.number().int().positive().max(10),
      }),
    )
    .min(1, 'At least one item is required'),
  promoCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Add an item to the shopping cart. */
export const addToCartSchema = z.object({
  planId: idSchema,
  quantity: z.number().int().positive().max(10).default(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;

/** Checkout request. */
export const checkoutSchema = z.object({
  cartId: idSchema,
  paymentMethod: z.nativeEnum(PaymentMethod),
  promoCode: z.string().optional(),
  billingEmail: emailSchema,
  billingPhone: phoneSchema.optional(),
  shippingAddress: z
    .object({
      recipientName: z.string().min(2).max(100),
      line1: z.string().min(5).max(255),
      line2: z.string().max(255).optional(),
      city: z.string().min(1).max(100),
      province: z.string().min(1).max(100),
      postalCode: z.string().min(4).max(10),
      country: z.string().length(2).default('ID'),
      phone: phoneSchema,
    })
    .optional(),
  idempotencyKey: z.string().uuid(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Admin / system order-status transition. */
export const updateOrderStatusSchema = z.object({
  orderId: idSchema,
  status: z.nativeEnum(OrderStatus),
  reason: z.string().max(500).optional(),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

/** Refund request. */
export const refundSchema = z.object({
  orderId: idSchema,
  amount: moneySchema,
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
  isPartial: z.boolean().default(false),
});
export type RefundInput = z.infer<typeof refundSchema>;
