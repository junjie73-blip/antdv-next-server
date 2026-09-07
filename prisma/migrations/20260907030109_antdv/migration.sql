-- AlterTable
ALTER TABLE "sys_menu" ALTER COLUMN "parent_id" DROP NOT NULL,
ALTER COLUMN "parent_id" DROP DEFAULT;
