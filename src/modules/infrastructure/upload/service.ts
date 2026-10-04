import path from "path";
import fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import { createHash, randomUUID } from "crypto";
import { FileRepository } from "../file/repository.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { env } from "@/config/env.js";
import { prisma } from "@/config/database.js";
import { Job, UnrecoverableError } from "bullmq";
import { getFileCategory } from "./file-category.js";
import dayjs from "dayjs";
import { publishUploadNotify } from "@/platform/ws/upload-notify.js";
import { buildClient } from "@/platform/storage/factory.js";
import type { IStorage, StorageConfig } from "@/platform/storage/types.js";
import { SettingsService } from "@/modules/system/setting/service.js";
import { ThrottleStream } from "@/platform/storage/throttle-stream.js";
import { mergeQueue } from "@/platform/queue/queues.js";

export const UPLOAD_ROOT = env.UPLOAD_ROOT || path.join(process.cwd(), "uploads");
export const TEMP_DIR = path.join(UPLOAD_ROOT, "temp");
export const FINAL_DIR = path.join(UPLOAD_ROOT, "files");
const MULTIPART_PART_SIZE = 8 * 1024 * 1024;
const THROTTLE_BPS = Number(env.UPLOAD_THROTTLE_BPS ?? 0);
const PRESIGN_EXPIRES_SEC = 2 * 60 * 60; // 2 小时
export interface MergeTaskStatus {
  taskId: string;
  status: string;
  progress: number;
  errorMsg?: string | null;
  fileId?: string | null;
  url?: string | null;
  size?: number | null;
}

export interface UploadingTaskItem {
  taskId: string;
  uploadId: string;
  fileName: string;
  totalChunks: number;
  status: string;
  progress: number;
  uploadedChunks: number;
  totalSize: number;
  uploadedSize: number;
  errorMsg?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadChunkInput {
  uploadId: string;
  index: number;
  totalChunks: number;
  buffer: Buffer;
  mimeType?: string;
  tenantId: string;
  userId?: string;
  fileName: string;
  fileSize?: number;
}
export interface CheckChunksResult {
  uploadedChunks: number[];
  uploadedBytes: number;
}
export interface MultipartInitServiceInput {
  tenantId: string;
  userId?: string;
  filename: string;
  fileSize: number;
  mimeType?: string;
  fileHash: string;
  totalChunks: number;
}

export interface MultipartInitServiceResult {
  uploadId: string;
  fileKey: string;
  parts: Array<{ partNumber: number; url: string }>;
  expiresIn: number;
}

export interface MultipartCompleteServiceInput {
  tenantId: string;
  userId?: string;
  uploadId: string;
  fileKey: string;
  filename: string;
  fileSize: number;
  mimeType?: string;
  fileHash: string;
  parts: Array<{ partNumber: number; etag: string }>;
}
const CHUNK_PREFIX = "chunks";
const FILE_PREFIX = "files";
export function chunkKey(uploadId: string, index: number): string {
  return `${CHUNK_PREFIX}/${uploadId}/chunk-${String(index).padStart(6, "0")}`;
}
export function chunkPrefix(uploadId: string): string {
  return `${CHUNK_PREFIX}/${uploadId}/`;
}
export function parseChunkIndex(key: string): number {
  const m = /\/chunk-(\d+)$/.exec(key);
  return m ? Number(m[1]) : -1;
}
export class UploadService {
  private readonly settingsService = new SettingsService();

  constructor(private readonly fileRepo: FileRepository) {}
  async saveChunk(input: UploadChunkInput): Promise<void> {
    // ⭐ 防御：buffer 必须存在
    if (!input.buffer || !Buffer.isBuffer(input.buffer)) {
      throw new AppError("分片内容不能为空", 400001, 400);
    }

    if (input.buffer.length === 0) {
      throw new AppError("分片内容长度为 0", 400001, 400);
    }

    const storage = await this.getStorage(input.tenantId);
    const key = chunkKey(input.uploadId, input.index);

    // 幂等：已存在则跳过
    const exists = await storage.exists(key);
    if (exists) {
      logger.debug(
        { uploadId: input.uploadId, index: input.index },
        "[upload] chunk already exists, skip",
      );
      return;
    }

    await storage.putObject({
      key,
      body: input.buffer,
      contentType: input.mimeType ?? "application/octet-stream",
      contentLength: input.buffer.length, // ✅ 现在安全了
    });

    logger.debug(
      {
        uploadId: input.uploadId,
        index: input.index,
        size: input.buffer.length,
      },
      "[upload] chunk saved",
    );
  }
  /* ============================================================
   * ⭐ 按租户拿 storage 实例
   * ============================================================ */
  private async getStorage(tenantId: string): Promise<IStorage> {
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
      accessKeyId: cfg.minioAccessKey || cfg.ossAccessKeyId || cfg.cosSecretId || cfg.s3AccessKeyId,
      accessKeySecret:
        cfg.minioSecretKey ||
        cfg.ossAccessKeySecret ||
        cfg.cosSecretKey ||
        cfg.s3AccessKeySecret ||
        undefined,
      customDomain:
        cfg.minioPublicUrl || cfg.ossCustomDomain || cfg.cosCustomDomain || cfg.s3CustomDomain,
    };

    return buildClient(storageCfg.storage, storageCfg);
  }

  async ensureDirs() {
    for (const dir of [UPLOAD_ROOT, TEMP_DIR, FINAL_DIR]) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
  async cleanChunks(uploadId: string, tenantId: string): Promise<number> {
    const storage = await this.getStorage(tenantId);
    const objects = await storage.listObjects({
      prefix: chunkPrefix(uploadId),
      maxKeys: 10000,
    });
    if (objects.length === 0) return 0;
    await storage.deleteObjects(objects.map((o) => o.key));
    return objects.length;
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
  async checkChunks(
    uploadId: string,
    tenantId: string,
    expectedTotalChunks?: number,
  ): Promise<CheckChunksResult> {
    const storage = await this.getStorage(tenantId);

    const objects = await storage.listObjects({
      prefix: chunkPrefix(uploadId),
      maxKeys: expectedTotalChunks ?? 10000,
    });

    const uploadedChunks: number[] = [];
    let uploadedBytes = 0;

    for (const o of objects) {
      const idx = parseChunkIndex(o.key);
      if (idx >= 0) {
        uploadedChunks.push(idx);
        uploadedBytes += o.size;
      }
    }

    uploadedChunks.sort((a, b) => a - b);

    return { uploadedChunks, uploadedBytes };
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
    fileHash?: string;
    fileSize?: number;
  }): Promise<{ taskId: string; status: string }> {
    const STALE_MS = 10 * 60_000;
    const existing = await prisma.sys_upload_task.findFirst({
      where: {
        upload_id: params.uploadId,
        tenant_id: params.tenantId,
        user_id: params.userId,
        status: { in: ["pending", "merging", "uploading", "completed"] },
      },
      orderBy: { created_at: "desc" },
    });
    if (existing) {
      // completed：秒传，直接返回
      if (existing.status === "completed") {
        return { taskId: existing.task_id, status: "completed" };
      }

      // pending/merging/uploading：检查是否"新鲜"
      const age = Date.now() - existing.updated_at.getTime();
      if (age < STALE_MS) {
        return { taskId: existing.task_id, status: existing.status };
      }

      // ⭐ 僵尸任务：先标记失败，让新任务入队
      logger.warn(
        { taskId: existing.task_id, uploadId: params.uploadId, age },
        "[merge] stale task detected, marking failed",
      );
      await prisma.sys_upload_task.update({
        where: { task_id: existing.task_id },
        data: {
          status: "failed",
          error_msg: `任务超时未完成（${Math.round(age / 60000)} 分钟无更新）`,
          updated_at: new Date(),
        },
      });
    }
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

    await mergeQueue.add("merge", { ...params, taskId: task.task_id }, { jobId: task.task_id });

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
      fileHash?: string;
      fileSize?: number;
    },
    job?: Job,
  ) {
    const update = async (data: Record<string, any>, progress?: number) => {
      await prisma.sys_upload_task.update({
        where: { task_id: taskId },
        data: {
          ...data,
          updated_at: new Date(),
          ...(job ? { attempts: job.attemptsMade + 1 } : {}),
        },
      });
      if (job && progress !== undefined) await job.updateProgress(progress);

      if (params.userId) {
        await publishUploadNotify({
          userId: params.userId,
          taskId,
          // ⭐ 不传 status 就不推，避免 progress 更新把 merging 刷屏
          status: data.status ?? undefined,
          progress: progress ?? data.progress,
          errorMsg: data.error_msg,
          fileId: data.file_id,
          url: data.url,
          size: data.size ? Number(data.size) : undefined,
        }).catch(() => undefined);
      }
    };

    let mergedPath: string | null = null;

    try {
      await update({ status: "merging" }, 0);

      const storage = await this.getStorage(params.tenantId);

      /* ---------- 1. 检查所有分片 ---------- */
      const { uploadedChunks } = await this.checkChunks(
        params.uploadId,
        params.tenantId,
        params.totalChunks,
      );

      if (uploadedChunks.length !== params.totalChunks) {
        const missing: number[] = [];
        for (let i = 0; i < params.totalChunks; i++) {
          if (!uploadedChunks.includes(i)) missing.push(i);
        }
        throw new AppError(
          `分片不完整，缺失：${missing.slice(0, 20).join(", ")}${missing.length > 20 ? "..." : ""}`,
          400001,
          400,
        );
      }

      /* ---------- 2. 流式下载 + 合并 ---------- */
      await this.ensureDirs();

      const ext = path.extname(params.fileName);
      const baseName = path.basename(params.fileName, ext);
      const safeFileName = `${baseName}_${Date.now()}${ext}`;
      const mergedFileName = `${randomUUID()}${ext}`;
      mergedPath = path.join(FINAL_DIR, mergedFileName);

      const writeStream = createWriteStream(mergedPath);
      const hasher = createHash("md5");

      for (let i = 0; i < params.totalChunks; i++) {
        if (await this.isCancelled(taskId)) {
          throw new AppError("任务已被用户取消", 400004, 400);
        }

        const key = chunkKey(params.uploadId, i);
        const obj = await storage.getObject(key);

        await new Promise<void>((resolve, reject) => {
          obj.body.on("data", (chunk: Buffer) => hasher.update(chunk));
          obj.body.on("end", resolve);
          obj.body.on("error", reject);
          obj.body.pipe(writeStream, { end: false });
        });

        const p = 5 + Math.floor(((i + 1) / params.totalChunks) * 40);
        await update({}, p);
        if (i % 10 === 0) {
          logger.info(
            { taskId, chunk: i + 1, totalChunks: params.totalChunks, progress: p },
            "[merge] chunk progress",
          );
        }
      }

      await new Promise<void>((resolve, reject) => {
        writeStream.end((err: any) => (err ? reject(err) : resolve()));
      });

      const finalHash = hasher.digest("hex");

      /* ---------- 3. ⭐ 完整性校验（FATAL，不重试） ---------- */
      if (params.fileHash && params.fileHash !== finalHash) {
        // ⭐ 用 UnrecoverableError，BullMQ 不会重试
        throw new UnrecoverableError(
          `文件完整性校验失败：期望 ${params.fileHash.slice(0, 16)}... 实际 ${finalHash.slice(0, 16)}...`,
        );
      }

      const stat = await fs.stat(mergedPath);

      if (params.fileSize && stat.size !== params.fileSize) {
        throw new UnrecoverableError(`文件大小不一致：期望 ${params.fileSize}，实际 ${stat.size}`);
      }

      /* ---------- 4. 上传到对象存储 ---------- */
      await update({ status: "uploading" }, 50);

      if (await this.isCancelled(taskId)) {
        throw new AppError("任务已被用户取消", 400004, 400);
      }

      const objectKey = `${FILE_PREFIX}/${mergedFileName}`;

      await storage.putObject({
        key: objectKey,
        body: createReadStream(mergedPath),
        contentLength: stat.size,
        contentType: params.mimeType,
      });

      await update({}, 90);

      /* ---------- 5. 落库 + hash 索引 ---------- */
      const url = storage.buildPublicUrl(objectKey);
      const category = getFileCategory(params.mimeType, params.fileName);

      const record = await prisma.$transaction(async (tx) => {
        const file = await tx.sys_file.create({
          data: {
            tenant_id: params.tenantId,
            filename: safeFileName,
            url,
            size: stat.size,
            mime_type: params.mimeType,
            uploader: params.userId,
            category,
          },
        });

        // 秒传索引
        if (params.fileHash) {
          await tx.sys_file_hash.upsert({
            where: {
              tenant_id_hash: {
                tenant_id: params.tenantId,
                hash: params.fileHash,
              },
            },
            update: { file_id: file.file_id, size: BigInt(stat.size) },
            create: {
              tenant_id: params.tenantId,
              hash: params.fileHash,
              file_id: file.file_id,
              size: BigInt(stat.size),
              mime_type: params.mimeType,
              filename: params.fileName,
            },
          });
        }

        await tx.sys_upload_task.update({
          where: { task_id: taskId },
          data: {
            status: "completed",
            progress: 100,
            file_id: file.file_id,
            url: file.url,
            size: BigInt(stat.size),
            error_msg: null,
          },
        });

        return file;
      });

      /* ---------- 6. ⭐ 额外推一次 completed 完整数据 ---------- */
      if (params.userId) {
        await publishUploadNotify({
          userId: params.userId,
          taskId,
          status: "completed",
          progress: 100,
          fileId: record.file_id,
          url: record.url,
          size: Number(record.size ?? stat.size),
          filename: safeFileName,
        }).catch(() => undefined);
      }

      /* ---------- 7. 清理分片 ---------- */
      await this.cleanChunks(params.uploadId, params.tenantId).catch((err) => {
        logger.warn({ err, uploadId: params.uploadId }, "[merge] clean chunks failed");
      });

      logger.info({ taskId, fileId: record.file_id, hash: finalHash }, "[merge] task completed");

      return {
        fileId: record.file_id,
        url: record.url,
        size: record.size,
        hash: finalHash,
      };
    } catch (e: any) {
      const isCancelled = e?.message?.includes("取消");
      const isFatal = e instanceof UnrecoverableError;

      // ⭐ 先查一下当前状态，如果已经是 completed/failed 就不要再改
      const current = await prisma.sys_upload_task.findUnique({
        where: { task_id: taskId },
        select: { status: true },
      });

      // 只在任务未结束时更新
      if (current?.status !== "completed" && current?.status !== "failed") {
        await update({
          status: isCancelled ? "cancelled" : "failed",
          error_msg: e?.message || "合并失败",
          progress: 0,
        }).catch((err) => {
          logger.error({ err, taskId }, "[merge] update failed status error");
        });
      }

      logger.error(
        { err: e?.message, taskId, uploadId: params.uploadId, isFatal },
        "[merge] task failed",
      );

      // ⭐ FATAL 错误用 UnrecoverableError，BullMQ 不会重试
      if (isFatal) {
        throw e;
      }
      if (isCancelled) {
        throw new UnrecoverableError(e.message);
      }
      throw e;
    } finally {
      if (mergedPath) {
        const toClean = mergedPath;
        setImmediate(() => {
          fs.rm(toClean, { force: true }).catch(() => undefined);
        });
      }
    }
  }
  async getTaskStatus(taskId: string, tenantId: string): Promise<MergeTaskStatus> {
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

    const storage = await this.getStorage(params.tenantId);

    const list = await Promise.all(
      rows.map(async (row) => {
        // 从对象存储查分片
        let uploadedChunks = 0;
        let uploadedSize = 0;
        try {
          const { uploadedChunks: chunks, uploadedBytes } = await this.checkChunks(
            row.upload_id,
            params.tenantId,
            row.total_chunks,
          );
          uploadedChunks = chunks.length;
          uploadedSize = uploadedBytes;
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
      }),
    );

    return { list, total, page, pageSize };
  }

  async cancelTasks(params: { taskIds: string[]; userId: string; tenantId: string }) {
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

      // ⭐ 清理对象存储里的分片
      await this.cleanChunks(t.upload_id, params.tenantId).catch(() => undefined);
      cancelled++;
    }

    return { cancelled };
  }

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

  async buildDownloadUrl(url: string, fileName: string, tenantId: string, expiresSec = 900) {
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
  async initMultipartUpload(input: MultipartInitServiceInput): Promise<MultipartInitServiceResult> {
    const storage = await this.getStorage(input.tenantId);

    if (!storage.supportsMultipart || !storage.createMultipartUpload) {
      throw new AppError(`当前存储类型 ${storage.type} 不支持原生 Multipart 上传`, 400001, 400);
    }

    // 1) 生成对象 key
    const ext = path.extname(input.filename);
    const fileKey = `${FILE_PREFIX}/${randomUUID()}${ext}`;

    // 2) 创建 multipart upload
    const { uploadId } = await storage.createMultipartUpload({
      key: fileKey,
      contentType: input.mimeType,
    });

    // 3) 生成每个 part 的预签名 URL
    const parts: Array<{ partNumber: number; url: string }> = [];
    for (let i = 1; i <= input.totalChunks; i++) {
      const url = await storage.presignUploadPart!({
        key: fileKey,
        uploadId,
        partNumber: i,
        expiresSec: PRESIGN_EXPIRES_SEC,
      });
      parts.push({ partNumber: i, url });
    }

    // 4) 落库（记录进行中的 multipart，便于中止清理）
    await prisma.sys_upload_task.create({
      data: {
        upload_id: uploadId,
        file_name: input.filename,
        total_chunks: input.totalChunks,
        status: "uploading",
        progress: 0,
        tenant_id: input.tenantId,
        user_id: input.userId,
        url: fileKey, // 暂存 fileKey
        size: BigInt(input.fileSize),
      },
    });

    logger.info({ uploadId, fileKey, parts: parts.length }, "[multipart] init");

    return {
      uploadId,
      fileKey,
      parts,
      expiresIn: PRESIGN_EXPIRES_SEC,
    };
  }

  /* ============================================================
   * ⭐ 完成 Multipart
   * ============================================================ */
  async completeMultipartUpload(input: MultipartCompleteServiceInput): Promise<{
    fileId: string;
    url: string;
    size: number;
  }> {
    const storage = await this.getStorage(input.tenantId);

    if (!storage.completeMultipartUpload) {
      throw new AppError("存储不支持 Multipart", 400001, 400);
    }

    // 1) 完成 multipart（S3 内部合并）
    const { url } = await storage.completeMultipartUpload({
      key: input.fileKey,
      uploadId: input.uploadId,
      parts: input.parts,
    });

    // 2) 写入文件表 + hash 映射
    const category = getFileCategory(input.mimeType, input.filename);
    const safeName = `${path.basename(input.filename, path.extname(input.filename))}_${Date.now()}${path.extname(input.filename)}`;

    const record = await prisma.$transaction(async (tx) => {
      const file = await tx.sys_file.create({
        data: {
          tenant_id: input.tenantId,
          filename: safeName,
          url,
          size: input.fileSize,
          mime_type: input.mimeType,
          uploader: input.userId,
          category,
        },
      });

      // ⭐ 秒传：写 hash 映射
      await tx.sys_file_hash.upsert({
        where: {
          tenant_id_hash: {
            tenant_id: input.tenantId,
            hash: input.fileHash,
          },
        },
        update: {
          file_id: file.file_id,
          size: BigInt(input.fileSize),
        },
        create: {
          tenant_id: input.tenantId,
          hash: input.fileHash,
          file_id: file.file_id,
          size: BigInt(input.fileSize),
          mime_type: input.mimeType,
          filename: input.filename,
        },
      });

      // 更新任务状态
      await tx.sys_upload_task.update({
        where: { task_id: input.uploadId },
        data: {
          status: "completed",
          progress: 100,
          file_id: file.file_id,
          url,
          size: BigInt(input.fileSize),
        },
      });

      return file;
    });

    logger.info({ fileId: record.file_id, size: input.fileSize }, "[multipart] complete");

    return {
      fileId: record.file_id,
      url: record.url,
      size: record.size,
    };
  }

  /* ============================================================
   * ⭐ 中止 Multipart
   * ============================================================ */
  async abortMultipartUpload(input: {
    tenantId: string;
    uploadId: string;
    fileKey: string;
  }): Promise<void> {
    const storage = await this.getStorage(input.tenantId);

    try {
      await storage.abortMultipartUpload?.({
        key: input.fileKey,
        uploadId: input.uploadId,
      });
    } catch (err) {
      logger.warn({ err, uploadId: input.uploadId }, "[multipart] abort failed");
    }

    // 清理任务
    await prisma.sys_upload_task.updateMany({
      where: {
        upload_id: input.uploadId,
        tenant_id: input.tenantId,
        status: { in: ["pending", "uploading", "merging"] },
      },
      data: { status: "cancelled", error_msg: "用户已中止" },
    });
  }
  async checkInstantUpload(input: {
    tenantId: string;
    hash: string;
    size: number;
    filename: string;
  }): Promise<
    { hit: true; fileId: string; url: string; size: number; filename: string } | { hit: false }
  > {
    const row = await prisma.sys_file_hash.findUnique({
      where: {
        tenant_id_hash: {
          tenant_id: input.tenantId,
          hash: input.hash,
        },
      },
    });

    if (!row) return { hit: false };

    // 校验 size 一致（防冲突）
    if (Number(row.size) !== input.size) {
      logger.warn(
        { hash: input.hash, expected: input.size, actual: row.size },
        "[instant] size mismatch, fallback to normal upload",
      );
      return { hit: false };
    }

    const file = await prisma.sys_file.findUnique({
      where: { file_id: row.file_id },
    });

    if (!file || file.is_deleted === 1) {
      // 文件已被删除 → 清理失效的 hash 记录
      await prisma.sys_file_hash.delete({ where: { id: row.id } });
      return { hit: false };
    }

    // 增加引用计数
    await prisma.sys_file_hash.update({
      where: { id: row.id },
      data: { ref_count: { increment: 1 } },
    });

    logger.info({ hash: input.hash, fileId: file.file_id }, "[instant] hit");

    return {
      hit: true,
      fileId: file.file_id,
      url: file.url,
      size: Number(row.size),
      filename: input.filename,
    };
  }
  async softDelete(fileId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.sys_file.update({
        where: { file_id: fileId },
        data: { is_deleted: 1, updated_at: new Date() },
      });

      // ⭐ 递减引用计数，为 0 时删 hash 记录
      const hashes = await tx.sys_file_hash.findMany({
        where: { file_id: fileId },
      });

      for (const h of hashes) {
        if (h.ref_count <= 1) {
          await tx.sys_file_hash.delete({ where: { id: h.id } });
        } else {
          await tx.sys_file_hash.update({
            where: { id: h.id },
            data: { ref_count: { decrement: 1 } },
          });
        }
      }
    });
  }
}
