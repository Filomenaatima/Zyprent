/*
  Warnings:

  - You are about to drop the column `email` on the `ServiceProvider` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ServiceProvider` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `ServiceProvider` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `ServiceProvider` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `ServiceProvider` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ServiceProvider_phone_key";

-- AlterTable
ALTER TABLE "ServiceProvider" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProvider_userId_key" ON "ServiceProvider"("userId");

-- AddForeignKey
ALTER TABLE "ServiceProvider" ADD CONSTRAINT "ServiceProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
