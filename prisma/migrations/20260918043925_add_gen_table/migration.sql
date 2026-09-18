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
    "gen_type" CHAR(1) NOT NULL DEFAULT '0',
    "gen_path" VARCHAR(200),
    "parent_menu_id" UUID,
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
    "ts_type" VARCHAR(500),
    "field_name" VARCHAR(200),
    "is_pk" CHAR(1) NOT NULL DEFAULT '0',
    "is_increment" CHAR(1) NOT NULL DEFAULT '0',
    "is_required" CHAR(1) NOT NULL DEFAULT '0',
    "is_insert" CHAR(1) NOT NULL DEFAULT '1',
    "is_edit" CHAR(1) NOT NULL DEFAULT '1',
    "is_list" CHAR(1) NOT NULL DEFAULT '1',
    "is_query" CHAR(1) NOT NULL DEFAULT '0',
    "query_type" VARCHAR(20) NOT NULL DEFAULT 'EQ',
    "html_type" VARCHAR(20) NOT NULL DEFAULT 'input',
    "dict_type" VARCHAR(200),
    "sort_order" INTEGER DEFAULT 0,
    "is_deleted" SMALLINT NOT NULL DEFAULT 0,
    "gen_tableTable_id" UUID,

    CONSTRAINT "gen_table_column_pkey" PRIMARY KEY ("column_id")
);

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

-- AddForeignKey
ALTER TABLE "gen_table_column" ADD CONSTRAINT "gen_table_column_gen_tableTable_id_fkey" FOREIGN KEY ("gen_tableTable_id") REFERENCES "gen_table"("table_id") ON DELETE SET NULL ON UPDATE CASCADE;
