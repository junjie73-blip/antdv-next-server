/*
  Warnings:

  - A unique constraint covering the columns `[notice_id,user_id,is_deleted]` on the table `sys_notice_user` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "sys_notice_user_notice_id_user_id_key";

-- AlterTable
ALTER TABLE "sys_audit_log" ADD COLUMN     "created_by" UUID;

-- AlterTable
ALTER TABLE "sys_file" ADD COLUMN     "created_by" UUID,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_by" UUID;

-- AlterTable
ALTER TABLE "sys_job_log" ADD COLUMN     "created_by" UUID;

-- AlterTable
ALTER TABLE "sys_login_log" ADD COLUMN     "created_by" UUID;

-- AlterTable
ALTER TABLE "sys_mfa_config" ADD COLUMN     "created_by" UUID;

-- AlterTable
ALTER TABLE "sys_notice_send_log" ADD COLUMN     "created_by" UUID;

-- AlterTable
ALTER TABLE "sys_notice_user" ADD COLUMN     "created_by" UUID,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_by" UUID;

-- AlterTable
ALTER TABLE "sys_password_history" ADD COLUMN     "created_by" UUID;

-- AlterTable
ALTER TABLE "sys_role_dept" ADD COLUMN     "created_by" UUID;

-- AlterTable
ALTER TABLE "sys_role_menu" ADD COLUMN     "created_by" UUID;

-- AlterTable
ALTER TABLE "sys_role_permission" ADD COLUMN     "created_by" UUID;

-- AlterTable
ALTER TABLE "sys_user_dept" ADD COLUMN     "created_by" UUID;

-- AlterTable
ALTER TABLE "sys_user_role" ADD COLUMN     "created_by" UUID;

-- AlterTable
ALTER TABLE "sys_user_tenant" ADD COLUMN     "created_by" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "sys_notice_user_notice_id_user_id_is_deleted_key" ON "sys_notice_user"("notice_id", "user_id", "is_deleted");
