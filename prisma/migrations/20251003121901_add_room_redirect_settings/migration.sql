-- CreateEnum
CREATE TYPE "RedirectType" AS ENUM ('NONE', 'WHATSAPP', 'CUSTOM_LINK', 'BOTH');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "customLink" TEXT,
ADD COLUMN     "redirectType" "RedirectType",
ADD COLUMN     "whatsappNumber" TEXT;
