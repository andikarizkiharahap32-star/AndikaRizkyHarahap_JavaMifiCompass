-- P14: Postgres Full Text Search (FTS) & Multilingual Aliases
-- Extensions required for accent-insensitive search and fuzzy trigram matching
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Multilingual Place Aliases Table
-- Stores names in Japanese (Kanji/Kana), Thai, Arabic, Chinese, etc.
CREATE TABLE IF NOT EXISTS place_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL, -- 'ja', 'th', 'ar', 'zh', 'ko', 'en', 'id'
  alias_name VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_place_aliases_place_id ON place_aliases(place_id);
CREATE INDEX IF NOT EXISTS idx_place_aliases_name_trgm ON place_aliases USING gin(alias_name gin_trgm_ops);

-- 2. Add tsvector column for fast full-text search
ALTER TABLE places ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 3. GIN index for tsvector
CREATE INDEX IF NOT EXISTS idx_places_search_vector ON places USING gin(search_vector);

-- 4. Trigram index for fuzzy text matching fallback
CREATE INDEX IF NOT EXISTS idx_places_name_trgm ON places USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_places_city_trgm ON places USING gin(city gin_trgm_ops);

-- 5. Stored function and trigger to automatically compute search_vector
CREATE OR REPLACE FUNCTION places_generate_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.city, ''))), 'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(NEW.destination_country, ''))), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_places_search_vector ON places;
CREATE TRIGGER trg_places_search_vector
BEFORE INSERT OR UPDATE OF name, city, destination_country ON places
FOR EACH ROW EXECUTE FUNCTION places_generate_search_vector();
