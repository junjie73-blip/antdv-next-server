import { ExcelColumn } from "@/platform/excel/index.js";

export interface ExportContext {
  taskId: string;
  tenantId: string;
  userId: string;
  queryParams: Record<string, any>;
  columns?: string[];
  /** 用于分批查询 */
  batchSize?: number;
}

export interface ExportResult {
  /** 数据流：一批批 yield 出去，避免一次性加载 */
  rows: AsyncGenerator<Record<string, any>>;
  /** 总行数（可选，用于进度） */
  totalCount?: number;
  /** 文件名前缀（不含扩展名） */
  fileBaseName: string;
  columns?: ExcelColumn[];
}

export interface ExportHandler {
  /** 业务类型标识 */
  bizType: string;
  /** 中文名（供 UI） */
  label: string;
  /** 执行导出，返回异步迭代器 */
  execute(ctx: ExportContext): Promise<ExportResult>;
  /** 列定义 */
  columns: ExcelColumn[];
}
