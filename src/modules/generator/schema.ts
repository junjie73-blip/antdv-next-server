import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const IDENT_RE = /^[a-z][a-z0-9_]*$/;
const yesNo = z.enum(["0", "1"]);

export const GenTableListSchema = z
  .object({
    pageNum: z
      .number()
      .int()
      .positive()
      .default(1)
      .openapi({ description: "页码" }),
    pageSize: z
      .number()
      .int()
      .positive()
      .max(100)
      .default(10)
      .openapi({ description: "每页条数" }),
    keyword: z.string().optional().openapi({ description: "表名或描述" }),
  })
  .openapi("GenTableList");

export const GenTableColumnSchema = z
  .object({
    columnId: z.string().uuid().optional(),
    columnName: z
      .string()
      .min(1)
      .max(64)
      .regex(
        /^[a-z][a-z0-9_]*$/,
        "列名必须小写字母开头，仅含小写字母/数字/下划线",
      ),
    columnComment: z.string().max(200).optional().nullable(),
    // 完整类型：varchar(64) / numeric(10,2) / uuid / timestamptz ...
    columnType: z.string().min(1).max(50),
    tsType: z.string().max(50).optional(),
    fieldName: z.string().max(100).optional(),
    isPk: yesNo.default("0"),
    isIncrement: yesNo.default("0"),
    isRequired: yesNo.default("0"),
    isInsert: yesNo.default("1"),
    isEdit: yesNo.default("1"),
    isList: yesNo.default("1"),
    isQuery: yesNo.default("0"),
    isSort: yesNo.default("0"),
    queryType: z
      .enum(["EQ", "NE", "GT", "LT", "LIKE", "BETWEEN"])
      .default("EQ"),
    htmlType: z
      .enum([
        "input",
        "textarea",
        "inputNumber",
        "select",
        "radio",
        "checkbox",
        "datetime",
        "switch",
        "imageUpload",
        "fileUpload",
      ])
      .default("input"),
    dictType: z.string().max(200).optional().nullable(),
    defaultValue: z.string().max(200).optional().nullable(),
    sort: z.number().int().optional(),
  })
  .openapi("GenTableColumn");

export const GenTableCreateSchema = z
  .object({
    tableName: z
      .string()
      .min(1)
      .max(64)
      .regex(IDENT_RE, "表名必须小写字母开头，仅含小写字母/数字/下划线"),
    tableComment: z.string().max(200).optional().nullable(),
    className: z.string().min(1).max(100),
    tplCategory: z.enum(["crud", "tree"]).default("crud"),
    packageName: z.string().max(100).default("src/modules"),
    moduleName: z.string().max(30).optional().nullable(),
    businessName: z.string().max(30).optional().nullable(),
    functionName: z.string().max(50).optional().nullable(),
    functionAuthor: z.string().max(50).optional().nullable(),
    columns: z.array(GenTableColumnSchema).min(1, "至少需要一个字段"),
  })
  .openapi("GenTableCreate");

export const GenTableUpdateSchema = GenTableCreateSchema.omit({
  tableName: true,
})
  .partial()
  .openapi("GenTableUpdate");
