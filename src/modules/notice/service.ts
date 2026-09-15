import { NoticeRepository } from "./repository.js";
import { NoticeImportRowSchema, NoticeExportColumns } from "./schema.js";
import { parseExcel, generateExcel } from "@/core/excel/excel.service.js";
import { AppError } from "@/core/errors.js";
import { dispatchNotice } from "./channels/index.js";
import { prisma } from "@/config/database.js";
import { BaseService } from "@/core/base/service.js";

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

  async sendNotice(noticeId: string, tenantId: string) {
    const notice = await this.repository.findOne(
      { notice_id: noticeId },
      tenantId,
    );
    if (!notice) throw new AppError("通知不存在", 404001, 404);
    if ((notice as any).status !== "1")
      throw new AppError("通知未发布", 400001, 400);

    const count = await this.repository.countTargetUsers(noticeId, tenantId);
    if (count === 0) throw new AppError("该通知没有目标用户", 400001, 400);

    await dispatchNotice({
      tenantId,
      noticeId,
      title: (notice as any).title,
      content: (notice as any).content ?? undefined,
    });
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

    await prisma.$transaction([
      prisma.sys_notice.update({
        where: { notice_id: noticeId },
        data: {
          status: "0",
          revoked_at: new Date(),
          revoked_by: userId,
          updated_at: new Date(),
        },
      }),
      prisma.sys_notice_user.updateMany({
        where: { notice_id: noticeId, tenant_id: tenantId },
        data: { is_deleted: 1 },
      }),
    ]);

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
