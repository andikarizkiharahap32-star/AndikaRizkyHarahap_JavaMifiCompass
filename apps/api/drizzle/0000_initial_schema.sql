-- Migration: 0000_initial_schema.sql
-- Invariant: Zero-downtime, expand-contract, lock_timeout protection

SET lock_timeout = '2s';

-- Custom Enums
DO $$ BEGIN
 CREATE TYPE "halal_status" AS ENUM('verified', 'self_declared', 'unverified', 'disputed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 1. Users
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Sessions
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "refresh_token" varchar(512) NOT NULL UNIQUE,
  "user_agent" varchar(512),
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "sessions" ("user_id");

-- 3. Places
CREATE TABLE IF NOT EXISTS "places" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" varchar(255) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "destination_country" char(2) NOT NULL,
  "city" varchar(100) NOT NULL,
  "halal_status" "halal_status" DEFAULT 'unverified' NOT NULL,
  "price_min" numeric(20, 6),
  "price_max" numeric(20, 6),
  "currency" char(3) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Place Sources
CREATE TABLE IF NOT EXISTS "place_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "place_id" uuid NOT NULL REFERENCES "places"("id") ON DELETE CASCADE,
  "source_name" varchar(100) NOT NULL,
  "external_id" varchar(255) NOT NULL,
  "raw_payload" jsonb,
  "synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_place_sources_place_id" ON "place_sources" ("place_id");

-- 5. Place Halal Evidence
CREATE TABLE IF NOT EXISTS "place_halal_evidence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "place_id" uuid NOT NULL REFERENCES "places"("id") ON DELETE CASCADE,
  "certifying_body" varchar(255),
  "certificate_number" varchar(255),
  "halal_tier" smallint NOT NULL,
  "evidence_type" varchar(100) NOT NULL,
  "evidence_url" varchar(1024),
  "verified_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_place_halal_evidence_place_id" ON "place_halal_evidence" ("place_id");

-- 6. Reviews
CREATE TABLE IF NOT EXISTS "reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "place_id" uuid NOT NULL REFERENCES "places"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "rating" smallint NOT NULL,
  "comment" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_reviews_place_id" ON "reviews" ("place_id");
CREATE INDEX IF NOT EXISTS "idx_reviews_user_id" ON "reviews" ("user_id");

-- 7. Favorites
CREATE TABLE IF NOT EXISTS "favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "place_id" uuid NOT NULL REFERENCES "places"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_favorites_user_id" ON "favorites" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_favorites_place_id" ON "favorites" ("place_id");

-- 8. FX Rates
CREATE TABLE IF NOT EXISTS "fx_rates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "from_currency" char(3) NOT NULL,
  "to_currency" char(3) DEFAULT 'IDR' NOT NULL,
  "rate" numeric(20, 6) NOT NULL,
  "effective_date" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 9. Payment Intents
CREATE TABLE IF NOT EXISTS "payment_intents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "amount" numeric(20, 6) NOT NULL,
  "currency" char(3) NOT NULL,
  "gateway_provider" varchar(50) NOT NULL,
  "gateway_transaction_id" varchar(255),
  "status" varchar(50) DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_payment_intents_user_id" ON "payment_intents" ("user_id");

-- 10. Audit Log
CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action" varchar(100) NOT NULL,
  "resource_type" varchar(100) NOT NULL,
  "resource_id" varchar(255),
  "payload" jsonb,
  "ip_address" varchar(45),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_audit_log_actor_id" ON "audit_log" ("actor_id");
