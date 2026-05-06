-- CreateEnum
CREATE TYPE "InvestmentSource" AS ENUM ('ADMIN', 'PLATFORM');

-- DropForeignKey
ALTER TABLE "InvestorShare" DROP CONSTRAINT "InvestorShare_offerId_fkey";

-- AlterTable
ALTER TABLE "InvestorShare" ADD COLUMN     "source" "InvestmentSource" NOT NULL DEFAULT 'ADMIN',
ALTER COLUMN "offerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "InvestorShare" ADD CONSTRAINT "InvestorShare_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "InvestmentOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
