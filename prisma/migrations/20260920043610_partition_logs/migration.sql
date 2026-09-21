-- DropIndex
DROP INDEX "sys_audit_log_operation_idx";

-- DropIndex
DROP INDEX "sys_audit_log_tenant_id_idx";

-- DropIndex
DROP INDEX "sys_audit_log_tenant_id_operation_idx";

-- DropIndex
DROP INDEX "sys_audit_log_user_id_idx";

-- CreateIndex
CREATE INDEX "sys_audit_log_log_id_created_at_idx" ON "sys_audit_log"("log_id", "created_at");

-- CreateIndex
CREATE INDEX "sys_audit_log_tenant_id_operation_created_at_idx" ON "sys_audit_log"("tenant_id", "operation", "created_at");
