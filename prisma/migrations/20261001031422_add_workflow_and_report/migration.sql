-- CreateTable
CREATE TABLE "sys_tenant" (
    "tenant_id" UUID NOT NULL,
    "tenant_code" VARCHAR(64) NOT NULL,
    "tenant_name" VARCHAR(128) NOT NULL,
    "contact_name" VARCHAR(64),
    "contact_phone" VARCHAR(32),
    "contact_email" VARCHAR(128),
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
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
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "last_login_ip" VARCHAR(64),
    "last_login_time" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "password_changed_at" TIMESTAMPTZ(6),
    "must_change_password" SMALLINT NOT NULL DEFAULT 0,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "id_card" VARCHAR(18),
    "phone_enc" TEXT,
    "phone_hash" VARCHAR(64),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancel_reason" VARCHAR(512),
    "cancel_effective" TIMESTAMPTZ(6),
    "id_card_enc" TEXT,
    "id_card_hash" VARCHAR(64),
    "email_verified" SMALLINT NOT NULL DEFAULT 0,
    "email_verified_at" TIMESTAMPTZ(6),

    CONSTRAINT "sys_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "sys_verify_code" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "target" VARCHAR(128) NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "scene" VARCHAR(32) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "sys_verify_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_role" (
    "role_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role_code" VARCHAR(64) NOT NULL,
    "role_name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(512),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "data_scope" VARCHAR(10) NOT NULL DEFAULT '1',
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
    "parent_id" UUID,
    "dept_code" VARCHAR(64) NOT NULL,
    "dept_name" VARCHAR(128) NOT NULL,
    "leader" VARCHAR(64),
    "leader_id" UUID,
    "phone" VARCHAR(32),
    "email" VARCHAR(128),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
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
    "parent_id" UUID,
    "menu_name" VARCHAR(128) NOT NULL,
    "menu_type" SMALLINT NOT NULL,
    "icon" VARCHAR(128),
    "path" VARCHAR(256),
    "component" VARCHAR(256),
    "permission" VARCHAR(128),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "is_platform" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "micro_app" JSONB,
    "is_external" BOOLEAN NOT NULL DEFAULT false,
    "layout" VARCHAR(20),
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "keep_alive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sys_menu_pkey" PRIMARY KEY ("menu_id")
);

-- CreateTable
CREATE TABLE "sys_permission" (
    "perm_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "perm_code" VARCHAR(128) NOT NULL,
    "perm_name" VARCHAR(128) NOT NULL,
    "resource_type" VARCHAR(32) NOT NULL,
    "perm_action" VARCHAR(32),
    "description" VARCHAR(512),
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
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
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
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
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
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
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "publish_time" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "template_id" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "is_top" SMALLINT NOT NULL DEFAULT 0,
    "send_status" VARCHAR(1) DEFAULT '0',
    "send_time" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_by" UUID,

    CONSTRAINT "sys_notice_pkey" PRIMARY KEY ("notice_id")
);

-- CreateTable
CREATE TABLE "sys_notice_user" (
    "id" UUID NOT NULL,
    "notice_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "is_read" SMALLINT NOT NULL DEFAULT 0,
    "read_time" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "sys_notice_user_pkey" PRIMARY KEY ("id")
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
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "error_msg" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "metadata" JSONB,

    CONSTRAINT "sys_audit_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "sys_user_role" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

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
    "created_by" UUID,

    CONSTRAINT "sys_user_dept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_role_menu" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "sys_role_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_role_permission" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "perm_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "sys_role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_role_dept" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "dept_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "sys_role_dept_pkey" PRIMARY KEY ("id")
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
    "created_by" UUID,

    CONSTRAINT "sys_mfa_config_pkey" PRIMARY KEY ("mfa_id")
);

-- CreateTable
CREATE TABLE "sys_file" (
    "file_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "filename" VARCHAR(256) NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "size" INTEGER NOT NULL,
    "mime_type" VARCHAR(128),
    "uploader" UUID,
    "category" TEXT NOT NULL DEFAULT 'other',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "md5" VARCHAR(32),

    CONSTRAINT "sys_file_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "sys_login_log" (
    "log_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "username" VARCHAR(64) NOT NULL,
    "ip_address" VARCHAR(64) NOT NULL,
    "user_agent" VARCHAR(512),
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "message" VARCHAR(256),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "sys_login_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "sys_config" (
    "config_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "config_key" VARCHAR(128) NOT NULL,
    "config_value" TEXT,
    "description" VARCHAR(512),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_config_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "sys_job" (
    "job_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "job_name" VARCHAR(128) NOT NULL,
    "job_group" VARCHAR(64) NOT NULL DEFAULT 'DEFAULT',
    "invoke_target" VARCHAR(256) NOT NULL,
    "cron_expression" VARCHAR(64) NOT NULL,
    "misfire_policy" SMALLINT NOT NULL DEFAULT 3,
    "concurrent" SMALLINT NOT NULL DEFAULT 1,
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "remark" VARCHAR(512),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "retry_count" SMALLINT NOT NULL DEFAULT 0,
    "retry_interval" INTEGER NOT NULL DEFAULT 60,
    "timeout_seconds" INTEGER NOT NULL DEFAULT 300,
    "is_paused" SMALLINT NOT NULL DEFAULT 0,
    "last_run_at" TIMESTAMPTZ(6),
    "next_run_at" TIMESTAMPTZ(6),
    "alert_enabled" SMALLINT NOT NULL DEFAULT 0,
    "alert_channels" VARCHAR(128),
    "alert_receivers" VARCHAR(512),
    "alert_threshold" SMALLINT NOT NULL DEFAULT 3,
    "fail_count" SMALLINT NOT NULL DEFAULT 0,
    "dependency_job_ids" JSONB,
    "dependency_mode" VARCHAR(8) DEFAULT 'all',
    "on_dependency_fail" VARCHAR(16) DEFAULT 'skip',
    "run_after_success" BOOLEAN NOT NULL DEFAULT true,

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
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retry_attempt" SMALLINT NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,

    CONSTRAINT "sys_job_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "sys_job_run" (
    "run_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "triggered_by" VARCHAR(32) NOT NULL,
    "trigger_parent" UUID,
    "status" VARCHAR(16) NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ,
    "duration_ms" INTEGER,
    "error_msg" TEXT,

    CONSTRAINT "sys_job_run_pkey" PRIMARY KEY ("run_id")
);

-- CreateTable
CREATE TABLE "sys_todo" (
    "todo_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "content" TEXT,
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "due_time" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "status" VARCHAR(10) NOT NULL DEFAULT '0',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "group_id" UUID,
    "remind_at" TIMESTAMPTZ(6),
    "reminded" SMALLINT NOT NULL DEFAULT 0,
    "tags" VARCHAR(256),

    CONSTRAINT "sys_todo_pkey" PRIMARY KEY ("todo_id")
);

-- CreateTable
CREATE TABLE "sys_ip_rule" (
    "rule_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "rule_type" VARCHAR(10) NOT NULL,
    "ip_pattern" VARCHAR(64) NOT NULL,
    "remark" VARCHAR(256),
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_ip_rule_pkey" PRIMARY KEY ("rule_id")
);

-- CreateTable
CREATE TABLE "sys_notice_channel" (
    "channel_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "channel_type" VARCHAR(32) NOT NULL,
    "enabled" SMALLINT NOT NULL DEFAULT 0,
    "config" TEXT,
    "remark" VARCHAR(256),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_notice_channel_pkey" PRIMARY KEY ("channel_id")
);

-- CreateTable
CREATE TABLE "sys_notice_send_log" (
    "log_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "notice_id" UUID,
    "channel_type" VARCHAR(32) NOT NULL,
    "receiver" VARCHAR(256) NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "error_msg" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "sys_notice_send_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "sys_password_history" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "password" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "sys_password_history_pkey" PRIMARY KEY ("id")
);

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
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "sys_todo_group_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "sys_user_tenant" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "is_default" SMALLINT NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "sys_user_tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gen_table" (
    "table_id" UUID NOT NULL,
    "table_name" VARCHAR(200) NOT NULL,
    "table_comment" VARCHAR(500),
    "class_name" VARCHAR(100) NOT NULL,
    "tpl_category" VARCHAR(20) NOT NULL DEFAULT 'crud',
    "package_name" VARCHAR(100),
    "module_name" VARCHAR(30),
    "business_name" VARCHAR(30),
    "function_name" VARCHAR(50),
    "function_author" VARCHAR(50),
    "table_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "tenant_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "gen_table_pkey" PRIMARY KEY ("table_id")
);

-- CreateTable
CREATE TABLE "gen_table_column" (
    "column_id" UUID NOT NULL,
    "table_id" UUID NOT NULL,
    "column_name" VARCHAR(200) NOT NULL,
    "column_comment" VARCHAR(500),
    "column_type" VARCHAR(100) NOT NULL,
    "ts_type" VARCHAR(50),
    "field_name" VARCHAR(200),
    "is_pk" CHAR(1) NOT NULL DEFAULT '0',
    "is_increment" CHAR(1) NOT NULL DEFAULT '0',
    "is_required" CHAR(1) NOT NULL DEFAULT '0',
    "is_insert" CHAR(1) NOT NULL DEFAULT '1',
    "is_edit" CHAR(1) NOT NULL DEFAULT '1',
    "is_list" CHAR(1) NOT NULL DEFAULT '1',
    "is_query" CHAR(1) NOT NULL DEFAULT '0',
    "is_sort" CHAR(1) NOT NULL DEFAULT '0',
    "query_type" VARCHAR(20) NOT NULL DEFAULT 'EQ',
    "html_type" VARCHAR(20) NOT NULL DEFAULT 'input',
    "dict_type" VARCHAR(200),
    "default_value" VARCHAR(200),
    "sort" INTEGER,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "gen_tableTable_id" UUID,

    CONSTRAINT "gen_table_column_pkey" PRIMARY KEY ("column_id")
);

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

-- CreateTable
CREATE TABLE "sys_audit_daily" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "stat_date" DATE NOT NULL,
    "operation" VARCHAR(128) NOT NULL,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "avg_time_ms" INTEGER NOT NULL DEFAULT 0,
    "p95_time_ms" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sys_audit_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_login_daily" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "stat_date" DATE NOT NULL,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "unique_users" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sys_login_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_approval_request" (
    "request_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "content" TEXT,
    "form_data" JSONB,
    "applicant_id" UUID NOT NULL,
    "current_dept_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT '0',
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "sys_approval_request_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "sys_approval_node" (
    "node_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "dept_id" UUID NOT NULL,
    "approver_id" UUID,
    "sequence" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT '0',
    "is_current" SMALLINT NOT NULL DEFAULT 0,
    "round" INTEGER NOT NULL DEFAULT 1,
    "reject_reason_type" VARCHAR(64),
    "reject_reason" VARCHAR(512),
    "approved_at" TIMESTAMPTZ(6),
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "sys_approval_node_pkey" PRIMARY KEY ("node_id")
);

-- CreateTable
CREATE TABLE "sys_approval_log" (
    "log_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "request_id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "operator_name" VARCHAR(64) NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "from_status" VARCHAR(20),
    "to_status" VARCHAR(20),
    "remark" TEXT,
    "reason_type" VARCHAR(64),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "sys_approval_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "sys_notice_template" (
    "template_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "template_code" VARCHAR(64) NOT NULL,
    "template_name" VARCHAR(128) NOT NULL,
    "channel_type" VARCHAR(32) NOT NULL,
    "title" VARCHAR(256),
    "content" TEXT NOT NULL,
    "content_format" VARCHAR(16) NOT NULL DEFAULT 'markdown',
    "remark" VARCHAR(512),
    "params" JSONB,
    "status" TEXT NOT NULL DEFAULT '1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "sys_notice_template_pkey" PRIMARY KEY ("template_id")
);

-- CreateTable
CREATE TABLE "sys_file_pending_delete" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_file_pending_delete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wf_definition" (
    "def_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "def_key" VARCHAR(64) NOT NULL,
    "def_name" VARCHAR(128) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "category" VARCHAR(64),
    "description" VARCHAR(512),
    "definition" JSONB NOT NULL,
    "form_schema" JSONB,
    "var_schema" JSONB,
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "wf_definition_pkey" PRIMARY KEY ("def_id")
);

-- CreateTable
CREATE TABLE "wf_instance" (
    "instance_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "def_id" UUID NOT NULL,
    "def_key" VARCHAR(64) NOT NULL,
    "def_version" INTEGER NOT NULL,
    "business_key" VARCHAR(128),
    "title" VARCHAR(256) NOT NULL,
    "initiator_id" UUID NOT NULL,
    "initiator_dept_id" UUID,
    "variables" JSONB NOT NULL,
    "active_nodes" JSONB NOT NULL DEFAULT '[]',
    "status" VARCHAR(20) NOT NULL DEFAULT '0',
    "start_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_at" TIMESTAMPTZ(6),
    "duration_ms" INTEGER,
    "parent_instance_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "wf_instance_pkey" PRIMARY KEY ("instance_id")
);

-- CreateTable
CREATE TABLE "wf_task" (
    "task_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "node_id" VARCHAR(64) NOT NULL,
    "node_name" VARCHAR(128) NOT NULL,
    "node_type" VARCHAR(32) NOT NULL,
    "assignee_id" UUID,
    "assignee_type" VARCHAR(32) NOT NULL,
    "candidate_ids" JSONB,
    "sign_type" VARCHAR(20),
    "sign_strategy" JSONB,
    "completed_ids" JSONB DEFAULT '[]',
    "status" VARCHAR(20) NOT NULL DEFAULT '0',
    "action" VARCHAR(32),
    "comment" TEXT,
    "form_data" JSONB,
    "due_at" TIMESTAMPTZ(6),
    "claimed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "duration_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "wf_task_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "wf_history" (
    "history_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "node_id" VARCHAR(64) NOT NULL,
    "node_name" VARCHAR(128) NOT NULL,
    "node_type" VARCHAR(32) NOT NULL,
    "event_type" VARCHAR(32) NOT NULL,
    "operator_id" UUID,
    "operator_name" VARCHAR(64),
    "comment" TEXT,
    "variables" JSONB,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wf_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateTable
CREATE TABLE "wf_variable_log" (
    "log_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "task_id" UUID,
    "key" VARCHAR(64) NOT NULL,
    "value" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "wf_variable_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "rp_dataset" (
    "dataset_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "dataset_code" VARCHAR(64) NOT NULL,
    "dataset_name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(512),
    "category" VARCHAR(64),
    "dataset_type" VARCHAR(20) NOT NULL DEFAULT 'sql',
    "source_config" JSONB NOT NULL,
    "params" JSONB,
    "fields" JSONB,
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "rp_dataset_pkey" PRIMARY KEY ("dataset_id")
);

-- CreateTable
CREATE TABLE "rp_report" (
    "report_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "report_code" VARCHAR(64) NOT NULL,
    "report_name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(512),
    "category" VARCHAR(64),
    "dataset_id" UUID NOT NULL,
    "config" JSONB,
    "params" JSONB,
    "allowed_roles" JSONB,
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "rp_report_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "rp_report_log" (
    "log_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "report_code" VARCHAR(64) NOT NULL,
    "params" JSONB,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(10) NOT NULL DEFAULT '1',
    "error_msg" TEXT,
    "export_type" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "rp_report_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "rp_report_favorite" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rp_report_favorite_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "sys_verify_code_tenant_id_target_scene_idx" ON "sys_verify_code"("tenant_id", "target", "scene");

-- CreateIndex
CREATE INDEX "sys_verify_code_expires_at_idx" ON "sys_verify_code"("expires_at");

-- CreateIndex
CREATE INDEX "sys_role_tenant_id_idx" ON "sys_role"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_role_is_deleted_idx" ON "sys_role"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_role_status_idx" ON "sys_role"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_tenant_id_role_code_key" ON "sys_role"("tenant_id", "role_code");

-- CreateIndex
CREATE INDEX "sys_dept_tenant_id_idx" ON "sys_dept"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_dept_is_deleted_idx" ON "sys_dept"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_dept_leader_id_idx" ON "sys_dept"("leader_id");

-- CreateIndex
CREATE INDEX "sys_dept_status_idx" ON "sys_dept"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sys_dept_tenant_id_dept_code_key" ON "sys_dept"("tenant_id", "dept_code");

-- CreateIndex
CREATE INDEX "sys_menu_tenant_id_idx" ON "sys_menu"("tenant_id");

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
CREATE INDEX "sys_notice_template_id_idx" ON "sys_notice"("template_id");

-- CreateIndex
CREATE INDEX "sys_notice_user_tenant_id_user_id_is_read_idx" ON "sys_notice_user"("tenant_id", "user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "sys_notice_user_notice_id_user_id_is_deleted_key" ON "sys_notice_user"("notice_id", "user_id", "is_deleted");

-- CreateIndex
CREATE INDEX "sys_audit_log_log_id_created_at_idx" ON "sys_audit_log"("log_id", "created_at");

-- CreateIndex
CREATE INDEX "sys_audit_log_tenant_id_created_at_idx" ON "sys_audit_log"("tenant_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "sys_audit_log_tenant_id_user_id_created_at_idx" ON "sys_audit_log"("tenant_id", "user_id", "created_at");

-- CreateIndex
CREATE INDEX "sys_audit_log_tenant_id_operation_created_at_idx" ON "sys_audit_log"("tenant_id", "operation", "created_at");

-- CreateIndex
CREATE INDEX "sys_audit_log_created_at_idx" ON "sys_audit_log"("created_at");

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
CREATE INDEX "sys_role_dept_tenant_id_idx" ON "sys_role_dept"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_role_dept_role_id_idx" ON "sys_role_dept"("role_id");

-- CreateIndex
CREATE INDEX "sys_role_dept_dept_id_idx" ON "sys_role_dept"("dept_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_role_dept_role_id_dept_id_key" ON "sys_role_dept"("role_id", "dept_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_mfa_config_user_id_key" ON "sys_mfa_config"("user_id");

-- CreateIndex
CREATE INDEX "sys_mfa_config_user_id_idx" ON "sys_mfa_config"("user_id");

-- CreateIndex
CREATE INDEX "sys_file_tenant_id_idx" ON "sys_file"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_login_log_tenant_id_idx" ON "sys_login_log"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_login_log_user_id_idx" ON "sys_login_log"("user_id");

-- CreateIndex
CREATE INDEX "sys_login_log_created_at_idx" ON "sys_login_log"("created_at");

-- CreateIndex
CREATE INDEX "sys_config_tenant_id_idx" ON "sys_config"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_config_tenant_id_config_key_key" ON "sys_config"("tenant_id", "config_key");

-- CreateIndex
CREATE INDEX "sys_job_tenant_id_idx" ON "sys_job"("tenant_id");

-- CreateIndex
CREATE INDEX "sys_job_log_job_id_idx" ON "sys_job_log"("job_id");

-- CreateIndex
CREATE INDEX "sys_job_log_created_at_idx" ON "sys_job_log"("created_at");

-- CreateIndex
CREATE INDEX "sys_job_run_job_id_started_at_idx" ON "sys_job_run"("job_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "sys_job_run_status_idx" ON "sys_job_run"("status");

-- CreateIndex
CREATE INDEX "sys_todo_tenant_id_user_id_idx" ON "sys_todo"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "sys_todo_status_idx" ON "sys_todo"("status");

-- CreateIndex
CREATE INDEX "sys_ip_rule_tenant_id_rule_type_idx" ON "sys_ip_rule"("tenant_id", "rule_type");

-- CreateIndex
CREATE INDEX "sys_notice_channel_tenant_id_idx" ON "sys_notice_channel"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_notice_channel_tenant_id_channel_type_key" ON "sys_notice_channel"("tenant_id", "channel_type");

-- CreateIndex
CREATE INDEX "sys_notice_send_log_tenant_id_channel_type_idx" ON "sys_notice_send_log"("tenant_id", "channel_type");

-- CreateIndex
CREATE INDEX "sys_notice_send_log_notice_id_idx" ON "sys_notice_send_log"("notice_id");

-- CreateIndex
CREATE INDEX "sys_notice_send_log_created_at_idx" ON "sys_notice_send_log"("created_at");

-- CreateIndex
CREATE INDEX "sys_password_history_tenant_id_user_id_created_at_idx" ON "sys_password_history"("tenant_id", "user_id", "created_at");

-- CreateIndex
CREATE INDEX "sys_todo_group_tenant_id_user_id_idx" ON "sys_todo_group"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "sys_user_tenant_user_id_idx" ON "sys_user_tenant"("user_id");

-- CreateIndex
CREATE INDEX "sys_user_tenant_tenant_id_idx" ON "sys_user_tenant"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_tenant_user_id_tenant_id_key" ON "sys_user_tenant"("user_id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "gen_table_table_name_key" ON "gen_table"("table_name");

-- CreateIndex
CREATE INDEX "gen_table_tenant_id_idx" ON "gen_table"("tenant_id");

-- CreateIndex
CREATE INDEX "gen_table_is_deleted_idx" ON "gen_table"("is_deleted");

-- CreateIndex
CREATE INDEX "gen_table_column_table_id_idx" ON "gen_table_column"("table_id");

-- CreateIndex
CREATE INDEX "gen_table_column_table_id_is_deleted_idx" ON "gen_table_column"("table_id", "is_deleted");

-- CreateIndex
CREATE INDEX "sys_upload_task_upload_id_idx" ON "sys_upload_task"("upload_id");

-- CreateIndex
CREATE INDEX "sys_upload_task_status_idx" ON "sys_upload_task"("status");

-- CreateIndex
CREATE INDEX "sys_audit_daily_tenant_id_stat_date_idx" ON "sys_audit_daily"("tenant_id", "stat_date");

-- CreateIndex
CREATE UNIQUE INDEX "sys_audit_daily_tenant_id_stat_date_operation_key" ON "sys_audit_daily"("tenant_id", "stat_date", "operation");

-- CreateIndex
CREATE UNIQUE INDEX "sys_login_daily_tenant_id_stat_date_key" ON "sys_login_daily"("tenant_id", "stat_date");

-- CreateIndex
CREATE INDEX "sys_approval_request_tenant_id_status_idx" ON "sys_approval_request"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "sys_approval_request_tenant_id_applicant_id_idx" ON "sys_approval_request"("tenant_id", "applicant_id");

-- CreateIndex
CREATE INDEX "sys_approval_request_is_deleted_idx" ON "sys_approval_request"("is_deleted");

-- CreateIndex
CREATE INDEX "sys_approval_node_tenant_id_request_id_idx" ON "sys_approval_node"("tenant_id", "request_id");

-- CreateIndex
CREATE INDEX "sys_approval_node_tenant_id_dept_id_status_idx" ON "sys_approval_node"("tenant_id", "dept_id", "status");

-- CreateIndex
CREATE INDEX "sys_approval_log_tenant_id_request_id_idx" ON "sys_approval_log"("tenant_id", "request_id");

-- CreateIndex
CREATE INDEX "sys_approval_log_created_at_idx" ON "sys_approval_log"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sys_notice_template_tenant_id_template_code_key" ON "sys_notice_template"("tenant_id", "template_code");

-- CreateIndex
CREATE INDEX "sys_file_pending_delete_next_retry_idx" ON "sys_file_pending_delete"("next_retry");

-- CreateIndex
CREATE INDEX "wf_definition_tenant_id_status_idx" ON "wf_definition"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "wf_definition_is_deleted_idx" ON "wf_definition"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "wf_definition_tenant_id_def_key_version_key" ON "wf_definition"("tenant_id", "def_key", "version");

-- CreateIndex
CREATE INDEX "wf_instance_tenant_id_status_idx" ON "wf_instance"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "wf_instance_tenant_id_initiator_id_idx" ON "wf_instance"("tenant_id", "initiator_id");

-- CreateIndex
CREATE INDEX "wf_instance_tenant_id_business_key_idx" ON "wf_instance"("tenant_id", "business_key");

-- CreateIndex
CREATE INDEX "wf_instance_parent_instance_id_idx" ON "wf_instance"("parent_instance_id");

-- CreateIndex
CREATE INDEX "wf_task_tenant_id_assignee_id_status_idx" ON "wf_task"("tenant_id", "assignee_id", "status");

-- CreateIndex
CREATE INDEX "wf_task_tenant_id_instance_id_idx" ON "wf_task"("tenant_id", "instance_id");

-- CreateIndex
CREATE INDEX "wf_task_tenant_id_node_id_status_idx" ON "wf_task"("tenant_id", "node_id", "status");

-- CreateIndex
CREATE INDEX "wf_history_tenant_id_instance_id_idx" ON "wf_history"("tenant_id", "instance_id");

-- CreateIndex
CREATE INDEX "wf_history_created_at_idx" ON "wf_history"("created_at");

-- CreateIndex
CREATE INDEX "wf_variable_log_tenant_id_instance_id_idx" ON "wf_variable_log"("tenant_id", "instance_id");

-- CreateIndex
CREATE INDEX "rp_dataset_tenant_id_category_idx" ON "rp_dataset"("tenant_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "rp_dataset_tenant_id_dataset_code_key" ON "rp_dataset"("tenant_id", "dataset_code");

-- CreateIndex
CREATE INDEX "rp_report_tenant_id_category_idx" ON "rp_report"("tenant_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "rp_report_tenant_id_report_code_key" ON "rp_report"("tenant_id", "report_code");

-- CreateIndex
CREATE INDEX "rp_report_log_tenant_id_report_id_idx" ON "rp_report_log"("tenant_id", "report_id");

-- CreateIndex
CREATE INDEX "rp_report_log_created_at_idx" ON "rp_report_log"("created_at");

-- CreateIndex
CREATE INDEX "rp_report_favorite_tenant_id_user_id_idx" ON "rp_report_favorite"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "rp_report_favorite_user_id_report_id_key" ON "rp_report_favorite"("user_id", "report_id");

-- AddForeignKey
ALTER TABLE "sys_notice_user" ADD CONSTRAINT "sys_notice_user_notice_id_fkey" FOREIGN KEY ("notice_id") REFERENCES "sys_notice"("notice_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_role" ADD CONSTRAINT "sys_user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_dept" ADD CONSTRAINT "sys_user_dept_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_user_dept" ADD CONSTRAINT "sys_user_dept_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "sys_dept"("dept_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_menu" ADD CONSTRAINT "sys_role_menu_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_menu" ADD CONSTRAINT "sys_role_menu_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "sys_menu"("menu_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_permission" ADD CONSTRAINT "sys_role_permission_perm_id_fkey" FOREIGN KEY ("perm_id") REFERENCES "sys_permission"("perm_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_dept" ADD CONSTRAINT "sys_role_dept_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "sys_role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_role_dept" ADD CONSTRAINT "sys_role_dept_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "sys_dept"("dept_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gen_table_column" ADD CONSTRAINT "gen_table_column_gen_tableTable_id_fkey" FOREIGN KEY ("gen_tableTable_id") REFERENCES "gen_table"("table_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_approval_node" ADD CONSTRAINT "sys_approval_node_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "sys_approval_request"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sys_approval_log" ADD CONSTRAINT "sys_approval_log_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "sys_approval_request"("request_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_instance" ADD CONSTRAINT "wf_instance_def_id_fkey" FOREIGN KEY ("def_id") REFERENCES "wf_definition"("def_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_task" ADD CONSTRAINT "wf_task_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "wf_instance"("instance_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_history" ADD CONSTRAINT "wf_history_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "wf_instance"("instance_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wf_variable_log" ADD CONSTRAINT "wf_variable_log_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "wf_instance"("instance_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rp_report" ADD CONSTRAINT "rp_report_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "rp_dataset"("dataset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rp_report_log" ADD CONSTRAINT "rp_report_log_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "rp_report"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;
