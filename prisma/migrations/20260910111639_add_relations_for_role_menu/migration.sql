-- AlterTable
ALTER TABLE "sys_role_menu" ADD COLUMN     "sys_roleRole_id" UUID;

-- AddForeignKey
ALTER TABLE "sys_role_menu" ADD CONSTRAINT "sys_role_menu_sys_roleRole_id_fkey" FOREIGN KEY ("sys_roleRole_id") REFERENCES "sys_role"("role_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_perm_id_fkey" FOREIGN KEY ("perm_id") REFERENCES "sys_permission"("perm_id") ON DELETE CASCADE ON UPDATE CASCADE;
