-- DropIndex
DROP INDEX "sys_dept_tenant_id_parent_id_idx";

-- DropIndex
DROP INDEX "sys_menu_tenant_id_parent_id_idx";

-- CreateIndex
CREATE INDEX "sys_dept_tenant_id_idx" ON "sys_dept"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_menu_tenant_id_idx" ON "sys_menu"("tenant_id");
