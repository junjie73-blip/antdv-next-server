import { prisma } from "@/config/database.js";

export class SettingsRepository {
  /**
   * 按前缀查询配置
   */
  async findByPrefix(tenantId: string, prefixes: string[]) {
    const where = prefixes.map((p) => ({ config_key: { startsWith: p } }));
    return prisma.sys_config.findMany({
      where: {
        tenant_id: tenantId,
        is_deleted: 0,
        OR: where,
      },
      orderBy: { config_key: "asc" },
    });
  }

  /**
   * 查询单条
   */
  async findByKey(tenantId: string, key: string) {
    return prisma.sys_config.findFirst({
      where: { tenant_id: tenantId, config_key: key, is_deleted: 0 },
    });
  }

  /**
   * Upsert
   */
  async upsert(
    tenantId: string,
    key: string,
    value: string | null,
    description: string | null,
    userId?: string,
  ) {
    return prisma.sys_config.upsert({
      where: { tenant_id_config_key: { tenant_id: tenantId, config_key: key } },
      update: {
        config_value: value,
        ...(description !== undefined && { description }),
        updated_by: userId ?? null,
        updated_at: new Date(),
      },
      create: {
        tenant_id: tenantId,
        config_key: key,
        config_value: value,
        description: description ?? null,
        created_by: userId ?? null,
        updated_by: userId ?? null,
        is_deleted: 0,
      },
    });
  }

  /**
   * 批量 Upsert（事务）
   */
  async upsertMany(
    tenantId: string,
    entries: Array<{
      key: string;
      value: string | null;
      description?: string | null;
    }>,
    userId?: string,
  ) {
    if (entries.length === 0) return 0;

    await prisma.$transaction(
      entries.map((e) =>
        prisma.sys_config.upsert({
          where: {
            tenant_id_config_key: { tenant_id: tenantId, config_key: e.key },
          },
          update: {
            config_value: e.value,
            ...(e.description !== undefined && { description: e.description }),
            updated_by: userId ?? null,
            updated_at: new Date(),
          },
          create: {
            tenant_id: tenantId,
            config_key: e.key,
            config_value: e.value,
            description: e.description ?? null,
            created_by: userId ?? null,
            updated_by: userId ?? null,
            is_deleted: 0,
          },
        }),
      ),
    );

    return entries.length;
  }
}
