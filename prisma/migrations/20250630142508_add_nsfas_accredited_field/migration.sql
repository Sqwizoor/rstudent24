/*
  Warnings:

  - You are about to drop the column `applicationFee` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "applicationFee",
ADD COLUMN     "isNsfassAccredited" BOOLEAN NOT NULL DEFAULT false;
