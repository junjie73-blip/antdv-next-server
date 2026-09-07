-- AlterTable
ALTER TABLE "sys_dept" ALTER COLUMN "parent_id" SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- AlterTable
ALTER TABLE "sys_menu" ALTER COLUMN "parent_id" SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- CreateTable
CREATE TABLE "sys_notice_user" (
    "id" UUID NOT NULL,
    "notice_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "is_read" SMALLINT NOT NULL DEFAULT 0,
    "read_time" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_notice_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_notice_user_tenant_id_user_id_is_read_idx" ON "sys_notice_user"("tenant_id", "user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "sys_notice_user_notice_id_user_id_key" ON "sys_notice_user"("notice_id", "user_id");

-- AddForeignKey
ALTER TABLE "sys_notice_user" ADD CONSTRAINT "sys_notice_user_notice_id_fkey" FOREIGN KEY ("notice_id") REFERENCES "sys_notice"("notice_id") ON DELETE CASCADE ON UPDATE CASCADE;
