import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { GROUP_TYPES } from "./constants.js";

extendZodWithOpenApi(z);

const GROUP_CODE_RE = /^[a-zA-Z][a-zA-Z0-9_-]{1,62}$/;

/* ============================================================
 * 创建
 * ============================================================ */
export const UserGroupCreateSchema = z
  .object({
    groupCode: z
      .string()
      .min(2)
      .max(64)
      .regex(GROUP_CODE_RE, "只允许字母开头，含字母数字下划线中划线")
      .openapi({ description: "组编码" }),
    groupName: z.string().min(2).max(128).openapi({ description: "组名称" }),
    description: z.string().max(512).optional(),
    groupType: z
      .enum(GROUP_TYPES as [string, ...string[]])
      .default("custom")
      .openapi({ description: "组类型" }),
    sortOrder: z.number().int().default(0),
    status: z
      .string()
      .regex(/^[01]$/)
      .default("1")
      .openapi({ description: "0-禁用，1-启用" }),
  })
  .openapi("UserGroupCreate");

/* ============================================================
 * 更新
 * ============================================================ */
export const UserGroupUpdateSchema = z
  .object({
    groupName: z.string().min(2).max(128).optional(),
    description: z.string().max(512).nullable().optional(),
    groupType: z.enum(GROUP_TYPES as [string, ...string[]]).optional(),
    sortOrder: z.number().int().optional(),
    status: z
      .string()
      .regex(/^[01]$/)
      .optional(),
  })
  .openapi("UserGroupUpdate");

/* ============================================================
 * 列表
 * ============================================================ */
export const UserGroupListSchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    keyword: z.string().max(128).optional(),
    groupType: z.enum(GROUP_TYPES as [string, ...string[]]).optional(),
    status: z
      .string()
      .regex(/^[01]$/)
      .optional(),
  })
  .openapi("UserGroupList");

/* ============================================================
 * 成员管理
 * ============================================================ */
export const AddMembersSchema = z
  .object({
    userIds: z.array(z.string().uuid()).min(1).max(500),
  })
  .openapi("UserGroupAddMembers");

export const RemoveMembersSchema = z
  .object({
    userIds: z.array(z.string().uuid()).min(1).max(500),
  })
  .openapi("UserGroupRemoveMembers");

/* ============================================================
 * 角色绑定
 * ============================================================ */
export const AssignRolesSchema = z
  .object({
    roleIds: z.array(z.string().uuid()).min(0).max(100),
  })
  .openapi("UserGroupAssignRoles");

export type UserGroupCreateDTO = z.infer<typeof UserGroupCreateSchema>;
export type UserGroupUpdateDTO = z.infer<typeof UserGroupUpdateSchema>;
export type UserGroupListDTO = z.infer<typeof UserGroupListSchema>;
export type AddMembersDTO = z.infer<typeof AddMembersSchema>;
export type RemoveMembersDTO = z.infer<typeof RemoveMembersSchema>;
export type AssignRolesDTO = z.infer<typeof AssignRolesSchema>;
