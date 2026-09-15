-- AlterTable
ALTER TABLE "sys_notice" ADD COLUMN     "is_top" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "priority" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "revoked_at" TIMESTAMPTZ(6),
ADD COLUMN     "revoked_by" UUID;

-- AlterTable
ALTER TABLE "sys_notice_user" ADD COLUMN     "is_deleted" SMALLINT NOT NULL DEFAULT 0;
