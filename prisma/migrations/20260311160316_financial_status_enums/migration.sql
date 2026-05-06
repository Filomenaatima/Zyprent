-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

---------------------------------------------------
-- Fix WalletTransaction.status
---------------------------------------------------

ALTER TABLE "WalletTransaction"
ALTER COLUMN "status" TYPE "WalletTransactionStatus"
USING "status"::text::"WalletTransactionStatus";

---------------------------------------------------
-- Fix Payout.status (table empty so safe)
---------------------------------------------------

ALTER TABLE "Payout"
ALTER COLUMN "status" TYPE "PayoutStatus"
USING "status"::text::"PayoutStatus";

---------------------------------------------------
-- Fix WithdrawalRequest.status
---------------------------------------------------

-- Remove old default first
ALTER TABLE "WithdrawalRequest"
ALTER COLUMN "status" DROP DEFAULT;

-- Convert to enum
ALTER TABLE "WithdrawalRequest"
ALTER COLUMN "status" TYPE "WithdrawalStatus"
USING "status"::text::"WithdrawalStatus";

-- Add enum default
ALTER TABLE "WithdrawalRequest"
ALTER COLUMN "status" SET DEFAULT 'PENDING';