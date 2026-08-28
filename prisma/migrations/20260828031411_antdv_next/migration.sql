/*
  Warnings:

  - You are about to drop the column `tenantId` on the `user_roles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username,tenantId,deletedAt]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "users_email_tenantId_deletedAt_key";

-- AlterTable
ALTER TABLE "user_roles" DROP COLUMN "tenantId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "users_email_tenantId_idx" ON "users"("email", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_tenantId_deletedAt_key" ON "users"("username", "tenantId", "deletedAt");
