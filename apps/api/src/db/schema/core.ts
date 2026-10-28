import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  char,
  smallint,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Halal Status Enum (Strict prohibition: never store halal status as a boolean is_halal flag)
export const halalStatusEnum = pgEnum('halal_status', [
  'verified',
  'self_declared',
  'unverified',
  'disputed',
]);

// 1. Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 2. Sessions table (indexed FK to users)
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshToken: varchar('refresh_token', { length: 512 }).notNull().unique(),
    userAgent: varchar('user_agent', { length: 512 }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_sessions_user_id').on(table.userId),
  }),
);

// 3. Places table (Core Dining venue; prices as numeric(20,6) + char(3), timestamptz everywhere)
export const places = pgTable('places', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  destinationCountry: char('destination_country', { length: 2 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  halalStatus: halalStatusEnum('halal_status').notNull().default('unverified'),
  priceMin: numeric('price_min', { precision: 20, scale: 6 }),
  priceMax: numeric('price_max', { precision: 20, scale: 6 }),
  currency: char('currency', { length: 3 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 4. Place Sources table (External provider attribution; indexed FK to places)
export const placeSources = pgTable(
  'place_sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    placeId: uuid('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    sourceName: varchar('source_name', { length: 100 }).notNull(),
    externalId: varchar('external_id', { length: 255 }).notNull(),
    rawPayload: jsonb('raw_payload'),
    syncedAt: timestamp('synced_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    placeIdIdx: index('idx_place_sources_place_id').on(table.placeId),
  }),
);

// 5. Place Halal Evidence table (Audit provenance rows; indexed FK to places)
export const placeHalalEvidence = pgTable(
  'place_halal_evidence',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    placeId: uuid('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    certifyingBody: varchar('certifying_body', { length: 255 }),
    certificateNumber: varchar('certificate_number', { length: 255 }),
    halalTier: smallint('halal_tier').notNull(), // Tier 1, 2, 3, 4
    evidenceType: varchar('evidence_type', { length: 100 }).notNull(),
    evidenceUrl: varchar('evidence_url', { length: 1024 }),
    verifiedAt: timestamp('verified_at', { withTimezone: true, mode: 'date' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    placeIdIdx: index('idx_place_halal_evidence_place_id').on(table.placeId),
  }),
);

// 6. Reviews table (indexed FK to places and users)
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    placeId: uuid('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: smallint('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    placeIdIdx: index('idx_reviews_place_id').on(table.placeId),
    userIdIdx: index('idx_reviews_user_id').on(table.userId),
  }),
);

// 7. Favorites table (indexed FK to users and places)
export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    placeId: uuid('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_favorites_user_id').on(table.userId),
    placeIdIdx: index('idx_favorites_place_id').on(table.placeId),
  }),
);

// 8. FX Rates table (Deterministic FX rate table with numeric(20,6) precision)
export const fxRates = pgTable('fx_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  fromCurrency: char('from_currency', { length: 3 }).notNull(),
  toCurrency: char('to_currency', { length: 3 }).notNull().default('IDR'),
  rate: numeric('rate', { precision: 20, scale: 6 }).notNull(),
  effectiveDate: timestamp('effective_date', { withTimezone: true, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 9. Payment Intents table (Money as numeric(20,6) + char(3), indexed FK to users)
export const paymentIntents = pgTable(
  'payment_intents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 20, scale: 6 }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    gatewayProvider: varchar('gateway_provider', { length: 50 }).notNull(),
    gatewayTransactionId: varchar('gateway_transaction_id', { length: 255 }),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_payment_intents_user_id').on(table.userId),
  }),
);

// 10. Audit Log table (Indexed FK to actor users with on delete set null)
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    resourceId: varchar('resource_id', { length: 255 }),
    payload: jsonb('payload'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    actorIdIdx: index('idx_audit_log_actor_id').on(table.actorId),
  }),
);
