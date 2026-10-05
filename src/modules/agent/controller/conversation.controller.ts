import { Request, Response } from "express";
import { z } from "zod";
import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@/core/decorator/index.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { env } from "@/config/env.js";
import { success, pageSuccess } from "@/shared/http/response.js";
import { agentHttpClient } from "../service/agent-http.client.js";
import { listConversations, listMessages } from "../service/agent-history.query.js";
import {
  AgentConversationListQuerySchema,
  AgentMessageListQuerySchema,
  parseAgentQuery,
} from "../schema.js";

const ConversationIdSchema = z.object({
  conversationId: z.string().min(1).max(64),
});

@Controller("/agent", { tags: ["AI 助手"] })
export default class AgentConversationController {
  @Get("/conversations")
  @ApiOperation("我的会话列表", "只读 Agent 历史表，按最近活跃倒序")
  @ApiQuery(AgentConversationListQuerySchema)
  @ApiResponse(200, "会话分页列表")
  async conversations(@Req() req: Request, @Res() res: Response): Promise<void> {
    const query = parseAgentQuery(AgentConversationListQuerySchema, req.query);
    const { list, total } = await listConversations(
      req.tenantId!,
      req.user!.userId,
      query.pageNum,
      query.pageSize,
    );
    return pageSuccess(res, list, total, query.pageNum, query.pageSize);
  }

  @Get("/conversations/:conversationId/messages")
  @ApiOperation("会话消息列表", "按 createdAt 正序返回；仅限本人本租户")
  @ApiQuery(AgentMessageListQuerySchema)
  @ApiResponse(200, "消息列表")
  async messages(
    @Req() req: Request,
    @Param("conversationId") conversationId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { conversationId: cid } = parseAgentQuery(ConversationIdSchema, { conversationId });
    const query = parseAgentQuery(AgentMessageListQuerySchema, req.query);
    const list = await listMessages(
      req.tenantId!,
      cid,
      req.user!.userId,
      query.limit,
      query.before,
    );
    return success(res, list);
  }

  @Get("/status")
  @RequirePermission("system:audit")
  @ApiOperation("AI 服务状态", "探测 Agent 的 /health 与 /ready，供运维排障")
  @ApiResponse(200, "服务状态")
  async status(_req: Request, @Res() res: Response): Promise<void> {
    const probe = await agentHttpClient.probe();
    return success(res, {
      enabled: env.AGENT_ENABLED,
      healthy: probe.healthy,
      ready: probe.ready,
      // baseUrl 不含任何密钥，可安全回显
      baseUrl: env.AGENT_BASE_URL,
      detail: probe.detail,
    });
  }
}
