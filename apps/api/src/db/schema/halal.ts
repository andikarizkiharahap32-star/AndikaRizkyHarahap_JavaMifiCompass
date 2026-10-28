import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { places, halalStatusEnum } from './core';

/**
 * P13: Halal Verification Evidence and Audit Log Schema
 *
 * Evidence Types:
 * - certificate: formal halal certification document with certifying body, number, validity
 * - authority_listing: official governmental/religious council database entry (e.g. MUIS, JAKIM)
 * - owner_declaration: business operator self-declaration (muslim-owned or pork/alcohol free)
 * - community_report: crowdsourced feedback or flags (cannot auto-upgrade status)
 */

export const halalEvidence = pgTable(
  'halal_evidence',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    placeId: uuid('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    evidenceType: varchar('evidence_type', { length: 50 }).notNull(), // certificate | authority_listing | owner_declaration | community_report
    certifyingBody: varchar('certifying_body', { length: 255 }),
    certificateNumber: varchar('certificate_number', { length: 255 }),
    issuedAt: timestamp('issued_at', { withTimezone: true, mode: 'date' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
    sourceUrl: varchar('source_url', { length: 1024 }),
    asOf: timestamp('as_of', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    isDisputed: boolean('is_disputed').default(false).notNull(),
    isVerifiedByModerator: boolean('is_verified_by_moderator').default(false).notNull(),
    notes: text('notes'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    placeIdIdx: index('idx_halal_evidence_place_id').on(table.placeId),
    evidenceTypeIdx: index('idx_halal_evidence_type').on(table.evidenceType),
  })
);

export const halalStatusAuditLogs = pgTable(
  'halal_status_audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    placeId: uuid('place_id')
      .notNull()
      .references(() => places.id, { onDelete: 'cascade' }),
    previousStatus: halalStatusEnum('previous_status').notNull(),
    newStatus: halalStatusEnum('new_status').notNull(),
    reason: varchar('reason', { length: 512 }).notNull(),
    changedBy: varchar('changed_by', { length: 255 }).notNull(),
    asOf: timestamp('as_of', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    placeIdIdx: index('idx_halal_audit_place_id').on(table.placeId),
    createdAtIdx: index('idx_halal_audit_created_at').on(table.createdAt),
  })
);
