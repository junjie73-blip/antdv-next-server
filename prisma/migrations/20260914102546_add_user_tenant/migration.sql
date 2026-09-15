-- CreateTable
CREATE TABLE "sys_user_tenant" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "is_default" SMALLINT NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_user_tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_user_tenant_user_id_idx" ON "sys_user_tenant"("user_id");

-- CreateIndex
CREATE INDEX "sys_user_tenant_tenant_id_idx" ON "sys_user_tenant"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_tenant_user_id_tenant_id_key" ON "sys_user_tenant"("user_id", "tenant_id");
