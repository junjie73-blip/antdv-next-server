-- AlterTable
ALTER TABLE "sys_user" ADD COLUMN     "must_change_password" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "password_changed_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "sys_password_history" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "password" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_password_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_password_history_tenant_id_user_id_created_at_idx" ON "sys_password_history"("tenant_id", "user_id", "created_at");
