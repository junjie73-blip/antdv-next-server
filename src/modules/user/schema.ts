import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

// 用户创建 Schema
export const UserCreateSchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(64)
      .openapi({ description: "用户名", example: "zhangsan" }),
    password: z
      .string()
      .min(6)
      .max(64)
      .openapi({ description: "密码（至少6位）", example: "123456" }),
    realName: z
      .string()
      .max(64)
      .optional()
      .openapi({ description: "真实姓名", example: "张三" }),
    phone: z.string().max(32).optional().openapi({ description: "手机号" }),
    email: z
      .string()
      .email()
      .max(128)
      .optional()
      .openapi({ description: "邮箱" }),
    avatar: z.string().max(512).optional().openapi({ description: "头像URL" }),
    gender: z
      .number()
      .int()
      .min(0)
      .max(2)
      .optional()
      .openapi({ description: "性别：0-未知，1-男，2-女" }),
    status: z
      .number()
      .int()
      .min(0)
      .max(1)
      .default(1)
      .openapi({ description: "状态：0-禁用，1-启用" }),
    roleIds: z
      .array(z.string().uuid())
      .optional()
      .openapi({ description: "关联角色ID列表" }),
    deptIds: z
      .string()
      .uuid()
      .optional()
      .openapi({ description: "关联部门ID列表" }),
    sortOrder: z.string().optional().openapi({ description: "排序顺序" }),
    tenantId: z.string().uuid().openapi({ description: "租户ID" }),
  })
  .openapi("UserCreate");

// 用户更新 Schema（所有字段可选）
export const UserUpdateSchema = z
  .object({
    username: z.string().min(3).max(64).optional(),
    realName: z.string().max(64).optional(),
    phone: z.string().max(32).optional(),
    email: z.string().email().max(128).optional(),
    avatar: z.string().max(512).optional(),
    gender: z.number().int().min(0).max(2).optional(),
    status: z.number().int().min(0).max(1).optional(),
    roleIds: z.array(z.string().uuid()).optional(),
    deptIds: z.array(z.string().uuid()).optional(),
    tenantId: z.string().uuid().optional(),
  })
  .openapi("UserUpdate");

// 用户列表查询 Schema
export const UserListSchema = z
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
    keyword: z
      .string()
      .optional()
      .openapi({ description: "关键字（用户名/真实姓名/手机号/邮箱）" }),
    status: z
      .string()
      .optional()
      .openapi({ description: "状态过滤：'0'或'1'" }),
    roleId: z.string().optional().openapi({ description: "角色ID过滤" }),
    deptId: z.string().optional().openapi({ description: "部门ID过滤" }),
    ids: z
      .array(z.string().uuid())
      .optional()
      .openapi({ description: "用户ID列表" }),
  })
  .openapi("UserList");

// 导入用户时的 Excel 行数据 Schema（用于验证）
export const UserImportRowSchema = z
  .object({
    username: z.string().min(3).max(64),
    realName: z.string().max(64).optional(),
    phone: z.string().max(32).optional(),
    email: z.string().email().optional(),
    gender: z.string().optional(), // Excel 中可能为文本，需转换
    status: z.string().optional(), // 0或1
    roleCodes: z.string().optional(), // 逗号分隔的角 色编码
    deptCodes: z.string().optional(), // 逗号分隔的部门编码
  })
  .openapi("UserImportRow");

export type UserCreateDto = z.infer<typeof UserCreateSchema>;
export type UserUpdateDto = z.infer<typeof UserUpdateSchema>;
export type UserListDto = z.infer<typeof UserListSchema>;
export type UserImportRow = z.infer<typeof UserImportRowSchema>;
