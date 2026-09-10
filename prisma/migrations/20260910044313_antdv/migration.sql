-- CreateTable
CREATE TABLE "sys_todo" (
    "todo_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "content" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "due_time" TIMESTAMPTZ(6),
    "status" VARCHAR(10) NOT NULL DEFAULT '0',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_todo_pkey" PRIMARY KEY ("todo_id")
);
