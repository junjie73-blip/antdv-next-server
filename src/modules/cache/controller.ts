import {
  Controller,
  Get,
  Delete,
  Req,
  Res,
  ApiOperation,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { RequirePermission } from "@/core/decorator/permission.js";
import { CacheRepository } from "./repository.js";
import { success } from "@/shared/http/response.js";

@Controller("/monitor/cache", { tags: ["缓存监控"] })
export default class CacheController {
  private repository = new CacheRepository();

  @Get("/info")
  @RequirePermission("business:monitor:cache")
  @ApiOperation("Redis 概览")
  async info(@Req() _req: Request, @Res() res: Response) {
    success(res, await this.repository.info());
  }

  @Get("/groups")
  @RequirePermission("business:monitor:cache")
  @ApiOperation("缓存组列表")
  async groups(@Req() _req: Request, @Res() res: Response) {
    success(res, await this.repository.getGroupList());
  }

  @Get("/keys")
  @RequirePermission("business:monitor:cache")
  @ApiOperation("缓存组下的 key 列表")
  async keys(@Req() req: Request, @Res() res: Response) {
    const prefix = (req.query.prefix as string) || "";
    if (!prefix) {
      success(res, []);
      return;
    }
    success(res, await this.repository.getKeys(prefix));
  }

  @Get("/value")
  @RequirePermission("business:monitor:cache")
  @ApiOperation("获取 key 值")
  async value(@Req() req: Request, @Res() res: Response) {
    const key = (req.query.key as string) || "";
    if (!key) {
      success(res, null);
      return;
    }
    success(res, await this.repository.getValue(decodeURIComponent(key)));
  }

  @Delete("/key")
  @RequirePermission("business:monitor:cache")
  @ApiOperation("删除单个 key")
  async deleteKey(@Req() req: Request, @Res() res: Response) {
    const key = (req.query.key as string) || "";
    await this.repository.deleteKey(decodeURIComponent(key));
    success(res, null, "已删除");
  }

  @Delete("/group")
  @RequirePermission("business:monitor:cache")
  @ApiOperation("清空某个缓存组")
  async clearGroup(@Req() req: Request, @Res() res: Response) {
    const prefix = (req.query.prefix as string) || "";
    const count = await this.repository.clearByPrefix(prefix);
    success(res, { count }, `已清空 ${count} 个 key`);
  }

  // ⚠️ 已移除 /all 路由
}
