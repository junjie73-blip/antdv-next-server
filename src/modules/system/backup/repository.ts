import { prisma } from "@/config/database.js";

export class BackupRepository {
  async findPage(params: {
    status?: string;
    triggerType?: string;
    pageNum: number;
    pageSize: number;
  }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.triggerType) where.trigger_type = params.triggerType;

    const [list, total] = await Promise.all([
      prisma.sys_backup_record.findMany({
        where,
        orderBy: { started_at: "desc" },
        skip: (params.pageNum - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.sys_backup_record.count({ where }),
    ]);
    return { list, total };
  }

  async findById(backupId: string) {
    return prisma.sys_backup_record.findUnique({
      where: { backup_id: backupId },
    });
  }

  async create(data: {
    triggerType: string;
    backupType: string;
    databaseName: string;
    compression?: string;
    createdBy?: string;
    remark?: string;
  }) {
    return prisma.sys_backup_record.create({
      data: {
        trigger_type: data.triggerType,
        backup_type: data.backupType,
        database_name: data.databaseName,
        compression: data.compression ?? "gzip",
        status: "pending",
        created_by: data.createdBy,
        remark: data.remark,
        started_at: new Date(),
      },
    });
  }

  async updateStatus(
    backupId: string,
    patch: Partial<{
      status: string;
      storageKey: string;
      fileName: string;
      fileSize: bigint;
      checksum: string;
      durationMs: number;
      errorMsg: string;
      finishedAt: Date;
      retainUntil: Date;
    }>,
  ) {
    await prisma.sys_backup_record.update({
      where: { backup_id: backupId },
      data: {
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.storageKey !== undefined && {
          storage_key: patch.storageKey,
        }),
        ...(patch.fileName !== undefined && { file_name: patch.fileName }),
        ...(patch.fileSize !== undefined && { file_size: patch.fileSize }),
        ...(patch.checksum !== undefined && { checksum: patch.checksum }),
        ...(patch.durationMs !== undefined && {
          duration_ms: patch.durationMs,
        }),
        ...(patch.errorMsg !== undefined && { error_msg: patch.errorMsg }),
        ...(patch.finishedAt !== undefined && {
          finished_at: patch.finishedAt,
        }),
        ...(patch.retainUntil !== undefined && {
          retain_until: patch.retainUntil,
        }),
      },
    });
  }

  async remove(backupId: string) {
    await prisma.sys_backup_record.delete({ where: { backup_id: backupId } });
  }

  /** 清理：找出超过保留期且已完成的备份 */
  async findExpired(limit = 100) {
    return prisma.sys_backup_record.findMany({
      where: {
        status: "completed",
        retain_until: { lt: new Date() },
      },
      orderBy: { started_at: "asc" },
      take: limit,
    });
  }

  /** 策略 */
  async listPolicies() {
    return prisma.sys_backup_policy.findMany({
      where: { is_deleted: 0 },
      orderBy: { created_at: "desc" },
    });
  }

  async upsertPolicy(data: {
    policyId?: string;
    name: string;
    cron: string;
    backupType: string;
    retainDays: number;
    retainCount: number;
    enabled: number;
    bucket?: string;
    remark?: string;
    userId?: string;
  }) {
    if (data.policyId) {
      return prisma.sys_backup_policy.update({
        where: { policy_id: data.policyId },
        data: {
          name: data.name,
          cron: data.cron,
          backup_type: data.backupType,
          retain_days: data.retainDays,
          retain_count: data.retainCount,
          enabled: data.enabled,
          bucket: data.bucket,
          remark: data.remark,
          updated_by: data.userId,
        },
      });
    }
    return prisma.sys_backup_policy.create({
      data: {
        name: data.name,
        cron: data.cron,
        backup_type: data.backupType,
        retain_days: data.retainDays,
        retain_count: data.retainCount,
        enabled: data.enabled,
        bucket: data.bucket,
        remark: data.remark,
        created_by: data.userId,
        updated_by: data.userId,
      },
    });
  }

  async deletePolicy(policyId: string, userId: string) {
    await prisma.sys_backup_policy.update({
      where: { policy_id: policyId },
      data: { is_deleted: 1, updated_by: userId },
    });
  }
}
