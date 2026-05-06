/*
  Warnings:

  - A unique constraint covering the columns `[propertyId,investorId,periodMonth,periodYear]` on the table `ProfitDistribution` will be added. If there are existing duplicate values, this will fail.
  - Made the column `periodMonth` on table `ProfitDistribution` required. This step will fail if there are existing NULL values in that column.
  - Made the column `periodYear` on table `ProfitDistribution` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ProfitDistribution" ALTER COLUMN "periodMonth" SET NOT NULL,
ALTER COLUMN "periodYear" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProfitDistribution_propertyId_investorId_periodMonth_period_key" ON "ProfitDistribution"("propertyId", "investorId", "periodMonth", "periodYear");
