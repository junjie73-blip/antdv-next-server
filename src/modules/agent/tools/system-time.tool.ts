import dayjs from "dayjs";
import { z } from "zod";
import type { ToolExecutorDefinition } from "../types.js";

/** 只读示例工具：验证「无权限要求 + 无确认」的最简路径 */
export const systemTimeTool: ToolExecutorDefinition = {
  spec: {
    name: "system.current_time",
    description: "获取系统当前时间（Asia/Shanghai）",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    required_permission: "",
    mutating: false,
    requires_confirmation: false,
  },
  inputSchema: z.object({}).strict(),
  async run() {
    return {
      iso: dayjs().toISOString(),
      timezone: "Asia/Shanghai",
      local: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };
  },
};
