-- CreateTable
CREATE TABLE "sys_audit_daily" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "stat_date" DATE NOT NULL,
    "operation" VARCHAR(128) NOT NULL,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "avg_time_ms" INTEGER NOT NULL DEFAULT 0,
    "p95_time_ms" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sys_audit_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_login_daily" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "stat_date" DATE NOT NULL,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "unique_users" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sys_login_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_audit_daily_tenant_id_stat_date_idx" ON "sys_audit_daily"("tenant_id", "stat_date");

-- CreateIndex
CREATE UNIQUE INDEX "sys_audit_daily_tenant_id_stat_date_operation_key" ON "sys_audit_daily"("tenant_id", "stat_date", "operation");

-- CreateIndex
CREATE UNIQUE INDEX "sys_login_daily_tenant_id_stat_date_key" ON "sys_login_daily"("tenant_id", "stat_date");
