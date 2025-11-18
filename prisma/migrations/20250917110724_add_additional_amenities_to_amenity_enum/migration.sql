-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Amenity" ADD VALUE 'OnSiteSecurity';
ALTER TYPE "Amenity" ADD VALUE 'TransportToCampus';
ALTER TYPE "Amenity" ADD VALUE 'OutdoorChillArea';
ALTER TYPE "Amenity" ADD VALUE 'SecurityCameras';
ALTER TYPE "Amenity" ADD VALUE 'Cafe';
ALTER TYPE "Amenity" ADD VALUE 'LaundryFacilities';
ALTER TYPE "Amenity" ADD VALUE 'GamesRoom';
ALTER TYPE "Amenity" ADD VALUE 'TVRoom';
ALTER TYPE "Amenity" ADD VALUE 'ComputerRoom';
ALTER TYPE "Amenity" ADD VALUE 'StudyLabs';
ALTER TYPE "Amenity" ADD VALUE 'Heater';
ALTER TYPE "Amenity" ADD VALUE 'Fan';
ALTER TYPE "Amenity" ADD VALUE 'Stove';
ALTER TYPE "Amenity" ADD VALUE 'Oven';
ALTER TYPE "Amenity" ADD VALUE 'BiometricAccess';
