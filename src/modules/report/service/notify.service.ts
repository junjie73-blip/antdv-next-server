import { prisma } from "@/config/database.js";
import { dispatchNotice } from "@/modules/notice/channels/index.js";
import { logger } from "@/platform/logger/index.js";
import { publishReportNotify } from "@/platform/ws/index.js";

export interface NotifyExportParams {
  tenantId: string;
  userId: string;
  taskId: string;
  reportCode: string;
  reportName: string;
  exportType: string;
  status: "completed" | "failed";
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  rowCount?: number;
  duration?: number;
  errorMsg?: string;
}

export class ReportNotifyService {
  /**
   * 导出完成通知
   */
  async notifyExportCompleted(params: NotifyExportParams): Promise<void> {
    const user = await prisma.sys_user.findUnique({
      where: { user_id: params.userId },
      select: { real_name: true, username: true, email: true, phone: true },
    });
    if (!user) return;

    const userName = user.real_name ?? user.username;

    if (params.status === "completed") {
      const title = `【导出完成】${params.reportName}`;
      const content = `${userName}，您导出的报表「${params.reportName}」已生成完成。\n共 ${params.rowCount ?? 0} 行。`;

      // ── WS 实时推送 ──
      await publishReportNotify({
        userId: params.userId,
        tenantId: params.tenantId,
        eventType: "export_completed",
        reportCode: params.reportCode,
        reportName: params.reportName,
        title,
        content,
        taskId: params.taskId,
        fileUrl: params.fileUrl,
        fileName: params.fileName,
        fileSize: params.fileSize,
        rowCount: params.rowCount,
      });

      // ── 邮件/短信 ──
      await dispatchNotice({
        tenantId: params.tenantId,
        title,
        content,
        channels: user.email ? ["email"] : [],
        receiversByChannel: {
          email: user.email ? [user.email] : [],
        },
      }).catch((err) => {
        logger.warn({ err }, "[rp-notify] 渠道发送失败");
      });
    } else {
      const title = `【导出失败】${params.reportName}`;
      const content = `${userName}，您导出的报表「${params.reportName}」生成失败。\n原因：${params.errorMsg ?? "未知错误"}`;

      await publishReportNotify({
        userId: params.userId,
        tenantId: params.tenantId,
        eventType: "export_failed",
        reportCode: params.reportCode,
        reportName: params.reportName,
        title,
        content,
        taskId: params.taskId,
      });
    }

    logger.info(
      {
        taskId: params.taskId,
        userId: params.userId,
        status: params.status,
      },
      "[rp-notify] 导出通知已发送",
    );
  }

  /**
   * 缓存预热通知（仅失败时通知管理员）
   */
  async notifyWarmFailed(params: {
    tenantId: string;
    reportCode: string;
    reportName: string;
    error: string;
    adminUserIds: string[];
  }): Promise<void> {
    const title = `【预热失败】${params.reportName}`;
    const content = `报表「${params.reportName}」缓存预热失败。\n原因：${params.error}`;

    for (const userId of params.adminUserIds) {
      await publishReportNotify({
        userId,
        tenantId: params.tenantId,
        eventType: "warm_failed",
        reportCode: params.reportCode,
        reportName: params.reportName,
        title,
        content,
      }).catch(() => undefined);
    }
  }
}

export const reportNotifyService = new ReportNotifyService();
