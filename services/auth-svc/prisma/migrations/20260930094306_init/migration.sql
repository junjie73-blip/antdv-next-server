-- CreateTable
CREATE TABLE "sys_user" (
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "status" CHAR(1) NOT NULL DEFAULT '1',
    "is_deleted" INTEGER NOT NULL DEFAULT 0,
    "must_change_password" INTEGER NOT NULL DEFAULT 0,
    "password_changed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_effective" TIMESTAMP(3),
    "last_login_ip" VARCHAR(64),
    "last_login_time" TIMESTAMP(3),

    CONSTRAINT "sys_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "sys_role" (
    "role_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role_code" VARCHAR(64) NOT NULL,
    "role_name" VARCHAR(128) NOT NULL,
    "data_scope" VARCHAR(8) NOT NULL DEFAULT '1',
    "status" CHAR(1) NOT NULL DEFAULT '1',
    "is_deleted" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sys_role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "sys_permission" (
    "perm_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "perm_code" VARCHAR(128) NOT NULL,
    "perm_name" VARCHAR(128) NOT NULL,
    "resource_type" VARCHAR(32) NOT NULL,
    "perm_action" VARCHAR(32),
    "status" CHAR(1) NOT NULL DEFAULT '1',
    "is_deleted" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_permission_pkey" PRIMARY KEY ("perm_id")
);

-- CreateTable
CREATE TABLE "sys_user_role" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,

    CONSTRAINT "sys_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_role_permission" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "perm_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,

    CONSTRAINT "sys_role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sys_user_tenant_id_username_idx" ON "sys_user"("tenant_id", "username");

-- CreateIndex
CREATE INDEX "sys_user_tenant_id_is_deleted_idx" ON "sys_user"("tenant_id", "is_deleted");

-- CreateIndex
CREATE INDEX "sys_role_tenant_id_is_deleted_idx" ON "sys_role"("tenant_id", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_tenant_id_role_code_key" ON "sys_role"("tenant_id", "role_code");

-- CreateIndex
CREATE INDEX "sys_permission_tenant_id_is_deleted_idx" ON "sys_permission"("tenant_id", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "sys_permission_tenant_id_perm_code_key" ON "sys_permission"("tenant_id", "perm_code");

-- CreateIndex
CREATE INDEX "sys_user_role_tenant_id_idx" ON "sys_user_role"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_role_user_id_role_id_key" ON "sys_user_role"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "sys_role_permission_tenant_id_idx" ON "sys_role_permission"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_permission_role_id_perm_id_key" ON "sys_role_permission"("role_id", "perm_id");

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_perm_id_fkey" FOREIGN KEY ("perm_id") REFERENCES "sys_permission"("perm_id") ON DELETE CASCADE ON UPDATE CASCADE;
