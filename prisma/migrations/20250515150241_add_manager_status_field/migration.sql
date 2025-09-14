/*
  Warnings:

  - Added the required column `updatedAt` to the `Manager` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('PRIVATE', 'SHARED', 'ENTIRE_UNIT');

-- CreateEnum
CREATE TYPE "ManagerStatus" AS ENUM ('Pending', 'Active', 'Disabled', 'Banned');

-- AlterTable
ALTER TABLE "Manager" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "ManagerStatus" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricePerMonth" DOUBLE PRECISION NOT NULL,
    "securityDeposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "squareFeet" INTEGER,
    "beds" INTEGER NOT NULL DEFAULT 1,
    "baths" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "roomType" "RoomType" NOT NULL DEFAULT 'PRIVATE',
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "propertyId" INTEGER NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Room_propertyId_idx" ON "Room"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_cognitoId_key" ON "Admin"("cognitoId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
