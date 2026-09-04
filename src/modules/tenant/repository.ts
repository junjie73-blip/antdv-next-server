import { prisma } from "@/config/database.js";
import { BaseRepository } from "@/core/base-repository.js";

export class TenantRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_tenant;
  protected readonly primaryKey = "tenant_id";
  async codeExists(
    tenantCode: string,
    tenantId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = { tenant_code: tenantCode };
    if (excludeId) {
      where.tenant_id = { not: excludeId };
    }
    return this.exists(where, tenantId);
  }
}

export default TenantRepository;
