-- CreateTable
CREATE TABLE "ShareListing" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "shares" INTEGER NOT NULL,
    "pricePerShare" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareListing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ShareListing" ADD CONSTRAINT "ShareListing_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareListing" ADD CONSTRAINT "ShareListing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
