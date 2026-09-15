-- AlterTable
ALTER TABLE "sys_todo" ADD COLUMN     "group_id" UUID,
ADD COLUMN     "remind_at" TIMESTAMPTZ(6),
ADD COLUMN     "reminded" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "tags" VARCHAR(256);

-- CreateTable
CREATE TABLE "sys_todo_group" (
    "group_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "color" VARCHAR(16),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_todo_group_pkey" PRIMARY KEY ("group_id")
);

-- CreateIndex
CREATE INDEX "sys_todo_group_tenant_id_user_id_idx" ON "sys_todo_group"("tenant_id", "user_id");
