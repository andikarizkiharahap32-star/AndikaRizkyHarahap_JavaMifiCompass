-- P15: PostGIS Geography Extension & Spatial Index Migration
-- Supports spatial radius filtering (ST_DWithin) and K-Nearest Neighbors (<-> KNN)

SET lock_timeout = '2s';

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add geography(Point, 4326) column to places table
ALTER TABLE places ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- 3. Populate geography location from existing latitude and longitude if available
-- Note: ST_MakePoint takes (longitude, latitude)
UPDATE places
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4. Spatial GiST Index for high-performance radius queries and KNN sorting
CREATE INDEX IF NOT EXISTS idx_places_location_gist ON places USING gist(location);

-- 5. Standard Spatial Radius Query Pattern with KNN sorting:
-- SELECT id, name, city,
--        ST_Distance(location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) AS distance_meters
-- FROM places
-- WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius_meters)
-- ORDER BY location <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography ASC
-- LIMIT :limit;
