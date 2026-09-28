/*
  Warnings:

  - You are about to drop the column `sys_approval_requestRequest_id` on the `sys_approval_log` table. All the data in the column will be lost.
  - You are about to drop the column `sys_approval_requestRequest_id` on the `sys_approval_node` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sys_approval_log" DROP CONSTRAINT "sys_approval_log_sys_approval_requestRequest_id_fkey";

-- DropForeignKey
ALTER TABLE "sys_approval_node" DROP CONSTRAINT "sys_approval_node_sys_approval_requestRequest_id_fkey";

-- AlterTable
ALTER TABLE "sys_approval_log" DROP COLUMN "sys_approval_requestRequest_id";

-- AlterTable
ALTER TABLE "sys_approval_node" DROP COLUMN "sys_approval_requestRequest_id",
ADD COLUMN     "created_by" UUID;

-- AddForeignKey
ALTER TABLE "sys_approval_node" ADD CONSTRAINT "sys_approval_node_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "sys_approval_request"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_approval_log" ADD CONSTRAINT "sys_approval_log_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "sys_approval_request"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;
