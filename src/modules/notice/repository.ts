import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import {
  keysToCamelCase,
  keysToSnakeCase,
} from "@/common/utils/case-convert.js";
import { pushNotice } from "./pusher.js";

export class NoticeRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_notice;
  protected readonly primaryKey = "notice_id";
  /**
   * 创建通知（重写基类方法以处理目标用户关联）
   */
  async create(data: any, tenantId: string, userId?: string): Promise<any> {
    const { target_user_ids: targetUserIds, publishTime, ...noticeData } = data;
    const publishTimeDate = publishTime ? new Date(publishTime) : null;
    const status =
      publishTimeDate && publishTimeDate > new Date()
        ? "0"
        : String(data.status ?? "1");

    return prisma.$transaction(async (tx) => {
      const notice = await tx.sys_notice.create({
        data: {
          // @ts-ignore
          ...keysToSnakeCase(noticeData),
          status,
          publish_time: publishTimeDate,
          tenant_id: tenantId,
          created_by: userId,
          updated_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          is_deleted: 0,
        },
      });

      if (targetUserIds?.length) {
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
    isRead?: number,
  ) {
    const skip = (page - 1) * pageSize;

    const userFilter: any = { user_id: userId };
    if (isRead !== undefined && !isNaN(isRead)) {
      userFilter.is_read = isRead;
    }
    const where: any = {
      tenant_id: tenantId,
      status: "1",
      is_deleted: 0,
      target_users: { some: userFilter },
    };

    const [rawList, total] = await Promise.all([
      prisma.sys_notice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { publish_time: "desc" },
        include: {
          target_users: {
            where: { user_id: userId },
            select: { is_read: true },
          },
        },
      }),
      prisma.sys_notice.count({ where }),
    ]);

    // ========== 关键：扁平化处理 ==========
    const list = rawList.map((item: any) => {
      const { target_users, ...rest } = item;
      return {
        ...rest,
        // 从关联表里取出当前用户的已读状态，提升到外层
        isRead: target_users?.[0]?.is_read ?? 0,
      };
    });

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
        notice: { status: "1", is_deleted: 0 }, // 只统计已发布未删除的通知
      },
    });
  }
  async update(
    id: string,
    data: any,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const {
      target_user_ids: targetUserIds,
      publish_time: publishTime,
      ...noticeData
    } = data;

    const publishTimeDate = publishTime ? new Date(publishTime) : null;
    let status = noticeData.status;
    if (publishTimeDate && publishTimeDate > new Date()) {
      status = "0";
    }

    return prisma.$transaction(async (tx) => {
      // 更新通知主记录
      await tx.sys_notice.update({
        where: { notice_id: id },
        data: {
          // @ts-ignore
          ...keysToSnakeCase(noticeData),
          status,
          publish_time: publishTimeDate,
          updated_by: userId,
          updated_at: new Date(),
        },
      });

      // 处理目标用户
      if (targetUserIds !== undefined) {
        // 若提供了 targetUserIds，则按提供列表更新关联
        await tx.sys_notice_user.deleteMany({
          where: { notice_id: id, tenant_id: tenantId },
        });
        if (targetUserIds.length > 0) {
          await tx.sys_notice_user.createMany({
            data: targetUserIds.map((uid: string) => ({
              notice_id: id,
              user_id: uid,
              tenant_id: tenantId,
            })),
          });
        }
      } else {
        // 未提供 targetUserIds，且状态为发布，则自动发送给租户下所有有效用户
        if (status === "1") {
          // 删除可能已存在的旧关联
          await tx.sys_notice_user.deleteMany({
            where: { notice_id: id, tenant_id: tenantId },
          });
          // 查询租户下所有用户（排除软删除、禁用）
          const users = await tx.sys_user.findMany({
            where: { tenant_id: tenantId, is_deleted: 0, status: "1" },
            select: { user_id: true },
          });
          if (users.length > 0) {
            await tx.sys_notice_user.createMany({
              data: users.map((u) => ({
                notice_id: id,
                user_id: u.user_id,
                tenant_id: tenantId,
              })),
            });
          }
        }
      }

      return tx.sys_notice.findUnique({ where: { notice_id: id } });
    });
  }
  async findDetailWithTargetUserIds(
    noticeId: string,
    tenantId: string,
  ): Promise<any> {
    const notice = await prisma.sys_notice.findFirst({
      where: {
        notice_id: noticeId,
        tenant_id: tenantId,
        is_deleted: 0,
      },
      include: {
        target_users: {
          // 注意关系字段名，根据 schema 应为 target_users
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!notice) return null;

    // 将关联用户转换为 ID 数组
    const targetUserIds = notice.target_users.map((tu: any) => tu.user_id);

    return {
      ...notice,
      targetUserIds,
    };
  }
}
