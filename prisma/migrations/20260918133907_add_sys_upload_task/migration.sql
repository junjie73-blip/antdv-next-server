-- CreateTable
CREATE TABLE "sys_upload_task" (
    "task_id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "total_chunks" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error_msg" TEXT,
    "file_id" TEXT,
    "url" TEXT,
    "size" BIGINT,
    "tenant_id" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_upload_task_pkey" PRIMARY KEY ("task_id")
);

-- CreateIndex
CREATE INDEX "sys_upload_task_upload_id_idx" ON "sys_upload_task"("upload_id");

-- CreateIndex
CREATE INDEX "sys_upload_task_status_idx" ON "sys_upload_task"("status");
