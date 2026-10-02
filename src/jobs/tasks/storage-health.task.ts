import { logger } from "@/platform/logger/index.js";
import { prisma } from "@/config/database.js";
import { storageHealthService } from "@/modules/storage-backend/index.js";

export async function runStorageHealthTask(): Promise<void> {
  const tenants = await prisma.sys_storage_backend.findMany({
    where: { is_deleted: 0 },
    select: { tenant_id: true },
    distinct: ["tenant_id"],
  });

  for (const t of tenants) {
    await storageHealthService
      .checkAll(t.tenant_id)
      .catch((err) =>
        logger.warn(
          { err, tenantId: t.tenant_id },
          "[storage-health] check failed",
        ),
      );
  }
}
