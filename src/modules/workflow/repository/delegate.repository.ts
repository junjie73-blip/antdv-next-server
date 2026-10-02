import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import type { WfDelegateEntity } from "../types.js";

export class WfDelegateRepository {
  /* ============================================================
   * 分页
   * ============================================================ */
  async findPage(
    tenantId: string,
    params: {
      pageNum: number;
      pageSize: number;
      delegatorId?: string;
      delegateeId?: string;
      enabled?: number;
    },
  ) {
    const { pageNum, pageSize, delegatorId, delegateeId, enabled } = params;
    const where: any = { tenant_id: tenantId, is_deleted: 0 };
    if (delegatorId) where.delegator_id = delegatorId;
    if (delegateeId) where.delegatee_id = delegateeId;
    if (enabled !== undefined) where.enabled = enabled;

    const [list, total] = await Promise.all([
      prisma.sys_wf_delegate.findMany({
        where,
        orderBy: [{ created_at: "desc" }],
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sys_wf_delegate.count({ where }),
    ]);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /* ============================================================
   * 详情
   * ============================================================ */
  async findById(
    delegateId: string,
    tenantId: string,
  ): Promise<WfDelegateEntity | null> {
    return prisma.sys_wf_delegate.findFirst({
      where: {
        delegate_id: delegateId,
        tenant_id: tenantId,
        is_deleted: 0,
      },
    }) as Promise<WfDelegateEntity | null>;
  }

  /* ============================================================
   * ⭐ 查找用户当前生效的委托规则（供引擎调用）
   * - delegator = userId
   * - 当前时间在 [start_at, end_at] 内
   * - enabled = 1
   * - def_key 匹配（如果规则限定了 def_key）
   * ============================================================ */
  async findEffectiveDelegate(
    delegatorId: string,
    tenantId: string,
    defKey?: string,
    at: Date = new Date(),
  ): Promise<WfDelegateEntity | null> {
    const candidates = await prisma.sys_wf_delegate.findMany({
      where: {
        tenant_id: tenantId,
        delegator_id: delegatorId,
        enabled: 1,
        is_deleted: 0,
        start_at: { lte: at },
        end_at: { gt: at },
      },
      orderBy: { created_at: "desc" },
    });

    // defKeys 为空数组或 null → 全流程生效
    for (const d of candidates) {
      const keys = (d.def_keys as string[] | null) ?? null;
      if (!keys || keys.length === 0) return d as WfDelegateEntity;
      if (defKey && keys.includes(defKey)) return d as WfDelegateEntity;
    }
    return null;
  }

  /* ============================================================
   * 冲突检查：同一委托人同一时段只允许一条生效规则
   * ============================================================ */
  async hasOverlapping(
    delegatorId: string,
    tenantId: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = {
      tenant_id: tenantId,
      delegator_id: delegatorId,
      is_deleted: 0,
      enabled: 1,
      // 时间段重叠：(start_at < endAt) AND (end_at > startAt)
      start_at: { lt: endAt },
      end_at: { gt: startAt },
    };
    if (excludeId) where.delegate_id = { not: excludeId };
    const count = await prisma.sys_wf_delegate.count({ where });
    return count > 0;
  }

  /* ============================================================
   * 创建
   * ============================================================ */
  async create(data: {
    tenantId: string;
    delegatorId: string;
    delegateeId: string;
    defKeys: string[] | null;
    startAt: Date;
    endAt: Date;
    reason: string | null;
    operatorId?: string;
  }): Promise<WfDelegateEntity> {
    return prisma.sys_wf_delegate.create({
      data: {
        tenant_id: data.tenantId,
        delegator_id: data.delegatorId,
        delegatee_id: data.delegateeId,
        def_keys: (data.defKeys ?? null) as any,
        scope: data.defKeys?.length ? "specific" : "all",
        start_at: data.startAt,
        end_at: data.endAt,
        reason: data.reason ?? null,
        enabled: 1,
        created_by: data.operatorId ?? null,
        updated_by: data.operatorId ?? null,
      },
    }) as Promise<WfDelegateEntity>;
  }

  /* ============================================================
   * 更新
   * ============================================================ */
  async update(
    delegateId: string,
    tenantId: string,
    patch: Partial<{
      defKeys: string[] | null;
      startAt: Date;
      endAt: Date;
      reason: string | null;
      enabled: number;
      operatorId?: string;
    }>,
  ) {
    const data: any = { updated_at: new Date() };
    if (patch.defKeys !== undefined) {
      data.def_keys = patch.defKeys;
      data.scope = patch.defKeys?.length ? "specific" : "all";
    }
    if (patch.startAt !== undefined) data.start_at = patch.startAt;
    if (patch.endAt !== undefined) data.end_at = patch.endAt;
    if (patch.reason !== undefined) data.reason = patch.reason;
    if (patch.enabled !== undefined) data.enabled = patch.enabled;
    if (patch.operatorId) data.updated_by = patch.operatorId;

    await prisma.sys_wf_delegate.update({
      where: { delegate_id: delegateId },
      data,
    });
  }

  /* ============================================================
   * 软删
   * ============================================================ */
  async softDelete(delegateId: string, tenantId: string, operatorId?: string) {
    await prisma.sys_wf_delegate.updateMany({
      where: {
        delegate_id: delegateId,
        tenant_id: tenantId,
        is_deleted: 0,
      },
      data: {
        is_deleted: 1,
        updated_by: operatorId ?? null,
        updated_at: new Date(),
      },
    });
  }

  /* ============================================================
   * 手动撤销（立即失效）
   * ============================================================ */
  async revoke(delegateId: string, tenantId: string, operatorId?: string) {
    await prisma.sys_wf_delegate.updateMany({
      where: {
        delegate_id: delegateId,
        tenant_id: tenantId,
        is_deleted: 0,
      },
      data: {
        enabled: 0,
        updated_by: operatorId ?? null,
        updated_at: new Date(),
      },
    });
  }
}
