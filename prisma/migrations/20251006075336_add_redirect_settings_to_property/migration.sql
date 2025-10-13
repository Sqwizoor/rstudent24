-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "customLink" TEXT,
ADD COLUMN     "redirectType" "RedirectType" DEFAULT 'NONE',
ADD COLUMN     "whatsappNumber" TEXT;
