/*
  Warnings:

  - Added the required column `tenantId` to the `user_roles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_roles" ADD COLUMN     "tenantId" TEXT NOT NULL;
