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
import { success } from "@/shared/http/response.js";
import { agentHttpClient } from "../service/agent-http.client.js";
import {
  AgentEmbedRequestSchema,
  AgentRerankRequestSchema,
  parseAgentBody,
} from "../schema.js";

@Controller("/agent", { tags: ["AI 助手"] })
export default class AgentCompletionController {
  @Post("/embed")
  @ApiOperation("文本向量化", "将文本批量转换为向量，供检索 / 去重等场景使用")
  @ApiResponse(200, "向量结果")
  @ApiBody(AgentEmbedRequestSchema)
  async embed(@Req() req: Request, @Res() res: Response): Promise<void> {
    const dto = parseAgentBody(AgentEmbedRequestSchema, req.body);
    const data = await agentHttpClient.postJson<Record<string, unknown>>("/embed", {
      texts: dto.texts,
    });
    return success(res, data);
  }

  @Post("/rerank")
  @ApiOperation("文档重排序", "按与 query 的相关性对候选文档重排并返回 TopN")
  @ApiResponse(200, "重排结果")
  @ApiBody(AgentRerankRequestSchema)
  async rerank(@Req() req: Request, @Res() res: Response): Promise<void> {
    const dto = parseAgentBody(AgentRerankRequestSchema, req.body);
    const data = await agentHttpClient.postJson<Record<string, unknown>>("/rerank", {
      query: dto.query,
      documents: dto.documents,
      top_n: dto.topN,
    });
    return success(res, data);
  }
}
