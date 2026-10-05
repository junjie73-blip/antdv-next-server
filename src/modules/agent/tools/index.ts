import { ToolRegistry } from "../service/tool-registry.js";
import type { ToolExecutorDefinition } from "../types.js";
import { systemTimeTool } from "./system-time.tool.js";
import { userProfileTool } from "./user-profile.tool.js";
import { auditNoteTool } from "./audit-note.tool.js";

const TOOL_DEFINITIONS: ToolExecutorDefinition[] = [
  systemTimeTool,
  userProfileTool,
  auditNoteTool,
];

/** 单例注册表：specs 稳定，构造一次即可复用 */
export const toolRegistry = new ToolRegistry(
  new Map(TOOL_DEFINITIONS.map((d) => [d.spec.name, d])),
);
