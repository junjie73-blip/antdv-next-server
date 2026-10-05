import { Request, Response } from "express";
import {
  Controller,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from "@/core/decorator/index.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { getTraceId } from "@/core/context/index.js";
import { success } from "@/shared/http/response.js";
import { agentHttpClient } from "../service/agent-http.client.js";
import { AgentIngestRequestSchema, parseAgentBody } from "../schema.js";

@Controller("/agent", { tags: ["AI 助手"] })
export default class AgentIngestController {
  @Post("/ingest")
  @RequirePermission("agent:knowledge:manage")
  @ApiOperation("知识入库", "把一段文本切分并写入向量库；租户由 BFF 注入，不接受前端传入")
  @ApiResponse(200, "入库结果")
  @ApiResponse(403, "无权限")
  @ApiBody(AgentIngestRequestSchema)
  async ingest(@Req() req: Request, @Res() res: Response): Promise<void> {
    const dto = parseAgentBody(AgentIngestRequestSchema, req.body);
    const data = await agentHttpClient.postJson<Record<string, unknown>>(
      "/ingest",
      {
        // 租户取自认证上下文，绝不信任前端传入的 tenant_id
        tenant_id: req.tenantId!,
        source_type: dto.sourceType,
        source_id: dto.sourceId ?? null,
        title: dto.title,
        content: dto.content,
        metadata: dto.metadata ?? {},
      },
      { traceId: getTraceId() },
    );
    return success(res, data);
  }
}
