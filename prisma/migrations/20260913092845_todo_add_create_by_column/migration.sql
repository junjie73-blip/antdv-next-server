-- AlterTable
ALTER TABLE "sys_todo" ADD COLUMN     "created_by" UUID,
ADD COLUMN     "updated_by" UUID;
