import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  jsonb,
  char,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

/**
 * P22: Idempotency Keys Schema
 *
 * Requirements:
 * 1. Store (key, user_id, route, request_hash, response, status) for 24 hours.
 * 2. Scoped by user_id and route (PROHIBITION: never global).
 * 3. Supports in-flight advisory locking and replay.
 */

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: varchar('key', { length: 255 }).notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    route: varchar('route', { length: 255 }).notNull(),
    requestHash: char('request_hash', { length: 64 }).notNull(), // SHA-256
    responseStatus: integer('response_status'), // NULL while in-flight
    responseHeaders: jsonb('response_headers'),
    responseBody: jsonb('response_body'),
    state: varchar('state', { length: 20 }).notNull().default('in_flight'), // 'in_flight' | 'completed'
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userRouteKeyIdx: uniqueIndex('idx_idempotency_user_route_key').on(
      table.userId,
      table.route,
      table.key,
    ),
    expiresAtIdx: index('idx_idempotency_expires_at').on(table.expiresAt),
  }),
);
