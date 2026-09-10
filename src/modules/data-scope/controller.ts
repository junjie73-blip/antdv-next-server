import { Controller } from "@/core/decorator/controller.js";
import { Get, Put } from "@/core/decorator/route.js";
import { ApiOperation, ApiBody } from "@/core/decorator/swagger.js";
import { Req, Res } from "@/core/decorator/validator.js";
import z, { success } from "zod";
import { DataScopeRepository } from "./repository.js";

@Controller("/data-scope", { tags: ["数据权限"] })
export default class DataScopeController {
  private repository = new DataScopeRepository();

  @Get("/role/:roleId")
  @ApiOperation("获取角色数据范围")
  async getRoleScope(@Req() req: Request, @Res() res: Response) {
    success(
      res,
      await this.repository.getRoleScope(req.params.roleId, req.tenantId!),
    );
  }

  @Put("/role/:roleId")
  @ApiOperation("更新角色数据范围")
  @ApiBody(
    z.object({
      dataScope: z.enum(["1", "2", "3", "4", "5"]),
      deptIds: z.array(z.string().uuid()).optional(),
    }),
  )
  async updateRoleScope(@Req() req: Request, @Res() res: Response) {
    const { dataScope, deptIds = [] } = req.body;
    await this.repository.updateRoleScope(
      req.params.roleId,
      dataScope,
      deptIds,
      req.tenantId!,
    );
    success(res, null, "更新成功");
  }
}
