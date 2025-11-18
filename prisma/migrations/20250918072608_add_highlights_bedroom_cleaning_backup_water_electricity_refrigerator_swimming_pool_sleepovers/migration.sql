-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Highlight" ADD VALUE 'BedroomCleaning';
ALTER TYPE "Highlight" ADD VALUE 'BackupWater';
ALTER TYPE "Highlight" ADD VALUE 'BackupElectricity';
ALTER TYPE "Highlight" ADD VALUE 'Refrigerator';
ALTER TYPE "Highlight" ADD VALUE 'SwimmingPool';
ALTER TYPE "Highlight" ADD VALUE 'SleepoversAllowed';
