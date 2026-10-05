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
import { getTraceId, getDataScope } from "@/core/context/index.js";
import { agentHttpClient } from "../service/agent-http.client.js";
import { pendingCallStore } from "../service/pending-call.store.js";
import { StreamOrchestrator } from "../service/stream-orchestrator.js";
import { toolRegistry } from "../tools/index.js";
import { AgentChatRequestSchema, parseAgentBody } from "../schema.js";

const orchestrator = new StreamOrchestrator({
  client: agentHttpClient,
  tools: toolRegistry,
  pending: pendingCallStore,
});

@Controller("/agent", { tags: ["AI 助手"] })
export default class AgentChatController {
  @Post("/chat")
  @ApiOperation("AI 助手流式对话", "以 SSE 返回 start/delta/toolCall/toolResult/end 等事件")
  @ApiResponse(200, "SSE 事件流（text/event-stream）")
  @ApiResponse(400, "参数错误")
  @ApiResponse(503, "AI 服务不可用")
  @ApiBody(AgentChatRequestSchema)
  async chat(@Req() req: Request, @Res() res: Response): Promise<void> {
    const dto = parseAgentBody(AgentChatRequestSchema, req.body);

    await orchestrator.pipe(req, res, {
      tenantId: req.tenantId!,
      userId: req.user!.userId,
      username: req.user!.username ?? "",
      roles: req.user!.roles ?? [],
      conversationId: dto.conversationId,
      message: dto.message,
      confirmedCallIds: dto.confirmedCallIds,
      dataScope: getDataScope(),
      traceId: getTraceId(),
    });
  }
}
