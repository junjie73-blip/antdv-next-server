import { prisma } from "@/config/database.js";

export const tenantService = {
  async getListByTenantId(tenantId: string): Promise<any[]> {
    return await prisma.sys_tenant.findMany({
      where: { tenant_id: tenantId },
    });
  },
};
