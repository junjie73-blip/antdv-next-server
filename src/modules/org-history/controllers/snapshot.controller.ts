import { Controller } from "@/core/decorator/controller.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { Get, Post } from "@/core/decorator/route.js";
import { ApiOperation, ApiQuery } from "@/core/decorator/swagger.js";
import { Req, Res } from "@/core/decorator/validator.js";
import z from "zod";
import { SnapshotDiffService } from "../services/snapshot-diff.service.js";
import { OrgSnapshotService } from "../services/snapshot.service.js";
import { success } from "@/shared/http/index.js";
import { Request, Response } from "express";
@Controller("/system/org-snapshot", { tags: ["组织快照"] })
export default class OrgSnapshotController {
  private diffService = new SnapshotDiffService();
  private snapshotService = new OrgSnapshotService();

  @Get("/list")
  @ApiOperation("快照列表")
  @ApiQuery(
    z.object({ limit: z.coerce.number().int().min(1).max(100).default(24) }),
  )
  async list(@Req() req: Request, @Res() res: Response) {
    const limit = Number(req.query.limit) || 24;
    return success(res, await this.snapshotService.list(req.tenantId!, limit));
  }

  @Post("/:idA/diff/:idB")
  @ApiOperation("对比两个快照")
  async diff(@Req() req: Request, @Res() res: Response) {
    const data = await this.diffService.diff(
      req.params.idA,
      req.params.idB,
      req.tenantId!,
    );
    return success(res, data);
  }
}
