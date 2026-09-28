-- CreateTable
CREATE TABLE "sys_approval_request" (
    "request_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "content" TEXT,
    "form_data" JSONB,
    "applicant_id" UUID NOT NULL,
    "current_dept_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT '0',
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "sys_approval_request_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "sys_approval_node" (
    "node_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "dept_id" UUID NOT NULL,
    "approver_id" UUID,
    "sequence" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT '0',
    "is_current" SMALLINT NOT NULL DEFAULT 0,
    "reject_reason" VARCHAR(512),
    "approved_at" TIMESTAMPTZ(6),
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "sys_approval_requestRequest_id" UUID,

    CONSTRAINT "sys_approval_node_pkey" PRIMARY KEY ("node_id")
);

-- CreateTable
CREATE TABLE "sys_approval_log" (
    "log_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "operator_name" VARCHAR(64) NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "from_status" VARCHAR(20),
    "to_status" VARCHAR(20),
    "remark" TEXT,
    "reason_type" VARCHAR(64),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "sys_approval_requestRequest_id" UUID,

    CONSTRAINT "sys_approval_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE INDEX "sys_approval_request_tenant_id_status_idx" ON "sys_approval_request"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sys_approval_request_tenant_id_applicant_id_idx" ON "sys_approval_request"("tenant_id", "applicant_id");

-- CreateIndex
CREATE INDEX "sys_approval_request_is_deleted_idx" ON "sys_approval_request"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_approval_node_tenant_id_request_id_idx" ON "sys_approval_node"("tenant_id", "request_id");

-- CreateIndex
CREATE INDEX "sys_approval_node_tenant_id_dept_id_status_idx" ON "sys_approval_node"("tenant_id", "dept_id", "status");

-- CreateIndex
CREATE INDEX "sys_approval_log_tenant_id_request_id_idx" ON "sys_approval_log"("tenant_id", "request_id");

-- CreateIndex
CREATE INDEX "sys_approval_log_created_at_idx" ON "sys_approval_log"("created_at");

-- AddForeignKey
ALTER TABLE "sys_approval_node" ADD CONSTRAINT "sys_approval_node_sys_approval_requestRequest_id_fkey" FOREIGN KEY ("sys_approval_requestRequest_id") REFERENCES "sys_approval_request"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_approval_log" ADD CONSTRAINT "sys_approval_log_sys_approval_requestRequest_id_fkey" FOREIGN KEY ("sys_approval_requestRequest_id") REFERENCES "sys_approval_request"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;
