-- Create ENUM type
DO $$ BEGIN
    CREATE TYPE "WalletTransactionType" AS ENUM ('PROFIT', 'WITHDRAW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Convert existing column to ENUM safely
ALTER TABLE "WalletTransaction"
ALTER COLUMN "type"
TYPE "WalletTransactionType"
USING "type"::"WalletTransactionType";