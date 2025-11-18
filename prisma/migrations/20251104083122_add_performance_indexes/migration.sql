-- CreateIndex - Performance Optimization Indexes
-- These indexes dramatically improve query speed without affecting data

-- Property table indexes for search and filtering
CREATE INDEX IF NOT EXISTS "idx_property_name" ON "Property"(name);
CREATE INDEX IF NOT EXISTS "idx_property_price" ON "Property"("pricePerMonth");
CREATE INDEX IF NOT EXISTS "idx_property_beds" ON "Property"(beds);
CREATE INDEX IF NOT EXISTS "idx_property_type" ON "Property"("propertyType");
CREATE INDEX IF NOT EXISTS "idx_property_location" ON "Property"("locationId");
CREATE INDEX IF NOT EXISTS "idx_property_manager" ON "Property"("managerCognitoId");
CREATE INDEX IF NOT EXISTS "idx_property_posted_date" ON "Property"("postedDate" DESC);

-- Room table indexes for availability and pricing queries
CREATE INDEX IF NOT EXISTS "idx_room_property_available" ON "Room"("propertyId", "isAvailable");
CREATE INDEX IF NOT EXISTS "idx_room_price" ON "Room"("pricePerMonth");
CREATE INDEX IF NOT EXISTS "idx_room_available_date" ON "Room"("availableFrom");

-- Location table indexes for geographic and city searches
CREATE INDEX IF NOT EXISTS "idx_location_city" ON "Location"(city);
CREATE INDEX IF NOT EXISTS "idx_location_suburb" ON "Location"(suburb);

-- Foreign key indexes for efficient joins
CREATE INDEX IF NOT EXISTS "idx_application_property" ON "Application"("propertyId");
CREATE INDEX IF NOT EXISTS "idx_application_tenant" ON "Application"("tenantCognitoId");
CREATE INDEX IF NOT EXISTS "idx_lease_property" ON "Lease"("propertyId");
CREATE INDEX IF NOT EXISTS "idx_lease_tenant" ON "Lease"("tenantCognitoId");
CREATE INDEX IF NOT EXISTS "idx_payment_lease" ON "Payment"("leaseId");
