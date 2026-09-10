-- CreateTable
CREATE TABLE "sys_job" (
    "job_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "job_name" VARCHAR(128) NOT NULL,
    "job_group" VARCHAR(64) NOT NULL,
    "invoke_target" VARCHAR(256) NOT NULL,
    "cron_expression" VARCHAR(64) NOT NULL,
    "misfire_policy" INTEGER NOT NULL DEFAULT 3,
    "concurrent" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_job_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "sys_job_log" (
    "log_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "job_name" VARCHAR(128) NOT NULL,
    "invoke_target" VARCHAR(256) NOT NULL,
    "job_message" VARCHAR(512),
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "exception_info" TEXT,
    "create_time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_job_log_pkey" PRIMARY KEY ("log_id")
);
