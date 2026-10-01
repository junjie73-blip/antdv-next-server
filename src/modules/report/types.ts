/** ==================== 参数类型 ==================== */
export type ParamType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "array"
  | "enum";

export interface ParamOption {
  label: string;
  value: any;
}

export interface ParamDef {
  name: string;
  label?: string;
  type: ParamType;
  required?: boolean;
  defaultValue?: any;
  /** 动态表达式，如 "$currentUser.deptId"、"$today" */
  expression?: string;
  /** 枚举选项（type=enum 时使用） */
  options?: ParamOption[];
  /** 校验：最小/最大（number） */
  min?: number;
  max?: number;
  /** 校验：正则（string） */
  pattern?: string;
  /** 描述（用于前端提示） */
  description?: string;
}

/** ==================== 数据集配置 ==================== */
export interface DatasetSourceConfig {
  /** SQL 语句，支持 :param 占位符 */
  sql: string;
  /** 超时（毫秒） */
  timeout?: number;
  /** 最大行数 */
  maxRows?: number;
  /** 是否强制注入 tenantId（默认 true） */
  enforceTenant?: boolean;
}

/** ==================== 报表配置 ==================== */
export interface ReportColumn {
  key: string;
  label: string;
  type?: "string" | "number" | "date" | "boolean";
  width?: number;
  align?: "left" | "center" | "right";
  /** 是否显示 */
  visible?: boolean;
  /** 格式化表达式 */
  formatter?: string;
}

export interface ReportChartConfig {
  type: "line" | "bar" | "pie" | "area" | "scatter";
  xField: string;
  yField: string | string[];
  seriesField?: string;
  /** ECharts option 覆盖 */
  option?: Record<string, any>;
}

export interface ReportConfig {
  columns?: ReportColumn[];
  chart?: ReportChartConfig;
  /** 是否有汇总行 */
  summary?: {
    enabled: boolean;
    /** 需要汇总的字段 */
    fields: string[];
    /** 计算方式 */
    method: "sum" | "avg" | "count" | "max" | "min";
  };
  /** 样式 */
  style?: {
    zebra?: boolean;
    border?: boolean;
    headerBg?: string;
  };
}

/** 导出类型 */
export type ExportType = "excel" | "pdf" | "html" | "csv";

/** 导出任务状态 */
export type ExportTaskStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/** 报表执行结果 */
export interface ExecuteReportResult {
  reportId: string;
  reportCode: string;
  reportName: string;
  columns: Array<{
    key: string;
    label: string;
    type?: string;
    align?: "left" | "center" | "right";
    width?: number;
  }>;
  rows: Record<string, any>[];
  total: number;
  duration: number;
  chartConfig?: Record<string, any>;
  summary?: Record<string, any>;
}
