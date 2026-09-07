-- AlterTable
ALTER TABLE "sys_config" ADD COLUMN     "is_deleted" SMALLINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sys_dept" ALTER COLUMN "parent_id" SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- AlterTable
ALTER TABLE "sys_menu" ALTER COLUMN "parent_id" SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- CreateIndex
CREATE INDEX "sys_config_tenant_id_idx" ON "sys_config"("tenant_id");
