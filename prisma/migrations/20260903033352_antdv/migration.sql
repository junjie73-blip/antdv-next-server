-- CreateTable
CREATE TABLE "sys_tenant" (
    "tenant_id" UUID NOT NULL,
    "tenant_code" VARCHAR(64) NOT NULL,
    "tenant_name" VARCHAR(128) NOT NULL,
    "contact_name" VARCHAR(64),
    "contact_phone" VARCHAR(32),
    "contact_email" VARCHAR(128),
    "status" SMALLINT NOT NULL DEFAULT 1,
    "expire_time" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_tenant_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "sys_user" (
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "password" VARCHAR(256) NOT NULL,
    "real_name" VARCHAR(64),
    "phone" VARCHAR(32),
    "email" VARCHAR(128),
    "avatar" VARCHAR(512),
    "gender" SMALLINT,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "last_login_ip" VARCHAR(64),
    "last_login_time" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "sys_role" (
    "role_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role_code" VARCHAR(64) NOT NULL,
    "role_name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(512),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "sys_dept" (
    "dept_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "parent_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    "dept_code" VARCHAR(64) NOT NULL,
    "dept_name" VARCHAR(128) NOT NULL,
    "leader" VARCHAR(64),
    "phone" VARCHAR(32),
    "email" VARCHAR(128),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_dept_pkey" PRIMARY KEY ("dept_id")
);

-- CreateTable
CREATE TABLE "sys_menu" (
    "menu_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "parent_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    "menu_name" VARCHAR(128) NOT NULL,
    "menu_type" SMALLINT NOT NULL,
    "icon" VARCHAR(128),
    "path" VARCHAR(256),
    "component" VARCHAR(256),
    "permission" VARCHAR(128),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_menu_pkey" PRIMARY KEY ("menu_id")
);

-- CreateTable
CREATE TABLE "sys_permission" (
    "perm_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "perm_code" VARCHAR(128) NOT NULL,
    "perm_name" VARCHAR(128) NOT NULL,
    "resource_type" VARCHAR(32) NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "description" VARCHAR(512),
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_permission_pkey" PRIMARY KEY ("perm_id")
);

-- CreateTable
CREATE TABLE "sys_dict_type" (
    "dict_type_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "dict_code" VARCHAR(64) NOT NULL,
    "dict_name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(512),
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_dict_type_pkey" PRIMARY KEY ("dict_type_id")
);

-- CreateTable
CREATE TABLE "sys_dict_data" (
    "dict_data_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "dict_type_id" UUID NOT NULL,
    "dict_label" VARCHAR(128) NOT NULL,
    "dict_value" VARCHAR(128) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "remark" VARCHAR(512),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_dict_data_pkey" PRIMARY KEY ("dict_data_id")
);

-- CreateTable
CREATE TABLE "sys_notice" (
    "notice_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "content" TEXT,
    "notice_type" SMALLINT NOT NULL,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "publish_time" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_notice_pkey" PRIMARY KEY ("notice_id")
);

-- CreateTable
CREATE TABLE "sys_audit_log" (
    "log_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "username" VARCHAR(64),
    "operation" VARCHAR(128) NOT NULL,
    "method" VARCHAR(32) NOT NULL,
    "request_url" VARCHAR(512) NOT NULL,
    "request_params" TEXT,
    "response_data" TEXT,
    "ip_address" VARCHAR(64) NOT NULL,
    "user_agent" VARCHAR(512),
    "execute_time" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "error_msg" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_audit_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "sys_user_role" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_user_dept" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "dept_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "is_primary" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_user_dept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_role_menu" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_role_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_role_permission" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "perm_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_mfa_config" (
    "mfa_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "secret" VARCHAR(256) NOT NULL,
    "enabled" SMALLINT NOT NULL DEFAULT 0,
    "backup_codes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sys_mfa_config_pkey" PRIMARY KEY ("mfa_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_tenant_tenant_code_key" ON "sys_tenant"("tenant_code");

-- CreateIndex
CREATE INDEX "sys_tenant_tenant_code_idx" ON "sys_tenant"("tenant_code");

-- CreateIndex
CREATE INDEX "sys_tenant_is_deleted_idx" ON "sys_tenant"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_tenant_status_idx" ON "sys_tenant"("status");

-- CreateIndex
CREATE INDEX "sys_user_tenant_id_idx" ON "sys_user"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_user_is_deleted_idx" ON "sys_user"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_user_status_idx" ON "sys_user"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_tenant_id_username_key" ON "sys_user"("tenant_id", "username");

-- CreateIndex
CREATE INDEX "sys_role_tenant_id_idx" ON "sys_role"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_role_is_deleted_idx" ON "sys_role"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_role_status_idx" ON "sys_role"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_tenant_id_role_code_key" ON "sys_role"("tenant_id", "role_code");

-- CreateIndex
CREATE INDEX "sys_dept_tenant_id_parent_id_idx" ON "sys_dept"("tenant_id", "parent_id");

-- CreateIndex
CREATE INDEX "sys_dept_is_deleted_idx" ON "sys_dept"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_dept_status_idx" ON "sys_dept"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sys_dept_tenant_id_dept_code_key" ON "sys_dept"("tenant_id", "dept_code");

-- CreateIndex
CREATE INDEX "sys_menu_tenant_id_parent_id_idx" ON "sys_menu"("tenant_id", "parent_id");

-- CreateIndex
CREATE INDEX "sys_menu_is_deleted_idx" ON "sys_menu"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_menu_status_idx" ON "sys_menu"("status");

-- CreateIndex
CREATE INDEX "sys_permission_tenant_id_idx" ON "sys_permission"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_permission_is_deleted_idx" ON "sys_permission"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_permission_status_idx" ON "sys_permission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sys_permission_tenant_id_perm_code_key" ON "sys_permission"("tenant_id", "perm_code");

-- CreateIndex
CREATE INDEX "sys_dict_type_tenant_id_idx" ON "sys_dict_type"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_dict_type_is_deleted_idx" ON "sys_dict_type"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_dict_type_status_idx" ON "sys_dict_type"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sys_dict_type_tenant_id_dict_code_key" ON "sys_dict_type"("tenant_id", "dict_code");

-- CreateIndex
CREATE INDEX "sys_dict_data_tenant_id_dict_type_id_idx" ON "sys_dict_data"("tenant_id", "dict_type_id");

-- CreateIndex
CREATE INDEX "sys_dict_data_is_deleted_idx" ON "sys_dict_data"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_dict_data_status_idx" ON "sys_dict_data"("status");

-- CreateIndex
CREATE INDEX "sys_notice_tenant_id_idx" ON "sys_notice"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_notice_is_deleted_idx" ON "sys_notice"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_notice_status_idx" ON "sys_notice"("status");

-- CreateIndex
CREATE INDEX "sys_audit_log_tenant_id_idx" ON "sys_audit_log"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_audit_log_user_id_idx" ON "sys_audit_log"("user_id");

-- CreateIndex
CREATE INDEX "sys_audit_log_created_at_idx" ON "sys_audit_log"("created_at");

-- CreateIndex
CREATE INDEX "sys_audit_log_operation_idx" ON "sys_audit_log"("operation");

-- CreateIndex
CREATE INDEX "sys_user_role_tenant_id_idx" ON "sys_user_role"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_user_role_user_id_idx" ON "sys_user_role"("user_id");

-- CreateIndex
CREATE INDEX "sys_user_role_role_id_idx" ON "sys_user_role"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_role_user_id_role_id_key" ON "sys_user_role"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "sys_user_dept_tenant_id_idx" ON "sys_user_dept"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_user_dept_user_id_idx" ON "sys_user_dept"("user_id");

-- CreateIndex
CREATE INDEX "sys_user_dept_dept_id_idx" ON "sys_user_dept"("dept_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_dept_user_id_dept_id_key" ON "sys_user_dept"("user_id", "dept_id");

-- CreateIndex
CREATE INDEX "sys_role_menu_tenant_id_idx" ON "sys_role_menu"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_role_menu_role_id_idx" ON "sys_role_menu"("role_id");

-- CreateIndex
CREATE INDEX "sys_role_menu_menu_id_idx" ON "sys_role_menu"("menu_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_menu_role_id_menu_id_key" ON "sys_role_menu"("role_id", "menu_id");

-- CreateIndex
CREATE INDEX "sys_role_permission_tenant_id_idx" ON "sys_role_permission"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_role_permission_role_id_idx" ON "sys_role_permission"("role_id");

-- CreateIndex
CREATE INDEX "sys_role_permission_perm_id_idx" ON "sys_role_permission"("perm_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_permission_role_id_perm_id_key" ON "sys_role_permission"("role_id", "perm_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_mfa_config_user_id_key" ON "sys_mfa_config"("user_id");

-- CreateIndex
CREATE INDEX "sys_mfa_config_user_id_idx" ON "sys_mfa_config"("user_id");
