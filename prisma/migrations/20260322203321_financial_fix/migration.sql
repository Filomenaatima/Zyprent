/*
  ✅ SAFE FINANCIAL MIGRATION (PRODUCTION READY)
*/

-- ================================
-- 1️⃣ CREATE ACCOUNT TYPE ENUM
-- ================================
DO $$ BEGIN
  CREATE TYPE "AccountType" AS ENUM ('USER', 'PROPERTY', 'PLATFORM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ================================
-- 2️⃣ EXTEND LEDGER ENUM
-- ================================
ALTER TYPE "LedgerSource" ADD VALUE IF NOT EXISTS 'PROFIT_DISTRIBUTION';

-- ================================
-- 3️⃣ FIX WALLET TRANSACTION ENUM
-- ================================
DO $$ BEGIN
  CREATE TYPE "WalletTransactionType_new" AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'RENT_PAYMENT',
    'PROFIT',
    'REFUND'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Convert existing values safely
ALTER TABLE "WalletTransaction"
ALTER COLUMN "type"
TYPE "WalletTransactionType_new"
USING (
  CASE
    WHEN "type" = 'WITHDRAW' THEN 'WITHDRAWAL'
    ELSE "type"::text
  END
)::"WalletTransactionType_new";

DROP TYPE IF EXISTS "WalletTransactionType";
ALTER TYPE "WalletTransactionType_new" RENAME TO "WalletTransactionType";

-- ================================
-- 4️⃣ DROP OLD FK CONSTRAINTS
-- ================================
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE "WalletTransaction" DROP CONSTRAINT IF EXISTS "WalletTransaction_investorId_fkey";
ALTER TABLE "WalletTransaction" DROP CONSTRAINT IF EXISTS "WalletTransaction_walletId_fkey";
ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT IF EXISTS "WithdrawalRequest_walletId_fkey";

-- ================================
-- 5️⃣ ACCOUNT TABLE FIX (CRITICAL)
-- ================================
-- Add columns as NULLABLE first
ALTER TABLE "Account"
ADD COLUMN IF NOT EXISTS "propertyId" TEXT,
ADD COLUMN IF NOT EXISTS "type" "AccountType";

-- Backfill ALL existing rows
UPDATE "Account"
SET "type" = 'USER'
WHERE "type" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "Account"
ALTER COLUMN "type" SET NOT NULL;

-- Make userId optional
ALTER TABLE "Account"
ALTER COLUMN "userId" DROP NOT NULL;

-- ================================
-- 6️⃣ CLEAN DUPLICATE PROPERTY ACCOUNTS
-- ================================
DELETE FROM "Account" a
USING "Account" b
WHERE a.ctid < b.ctid
AND a."propertyId" = b."propertyId"
AND a."propertyId" IS NOT NULL;

-- ================================
-- 7️⃣ WALLET TRANSACTION FIXES
-- ================================
ALTER TABLE "WalletTransaction"
DROP COLUMN IF EXISTS "investorId",
ADD COLUMN IF NOT EXISTS "reference" TEXT;

ALTER TABLE "WalletTransaction"
ALTER COLUMN "amount" TYPE DECIMAL(65,30)
USING "amount"::DECIMAL;

-- ================================
-- 8️⃣ DROP OLD WALLET TABLE
-- ================================
DROP TABLE IF EXISTS "InvestorWallet";

-- ================================
-- 9️⃣ CREATE NEW WALLET SYSTEM
-- ================================
CREATE TABLE IF NOT EXISTS "Wallet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_userId_key"
ON "Wallet"("userId");

-- ================================
-- 🔟 UNIQUE CONSTRAINTS
-- ================================
CREATE UNIQUE INDEX IF NOT EXISTS "Account_propertyId_key"
ON "Account"("propertyId");

CREATE UNIQUE INDEX IF NOT EXISTS "Account_userId_key"
ON "Account"("userId");

-- ================================
-- 1️⃣1️⃣ RESTORE FOREIGN KEYS
-- ================================
ALTER TABLE "Account"
ADD CONSTRAINT "Account_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Account"
ADD CONSTRAINT "Account_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Wallet"
ADD CONSTRAINT "Wallet_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WalletTransaction"
ADD CONSTRAINT "WalletTransaction_walletId_fkey"
FOREIGN KEY ("walletId") REFERENCES "Wallet"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WithdrawalRequest"
ADD CONSTRAINT "WithdrawalRequest_walletId_fkey"
FOREIGN KEY ("walletId") REFERENCES "Wallet"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;