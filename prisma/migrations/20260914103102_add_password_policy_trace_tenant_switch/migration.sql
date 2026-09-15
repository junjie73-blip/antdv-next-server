-- AlterTable
ALTER TABLE "sys_job" ADD COLUMN     "is_paused" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "last_run_at" TIMESTAMPTZ(6),
ADD COLUMN     "next_run_at" TIMESTAMPTZ(6),
ADD COLUMN     "retry_count" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "retry_interval" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "timeout_seconds" INTEGER NOT NULL DEFAULT 300;

-- AlterTable
ALTER TABLE "sys_job_log" ADD COLUMN     "duration_ms" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "retry_attempt" SMALLINT NOT NULL DEFAULT 0;
