import {
  Controller,
  Get,
  Delete,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { FileRepository } from "./repository.js";
import { FileService } from "./service.js";
import { FileListSchema } from "./schema.js";
import { success } from "@/common/utils/response.js";
import { BaseController } from "@/core/base/controller.js";

@Controller("/file", { tags: ["文件管理"] })
export default class FileController extends BaseController<any, any, any, any> {
  protected readonly repository = new FileRepository();
  protected readonly service = new FileService(this.repository);
  protected readonly config = {
    routePrefix: "/api/v1/file",
    tags: ["文件管理"],
    permissionPrefix: "file",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = undefined;
  protected readonly updateSchema = undefined;
  protected readonly querySchema = FileListSchema;

  @Get("/list")
  @ApiOperation("获取文件列表")
  @ApiQuery(FileListSchema)
  async listFile(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除文件")
  async removeFile(@Req() req: Request, @Res() res: Response) {
    try {
      await this.service.removeFile(
        req.params.id,
        req.tenantId!,
        req.user?.userId,
      );
      success(res, null, "删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
