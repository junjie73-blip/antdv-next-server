import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { BaseController } from "@/core/base/controller.js";
import { IpRuleRepository } from "./repository.js";
import { success } from "@/common/utils/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { z } from "zod";
import { IpRuleService } from "./service.js";

// ========== 把 schema 提到模块级 ==========
const IpRuleCreateSchema = z
  .object({
    ruleType: z.enum(["white", "black"]),
    ipPattern: z.string().min(1).max(64),
    remark: z.string().max(256).optional(),
    status: z.string().default("1"),
  })
  .openapi("IpRuleCreate");

const IpRuleUpdateSchema = IpRuleCreateSchema.partial().openapi("IpRuleUpdate");

const IpRuleCheckSchema = z
  .object({
    ip: z.string(),
  })
  .openapi("IpRuleCheck");

@Controller("/ip-rule", { tags: ["IP 白黑名单"] })
export default class IpRuleController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new IpRuleRepository();
  protected readonly config = {
    routePrefix: "/api/v1/ip-rule",
    tags: ["IP 白黑名单"],
    permissionPrefix: "system:ip-rule",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly service = new IpRuleService(this.repository);
  protected readonly createSchema = IpRuleCreateSchema;
  protected readonly updateSchema = IpRuleUpdateSchema;
  protected readonly querySchema = z.object({});

  protected buildListWhere() {
    return {};
  }

  @Get("/list")
  @ApiOperation("IP 规则列表")
  async ipList(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }

  @Post("/")
  @ApiOperation("创建 IP 规则")
  @ApiBody(IpRuleCreateSchema) // ✅ 使用模块级常量
  async ipCreate(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Put("/:id")
  @ApiOperation("更新 IP 规则")
  @ApiBody(IpRuleUpdateSchema) // ✅ 使用模块级常量
  async ipUpdate(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除 IP 规则")
  async ipRemove(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }

  @Post("/check")
  @ApiOperation("检查 IP 是否允许")
  @ApiBody(IpRuleCheckSchema)
  async ipCheck(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.service.checkIp(req.body.ip, req.tenantId!);
      success(res, result);
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
