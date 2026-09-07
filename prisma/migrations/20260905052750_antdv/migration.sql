-- AlterTable
ALTER TABLE "sys_dept" ALTER COLUMN "parent_id" SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- AlterTable
ALTER TABLE "sys_menu" ALTER COLUMN "parent_id" SET DEFAULT '00000000-0000-0000-0000-000000000000';

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_dept" ADD CONSTRAINT "sys_user_dept_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_dept" ADD CONSTRAINT "sys_user_dept_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "sys_dept"("dept_id") ON DELETE RESTRICT ON UPDATE CASCADE;
