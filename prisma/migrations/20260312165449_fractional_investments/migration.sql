-- CreateEnum
CREATE TYPE "ShareTransactionType" AS ENUM ('BUY', 'SELL', 'TRANSFER');

-- CreateTable
CREATE TABLE "InvestmentOffer" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "totalShares" INTEGER NOT NULL,
    "pricePerShare" DOUBLE PRECISION NOT NULL,
    "sharesSold" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestmentOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorShare" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "sharesOwned" INTEGER NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareTransaction" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "investorShareId" TEXT NOT NULL,
    "shares" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "ShareTransactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentOffer_propertyId_key" ON "InvestmentOffer"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorShare_investorId_propertyId_key" ON "InvestorShare"("investorId", "propertyId");

-- AddForeignKey
ALTER TABLE "InvestmentOffer" ADD CONSTRAINT "InvestmentOffer_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorShare" ADD CONSTRAINT "InvestorShare_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorShare" ADD CONSTRAINT "InvestorShare_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorShare" ADD CONSTRAINT "InvestorShare_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "InvestmentOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareTransaction" ADD CONSTRAINT "ShareTransaction_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareTransaction" ADD CONSTRAINT "ShareTransaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareTransaction" ADD CONSTRAINT "ShareTransaction_investorShareId_fkey" FOREIGN KEY ("investorShareId") REFERENCES "InvestorShare"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
