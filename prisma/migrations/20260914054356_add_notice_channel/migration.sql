-- CreateTable
CREATE TABLE "sys_notice_channel" (
    "channel_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "channel_type" VARCHAR(32) NOT NULL,
    "enabled" SMALLINT NOT NULL DEFAULT 0,
    "config" TEXT,
    "remark" VARCHAR(256),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_notice_channel_pkey" PRIMARY KEY ("channel_id")
);

-- CreateTable
CREATE TABLE "sys_notice_send_log" (
    "log_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "notice_id" UUID,
    "channel_type" VARCHAR(32) NOT NULL,
    "receiver" VARCHAR(256) NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "error_msg" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_notice_send_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE INDEX "sys_notice_channel_tenant_id_idx" ON "sys_notice_channel"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_notice_channel_tenant_id_channel_type_key" ON "sys_notice_channel"("tenant_id", "channel_type");

-- CreateIndex
CREATE INDEX "sys_notice_send_log_tenant_id_channel_type_idx" ON "sys_notice_send_log"("tenant_id", "channel_type");

-- CreateIndex
CREATE INDEX "sys_notice_send_log_notice_id_idx" ON "sys_notice_send_log"("notice_id");

-- CreateIndex
CREATE INDEX "sys_notice_send_log_created_at_idx" ON "sys_notice_send_log"("created_at");
