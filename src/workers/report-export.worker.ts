import { Worker, Job } from "bullmq";
import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { uploadBuffer } from "@/platform/storage/index.js";
import { reportEngine } from "@/modules/report/service/engine.js";
import { reportNotifyService } from "@/modules/report/service/notify.service.js";
import {
  classifyExportError,
  ExportErrorType,
} from "@/modules/report/service/export-error.js";
import { calcRetryDelay } from "@/modules/report/service/export-retry.config.js";
import {
  rpExportTotal,
  rpExportDuration,
  rpExportRetryTotal,
} from "@/platform/metrics/report.js";
import {
  ExcelExporter,
  CsvExporter,
  HtmlExporter,
  PdfExporter,
} from "@/modules/report/exporters/index.js";
import { createBullConnection } from "@/config/redis.js";

interface ExportJobData {
  taskId: string;
  tenantId: string;
  userId: string;
  reportCode: string;
  exportType: "excel" | "pdf" | "html" | "csv";
  input: Record<string, any>;
  filename?: string;
}

const CONTENT_TYPES: Record<string, string> = {
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv; charset=utf-8",
  html: "text/html; charset=utf-8",
  pdf: "application/pdf",
};

const EXTENSIONS: Record<string, string> = {
  excel: "xlsx",
  csv: "csv",
  html: "html",
  pdf: "pdf",
};

export const reportExportWorker = new Worker<ExportJobData>(
  "report-export",
  async (job: Job<ExportJobData>) => {
    const {
      taskId,
      tenantId,
      userId,
      reportCode,
      exportType,
      input,
      filename,
    } = job.data;

    const start = Date.now();

    try {
      // ── 1. 状态：processing ──
      await updateTask(taskId, {
        status: "processing",
        progress: 10,
        started_at: new Date(),
      });

      // ── 2. 执行报表 ──
      const result = await reportEngine.execute({
        reportCode,
        tenantId,
        userId,
        username: "",
        input,
        useCache: false,
      });

      await updateTask(taskId, { progress: 50, row_count: result.total });

      // ── 3. 生成文件 ──
      const buffer = await buildFile(exportType, result);
      await updateTask(taskId, { progress: 80 });

      // ── 4. 上传 ──
      const ext = EXTENSIONS[exportType];
      const objectKey = `reports/${tenantId}/${taskId}.${ext}`;
      const uploadResult = await uploadBuffer({
        tenantId,
        key: objectKey,
        body: buffer,
        contentType: CONTENT_TYPES[exportType],
      });

      const duration = Date.now() - start;
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

      // ── 5. 完成 ──
      await updateTask(taskId, {
        status: "completed",
        progress: 100,
        file_url: uploadResult.url,
        file_name: filename ?? `${result.reportName}.${ext}`,
        file_size: BigInt(uploadResult.size),
        duration_ms: duration,
        completed_at: new Date(),
        expires_at: expiresAt,
        error_msg: null,
        error_type: null,
        next_retry_at: null,
      });

      // ── 6. 埋点 ──
      rpExportTotal.labels(tenantId, reportCode, exportType, "success").inc();
      rpExportDuration.labels(exportType).observe(duration / 1000);

      // ── 7. 通知 ──
      await reportNotifyService
        .notifyExportCompleted({
          tenantId,
          userId,
          taskId,
          reportCode,
          reportName: result.reportName,
          exportType,
          status: "completed",
          fileName: filename ?? `${result.reportName}.${ext}`,
          fileUrl: uploadResult.url,
          fileSize: uploadResult.size,
          rowCount: result.total,
          duration,
        })
        .catch(() => undefined);

      logger.info(
        { taskId, reportCode, rowCount: result.total, duration },
        "[export] 任务完成",
      );

      return { fileUrl: uploadResult.url, rowCount: result.total };
    } catch (err: any) {
      const duration = Date.now() - start;

      // ⭐ 错误分类
      const errorInfo = classifyExportError(err);

      // 查当前重试次数
      const task = await prisma.rp_export_task.findUnique({
        where: { task_id: taskId },
        select: { retry_count: true, max_retries: true, report_code: true },
      });

      const currentRetry = task?.retry_count ?? 0;
      const maxRetries = task?.max_retries ?? 3;
      const isRetryable = errorInfo.type !== ExportErrorType.FATAL;
      const canRetry = isRetryable && currentRetry < maxRetries;

      if (canRetry) {
        // ⭐ 计算下次重试时间
        const delayMs = errorInfo.retryAfterMs ?? calcRetryDelay(currentRetry);
        const nextRetryAt = new Date(Date.now() + delayMs);

        await updateTask(taskId, {
          status: "pending",
          progress: 0,
          retry_count: currentRetry + 1,
          next_retry_at: nextRetryAt,
          error_msg: errorInfo.message,
          error_type: errorInfo.type,
          error_stack: (err.stack ?? "").slice(0, 2000),
        });

        rpExportRetryTotal.labels(exportType, "scheduled").inc();

        logger.warn(
          {
            taskId,
            errorType: errorInfo.type,
            retryCount: currentRetry + 1,
            maxRetries,
            nextRetryAt,
            delayMs,
          },
          "[export] 任务将重试",
        );

        // 抛出以便 BullMQ 标记为失败，但通过 delay 入队
        throw new Error(`[RETRY] ${errorInfo.message}`);
      }

      // ⭐ 不可重试 / 超过最大重试次数
      await updateTask(taskId, {
        status: "failed",
        error_msg: errorInfo.message,
        error_type: errorInfo.type,
        error_stack: (err.stack ?? "").slice(0, 2000),
        duration_ms: duration,
        completed_at: new Date(),
        next_retry_at: null,
      });

      rpExportTotal.labels(tenantId, reportCode, exportType, "failed").inc();
      rpExportRetryTotal.labels(exportType, "exhausted").inc();

      // ⭐ 通知失败
      await reportNotifyService
        .notifyExportCompleted({
          tenantId,
          userId,
          taskId,
          reportCode,
          reportName: task?.report_code ?? reportCode,
          exportType,
          status: "failed",
          errorMsg: errorInfo.message,
        })
        .catch(() => undefined);

      logger.error(
        {
          err,
          taskId,
          errorType: errorInfo.type,
          retryCount: currentRetry,
        },
        "[export] 任务最终失败",
      );

      throw err;
    }
  },
  {
    connection: createBullConnection("report-export"),
    concurrency: 3,
    limiter: { max: 10, duration: 1000 },
  },
);

/* ============================================================
 * 内部方法
 * ============================================================ */
async function buildFile(exportType: string, result: any): Promise<Buffer> {
  switch (exportType) {
    case "excel":
      return ExcelExporter.export({
        title: result.reportName,
        sheetName: result.reportName,
        columns: result.columns,
        rows: result.rows,
        summary: result.summary,
      });
    case "csv":
      return Buffer.from(
        CsvExporter.export({ columns: result.columns, rows: result.rows }),
        "utf-8",
      );
    case "html":
      return Buffer.from(
        HtmlExporter.export({
          title: result.reportName,
          columns: result.columns,
          rows: result.rows,
          summary: result.summary,
        }),
        "utf-8",
      );
    case "pdf":
      return PdfExporter.export({
        title: result.reportName,
        columns: result.columns,
        rows: result.rows,
        summary: result.summary,
        fontPath: process.env.PDF_FONT_PATH,
      });
    default:
      throw new Error(`不支持的导出类型：${exportType}`);
  }
}

async function updateTask(taskId: string, data: any): Promise<void> {
  await prisma.rp_export_task.update({
    where: { task_id: taskId },
    data,
  });
}

export default reportExportWorker;
