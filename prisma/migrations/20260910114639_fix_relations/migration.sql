/*
  Warnings:

  - You are about to drop the column `sys_roleRole_id` on the `sys_role_menu` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sys_role_menu" DROP CONSTRAINT "sys_role_menu_sys_roleRole_id_fkey";

-- DropForeignKey
ALTER TABLE "sys_user_dept" DROP CONSTRAINT "sys_user_dept_dept_id_fkey";

-- DropForeignKey
ALTER TABLE "sys_user_dept" DROP CONSTRAINT "sys_user_dept_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sys_user_role" DROP CONSTRAINT "sys_user_role_role_id_fkey";

-- DropForeignKey
ALTER TABLE "sys_user_role" DROP CONSTRAINT "sys_user_role_user_id_fkey";

-- AlterTable
ALTER TABLE "sys_permission" ALTER COLUMN "action" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sys_role" ADD COLUMN     "data_scope" VARCHAR(10) NOT NULL DEFAULT '1';

-- AlterTable
ALTER TABLE "sys_role_menu" DROP COLUMN "sys_roleRole_id";

-- CreateIndex
CREATE INDEX "sys_role_dept_role_id_idx" ON "sys_role_dept"("role_id");

-- CreateIndex
CREATE INDEX "sys_role_dept_dept_id_idx" ON "sys_role_dept"("dept_id");

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_dept" ADD CONSTRAINT "sys_user_dept_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_dept" ADD CONSTRAINT "sys_user_dept_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "sys_dept"("dept_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_menu" ADD CONSTRAINT "sys_role_menu_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_menu" ADD CONSTRAINT "sys_role_menu_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "sys_menu"("menu_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_dept" ADD CONSTRAINT "sys_role_dept_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_dept" ADD CONSTRAINT "sys_role_dept_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "sys_dept"("dept_id") ON DELETE CASCADE ON UPDATE CASCADE;
