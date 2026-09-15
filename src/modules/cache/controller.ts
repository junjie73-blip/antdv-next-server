import {
  Controller,
  Get,
  Delete,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { CacheRepository } from "./repository.js";
import { success } from "@/common/utils/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";

@Controller("/monitor/cache", { tags: ["缓存监控"] })
export default class CacheController {
  private repository = new CacheRepository();

  @Get("/info")
  @ApiOperation("Redis 信息")
  async info(@Req() req: Request, @Res() res: Response) {
    success(res, await this.repository.info());
  }

  @Get("/keys")
  @ApiOperation("Key 列表")
  async keys(@Req() req: Request, @Res() res: Response) {
    const pattern = (req.query.pattern as string) || "*";
    success(res, await this.repository.keys(pattern));
  }

  @Delete("/key/:key")
  @ApiOperation("删除 Key")
  async deleteKey(@Req() req: Request, @Res() res: Response) {
    await this.repository.deleteKey(req.params.key);
    success(res, null, "已删除");
  }

  @Post("/clear")
  @ApiOperation("清空缓存")
  async clear(@Req() req: Request, @Res() res: Response) {
    await this.repository.clear();
    success(res, null, "已清空");
  }
}
