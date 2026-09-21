import archiver from "archiver";
import type { Writable } from "node:stream";
import { z } from "zod";
import { GenTableRepository } from "./repository.js";
import { BaseService } from "@/core/base/service.js";
import { AppError, ConflictError, ValidationError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { prisma } from "@/config/database.js";
import type { GenTableCreateSchema, GenTableUpdateSchema } from "./schema.js";
import type { TableDdl, TemplateColumn } from "./types.js";
import {
  toCamelCase,
  toClassName,
  toBusinessName,
  lowerFirst,
} from "./utils/naming.js";
import {
  mapTsType,
  zodFromTsType,
  guessHtmlType,
  isAuditField,
  isQueryCandidate,
} from "./utils/type-mapper.js";
import { buildCreateTableDdl } from "./utils/db-ddl-builder.js";
import { renderTemplate } from "./utils/template-engine.js";
import { tableExists } from "./utils/db-metadata.js";
import { keysToSnakeCase } from "@/shared/utils/case-convert.js";

type CreateInput = z.infer<typeof GenTableCreateSchema>;
type UpdateInput = z.infer<typeof GenTableUpdateSchema>;

// ============================================================
// 模板注册表
// ============================================================

const TEMPLATE_MAP: Record<string, string> = {
  controller: "backend/controller.hbs",
  service: "backend/service.hbs",
  repository: "backend/repository.hbs",
  schema: "backend/schema.hbs",
  index: "backend/index.hbs",
  api: "frontend/api.hbs",
  vue: "frontend/index.vue.hbs",
  frontendTypes: "frontend/types.hbs",
  frontendConstants: "frontend/constants.hbs",
  frontendColumns: "frontend/columns.hbs",
  frontendSchemas: "frontend/schemas.hbs",
  frontendActions: "frontend/actions.hbs",
  tableSql: "sql/table.hbs",
  menuSql: "sql/menu.hbs",
};

const OUTPUT_PATH_MAP: Record<string, (ctx: Record<string, string>) => string> =
  {
    controller: (c) =>
      `src/backend/${c.packageName}/${c.businessName}/controller.ts`,
    service: (c) => `src/backend/${c.packageName}/${c.businessName}/service.ts`,
    repository: (c) =>
      `src/backend/${c.packageName}/${c.businessName}/repository.ts`,
    schema: (c) => `src/backend/${c.packageName}/${c.businessName}/schema.ts`,
    index: (c) => `src/backend/${c.packageName}/${c.businessName}/index.ts`,
    api: (c) => `src/frontend/api/api/${c.packageName}.ts`,
    vue: (c) => `src/frontend/views/${c.businessName}/index.vue`,
    frontendTypes: (c) => `src/frontend/views/${c.businessName}/types.ts`,
    frontendConstants: (c) =>
      `src/frontend/views/${c.businessName}/constants.ts`,
    frontendColumns: (c) => `src/frontend/views/${c.businessName}/columns.ts`,
    frontendSchemas: (c) => `src/frontend/views/${c.businessName}/schemas.ts`,
    frontendActions: (c) => `src/frontend/views/${c.businessName}/actions.ts`,
    tableSql: (c) => `sql/${c.tableName}.sql`,
    menuSql: (c) => `sql/${c.tableName}_menu.sql`,
  };

// ============================================================
// Service
// ============================================================

export class GenTableService extends BaseService<GenTableRepository> {
  constructor(repository: GenTableRepository) {
    super(repository);
  }

  // ---------- 建表 ----------

  /**
   * 创建配置 + 建表 + 存元数据
   * 流程：
   *  1. 校验表名不存在
   *  2. 补全列派生字段
   *  3. 事务存元数据
   *  4. 执行 DDL（失败则标记 pending，可重试）
   */
  async createWithTable(
    dto: CreateInput,
    tenantId: string,
    userId?: string,
  ): Promise<{ tableId: string; tableName: string }> {
    const exists = await this.repository.findByTableName(
      dto.tableName,
      tenantId,
    );
    if (exists) throw new ConflictError(`表 ${dto.tableName} 已存在`);

    if (await tableExists(dto.tableName)) {
      throw new ConflictError(`数据库表 ${dto.tableName} 已存在`);
    }

    const columns = dto.columns.map((c) => this.enrichColumn(c));
    const tableData = this.buildTableData(dto, tenantId, userId);
    const tableId = await this.repository.saveWithColumns(tableData, columns);
    await this.executeDdl(
      tableId,
      dto.tableName,
      dto.tableComment ?? null,
      columns,
    );
    logger.info(
      { tableId, tableName: dto.tableName, tenantId },
      "[generator] table created",
    );

    return { tableId, tableName: dto.tableName };
  }

  /** 更新元数据（不执行 ALTER TABLE，避免误操作） */
  async updateMetadata(
    tableId: string,
    dto: UpdateInput,
    tenantId: string,
    userId?: string,
  ): Promise<void> {
    const table = await this.repository.findWithColumns(tableId, tenantId);
    const columns = dto.columns?.map((c) => this.enrichColumn(c));

    const tableData = this.buildUpdateData(dto, userId);

    await this.repository.saveWithColumns(tableData, columns ?? [], tableId);
    logger.info({ tableId, tenantId }, "[generator] metadata updated");
  }

  // ---------- 生成 ----------

  /** 预览单个模板 */
  async preview(
    tableId: string,
    tenantId: string,
    templateKey: string,
  ): Promise<string> {
    const relPath = TEMPLATE_MAP[templateKey];
    if (!relPath) throw new ValidationError(`未知模板: ${templateKey}`);

    const table = await this.repository.findWithColumns(tableId, tenantId);
    const ctx = this.buildTemplateContext(keysToSnakeCase(table));
    return renderTemplate(relPath, ctx);
  }

  /** 下载 zip（SQL + 后端 + 前端 + 菜单） */
  async downloadZip(
    tableId: string,
    tenantId: string,
    res: Writable,
  ): Promise<void> {
    const table = await this.repository.findWithColumns(tableId, tenantId);
    const ctx = this.buildTemplateContext(keysToSnakeCase(table));
    const files = this.renderAll(ctx);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      logger.error({ err, tableId }, "[generator] archive error");
      throw err;
    });

    archive.pipe(res);
    for (const [name, content] of files) {
      archive.append(content, { name });
    }
    await archive.finalize();

    logger.info(
      { tableId, fileCount: files.size },
      "[generator] code generated",
    );
  }

  // ---------- 内部 ----------

  private async executeDdl(
    tableId: string,
    tableName: string,
    tableComment: string | null,
    columns: Array<Record<string, unknown>>,
  ): Promise<void> {
    const ddl: TableDdl = buildCreateTableDdl(
      tableName,
      tableComment,
      columns.map((c) => ({
        columnName: String(c.column_name),
        columnType: String(c.column_type), // 完整类型
        isPk: String(c.is_pk),
        isIncrement: String(c.is_increment),
        isRequired: String(c.is_required),
        defaultValue: c.default_value as string | null,
        columnComment: c.column_comment as string | null,
      })),
    );

    try {
      await prisma.$executeRawUnsafe(ddl.createTableSql);
      for (const sql of ddl.indexSqls) await prisma.$executeRawUnsafe(sql);
      for (const sql of ddl.commentSqls) await prisma.$executeRawUnsafe(sql);
      await this.repository.updateStatus(tableId, "created");
    } catch (err) {
      logger.error({ err, tableName }, "[generator] DDL failed");
      await this.repository.updateStatus(tableId, "pending");
      throw new AppError(`建表失败: ${(err as Error).message}`, 500001, 500);
    }
  }

  private enrichColumn(
    c: z.infer<typeof GenTableCreateSchema>["columns"][number],
  ): Record<string, unknown> {
    const tsType = c.tsType ?? mapTsType(c.columnType);
    const fieldName = c.fieldName ?? toCamelCase(c.columnName);
    return {
      column_name: c.columnName,
      column_comment: c.columnComment ?? c.columnName,
      column_type: c.columnType, // 完整类型串，直接存
      ts_type: tsType,
      field_name: fieldName,
      is_pk: c.isPk,
      is_increment: c.isIncrement,
      is_required: c.isRequired,
      is_insert: c.isInsert,
      is_edit: c.isEdit,
      is_list: c.isList,
      is_query: c.isQuery,
      is_sort: c.isSort,
      query_type: c.queryType,
      html_type: c.htmlType,
      dict_type: c.dictType ?? null,
      default_value: c.defaultValue ?? null,
      sort: c.sort ?? null,
    };
  }

  private buildTableData(
    dto: CreateInput,
    tenantId: string,
    userId?: string,
  ): Record<string, unknown> {
    const className = dto.className || toClassName(dto.tableName) || "Demo";
    const businessName =
      dto.businessName || toBusinessName(dto.tableName) || "demo";

    return {
      table_name: dto.tableName,
      table_comment: dto.tableComment || null,
      class_name: className, // ⭐ 保证非空
      tpl_category: dto.tplCategory || "crud",
      package_name: dto.packageName || "src/modules",
      module_name: dto.moduleName || businessName, // ⭐ 保证非空
      business_name: businessName, // ⭐ 保证非空
      function_name: dto.functionName || className,
      function_author: dto.functionAuthor || userId || "codegen",
      table_status: "pending",
      tenant_id: tenantId,
      created_by: userId,
      updated_by: userId,
      is_deleted: 0,
    };
  }

  private buildUpdateData(
    dto: UpdateInput,
    userId?: string,
  ): Record<string, unknown> {
    const data: Record<string, unknown> = { updated_by: userId };
    if (dto.tableComment !== undefined) data.table_comment = dto.tableComment;
    if (dto.className !== undefined) data.class_name = dto.className;
    if (dto.tplCategory !== undefined) data.tpl_category = dto.tplCategory;
    if (dto.packageName !== undefined) data.package_name = dto.packageName;
    if (dto.moduleName !== undefined) data.module_name = dto.moduleName;
    if (dto.businessName !== undefined) data.business_name = dto.businessName;
    if (dto.functionName !== undefined) data.function_name = dto.functionName;
    if (dto.functionAuthor !== undefined)
      data.function_author = dto.functionAuthor;
    return data;
  }

  private renderAll(ctx: Record<string, unknown>): Map<string, string> {
    const files = new Map<string, string>();

    for (const [key, relPath] of Object.entries(TEMPLATE_MAP)) {
      try {
        const content = renderTemplate(relPath, ctx);
        const outputPath = OUTPUT_PATH_MAP[key](ctx as Record<string, string>);
        files.set(outputPath, content);
        logger.debug(
          { key, outputPath, size: content.length },
          "[generator] file rendered",
        );
      } catch (err) {
        logger.error({ err, key, relPath }, "[generator] render failed");
        // 单个模板失败不影响其他模板
      }
    }

    logger.info(
      { total: files.size, keys: Array.from(files.keys()) },
      "[generator] renderAll complete",
    );
    return files;
  }

  // ---------- 模板上下文 ----------

  private buildTemplateContext(
    table: Record<string, unknown> & {
      columns: Array<Record<string, unknown>>;
    },
  ): Record<string, unknown> {
    const columns: TemplateColumn[] = (table.columns ?? []).map((c) =>
      this.toTemplateColumn(c),
    );
    const pkColumn = columns.find((c) => c.isPk === "1") ?? columns[0];

    // ⭐ 全部加安全兜底
    const tableName = String(table.table_name ?? "");
    const tableComment = String(table.table_comment ?? "");
    const className = String(table.class_name ?? "Demo");
    const moduleName = String(table.module_name ?? "system");
    const businessName = String(
      table.business_name ??
        className.charAt(0).toLowerCase() + className.slice(1),
    );
    const functionName = String(table.function_name ?? className);
    const packageName = String(table.package_name ?? "src/modules");
    const author = String(table.function_author ?? "codegen");

    // ⭐ 加调试日志，看实际值
    logger.debug(
      {
        tableName,
        className,
        moduleName,
        businessName,
        functionName,
        packageName,
      },
      "[generator] template context built",
    );

    return {
      tableName,
      tableComment,
      className,
      classNameLower: className.charAt(0).toLowerCase() + className.slice(1),
      moduleName,
      businessName,
      packageName,
      functionName,
      author,
      datetime: new Date().toISOString().slice(0, 10),

      columns,
      pkColumn,
      pkColumns: columns.filter((c) => c.isPk === "1"),
      listColumns: columns.filter((c) => c.isList === "1"),
      queryColumns: columns.filter((c) => c.isQuery === "1"),
      formColumns: columns.filter(
        (c) => c.isInsert === "1" || c.isEdit === "1",
      ),

      hasDate: columns.some((c) => c.tsType === "Date"),
      hasBigint: columns.some((c) => c.tsType === "bigint"),
      hasDict: columns.some((c) => Boolean(c.dictType)),
      hasImage: columns.some((c) => c.htmlType === "imageUpload"),
      hasUpload: columns.some((c) =>
        ["imageUpload", "fileUpload"].includes(c.htmlType),
      ),
    };
  }

  private toTemplateColumn(c: Record<string, unknown>): TemplateColumn {
    // snake_case 读 → camelCase 输出
    const columnName = String(c.column_name ?? "");
    const columnComment = String(c.column_comment ?? columnName);
    const columnType = String(c.column_type ?? "varchar");
    const tsType = String(c.ts_type ?? "unknown");
    const fieldName = String(c.field_name ?? "");
    const isRequired = c.is_required === "1";

    return {
      columnName,
      columnComment,
      columnType,
      tsType,
      fieldName,
      isPk: String(c.is_pk ?? "0"),
      isIncrement: String(c.is_increment ?? "0"),
      isRequired: String(c.is_required ?? "0"),
      isInsert: String(c.is_insert ?? "1"),
      isEdit: String(c.is_edit ?? "1"),
      isList: String(c.is_list ?? "1"),
      isQuery: String(c.is_query ?? "0"),
      isSort: String(c.is_sort ?? "0"),
      queryType: String(c.query_type ?? "EQ"),
      htmlType: String(c.html_type ?? "input"),
      dictType: c.dict_type ? String(c.dict_type) : null,
      zodType: zodFromTsType(tsType, isRequired),
    };
  }
}
