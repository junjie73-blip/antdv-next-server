import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { prisma } from "@/config/database.js";
import { WfDelegateRepository } from "../repository/delegate.repository.js";
import type {
  WfDelegateCreateDTO,
  WfDelegateUpdateDTO,
  WfDelegateListDTO,
} from "../schema.js";

export class WfDelegateService {
  private repo = new WfDelegateRepository();

  /* ============================================================
   * 列表
   * ============================================================ */
  async list(tenantId: string, query: WfDelegateListDTO) {
    return this.repo.findPage(tenantId, query);
  }

  /* ============================================================
   * 详情
   * ============================================================ */
  async detail(delegateId: string, tenantId: string) {
    const d = await this.repo.findById(delegateId, tenantId);
    if (!d) throw new AppError("委托规则不存在", 404001, 404);
    return d;
  }

  /* ============================================================
   * 创建
   * ============================================================ */
  async create(
    tenantId: string,
    delegatorId: string,
    dto: WfDelegateCreateDTO,
    operatorId?: string,
  ) {
    if (dto.delegateeId === delegatorId) {
      throw new AppError("不能委托给自己", 400001, 400);
    }

    // 校验被委托人
    const target = await prisma.sys_user.findFirst({
      where: {
        user_id: dto.delegateeId,
        tenant_id: tenantId,
        is_deleted: 0,
        status: "1",
      },
      select: { user_id: true },
    });
    if (!target) throw new AppError("被委托人不存在或已禁用", 404001, 404);

    // 时间冲突检查
    const overlap = await this.repo.hasOverlapping(
      delegatorId,
      tenantId,
      dto.startAt,
      dto.endAt,
    );
    if (overlap) {
      throw new AppError("该时间段内已有生效的委托规则", 409001, 409);
    }

    const created = await this.repo.create({
      tenantId,
      delegatorId,
      delegateeId: dto.delegateeId,
      defKeys: dto.defKeys ?? null,
      startAt: dto.startAt,
      endAt: dto.endAt,
      reason: dto.reason ?? null,
      operatorId,
    });

    logger.info(
      {
        delegateId: created.delegate_id,
        delegator: delegatorId,
        delegatee: dto.delegateeId,
      },
      "[wf-delegate] created",
    );

    return created;
  }

  /* ============================================================
   * 更新
   * ============================================================ */
  async update(
    delegateId: string,
    tenantId: string,
    dto: WfDelegateUpdateDTO,
    operatorId?: string,
  ) {
    const existing = await this.repo.findById(delegateId, tenantId);
    if (!existing) throw new AppError("委托规则不存在", 404001, 404);

    // 时间变更 → 冲突检查
    if (dto.startAt || dto.endAt) {
      const startAt = dto.startAt ?? existing.start_at;
      const endAt = dto.endAt ?? existing.end_at;
      if (endAt <= startAt) {
        throw new AppError("结束时间必须晚于开始时间", 400001, 400);
      }
      const overlap = await this.repo.hasOverlapping(
        existing.delegator_id,
        tenantId,
        startAt,
        endAt,
        delegateId,
      );
      if (overlap) {
        throw new AppError("该时间段内已有生效的委托规则", 409001, 409);
      }
    }

    await this.repo.update(delegateId, tenantId, {
      defKeys: dto.defKeys,
      startAt: dto.startAt,
      endAt: dto.endAt,
      reason: dto.reason,
      enabled: dto.enabled,
      operatorId,
    });

    logger.info({ delegateId }, "[wf-delegate] updated");
  }

  /* ============================================================
   * 撤销（立即失效）
   * ============================================================ */
  async revoke(delegateId: string, tenantId: string, operatorId?: string) {
    const existing = await this.repo.findById(delegateId, tenantId);
    if (!existing) throw new AppError("委托规则不存在", 404001, 404);
    await this.repo.revoke(delegateId, tenantId, operatorId);
    logger.info({ delegateId }, "[wf-delegate] revoked");
  }

  /* ============================================================
   * 删除
   * ============================================================ */
  async remove(delegateId: string, tenantId: string, operatorId?: string) {
    const existing = await this.repo.findById(delegateId, tenantId);
    if (!existing) throw new AppError("委托规则不存在", 404001, 404);
    await this.repo.softDelete(delegateId, tenantId, operatorId);
  }

  /* ============================================================
   * 我的委托（作为委托人）
   * ============================================================ */
  async myDelegations(
    userId: string,
    tenantId: string,
    query: { pageNum: number; pageSize: number },
  ) {
    return this.repo.findPage(tenantId, {
      ...query,
      delegatorId: userId,
    });
  }

  /* ============================================================
   * 我代理的（作为被委托人）
   * ============================================================ */
  async myActing(
    userId: string,
    tenantId: string,
    query: { pageNum: number; pageSize: number },
  ) {
    return this.repo.findPage(tenantId, {
      ...query,
      delegateeId: userId,
      enabled: 1,
    });
  }
}
