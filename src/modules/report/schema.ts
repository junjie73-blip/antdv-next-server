import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

/* ============================================================
 * 公共
 * ============================================================ */

const ParamDefSchema = z.object({
  name: z.string().min(1).max(64),
  label: z.string().max(128).optional(),
  type: z.enum([
    "string",
    "number",
    "boolean",
    "date",
    "datetime",
    "array",
    "enum",
  ]),
  required: z.boolean().optional(),
  defaultValue: z.any().optional(),
  expression: z.string().max(500).optional(),
  options: z.array(z.object({ label: z.string(), value: z.any() })).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().max(200).optional(),
  description: z.string().max(512).optional(),
});

const SourceConfigSchema = z.object({
  sql: z.string().min(1).max(50_000),
  timeout: z.number().int().min(1000).max(300_000).optional(),
  maxRows: z.number().int().min(1).max(1_000_000).optional(),
  enforceTenant: z.boolean().optional(),
});

const ReportColumnSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["string", "number", "date", "boolean"]).optional(),
  width: z.number().int().min(20).max(500).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  visible: z.boolean().optional(),
  formatter: z.string().max(500).optional(),
});

const ChartConfigSchema = z.object({
  type: z.enum(["line", "bar", "pie", "area", "scatter"]),
  xField: z.string(),
  yField: z.union([z.string(), z.array(z.string())]),
  seriesField: z.string().optional(),
  option: z.record(z.string(), z.any()).optional(),
});

const ReportConfigSchema = z.object({
  columns: z.array(ReportColumnSchema).optional(),
  chart: ChartConfigSchema.optional(),
  summary: z
    .object({
      enabled: z.boolean(),
      fields: z.array(z.string()),
      method: z.enum(["sum", "avg", "count", "max", "min"]),
    })
    .optional(),
  style: z
    .object({
      zebra: z.boolean().optional(),
      border: z.boolean().optional(),
      headerBg: z.string().optional(),
    })
    .optional(),
});

/* ============================================================
 * 数据集
 * ============================================================ */

export const DatasetCreateSchema = z
  .object({
    datasetCode: z
      .string()
      .min(2)
      .max(64)
      .regex(
        /^[a-zA-Z][a-zA-Z0-9_-]*$/,
        "只允许字母开头，含字母数字下划线中划线",
      ),
    datasetName: z.string().min(2).max(128),
    description: z.string().max(512).optional(),
    category: z.string().max(64).optional(),
    datasetType: z.enum(["sql"]).default("sql"),
    sourceConfig: SourceConfigSchema,
    params: z.array(ParamDefSchema).optional(),
    fields: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          label: z.string().optional(),
        }),
      )
      .optional(),
    status: z.enum(["0", "1"]).default("1"),
  })
  .openapi("DatasetCreate");

export const DatasetUpdateSchema = z
  .object({
    datasetName: z.string().min(2).max(128).optional(),
    description: z.string().max(512).optional(),
    category: z.string().max(64).optional(),
    sourceConfig: SourceConfigSchema.optional(),
    params: z.array(ParamDefSchema).optional(),
    fields: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          label: z.string().optional(),
        }),
      )
      .optional(),
    status: z.enum(["0", "1"]).optional(),
  })
  .openapi("DatasetUpdate");

export const DatasetListSchema = z
  .object({
    keyword: z.string().max(128).optional(),
    category: z.string().max(64).optional(),
    status: z.enum(["0", "1"]).optional(),
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .openapi("DatasetList");

export const DatasetTestSchema = z
  .object({
    params: z.record(z.string(), z.any()).default({}),
    limit: z.number().int().min(1).max(1000).default(100),
  })
  .openapi("DatasetTest");

/* ============================================================
 * 报表
 * ============================================================ */

export const ReportCreateSchema = z
  .object({
    reportCode: z
      .string()
      .min(2)
      .max(64)
      .regex(
        /^[a-zA-Z][a-zA-Z0-9_-]*$/,
        "只允许字母开头，含字母数字下划线中划线",
      ),
    reportName: z.string().min(2).max(128),
    description: z.string().max(512).optional(),
    category: z.string().max(64).optional(),
    datasetId: z.string().uuid(),
    config: ReportConfigSchema.optional(),
    params: z.array(ParamDefSchema).optional(),
    allowedRoles: z.array(z.string()).optional(),
    status: z.enum(["0", "1"]).default("1"),
  })
  .openapi("ReportCreate");

export const ReportUpdateSchema = z
  .object({
    reportName: z.string().min(2).max(128).optional(),
    description: z.string().max(512).optional(),
    category: z.string().max(64).optional(),
    datasetId: z.string().uuid().optional(),
    config: ReportConfigSchema.optional(),
    params: z.array(ParamDefSchema).optional(),
    allowedRoles: z.array(z.string()).optional(),
    status: z.enum(["0", "1"]).optional(),
  })
  .openapi("ReportUpdate");

export const ReportListSchema = z
  .object({
    keyword: z.string().max(128).optional(),
    category: z.string().max(64).optional(),
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .openapi("ReportList");

export const ReportExecuteSchema = z
  .object({
    params: z.record(z.string(), z.any()).default({}),
    useCache: z.boolean().default(true),
    /** 分页（可选，服务端不做分页，由前端处理） */
    pageNum: z.number().int().min(1).optional(),
    pageSize: z.number().int().min(1).max(10000).optional(),
  })
  .openapi("ReportExecute");

export const ReportExportSchema = z
  .object({
    params: z.record(z.string(), z.any()).default({}),
    filename: z.string().max(200).optional(),
    /** 是否异步导出（大文件场景） */
    async: z.boolean().default(false),
  })
  .openapi("ReportExport");

export const ReportLogListSchema = z
  .object({
    reportCode: z.string().max(64).optional(),
    exportType: z.enum(["excel", "pdf", "html", "csv"]).optional(),
    status: z.enum(["0", "1"]).optional(),
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .openapi("ReportLogList");

/* ============================================================
 * 导出任务
 * ============================================================ */

export const ExportTaskListSchema = z
  .object({
    status: z
      .enum(["pending", "processing", "completed", "failed", "cancelled"])
      .optional(),
    reportCode: z.string().max(64).optional(),
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .openapi("ExportTaskList");

/* ============================================================
 * 类型导出
 * ============================================================ */
export type DatasetCreateDTO = z.infer<typeof DatasetCreateSchema>;
export type DatasetUpdateDTO = z.infer<typeof DatasetUpdateSchema>;
export type DatasetListDTO = z.infer<typeof DatasetListSchema>;
export type DatasetTestDTO = z.infer<typeof DatasetTestSchema>;

export type ReportCreateDTO = z.infer<typeof ReportCreateSchema>;
export type ReportUpdateDTO = z.infer<typeof ReportUpdateSchema>;
export type ReportListDTO = z.infer<typeof ReportListSchema>;
export type ReportExecuteDTO = z.infer<typeof ReportExecuteSchema>;
export type ReportExportDTO = z.infer<typeof ReportExportSchema>;
export type ReportLogListDTO = z.infer<typeof ReportLogListSchema>;

export type ExportTaskListDTO = z.infer<typeof ExportTaskListSchema>;
