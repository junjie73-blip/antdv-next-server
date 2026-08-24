import { Request, Response as ExpressResponse } from "express";
import {
  Controller,
  Get,
  Post,
  Delete,
  Tag,
  Summary,
  Description,
  Query,
  Body,
  Params,
  Response as ApiResponse, // ← 改名
} from "@/common/core/decorators.js";

import { z } from "zod";

@Controller("/users")
export default class UserController {
  @Tag("用户管理")
  @Summary("获取用户列表")
  @Description("分页查询租户下的用户")
  @Query(z.object({ tenantId: z.string() }))
  @Query(z.object({ page: z.number().int().min(1).default(1) }))
  @Query(z.object({ pageSize: z.number().int().min(1).max(100).default(10) }))
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.array(z.object({ id: z.string() })),
      total: z.number(),
    }),
    "查询成功",
  )
  @Get("/list")
  async list(req: Request, res: ExpressResponse) {
    // ...
  }
}
