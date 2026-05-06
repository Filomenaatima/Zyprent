-- CreateEnum
CREATE TYPE "ProviderSource" AS ENUM ('PLATFORM', 'MANAGER');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SERVICE_PROVIDER';

-- AlterTable
ALTER TABLE "ServiceProvider" ADD COLUMN     "source" "ProviderSource" NOT NULL DEFAULT 'PLATFORM';
