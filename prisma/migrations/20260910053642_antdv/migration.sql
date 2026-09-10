-- CreateTable
CREATE TABLE "sys_ip_rule" (
    "rule_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "rule_type" VARCHAR(10) NOT NULL,
    "ip_pattern" VARCHAR(64) NOT NULL,
    "remark" VARCHAR(256),
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_ip_rule_pkey" PRIMARY KEY ("rule_id")
);

-- CreateIndex
CREATE INDEX "sys_ip_rule_tenant_id_rule_type_idx" ON "sys_ip_rule"("tenant_id", "rule_type");
