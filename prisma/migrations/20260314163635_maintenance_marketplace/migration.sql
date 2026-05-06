-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "DamageSeverity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'CRITICAL');

-- AlterTable
ALTER TABLE "MaintenanceQuote" ADD COLUMN     "severity" "DamageSeverity";

-- AlterTable
ALTER TABLE "MaintenanceRequest" ADD COLUMN     "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM';
