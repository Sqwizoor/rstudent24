-- Add text search indexes for faster location filtering
-- This significantly improves search performance for neighborhoods like Maboneng

-- Re-add the basic indexes if they were removed
CREATE INDEX IF NOT EXISTS "idx_location_city" ON "Location"(city);
CREATE INDEX IF NOT EXISTS "idx_location_suburb" ON "Location"(suburb);

-- Add text search index on address for fast word boundary matching
-- This makes searches like "Maboneng" much faster
CREATE INDEX IF NOT EXISTS "idx_location_address_text" ON "Location" USING gin(to_tsvector('english', address));

-- Add composite index for common location search patterns
CREATE INDEX IF NOT EXISTS "idx_location_city_suburb" ON "Location"(city, suburb);

-- Add case-insensitive pattern matching index for address
CREATE INDEX IF NOT EXISTS "idx_location_address_lower" ON "Location"(LOWER(address) text_pattern_ops);
