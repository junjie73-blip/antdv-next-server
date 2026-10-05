import { z } from "zod";
import type { ToolExecutorDefinition } from "../types.js";

/**
 * 只读示例工具：验证「带 requiredPermission」的路径。
 * 数据直接取自 ToolExecutionContext，不查库 —— 上下文已在认证链中可信注入。
 */
export const userProfileTool: ToolExecutorDefinition = {
  spec: {
    name: "user.current_profile",
    description: "获取当前登录用户的基本信息（用户名、租户、角色）",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    required_permission: "user:read",
    mutating: false,
    requires_confirmation: false,
  },
  inputSchema: z.object({}).strict(),
  async run(_input, ctx) {
    return {
      userId: ctx.userId,
      username: ctx.username,
      tenantId: ctx.tenantId,
      roles: ctx.roles,
    };
  },
};
