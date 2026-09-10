-- AlterTable
ALTER TABLE "sys_ip_rule" ADD COLUMN     "created_by" UUID,
ADD COLUMN     "updated_by" UUID;
