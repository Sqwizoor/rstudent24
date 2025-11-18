-- Add Referral and Voucher System
-- Migration: add_referral_voucher_system
-- Date: 2025-01-06

-- Create VoucherStatus enum
CREATE TYPE "VoucherStatus" AS ENUM ('Active', 'Used', 'Expired');

-- Create Referral table
CREATE TABLE "Referral" (
    "id" SERIAL NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referrerCognitoId" TEXT NOT NULL,
    "referredCognitoId" TEXT,
    "referredEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "voucherGenerated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- Create Voucher table
CREATE TABLE "Voucher" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "ownerCognitoId" TEXT NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "discountPercent" DOUBLE PRECISION,
    "status" "VoucherStatus" NOT NULL DEFAULT 'Active',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referralId" INTEGER,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- Add referredBy field to Tenant table
ALTER TABLE "Tenant" ADD COLUMN "referredBy" TEXT;

-- Create unique indexes
CREATE UNIQUE INDEX "Referral_referralCode_key" ON "Referral"("referralCode");
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

-- Create performance indexes for Referral
CREATE INDEX "Referral_referralCode_idx" ON "Referral"("referralCode");
CREATE INDEX "Referral_referrerCognitoId_idx" ON "Referral"("referrerCognitoId");
CREATE INDEX "Referral_referredCognitoId_idx" ON "Referral"("referredCognitoId");

-- Create performance indexes for Voucher
CREATE INDEX "Voucher_code_idx" ON "Voucher"("code");
CREATE INDEX "Voucher_ownerCognitoId_idx" ON "Voucher"("ownerCognitoId");
CREATE INDEX "Voucher_status_idx" ON "Voucher"("status");

-- Add foreign key constraints
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerCognitoId_fkey" FOREIGN KEY ("referrerCognitoId") REFERENCES "Tenant"("cognitoId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredCognitoId_fkey" FOREIGN KEY ("referredCognitoId") REFERENCES "Tenant"("cognitoId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_ownerCognitoId_fkey" FOREIGN KEY ("ownerCognitoId") REFERENCES "Tenant"("cognitoId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;
