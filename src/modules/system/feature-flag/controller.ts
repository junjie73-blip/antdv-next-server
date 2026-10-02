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
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { success, pageSuccess } from "@/shared/http/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { featureFlagService } from "./singleton.js";

const ListQuery = z.object({
  keyword: z.string().max(128).optional(),
  groupName: z.string().max(64).optional(),
  status: z.enum(["0", "1"]).optional(),
  pageNum: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const UpsertSchema = z.object({
  flagKey: z
    .string()
    .min(2)
    .max(128)
    .regex(/^[a-z0-9][a-z0-9-_:.]*$/i),
  flagName: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  defaultOn: z.coerce.number().int().min(0).max(1).default(0),
  rolloutPct: z.coerce.number().int().min(0).max(100).default(0),
  status: z.enum(["0", "1"]).default("1"),
  expireAt: z.coerce.date().nullable().optional(),
  tags: z.array(z.string()).optional(),
  owner: z.string().max(128).optional(),
  groupName: z.string().max(64).optional(),
});

const RuleSchema = z.object({
  ruleType: z.enum(["tenant", "user", "role", "percentage"]),
  target: z.string().min(1).max(128),
  enabled: z.coerce.number().int().min(0).max(1).default(1),
  priority: z.coerce.number().int().default(0),
  tenantId: z.string().uuid().optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveUntil: z.coerce.date().optional(),
  expireAt: z.coerce.date().optional(),
  remark: z.string().max(256).optional(),
});

const RulesPutSchema = z.object({
  rules: z.array(RuleSchema).max(200),
});

@Controller("/system/feature-flag", { tags: ["特性开关"] })
export default class FeatureFlagController {
  @Get("/list")
  @RequirePermission("system:feature-flag:list")
  @ApiOperation("列表")
  @ApiQuery(ListQuery)
  async list(@Req() req: Request, @Res() res: Response) {
    const dto = ListQuery.parse(req.query);
    const data = await featureFlagService.list(dto);
    return pageSuccess(res, data.list, data.total, dto.pageNum, dto.pageSize);
  }

  @Get("/:id")
  @RequirePermission("system:feature-flag:list")
  @ApiOperation("详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    return success(res, await featureFlagService.detail(req.params.id));
  }

  @Post("/")
  @RequirePermission("system:feature-flag:manage")
  @ApiOperation("创建")
  @ApiBody(UpsertSchema)
  async create(@Req() req: Request, @Res() res: Response) {
    const dto = UpsertSchema.parse(req.body);
    const created = await featureFlagService.create(dto, req.user?.userId);
    return success(res, created, "创建成功");
  }

  @Put("/:id")
  @RequirePermission("system:feature-flag:manage")
  @ApiOperation("更新")
  @ApiBody(UpsertSchema.partial())
  async update(@Req() req: Request, @Res() res: Response) {
    const dto = UpsertSchema.partial().parse(req.body);
    const patch: Record<string, unknown> = {};
    if (dto.flagName !== undefined) patch.flag_name = dto.flagName;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.defaultOn !== undefined) patch.default_on = dto.defaultOn;
    if (dto.rolloutPct !== undefined) patch.rollout_pct = dto.rolloutPct;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.expireAt !== undefined) patch.expire_at = dto.expireAt;
    if (dto.tags !== undefined) patch.tags = dto.tags;
    if (dto.owner !== undefined) patch.owner = dto.owner;
    if (dto.groupName !== undefined) patch.group_name = dto.groupName;

    const updated = await featureFlagService.update(
      req.params.id,
      patch,
      req.user?.userId,
    );
    return success(res, updated, "更新成功");
  }

  @Delete("/:id")
  @RequirePermission("system:feature-flag:manage")
  @ApiOperation("删除")
  async remove(@Req() req: Request, @Res() res: Response) {
    await featureFlagService.remove(req.params.id, req.user!.userId);
    return success(res, null, "已删除");
  }

  @Put("/:id/rules")
  @RequirePermission("system:feature-flag:manage")
  @ApiOperation("替换灰度规则（全量覆盖）")
  @ApiBody(RulesPutSchema)
  async replaceRules(@Req() req: Request, @Res() res: Response) {
    const { rules } = RulesPutSchema.parse(req.body);
    const result = await featureFlagService.replaceRules(
      req.params.id,
      rules,
      req.user?.userId,
    );
    return success(res, result, "规则已保存");
  }

  /** 调试用：查看某用户对某 flag 的评估结果 */
  @Get("/:id/evaluate")
  @RequirePermission("system:feature-flag:list")
  @ApiOperation("评估（调试）")
  @ApiQuery(
    z.object({
      userId: z.string().uuid().optional(),
      tenantId: z.string().uuid().optional(),
    }),
  )
  async evaluate(@Req() req: Request, @Res() res: Response) {
    const flag = await featureFlagService.detail(req.params.id);
    const result = await featureFlagService.evaluate(flag.flag_key, {
      userId: req.query.userId as string | undefined,
      tenantId: req.query.tenantId as string | undefined,
    });
    return success(res, result);
  }
}
