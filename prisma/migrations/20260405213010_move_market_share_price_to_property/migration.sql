/*
  Warnings:

  - You are about to drop the column `marketPricePerShare` on the `InvestmentOffer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InvestmentOffer" DROP COLUMN "marketPricePerShare";

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "marketPricePerShare" DOUBLE PRECISION;
