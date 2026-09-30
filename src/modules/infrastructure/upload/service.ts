import path from "path";
import fs from "fs/promises";
import { createReadStream } from "fs";
import { randomUUID } from "crypto";
import { FileRepository } from "../file/repository.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { env } from "@/config/env.js";
import { prisma } from "@/config/database.js";
import { mergeQueue } from "./queue.js";
import { Job, UnrecoverableError } from "bullmq";
import { getFileCategory } from "./file-category.js";
import dayjs from "dayjs";
import { publishUploadNotify } from "@/platform/ws/upload-notify.js";
import { createStorage } from "@/platform/storage/factory.js";
import type { IStorage, StorageConfig } from "@/platform/storage/types.js";
import { SettingsService } from "@/modules/system/setting/service.js";

export const UPLOAD_ROOT =
  env.UPLOAD_ROOT || path.join(process.cwd(), "uploads");
export const TEMP_DIR = path.join(UPLOAD_ROOT, "temp");
export const FINAL_DIR = path.join(UPLOAD_ROOT, "files");

export type MergeTaskStatus = {
  /* 同原 */
};
export interface UploadingTaskItem {
  /* 同原 */
}

export class UploadService {
  private readonly settingsService = new SettingsService();

  constructor(private readonly fileRepo: FileRepository) {}

  /* ============================================================
   * ⭐ 按租户拿 storage 实例
   * ============================================================ */
  private async getStorage(tenantId: string): Promise<IStorage> {
    // ⭐ 用 raw 版本拿真实值
    const cfg = await this.settingsService.getUploadConfigRaw(tenantId);

    const storageCfg: StorageConfig = {
      storage: cfg.storage as any,
      localPath: cfg.localPath,
      localUrl: cfg.localUrl,
      endpoint: cfg.minioEndpoint || cfg.ossEndpoint || undefined,
      port: cfg.minioPort,
      useSSL: cfg.minioUseSSL,
      region: cfg.minioRegion || cfg.ossRegion || cfg.cosRegion || cfg.s3Region,
      bucket: cfg.minioBucket || cfg.ossBucket || cfg.cosBucket || cfg.s3Bucket,
      accessKeyId:
        cfg.minioAccessKey ||
        cfg.ossAccessKeyId ||
        cfg.cosSecretId ||
        cfg.s3AccessKeyId,
      accessKeySecret:
        cfg.minioSecretKey || // ⭐ 真实值
        cfg.ossAccessKeySecret ||
        cfg.cosSecretKey ||
        cfg.s3AccessKeySecret ||
        undefined,
      customDomain:
        cfg.minioPublicUrl ||
        cfg.ossCustomDomain ||
        cfg.cosCustomDomain ||
        cfg.s3CustomDomain,
    };

    return createStorage(tenantId, storageCfg);
  }

  async ensureDirs() {
    for (const dir of [UPLOAD_ROOT, TEMP_DIR, FINAL_DIR]) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /* ============================================================
   * 简单上传
   * ============================================================ */
  async saveSimpleFile(params: {
    originalName: string;
    buffer: Buffer;
    mimeType: string;
    size: number;
    tenantId: string;
    userId?: string;
  }) {
    const storage = await this.getStorage(params.tenantId);

    const ext = path.extname(params.originalName);
    const baseName = path.basename(params.originalName, ext);
    const safeFileName = `${baseName}_${Date.now()}${ext}`;
    const key = `files/${safeFileName}`;

    await storage.putObject({
      key,
      body: params.buffer,
      contentType: params.mimeType,
      contentLength: params.size,
    });

    const category = getFileCategory(params.mimeType, params.originalName);
    const url = storage.buildPublicUrl(key);

    const record = await this.fileRepo.createFromUpload({
      filename: safeFileName,
      url,
      size: params.size,
      mimeType: params.mimeType,
      uploader: params.userId,
      tenantId: params.tenantId,
      category,
    });

    return {
      fileId: record.file_id,
      filename: record.filename,
      url: record.url,
      size: record.size,
    };
  }

  /* ============================================================
   * 分片检查
   * ============================================================ */
  async checkChunks(uploadId: string) {
    const dir = path.join(TEMP_DIR, uploadId);
    try {
      const files = await fs.readdir(dir);
      const uploaded = files
        .filter((f) => f.startsWith("chunk-"))
        .map((f) => parseInt(f.replace("chunk-", ""), 10))
        .filter((n) => Number.isInteger(n));
      return { uploaded };
    } catch {
      return { uploaded: [] };
    }
  }

  /* ============================================================
   * 删除物理文件
   * ============================================================ */
  async removeFile(url: string, tenantId: string) {
    const storage = await this.getStorage(tenantId);
    const key = storage.keyFromUrl(url);
    if (!key) throw new AppError("无法从 URL 解析文件 Key", 400002, 400);
    await storage.deleteObject(key);
  }

  async cleanTempDirs(olderThanHours = 24): Promise<number> {
    const dirs = await fs.readdir(TEMP_DIR).catch(() => []);
    const now = Date.now();
    let cleaned = 0;
    for (const dir of dirs) {
      const fullPath = path.join(TEMP_DIR, dir);
      const stat = await fs.stat(fullPath).catch(() => null);
      if (stat && now - stat.mtimeMs > olderThanHours * 3600 * 1000) {
        await fs.rm(fullPath, { recursive: true, force: true });
        cleaned++;
      }
    }
    logger.info({ cleaned }, "[upload] temp dirs cleaned");
    return cleaned;
  }

  async findByUrl(url: string, tenantId: string) {
    return (
      (await prisma.sys_file.findFirst({
        where: { url, tenant_id: tenantId },
      })) ?? null
    );
  }

  async findByFileId(fileId: string, tenantId: string) {
    return prisma.sys_file.findFirst({
      where: { file_id: fileId, tenant_id: tenantId, is_deleted: 0 },
    });
  }

  async softDelete(fileId: string) {
    return prisma.sys_file.update({
      where: { file_id: fileId },
      data: { updated_at: new Date(), is_deleted: 1 },
    });
  }

  /* ============================================================
   * 触发合并任务
   * ============================================================ */
  async triggerMerge(params: {
    uploadId: string;
    fileName: string;
    totalChunks: number;
    tenantId: string;
    userId?: string;
    mimeType?: string;
  }): Promise<{ taskId: string; status: string }> {
    const existing = await prisma.sys_upload_task.findFirst({
      where: {
        upload_id: params.uploadId,
        tenant_id: params.tenantId,
        user_id: params.userId,
        status: { in: ["pending", "merging", "uploading", "completed"] },
      },
      orderBy: { created_at: "desc" },
    });
    if (existing) return { taskId: existing.task_id, status: existing.status };

    const task = await prisma.sys_upload_task.create({
      data: {
        upload_id: params.uploadId,
        file_name: params.fileName,
        total_chunks: params.totalChunks,
        status: "pending",
        progress: 0,
        tenant_id: params.tenantId,
        user_id: params.userId,
      },
    });

    await mergeQueue.add(
      "merge",
      { ...params, taskId: task.task_id },
      { jobId: task.task_id },
    );

    return { taskId: task.task_id, status: "pending" };
  }

  /* ============================================================
   * 后台合并任务
   * ============================================================ */
  async runMergeTask(
    taskId: string,
    params: {
      uploadId: string;
      fileName: string;
      totalChunks: number;
      tenantId: string;
      userId?: string;
      mimeType?: string;
    },
    job?: Job,
  ) {
    const update = async (data: Record<string, any>, progress?: number) => {
      await prisma.sys_upload_task.update({
        where: { task_id: taskId },
        data: { ...data, updated_at: new Date() },
      });
      if (job && progress !== undefined) await job.updateProgress(progress);
    };

    const tempDir = path.join(TEMP_DIR, params.uploadId);
    let mergedPath: string | null = null;

    try {
      await update({ status: "merging" }, 5);

      try {
        await fs.access(tempDir);
      } catch {
        throw new AppError("上传临时目录不存在", 404001, 404);
      }

      await this.ensureDirs();

      const ext = path.extname(params.fileName);
      const baseName = path.basename(params.fileName, ext);
      const safeFileName = `${baseName}_${Date.now()}${ext}`;
      const mergedFileName = `${randomUUID()}${ext}`;
      mergedPath = path.join(FINAL_DIR, mergedFileName);
      const key = `files/${mergedFileName}`;

      // ===== 1. 合并本地分片 =====
      const step = Math.max(1, Math.floor(params.totalChunks / 10));
      for (let i = 0; i < params.totalChunks; i++) {
        if (i % 10 === 0 && (await this.isCancelled(taskId))) {
          throw new AppError("任务已被用户取消", 400004, 400);
        }
        const chunkPath = path.join(tempDir, `chunk-${i}`);
        let data: Buffer;
        try {
          data = await fs.readFile(chunkPath);
        } catch {
          throw new AppError(`缺失分片 ${i}`, 400001, 400);
        }
        await fs.appendFile(mergedPath, data);
        if (i % step === 0) {
          const p = 5 + Math.floor((i / params.totalChunks) * 40);
          await update({}, p);
        }
      }

      const stat = await fs.stat(mergedPath);

      // ===== 2. ⭐ 按配置上传到目标存储 =====
      await update({ status: "uploading" }, 50);

      if (await this.isCancelled(taskId)) {
        throw new AppError("任务已被用户取消", 400004, 400);
      }

      const storage = await this.getStorage(params.tenantId);

      await storage.putObject({
        key,
        body: createReadStream(mergedPath),
        contentLength: stat.size,
        contentType: params.mimeType,
      });

      await update({}, 90);

      // ===== 3. 落库 =====
      const url = storage.buildPublicUrl(key);
      const category = getFileCategory(params.mimeType, params.fileName);

      if (await this.isCancelled(taskId)) {
        throw new AppError("任务已被用户取消", 400004, 400);
      }

      const record = await this.fileRepo.createFromUpload({
        filename: safeFileName,
        url,
        size: stat.size,
        uploader: params.userId,
        tenantId: params.tenantId,
        category,
      });

      await update(
        {
          status: "completed",
          file_id: record.file_id,
          url: record.url,
          size: BigInt(record.size ?? stat.size),
        },
        100,
      );

      if (params.userId) {
        await publishUploadNotify({
          userId: params.userId,
          taskId,
          status: "completed",
          fileId: record.file_id,
          url: record.url,
          size: Number(record.size ?? stat.size),
          filename: safeFileName,
        });
      }

      logger.info(
        { taskId, fileId: record.file_id, storage: storage.type },
        "[merge] task completed",
      );

      return { fileId: record.file_id, url: record.url, size: record.size };
    } catch (e: any) {
      const isCancelled = e?.message?.includes("取消");
      logger.error({ err: e?.message, taskId }, "[merge] task failed");
      await update({
        status: isCancelled ? "cancelled" : "failed",
        error_msg: e?.message || "合并失败",
      });
      if (params.userId) {
        await publishUploadNotify({
          userId: params.userId,
          taskId,
          status: "failed",
          errorMsg: e?.message || "合并失败",
        });
      }
      if (isCancelled) throw new UnrecoverableError(e.message);
      throw e;
    } finally {
      const toCleanMerged = mergedPath;
      const toCleanTemp = tempDir;
      setImmediate(async () => {
        if (toCleanMerged)
          await fs.rm(toCleanMerged, { force: true }).catch(() => {});
        await fs
          .rm(toCleanTemp, { recursive: true, force: true })
          .catch(() => {});
      });
    }
  }

  /* ============================================================
   * 其余方法保持：getTaskStatus / cancelTasks / listUploadingTasks 等
   * ============================================================ */
  async getTaskStatus(
    taskId: string,
    tenantId: string,
  ): Promise<MergeTaskStatus> {
    const task = await prisma.sys_upload_task.findFirst({
      where: { task_id: taskId, tenant_id: tenantId },
    });
    if (!task) throw new AppError("任务不存在", 404003, 404);

    return {
      taskId: task.task_id,
      status: task.status,
      progress: task.progress,
      errorMsg: task.error_msg,
      fileId: task.file_id,
      url: task.url,
      size: task.size ? Number(task.size) : null,
    };
  }

  private async isCancelled(taskId: string): Promise<boolean> {
    const row = await prisma.sys_upload_task.findUnique({
      where: { task_id: taskId },
      select: { status: true },
    });
    return row?.status === "cancelled";
  }

  async listUploadingTasks(params: {
    userId: string;
    tenantId: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

    const statusList =
      params.status && params.status !== "all"
        ? [params.status]
        : ["pending", "merging", "uploading", "failed"];

    const where: any = {
      user_id: params.userId,
      tenant_id: params.tenantId,
      status: { in: statusList },
    };

    const [rows, total] = await Promise.all([
      prisma.sys_upload_task.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sys_upload_task.count({ where }),
    ]);

    const list = await Promise.all(
      rows.map((row) => this.buildUploadingItem(row)),
    );

    return { list, total, page, pageSize };
  }

  private async buildUploadingItem(row: any): Promise<UploadingTaskItem> {
    const tempDir = path.join(TEMP_DIR, row.upload_id);
    let uploadedChunks = 0;
    let uploadedSize = 0;

    try {
      const files = await fs.readdir(tempDir);
      const chunkFiles = files.filter((f) => f.startsWith("chunk-"));
      const stats = await Promise.all(
        chunkFiles.map(async (f) => {
          try {
            return (await fs.stat(path.join(tempDir, f))).size;
          } catch {
            return 0;
          }
        }),
      );
      uploadedChunks = chunkFiles.length;
      uploadedSize = stats.reduce((a, b) => a + b, 0);
    } catch {
      /* ignore */
    }

    return {
      taskId: row.task_id,
      uploadId: row.upload_id,
      fileName: row.file_name,
      totalChunks: row.total_chunks,
      status: row.status,
      progress: row.progress,
      uploadedChunks,
      totalSize: row.size ? Number(row.size) : 0,
      uploadedSize,
      errorMsg: row.error_msg,
      createdAt: dayjs(row.created_at).format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: dayjs(row.updated_at).format("YYYY-MM-DD HH:mm:ss"),
    };
  }

  async cancelTasks(params: {
    taskIds: string[];
    userId: string;
    tenantId: string;
  }) {
    const tasks = await prisma.sys_upload_task.findMany({
      where: {
        task_id: { in: params.taskIds },
        user_id: params.userId,
        tenant_id: params.tenantId,
        status: { in: ["pending", "merging", "uploading", "failed"] },
      },
      select: { task_id: true, upload_id: true },
    });

    let cancelled = 0;
    for (const t of tasks) {
      await prisma.sys_upload_task.update({
        where: { task_id: t.task_id },
        data: { status: "cancelled", error_msg: "用户已取消" },
      });

      try {
        const job = await mergeQueue.getJob(t.task_id);
        if (job) await job.remove();
      } catch {
        /* ignore */
      }

      const tempDir = path.join(TEMP_DIR, t.upload_id);
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      cancelled++;
    }

    return { cancelled };
  }

  /* ============================================================
   * 预览/下载 URL
   * ============================================================ */
  async buildPreviewUrl(url: string, tenantId: string, expiresSec = 900) {
    const storage = await this.getStorage(tenantId);
    const key = storage.keyFromUrl(url);
    if (!key) throw new AppError("无法从 URL 解析文件 Key", 400002, 400);

    return storage.presignedUrl({
      key,
      expiresSec,
      responseContentDisposition: "inline",
    });
  }

  async buildDownloadUrl(
    url: string,
    fileName: string,
    tenantId: string,
    expiresSec = 900,
  ) {
    const storage = await this.getStorage(tenantId);
    const key = storage.keyFromUrl(url);
    if (!key) throw new AppError("无法从 URL 解析文件 Key", 400002, 400);

    const safeName = encodeURIComponent(fileName.replace(/[\r\n"]/g, ""));
    return storage.presignedUrl({
      key,
      expiresSec,
      responseContentDisposition: `attachment; filename*=UTF-8''${safeName}`,
    });
  }
}
