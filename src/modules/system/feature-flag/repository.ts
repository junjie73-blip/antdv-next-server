import { prisma } from "@/config/database.js";

export class FeatureFlagRepository {
  async findByKey(key: string) {
    return prisma.sys_feature_flag.findFirst({
      where: { flag_key: key, is_deleted: 0 },
      include: {
        rules: {
          where: { is_deleted: 0 },
          orderBy: [{ priority: "desc" }, { created_at: "asc" }],
        },
      },
    });
  }

  async listAll() {
    return prisma.sys_feature_flag.findMany({
      where: { is_deleted: 0 },
      include: { rules: { where: { is_deleted: 0 } } },
      orderBy: [{ group_name: "asc" }, { flag_key: "asc" }],
    });
  }

  async findPage(params: {
    keyword?: string;
    groupName?: string;
    status?: string;
    pageNum: number;
    pageSize: number;
  }) {
    const where: any = { is_deleted: 0 };
    if (params.keyword) {
      where.OR = [
        { flag_key: { contains: params.keyword } },
        { flag_name: { contains: params.keyword } },
      ];
    }
    if (params.groupName) where.group_name = params.groupName;
    if (params.status) where.status = params.status;

    const [list, total] = await Promise.all([
      prisma.sys_feature_flag.findMany({
        where,
        include: { rules: { where: { is_deleted: 0 } } },
        orderBy: { created_at: "desc" },
        skip: (params.pageNum - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.sys_feature_flag.count({ where }),
    ]);
    return { list, total };
  }

  async create(data: {
    flagKey: string;
    flagName: string;
    description?: string;
    defaultOn?: number;
    rolloutPct?: number;
    status?: string;
    expireAt?: Date;
    tags?: unknown;
    owner?: string;
    groupName?: string;
    userId?: string;
  }) {
    return prisma.sys_feature_flag.create({
      data: {
        flag_key: data.flagKey,
        flag_name: data.flagName,
        description: data.description,
        default_on: data.defaultOn ?? 0,
        rollout_pct: data.rolloutPct ?? 0,
        status: data.status ?? "1",
        expire_at: data.expireAt,
        tags: data.tags as any,
        owner: data.owner,
        group_name: data.groupName,
        created_by: data.userId,
        updated_by: data.userId,
      },
    });
  }

  async update(flagId: string, patch: Record<string, unknown>) {
    return prisma.sys_feature_flag.update({
      where: { flag_id: flagId },
      data: { ...patch, version: { increment: 1 } },
    });
  }

  async softDelete(flagId: string, userId: string) {
    await prisma.sys_feature_flag.update({
      where: { flag_id: flagId },
      data: { is_deleted: 1, updated_by: userId, version: { increment: 1 } },
    });
  }

  /* ========== 规则 ========== */
  async listRules(flagId: string) {
    return prisma.sys_feature_flag_rule.findMany({
      where: { flag_id: flagId, is_deleted: 0 },
      orderBy: [{ priority: "desc" }, { created_at: "asc" }],
    });
  }

  async replaceRules(
    flagId: string,
    rules: Array<{
      ruleType: string;
      target: string;
      enabled?: number;
      priority?: number;
      tenantId?: string;
      effectiveFrom?: Date;
      effectiveUntil?: Date;
      expireAt?: Date;
      remark?: string;
    }>,
    userId?: string,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.sys_feature_flag_rule.updateMany({
        where: { flag_id: flagId },
        data: { is_deleted: 1 },
      });
      if (rules.length === 0) return [];
      await tx.sys_feature_flag_rule.createMany({
        data: rules.map((r) => ({
          flag_id: flagId,
          tenant_id: r.tenantId,
          rule_type: r.ruleType,
          target: r.target,
          enabled: r.enabled ?? 1,
          priority: r.priority ?? 0,
          effective_from: r.effectiveFrom,
          effective_until: r.effectiveUntil,
          expire_at: r.expireAt,
          remark: r.remark,
          created_by: userId,
        })),
      });
      // flag version + 1
      await tx.sys_feature_flag.update({
        where: { flag_id: flagId },
        data: { version: { increment: 1 }, updated_by: userId },
      });
      return tx.sys_feature_flag_rule.findMany({
        where: { flag_id: flagId, is_deleted: 0 },
      });
    });
  }

  /** 到期提醒（每日 cron） */
  async findExpiring(days = 7) {
    const deadline = new Date(Date.now() + days * 86_400_000);
    return prisma.sys_feature_flag.findMany({
      where: {
        is_deleted: 0,
        status: "1",
        expire_at: { not: null, lte: deadline, gte: new Date() },
      },
    });
  }
}
