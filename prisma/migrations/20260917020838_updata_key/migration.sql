/*
  Warnings:

  - You are about to drop the column `action` on the `sys_permission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sys_permission" DROP COLUMN "action",
ADD COLUMN     "perm_action" VARCHAR(32);
