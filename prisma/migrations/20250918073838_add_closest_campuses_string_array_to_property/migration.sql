-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "closestCampuses" TEXT[] DEFAULT ARRAY[]::TEXT[];
