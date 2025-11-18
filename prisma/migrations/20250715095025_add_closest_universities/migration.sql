-- CreateEnum
CREATE TYPE "University" AS ENUM ('UCT', 'WITS', 'UJ', 'UKZN', 'UWC', 'UP', 'SU', 'CPUT', 'TUT', 'UNISA', 'NWU', 'UFS', 'UFH', 'RU', 'WSU', 'UL', 'UZ', 'CUT', 'MUT', 'SPU');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "closestUniversities" "University"[];
