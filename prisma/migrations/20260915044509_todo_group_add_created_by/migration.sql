-- AlterTable
ALTER TABLE "sys_todo_group" ADD COLUMN     "created_by" UUID,
ADD COLUMN     "updated_by" UUID;

-- CreateIndex
CREATE INDEX "sys_audit_log_tenant_id_created_at_idx" ON "sys_audit_log"("tenant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "sys_audit_log_tenant_id_user_id_created_at_idx" ON "sys_audit_log"("tenant_id", "user_id", "created_at");

-- CreateIndex
CREATE INDEX "sys_audit_log_tenant_id_operation_idx" ON "sys_audit_log"("tenant_id", "operation");
