/*
  Warnings:

  - You are about to drop the column `customLink` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `redirectType` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappNumber` on the `Room` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Room" DROP COLUMN "customLink",
DROP COLUMN "redirectType",
DROP COLUMN "whatsappNumber";
