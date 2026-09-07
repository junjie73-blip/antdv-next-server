import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { keysToSnakeCase } from "@/common/utils/case-convert.js";
import { pushNotice } from "./pusher.js";

export class NoticeRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_notice;
  protected readonly primaryKey = "notice_id";
  /**
   * 创建通知（重写基类方法以处理目标用户关联）
   */
  async create(data: any, tenantId: string, userId?: string): Promise<any> {
    const { targetUserIds, ...noticeData } = data;
    const publishTime = noticeData.publishTime
      ? new Date(noticeData.publishTime)
      : null;

    // 如果设置了发布未来时间，状态强制为草稿（0）
    const status =
      publishTime && publishTime > new Date() ? 0 : noticeData.status;

    return prisma.$transaction(async (tx) => {
      // 1. 创建通知主记录
      const notice = await tx.sys_notice.create({
        data: {
          ...((keysToSnakeCase(noticeData) as typeof noticeData) || {}),
          status,
          publish_time: publishTime,
          tenant_id: tenantId,
          created_by: userId,
          updated_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          is_deleted: 0,
        },
      });

      // 2. 如果指定了目标用户，插入关联表
      if (targetUserIds && targetUserIds.length > 0) {
        await tx.sys_notice_user.createMany({
          data: targetUserIds.map((uid: string) => ({
            notice_id: notice.notice_id,
            user_id: uid,
            tenant_id: tenantId,
          })),
        });
      }

      return notice;
    });
  }
  async findNoticesForUser(
    userId: string,
    tenantId: string,
    page: number,
    pageSize: number,
  ) {
    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      prisma.sys_notice.findMany({
        where: {
          tenant_id: tenantId,
          status: 1,
          is_deleted: 0,
          //   @ts-ignore
          sys_notice_user: { some: { user_id: userId } },
        },
        skip,
        take: pageSize,
        orderBy: { publish_time: "desc" },
        include: {
          // @ts-ignore
          sys_notice_user: {
            where: { user_id: userId },
            select: { is_read: true },
          },
        },
      }),
      prisma.sys_notice.count({
        where: {
          tenant_id: tenantId,
          status: 1,
          is_deleted: 0,
          //   @ts-ignore
          sys_notice_user: { some: { user_id: userId } },
        },
      }),
    ]);
    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
  // 标记已读
  async markAsRead(noticeId: string, userId: string, tenantId: string) {
    await prisma.sys_notice_user.updateMany({
      where: { notice_id: noticeId, user_id: userId, tenant_id: tenantId },
      data: { is_read: 1, read_time: new Date() },
    });
  }

  // 获取未读数量
  async getUnreadCount(userId: string, tenantId: string) {
    return prisma.sys_notice_user.count({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        is_read: 0,
        notice: { status: 1, is_deleted: 0 }, // 只统计已发布未删除的通知
      },
    });
  }
}
