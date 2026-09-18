import type { BaseQuery, PageResult } from "@/types/base-repository.js";

export type YesNo = "0" | "1";

export type TplCategory = "crud" | "tree";

export type TableStatus = "pending" | "created";

export type QueryType = "EQ" | "NE" | "GT" | "LT" | "LIKE" | "BETWEEN";

export type HtmlType =
  | "input"
  | "textarea"
  | "inputNumber"
  | "select"
  | "radio"
  | "checkbox"
  | "datetime"
  | "switch"
  | "imageUpload"
  | "fileUpload";

/** 数据库列原始元数据 */
export interface DbColumn {
  columnName: string;
  columnComment: string | null;
  dataType: string;
  udtName: string;
  maxLength: number | null;
  precision: number | null;
  scale: number | null;
  isNullable: boolean;
  columnDefault: string | null;
  sort: number;
  isPk: boolean;
  isIncrement: boolean;
  [key: string]: any;
}

/** DDL 生成结果 */
export interface TableDdl {
  createTableSql: string;
  indexSqls: string[];
  commentSqls: string[];
}

/** 模板上下文中的列（已归一化为 camelCase） */
export interface TemplateColumn {
  columnName: string;
  columnComment: string;
  columnType: string;
  tsType: string;
  fieldName: string;
  isPk: string;
  isIncrement: string;
  isRequired: string;
  isInsert: string;
  isEdit: string;
  isList: string;
  isQuery: string;
  isSort: string;
  queryType: string;
  htmlType: string;
  dictType: string | null;
  zodType: string;
}

export type { BaseQuery, PageResult };
