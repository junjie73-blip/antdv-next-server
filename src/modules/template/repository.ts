import { prisma } from "@/config/database.js";
import { BaseRepository } from "@/core/index.js";

export class TemplateRepository extends BaseRepository<any, any, any, any> {
  async findAll(tenantId?: string) {
    return this.model.findMany({
      where: {
        status: "1",
        is_deleted: 0,
        ...(tenantId ? { tenant_id: tenantId } : {}),
      },
    });
  }
  protected readonly model = prisma.sys_notice_template;
  protected readonly primaryKey = "template_id";
}
