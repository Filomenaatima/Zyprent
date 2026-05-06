-- CreateTable
CREATE TABLE "PropertyProfit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "totalProfit" DOUBLE PRECISION NOT NULL,
    "distributedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyProfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfitRequest" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfitRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfitVote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "vote" BOOLEAN NOT NULL,

    CONSTRAINT "ProfitVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyProfit_propertyId_periodMonth_periodYear_key" ON "PropertyProfit"("propertyId", "periodMonth", "periodYear");

-- CreateIndex
CREATE UNIQUE INDEX "ProfitVote_requestId_investorId_key" ON "ProfitVote"("requestId", "investorId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- AddForeignKey
ALTER TABLE "PropertyProfit" ADD CONSTRAINT "PropertyProfit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitRequest" ADD CONSTRAINT "ProfitRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitRequest" ADD CONSTRAINT "ProfitRequest_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitVote" ADD CONSTRAINT "ProfitVote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProfitRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfitVote" ADD CONSTRAINT "ProfitVote_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
