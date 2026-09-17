import { NoticeRepository } from "./repository.js";
import { NoticeImportRowSchema, NoticeExportColumns } from "./schema.js";
import { parseExcel, generateExcel } from "@/core/excel/excel.service.js";
import { AppError } from "@/core/errors.js";
import { dispatchNotice } from "./channels/index.js";
import { prisma } from "@/config/database.js";
import { BaseService } from "@/core/base/service.js";
import { publishNoticePush } from "@/core/redis/pubsub.js";
import { logger } from "@/core/logger/logger.js";
export interface SendNoticeOptions {
  channels?: string[];
  receiversByChannel?: Record<string, string[]>;
  operatorId?: string;
}
export class NoticeService extends BaseService<NoticeRepository> {
  constructor(repository: NoticeRepository) {
    super(repository);
  }

  async checkBeforeCreate(dto: any, tenantId: string) {
    await this.assertUnique(
      () => this.repository.findOne({ title: dto.title }, tenantId),
      "通知标题",
      dto.title,
    );
  }

  async markManyAsRead(noticeIds: string[], userId: string, tenantId: string) {
    if (!Array.isArray(noticeIds) || noticeIds.length === 0) return;
    await this.repository.markManyAsRead(noticeIds, userId, tenantId);
  }

  async sendNotice(
    noticeId: string,
    tenantId: string,
    options: SendNoticeOptions = {},
  ) {
    const notice = await this.repository.findOne(
      { notice_id: noticeId },
      tenantId,
    );
    if (!notice) throw new AppError("通知不存在", 404001, 404);
    if ((notice as any).send_status === "1") {
      throw new AppError("该通知已发送，不能再次发布", 400001, 400);
    }
    if ((notice as any).revoked_at) {
      throw new AppError("通知已撤回，无法发送", 400001, 400);
    }

    // 1) 目标人：空 → 全员
    let targetUserIds = await this.repository.getTargetUserIds(
      noticeId,
      tenantId,
    );
    if (targetUserIds.length === 0) {
      targetUserIds = await this.repository.getAllTenantUserIds(tenantId);
      if (targetUserIds.length === 0) {
        throw new AppError("租户下没有可接收通知的成员", 400001, 400);
      }
      await this.repository.insertNoticeUsers(
        noticeId,
        tenantId,
        targetUserIds,
      );
      this.log("sendNotice:fallbackToAllUsers", {
        noticeId,
        count: targetUserIds.length,
      });
    }

    // 2) 原子锁定发送状态（并发只允许一个通过）
    const now = new Date();
    await this.repository.lockSendState(noticeId, tenantId, {
      status: "1",
      publishTime: now,
      sendTime: now,
    });
    const after = await this.repository.findOne(
      { notice_id: noticeId },
      tenantId,
    );
    if (
      (after as any)?.send_status !== "1" ||
      +new Date((after as any).send_time) !== +now
    ) {
      // 落库失败说明被别人抢先了
      throw new AppError("该通知已发送，不能再次发布", 400001, 400);
    }

    // 3) 派发
    const results = await dispatchNotice({
      tenantId,
      noticeId,
      title: (notice as any).title,
      content: (notice as any).content ?? undefined,
      channels: options.channels,
      receiversByChannel: options.receiversByChannel,
    });

    return { results, targetCount: targetUserIds.length };
  }

  async revokeNotice(noticeId: string, tenantId: string, userId: string) {
    const notice = await this.repository.findOne(
      { notice_id: noticeId },
      tenantId,
    );
    if (!notice) throw new AppError("通知不存在", 404001, 404);
    if ((notice as any).status !== "1")
      throw new AppError("只能撤回已发布的通知", 400001, 400);
    if ((notice as any).revoked_at)
      throw new AppError("通知已撤回", 400001, 400);

    const now = new Date();

    // ⭐ updateMany + 条件，保证并发下只有一次成功
    const updated = await prisma.sys_notice.updateMany({
      where: {
        notice_id: noticeId,
        tenant_id: tenantId,
        is_deleted: 0,
        status: "1",
      },
      data: {
        status: "0", // 回到草稿态，用户端不再展示
        revoked_at: null,
        revoked_by: null,
        send_status: "0", // ⭐ 允许再次发送
        send_time: null,
        updated_at: now,
      },
    });
    if (updated.count === 0) {
      throw new AppError("通知已撤回或状态已变更", 400001, 400);
    }

    // ⭐ 广播撤回事件：各实例推给自己的连接，客户端重新拉取
    try {
      await publishNoticePush(noticeId, "revoke");
    } catch (err) {
      // 推送失败不影响撤回结果，只记日志
      logger.error({ err, noticeId }, "[notice] publish revoke failed");
    }

    this.log("revokeNotice", { noticeId });
  }
  async myNotices(
    tenantId: string,
    userId: string,
    _pageNum: string,
    _pageSize: string,
    isRead: string,
  ) {
    const pageNum = Number(_pageNum) || 1;
    const pageSize = Number(_pageSize) || 10;
    const data = await (this.repository as NoticeRepository).findNoticesForUser(
      userId,
      tenantId,
      pageNum,
      pageSize,
      Number(isRead!),
    );
    return data;
  }
  async exportToExcel(tenantId: string): Promise<Buffer> {
    const notices = await this.repository.findAllForExport(tenantId);
    return generateExcel(notices, [...NoticeExportColumns], "通知数据");
  }

  async importFromExcel(buffer: Buffer, tenantId: string, userId?: string) {
    const { rows, errors: parseErrors } = parseExcel<Record<string, any>>(
      buffer,
      NoticeImportRowSchema,
    );

    const errors = parseErrors.map((e) => `第 ${e.rowNum} 行：${e.message}`);
    let successCount = 0;

    for (const row of rows) {
      const title = String(row["标题"] || "").trim();
      if (!title) continue;
      try {
        await this.repository.insertNotice({
          tenantId,
          title,
          content: String(row["内容"] || ""),
          noticeType: Number(
            row["类型"] === "公告" ? 2 : row["类型"] === "提醒" ? 3 : 1,
          ),
          status: row["状态"] === "草稿" ? "0" : "1",
          publishTime: row["发布时间"] ? new Date(row["发布时间"]) : null,
          userId,
        });
        successCount++;
      } catch (e: any) {
        errors.push(`通知「${title}」：${e.message}`);
      }
    }

    return { successCount, failCount: errors.length, errors };
  }
}
