-- AlterTable
ALTER TABLE "sys_dept" ALTER COLUMN "parent_id" SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- AlterTable
ALTER TABLE "sys_menu" ALTER COLUMN "parent_id" SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- CreateTable
CREATE TABLE "sys_file" (
    "file_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "filename" VARCHAR(256) NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "size" INTEGER NOT NULL,
    "mime_type" VARCHAR(128),
    "uploader" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_file_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "sys_login_log" (
    "log_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "username" VARCHAR(64) NOT NULL,
    "ip_address" VARCHAR(64) NOT NULL,
    "user_agent" VARCHAR(512),
    "status" SMALLINT NOT NULL DEFAULT 1,
    "message" VARCHAR(256),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_login_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "sys_config" (
    "config_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "config_key" VARCHAR(128) NOT NULL,
    "config_value" TEXT,
    "description" VARCHAR(512),
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sys_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateIndex
CREATE INDEX "sys_file_tenant_id_idx" ON "sys_file"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_login_log_tenant_id_idx" ON "sys_login_log"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_login_log_user_id_idx" ON "sys_login_log"("user_id");

-- CreateIndex
CREATE INDEX "sys_login_log_created_at_idx" ON "sys_login_log"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sys_config_tenant_id_config_key_key" ON "sys_config"("tenant_id", "config_key");
