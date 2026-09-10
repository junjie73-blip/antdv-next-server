/*
  Warnings:

  - You are about to alter the column `misfire_policy` on the `sys_job` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `concurrent` on the `sys_job` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to drop the column `create_time` on the `sys_job_log` table. All the data in the column will be lost.
  - You are about to drop the `sys_todo` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "sys_job" ADD COLUMN     "created_by" UUID,
ADD COLUMN     "remark" VARCHAR(512),
ADD COLUMN     "updated_by" UUID,
ALTER COLUMN "job_group" SET DEFAULT 'DEFAULT',
ALTER COLUMN "misfire_policy" SET DATA TYPE SMALLINT,
ALTER COLUMN "concurrent" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "sys_job_log" DROP COLUMN "create_time",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "sys_todo";

-- CreateTable
CREATE TABLE "sys_role_dept" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "dept_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_role_dept_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_role_dept_tenant_id_idx" ON "sys_role_dept"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_dept_role_id_dept_id_key" ON "sys_role_dept"("role_id", "dept_id");

-- CreateIndex
CREATE INDEX "sys_job_tenant_id_idx" ON "sys_job"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_job_log_job_id_idx" ON "sys_job_log"("job_id");

-- CreateIndex
CREATE INDEX "sys_job_log_created_at_idx" ON "sys_job_log"("created_at");
