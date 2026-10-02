import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { uploadBuffer } from "@/platform/storage/index.js";
import { generateExcel, type ExcelColumn } from "@/platform/excel/service.js";
import { ExportRepository } from "./repository.js";
import { getExportHandler } from "./handlers/index.js";

const DEFAULT_EXPIRES_DAYS = 7;
const MAX_ROWS = 100_000; // 单次导出上限，防止内存爆炸

export class ExportExecutor {
  constructor(private repo: ExportRepository) {}

  async execute(taskId: string): Promise<void> {
    const task = await this.repo.findById(taskId);
    if (!task) throw new Error(`Export task ${taskId} not found`);
    if (task.status !== "pending") return;

    const startedAt = new Date();
    await this.repo.update(taskId, {
      status: "processing",
      started_at: startedAt,
      progress: 5,
    });

    try {
      const handler = getExportHandler(task.biz_type);

      // 1. 执行 handler，拿到流式 rows
      const result = await handler.execute({
        taskId,
        tenantId: task.tenant_id,
        userId: task.user_id,
        queryParams: (task.query_params as Record<string, any>) ?? {},
        columns: (task.columns as string[]) ?? undefined,
      });

      // 2. 分页收集 rows（避免一次性拉全表）
      const rows = await this.collectRows(
        result.rows,
        taskId,
        result.totalCount,
      );

      await this.repo.update(taskId, { progress: 60, row_count: rows.length });

      // 3. ⭐ 用项目现有 generateExcel 生成 Buffer（表头由 columns 保证）
      const cols: ExcelColumn[] = this.pickColumns(
        handler.columns,
        result.rows,
        task,
      );
      const buffer = generateExcel(rows, cols, result.fileBaseName);

      await this.repo.update(taskId, { progress: 90 });

      // 4. 上传
      const ext = task.export_format;
      const contentType =
        ext === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : ext === "csv"
            ? "text/csv; charset=utf-8"
            : "application/json";

      const objectKey = `exports/${task.tenant_id}/${taskId}.${ext}`;
      const uploadResult = await uploadBuffer({
        tenantId: task.tenant_id,
        key: objectKey,
        body: buffer,
        contentType,
      });

      const durationMs = Date.now() - startedAt.getTime();
      const expiresAt = new Date(
        Date.now() + DEFAULT_EXPIRES_DAYS * 86_400_000,
      );

      await this.repo.update(taskId, {
        status: "completed",
        progress: 100,
        row_count: rows.length,
        file_url: uploadResult.url,
        file_name: buildExportFileName(handler.label, task.user_id, ext),
        file_size: BigInt(buffer.length),
        duration_ms: durationMs,
        completed_at: new Date(),
        expires_at: expiresAt,
      });

      logger.info(
        { taskId, bizType: task.biz_type, rowCount: rows.length, durationMs },
        "[export] completed",
      );
    } catch (err: any) {
      const currentRetry = task.retry_count ?? 0;
      const maxRetries = task.max_retries ?? 3;
      const canRetry =
        currentRetry < maxRetries && err?.name !== "TooManyRowsError";

      await this.repo.update(taskId, {
        status: canRetry ? "pending" : "failed",
        retry_count: canRetry ? currentRetry + 1 : currentRetry,
        error_msg: (err?.message ?? "unknown").slice(0, 1000),
        error_type: err?.name ?? "Error",
        error_stack: (err?.stack ?? "").slice(0, 2000),
        started_at: canRetry ? null : startedAt,
        completed_at: canRetry ? null : new Date(),
      });

      logger.error({ err, taskId, willRetry: canRetry }, "[export] failed");
      if (canRetry) throw err;
    }
  }

  /* ============================================================
   * 分页收集（带进度 + 上限）
   * ============================================================ */
  private async collectRows(
    gen: AsyncGenerator<Record<string, any>>,
    taskId: string,
    total?: number,
  ): Promise<Record<string, any>[]> {
    const out: Record<string, any>[] = [];
    for await (const row of gen) {
      out.push(row);
      if (out.length > MAX_ROWS) {
        const e: any = new Error(
          `导出结果超过 ${MAX_ROWS} 行，请收窄查询条件后再试`,
        );
        e.name = "TooManyRowsError";
        throw e;
      }
      // 每 1000 行更新一次进度（5% ~ 55%）
      if (out.length % 1000 === 0) {
        const pct = total
          ? Math.min(55, Math.floor((out.length / total) * 50) + 5)
          : 30;
        await this.repo.update(taskId, {
          progress: pct,
          row_count: out.length,
        });
      }
    }
    return out;
  }

  /* ============================================================
   * 列裁剪：如果任务指定了 columns 子集，只保留这些列
   * ============================================================ */
  private pickColumns(
    handlerCols: ExcelColumn[],
    _rows: AsyncGenerator<Record<string, any>>,
    task: any,
  ): ExcelColumn[] {
    const requested = (task.columns as string[] | null) ?? null;
    if (!requested || requested.length === 0) return handlerCols;
    const set = new Set(requested);
    const filtered = handlerCols.filter((c) => set.has(c.key));
    return filtered.length > 0 ? filtered : handlerCols;
  }
}
export function buildExportFileName(
  label: string,
  userId: string,
  ext: string,
): string {
  const ts = formatTimestamp(new Date());
  const suffix = userId.replace(/-/g, "").slice(-6);
  const safeLabel = sanitizeLabel(label);
  return `${safeLabel}_${ts}_${suffix}.${ext}`;
}

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

/** 去掉文件名里的非法字符（Windows / 跨平台兼容） */
function sanitizeLabel(label: string): string {
  return (label || "导出")
    .replace(/[\\/:*?"<>|\r\n\t]/g, "_") // 非法字符
    .replace(/\s+/g, "") // 去空格
    .slice(0, 30); // 防止过长
}
