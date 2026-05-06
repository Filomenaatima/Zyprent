/*
  Warnings:

  - You are about to drop the column `amountDue` on the `RentInvoice` table. All the data in the column will be lost.
  - Added the required column `totalAmount` to the `RentInvoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RentInvoice" DROP COLUMN "amountDue",
ADD COLUMN     "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmount" DECIMAL(65,30) NOT NULL;
