import {
  Controller,
  Get,
  Delete,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { FileRepository } from "./repository.js";
import { FileListSchema } from "./schema.js";
import { error, success } from "@/common/utils/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { AppError } from "@/core/errors.js";

@Controller("/file", { tags: ["文件管理"] })
export default class FileController {
  private repository = new FileRepository();

  @Get("/list")
  @ApiOperation("获取文件列表")
  @ApiQuery(FileListSchema)
  @ApiResponse(200, "查询成功")
  async listFile(@Req() req: Request, @Res() res: Response) {
    try {
      const query = {
        pageNum: Number(req.query.pageNum) || 1,
        pageSize: Number(req.query.pageSize) || 10,
        tenantId: req.tenantId!,
        keyword: req.query.keyword as string,
        mimeType: req.query.mimeType as string,
      };
      const data = await this.repository.findPage(query, {});
      success(res, data, "查询文件列表成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Delete("/:id")
  @ApiOperation("删除文件")
  @ApiResponse(200, "删除成功")
  async removeFile(@Req() req: Request, @Res() res: Response) {
    try {
      await this.repository.softDelete(
        req.params.id,
        req.tenantId!,
        req.user?.userId,
      );
      success(res, null, "删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: any) {
    if (err instanceof AppError) {
      error(res, err.message, err.code, err.statusCode);
      return;
    }
    console.error("Controller error:", err);
    error(res, "操作失败", 500, 500);
  }
}
