import { z } from "zod";
import { pushAudit } from "@/platform/audit/index.js";
import type { ToolExecutorDefinition } from "../types.js";

/**
 * 写工具示例：验证「mutating + requires_confirmation」的人工确认流。
 * 复用既有 system:audit 权限码，不新增工具级权限码（避免默认角色开箱不可用）。
 */
export const auditNoteTool: ToolExecutorDefinition = {
  spec: {
    name: "system.audit_note",
    description: "代用户在审计日志中写入一条备注",
    parameters: {
      type: "object",
      properties: {
        note: { type: "string", description: "备注内容（1-500 字）" },
      },
      required: ["note"],
      additionalProperties: false,
    },
    required_permission: "system:audit",
    mutating: true,
    requires_confirmation: true,
  },
  inputSchema: z.object({ note: z.string().min(1).max(500) }).strict(),
  async run(input, ctx) {
    const note = String(input.note);
    await pushAudit({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      username: ctx.username,
      operation: "agent.audit_note",
      method: "AGENT",
      requestUrl: "agent://tool/system.audit_note",
      requestParams: { note },
      ipAddress: "agent",
      executeTime: 0,
      status: "success",
      metadata: { conversationId: ctx.conversationId },
    });
    return { recorded: true, note };
  },
};
