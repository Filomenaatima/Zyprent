-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExpenseCategory_new" AS ENUM (
  'MAINTENANCE',
  'UTILITIES',
  'SECURITY',
  'CLEANING',
  'STAFF',
  'REPAIRS',
  'TAX',
  'INSURANCE',
  'MARKETING',
  'LEGAL',
  'SUPPLIES',
  'OTHER'
);

-- AlterTable Property
ALTER TABLE "Property"
ADD COLUMN IF NOT EXISTS "expenseApprovalThreshold" DOUBLE PRECISION NOT NULL DEFAULT 200000,
ADD COLUMN IF NOT EXISTS "autoApproveSmallExpenses" BOOLEAN NOT NULL DEFAULT true;

-- Add all new Expense columns first
ALTER TABLE "Expense"
ADD COLUMN IF NOT EXISTS "unitId" TEXT,
ADD COLUMN IF NOT EXISTS "maintenanceRequestId" TEXT,
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'UGX',
ADD COLUMN IF NOT EXISTS "vendorName" TEXT,
ADD COLUMN IF NOT EXISTS "receiptUrl" TEXT,
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "paymentReference" TEXT,
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
ADD COLUMN IF NOT EXISTS "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS "isAboveApprovalThreshold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "autoApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "expenseDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "createdById" TEXT,
ADD COLUMN IF NOT EXISTS "reviewedById" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill expenseDate from old incurredAt
UPDATE "Expense"
SET "expenseDate" = COALESCE("expenseDate", "incurredAt");

-- Backfill createdById from property's manager first, then owner
UPDATE "Expense" e
SET "createdById" = COALESCE(p."managerId", p."ownerId")
FROM "Property" p
WHERE e."propertyId" = p."id"
  AND e."createdById" IS NULL;

-- Backfill updatedAt
UPDATE "Expense"
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);

-- Convert old string category to enum safely
ALTER TABLE "Expense" ADD COLUMN "category_new" "ExpenseCategory_new";

UPDATE "Expense"
SET "category_new" = CASE UPPER(TRIM("category"))
  WHEN 'MAINTENANCE' THEN 'MAINTENANCE'::"ExpenseCategory_new"
  WHEN 'UTILITIES' THEN 'UTILITIES'::"ExpenseCategory_new"
  WHEN 'SECURITY' THEN 'SECURITY'::"ExpenseCategory_new"
  WHEN 'CLEANING' THEN 'CLEANING'::"ExpenseCategory_new"
  WHEN 'STAFF' THEN 'STAFF'::"ExpenseCategory_new"
  WHEN 'REPAIRS' THEN 'REPAIRS'::"ExpenseCategory_new"
  WHEN 'TAX' THEN 'TAX'::"ExpenseCategory_new"
  WHEN 'INSURANCE' THEN 'INSURANCE'::"ExpenseCategory_new"
  WHEN 'MARKETING' THEN 'MARKETING'::"ExpenseCategory_new"
  WHEN 'LEGAL' THEN 'LEGAL'::"ExpenseCategory_new"
  WHEN 'SUPPLIES' THEN 'SUPPLIES'::"ExpenseCategory_new"
  ELSE 'OTHER'::"ExpenseCategory_new"
END;

-- Compute threshold flags and initial statuses from property settings
UPDATE "Expense" e
SET
  "isAboveApprovalThreshold" = e."amount" > COALESCE(p."expenseApprovalThreshold", 200000),
  "autoApproved" = CASE
    WHEN COALESCE(p."autoApproveSmallExpenses", true) = true
         AND e."amount" <= COALESCE(p."expenseApprovalThreshold", 200000)
    THEN true
    ELSE false
  END,
  "status" = CASE
    WHEN COALESCE(p."autoApproveSmallExpenses", true) = true
         AND e."amount" <= COALESCE(p."expenseApprovalThreshold", 200000)
    THEN 'APPROVED'::"ExpenseStatus"
    ELSE 'SUBMITTED'::"ExpenseStatus"
  END
FROM "Property" p
WHERE e."propertyId" = p."id";

-- Ensure required backfills are complete
UPDATE "Expense"
SET "expenseDate" = COALESCE("expenseDate", "createdAt", CURRENT_TIMESTAMP)
WHERE "expenseDate" IS NULL;

-- Replace old category column
ALTER TABLE "Expense" DROP COLUMN "category";
ALTER TABLE "Expense" RENAME COLUMN "category_new" TO "category";
ALTER TYPE "ExpenseCategory_new" RENAME TO "ExpenseCategory";

-- Drop old incurredAt column only after data copy
ALTER TABLE "Expense" DROP COLUMN "incurredAt";

-- Enforce NOT NULL on new required fields
ALTER TABLE "Expense"
ALTER COLUMN "expenseDate" SET NOT NULL,
ALTER COLUMN "createdById" SET NOT NULL,
ALTER COLUMN "category" SET NOT NULL;

-- Foreign keys
ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_unitId_fkey"
FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_maintenanceRequestId_fkey"
FOREIGN KEY ("maintenanceRequestId") REFERENCES "MaintenanceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "Expense_propertyId_idx" ON "Expense"("propertyId");
CREATE INDEX IF NOT EXISTS "Expense_unitId_idx" ON "Expense"("unitId");
CREATE INDEX IF NOT EXISTS "Expense_maintenanceRequestId_idx" ON "Expense"("maintenanceRequestId");
CREATE INDEX IF NOT EXISTS "Expense_createdById_idx" ON "Expense"("createdById");
CREATE INDEX IF NOT EXISTS "Expense_reviewedById_idx" ON "Expense"("reviewedById");
CREATE INDEX IF NOT EXISTS "Expense_status_idx" ON "Expense"("status");
CREATE INDEX IF NOT EXISTS "Expense_category_idx" ON "Expense"("category");
CREATE INDEX IF NOT EXISTS "Expense_expenseDate_idx" ON "Expense"("expenseDate");
CREATE INDEX IF NOT EXISTS "Property_ownerId_idx" ON "Property"("ownerId");
CREATE INDEX IF NOT EXISTS "Property_managerId_idx" ON "Property"("managerId");