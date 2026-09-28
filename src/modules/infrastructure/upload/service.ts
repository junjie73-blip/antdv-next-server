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
import { FILE_BUCKET, ensureBucket } from "@/config/storage.js";
import {
  putBuffer,
  putStream,
  deleteObject,
  presignedGetUrl,
} from "@/platform/storge/s3.js";
import { publishUploadNotify } from "@/platform/ws/upload-notify.js";

export const UPLOAD_ROOT =
  env.UPLOAD_ROOT || path.join(process.cwd(), "uploads");
export const TEMP_DIR = path.join(UPLOAD_ROOT, "temp");
export const FINAL_DIR = path.join(UPLOAD_ROOT, "files");

export type MergeTaskStatus = {
  taskId: string;
  status: string;
  progress: number;
  errorMsg?: string | null;
  fileId?: string | null;
  url?: string | null;
  size?: number | null;
};

export interface UploadingTaskItem {
  taskId: string;
  uploadId: string;
  fileName: string;
  totalChunks: number;
  status: "pending" | "merging" | "uploading" | "failed";
  progress: number;
  uploadedChunks: number;
  totalSize: number;
  uploadedSize: number;
  errorMsg?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class UploadService {
  private readonly bucket: string;

  constructor(private readonly fileRepo: FileRepository) {
    this.bucket = FILE_BUCKET;
  }

  async ensureDirs() {
    for (const dir of [UPLOAD_ROOT, TEMP_DIR, FINAL_DIR]) {
      await fs.mkdir(dir, { recursive: true });
    }
    await ensureBucket(this.bucket);
  }

  /** 生成对外可访问的 URL（公开 bucket 用，或走 CDN / 反代时用） */
  private buildObjectUrl(key: string): string {
    const encodedKey = key.split("/").map(encodeURIComponent).join("/");

    // ★ 相对路径前缀（走 Nginx 反代）
    if (env.MINIO_PUBLIC_URL && env.MINIO_PUBLIC_URL.startsWith("/")) {
      const prefix = env.MINIO_PUBLIC_URL.replace(/\/+$/, "");
      return `${prefix}/${this.bucket}/${encodedKey}`;
    }

    // 绝对 URL 兜底（保留原逻辑）
    if (env.MINIO_PUBLIC_URL) {
      return `${env.MINIO_PUBLIC_URL.replace(/\/+$/, "")}/${encodedKey}`;
    }
    const protocol = env.MINIO_USE_SSL ? "https" : "http";
    const defaultPort = env.MINIO_USE_SSL ? 443 : 80;
    const portPart = env.MINIO_PORT === defaultPort ? "" : `:${env.MINIO_PORT}`;
    return `${protocol}://${env.MINIO_ENDPOINT}${portPart}/${this.bucket}/${encodedKey}`;
  }

  /** 从 URL 反解 MinIO Object Key（支持自定义域名、默认域名、旧本地路径） */
  private keyFromUrl(url: string): string | null {
    if (!url) return null;
    // ★ 相对前缀：/minio-api/antdv/files/xxx.jpg
    if (env.MINIO_PUBLIC_URL && env.MINIO_PUBLIC_URL.startsWith("/")) {
      const prefix = env.MINIO_PUBLIC_URL.replace(/\/+$/, "") + "/";
      if (url.startsWith(prefix)) {
        const rest = safeDecode(url.slice(prefix.length)); // antdv/files/xxx.jpg
        const bucketPrefix = `${this.bucket}/`;
        return rest.startsWith(bucketPrefix)
          ? rest.slice(bucketPrefix.length)
          : rest;
      }
    }

    // 自定义域名绝对 URL
    if (env.MINIO_PUBLIC_URL) {
      const prefix = env.MINIO_PUBLIC_URL.replace(/\/+$/, "") + "/";
      if (url.startsWith(prefix)) return safeDecode(url.slice(prefix.length));
    }

    // 标准 URL
    try {
      const u = new URL(url);
      const pathname = safeDecode(u.pathname.replace(/^\/+/, ""));
      const bucketPrefix = `${this.bucket}/`;
      if (pathname.startsWith(bucketPrefix))
        return pathname.slice(bucketPrefix.length);
      if (u.host !== `${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`) return pathname;
    } catch {}

    // 老本地路径兼容
    if (url.startsWith("/uploads/files/")) {
      return `files/${safeDecode(url.replace("/uploads/files/", ""))}`;
    }
    return null;
  }

  /** 简单上传（小文件）：Buffer → MinIO */
  private async putObject(
    key: string,
    body: Buffer,
    mimeType?: string,
  ): Promise<void> {
    await putBuffer({
      bucket: this.bucket,
      key,
      body,
      contentType: mimeType,
    });
  }

  /** 大文件：以流的方式上传，MinIO SDK 内部自动分片（multipart） */
  private async putObjectFromFile(
    key: string,
    filePath: string,
    mimeType?: string,
  ): Promise<void> {
    const stat = await fs.stat(filePath);
    await putStream({
      bucket: this.bucket,
      key,
      body: createReadStream(filePath),
      contentLength: stat.size, // ⭐ 必须，否则 SDK 会把流读全到内存
      contentType: mimeType,
    });
  }

  private async removeObject(key: string): Promise<void> {
    await deleteObject(key, this.bucket);
  }

  /** 生成预签名 URL */
  private async presignedUrl(
    key: string,
    options: {
      expiresSec: number;
      contentDisposition?: string;
      contentType?: string;
    },
  ): Promise<string> {
    const ext = key.includes(".")
      ? key.slice(key.lastIndexOf(".")).toLowerCase()
      : "";
    const contentType = options.contentType || this.getContentType(ext);

    return presignedGetUrl({
      bucket: this.bucket,
      key,
      expiresSec: options.expiresSec,
      responseContentType: contentType,
      responseContentDisposition: options.contentDisposition,
    });
  }

  // ==================== 业务方法 ====================

  /** 简单上传：Buffer → MinIO → 落库 */
  async saveSimpleFile(params: {
    originalName: string;
    buffer: Buffer;
    mimeType: string;
    size: number;
    tenantId: string;
    userId?: string;
  }) {
    const ext = path.extname(params.originalName);
    const baseName = path.basename(params.originalName, ext);
    const safeFileName = `${baseName}_${Date.now()}${ext}`;
    const key = `files/${safeFileName}`;

    await this.putObject(key, params.buffer, params.mimeType);

    const category = getFileCategory(params.mimeType, params.originalName);
    const url = this.buildObjectUrl(key);

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

  /** 检查已上传分片 */
  async checkChunks(uploadId: string): Promise<{ uploaded: number[] }> {
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

  /** 合并分片 → MinIO → 落库（同步版本，控制器里已不再使用，保留备用） */
  async mergeChunks(params: {
    uploadId: string;
    fileName: string;
    totalChunks: number;
    tenantId: string;
    userId?: string;
  }) {
    const tempDir = path.join(TEMP_DIR, params.uploadId);
    try {
      await fs.access(tempDir);
    } catch {
      throw new AppError("上传临时目录不存在", 404001, 404);
    }

    await this.ensureDirs();

    const ext = path.extname(params.fileName);
    const baseName = path.basename(params.fileName, ext);
    const safeFileName = `${baseName}_${Date.now()}${ext}`;
    const mergedPath = path.join(FINAL_DIR, safeFileName);
    const key = `files/${safeFileName}`;

    try {
      for (let i = 0; i < params.totalChunks; i++) {
        const chunkPath = path.join(tempDir, `chunk-${i}`);
        let data: Buffer;
        try {
          data = await fs.readFile(chunkPath);
        } catch {
          throw new AppError(`缺失分片 ${i}`, 400001, 400);
        }
        await fs.appendFile(mergedPath, data);
      }
    } catch (e) {
      await fs.rm(mergedPath, { force: true });
      throw e;
    }

    const stat = await fs.stat(mergedPath);

    try {
      await this.putObjectFromFile(key, mergedPath);
    } catch (e: any) {
      logger.error({ err: e?.message, key }, "[upload] MinIO 上传失败");
      throw new AppError("上传到 MinIO 失败", 500002, 500);
    } finally {
      await fs.rm(mergedPath, { force: true });
      await fs.rm(tempDir, { recursive: true, force: true });
    }

    const url = this.buildObjectUrl(key);
    const record = await this.fileRepo.createFromUpload({
      filename: safeFileName,
      url,
      size: stat.size,
      uploader: params.userId,
      tenantId: params.tenantId,
    });

    return {
      fileId: record.file_id,
      filename: record.filename,
      url: record.url,
      size: record.size,
    };
  }

  /** 删除物理文件（仅删 MinIO 对象，不动数据库记录） */
  async removeFile(url: string) {
    const key = this.keyFromUrl(url);
    if (!key) throw new AppError("无法从 URL 解析文件 Key", 400002, 400);
    await this.removeObject(key);
  }

  /** 清理 24 小时前的临时目录 */
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
    const row = await prisma.sys_file.findFirst({
      where: { url, tenant_id: tenantId },
    });
    return row ?? null;
  }

  async findByFileId(fileId: string, tenantId: string) {
    return prisma.sys_file.findFirst({
      where: { file_id: fileId, tenant_id: tenantId, is_deleted: 0 },
    });
  }

  async softDelete(fileId: string) {
    return await prisma.sys_file.update({
      where: { file_id: fileId },
      data: {
        updated_at: new Date(),
        is_deleted: 1,
      },
    });
  }

  /** 触发合并任务 */
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
        status: { in: ["pending", "merging", "uploading", "completed"] },
      },
      orderBy: { created_at: "desc" },
    });
    if (existing) {
      return { taskId: existing.task_id, status: existing.status };
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

    await mergeQueue.add(
      "merge",
      {
        taskId: task.task_id,
        uploadId: params.uploadId,
        fileName: params.fileName,
        totalChunks: params.totalChunks,
        tenantId: params.tenantId,
        userId: params.userId,
        mimeType: params.mimeType,
      },
      { jobId: task.task_id },
    );

    return { taskId: task.task_id, status: "pending" };
  }

  /** 真正的后台任务执行体 */
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
      if (job && progress !== undefined) {
        await job.updateProgress(progress);
      }
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

      // ===== 2. 上传 MinIO =====
      await update({ status: "uploading" }, 50);
      try {
        if (await this.isCancelled(taskId)) {
          throw new AppError("任务已被用户取消", 400004, 400);
        }
        await this.putObjectFromFile(key, mergedPath, params.mimeType);
      } catch (e: any) {
        logger.error({ err: e?.message, key }, "[merge] MinIO upload failed");
        throw new AppError("上传到 MinIO 失败", 500002, 500);
      }
      await update({}, 90);

      // ===== 3. 落库 =====
      const url = this.buildObjectUrl(key);
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
      logger.info({ taskId, fileId: record.file_id }, "[merge] task completed");
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
      if (isCancelled) {
        throw new UnrecoverableError(e.message);
      }
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

  /** 查询任务状态 */
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
  }): Promise<{
    list: UploadingTaskItem[];
    total: number;
    page: number;
    pageSize: number;
  }> {
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
            const st = await fs.stat(path.join(tempDir, f));
            return st.size;
          } catch {
            return 0;
          }
        }),
      );

      uploadedChunks = chunkFiles.length;
      uploadedSize = stats.reduce((a, b) => a + b, 0);
    } catch {
      // ignore
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
  }): Promise<{ cancelled: number }> {
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
        // ignore
      }

      const tempDir = path.join(TEMP_DIR, t.upload_id);
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

      cancelled++;
    }

    return { cancelled };
  }
  /**
   * 把 SDK 生成的绝对签名 URL 转成走 Nginx 反代的相对路径
   * 例：https://api.xxx.com/antdv/files/x.jpg?X-Amz-...
   *  →  /minio-api/antdv/files/x.jpg?X-Amz-...
   */
  private toRelativeUrl(signedUrl: string): string {
    // 没配相对前缀，原样返回（比如用 CDN 或直连 MinIO 时）
    if (!env.MINIO_PUBLIC_URL || !env.MINIO_PUBLIC_URL.startsWith("/")) {
      return signedUrl;
    }
    try {
      const u = new URL(signedUrl);
      const prefix = env.MINIO_PUBLIC_URL.replace(/\/+$/, ""); // /minio-api
      return `${prefix}${u.pathname}${u.search}`;
    } catch {
      return signedUrl;
    }
  }
  // ==================== 预签名 URL ====================

  /**
   * 生成预览用的临时 URL（inline，浏览器直接展示）
   */
  async buildPreviewUrl(url: string, expiresSec = 15 * 60): Promise<string> {
    const key = this.keyFromUrl(url);
    if (!key) throw new AppError("无法从 URL 解析文件 Key", 400002, 400);

    const signed = await this.presignedUrl(key, {
      expiresSec,
      contentDisposition: "inline",
    });
    return this.toRelativeUrl(signed);
  }

  /**
   * 生成下载用的临时 URL（attachment，强制下载，可指定文件名）
   */
  async buildDownloadUrl(
    url: string,
    fileName: string,
    expiresSec = 15 * 60,
  ): Promise<string> {
    const key = this.keyFromUrl(url);
    if (!key) throw new AppError("无法从 URL 解析文件 Key", 400002, 400);

    const safeName = encodeURIComponent(fileName.replace(/[\r\n"]/g, ""));

    return this.presignedUrl(key, {
      expiresSec,
      contentDisposition: `attachment; filename*=UTF-8''${safeName}`,
    });
  }

  private getContentType(ext: string): string {
    const map: Record<string, string> = {
      ".pdf": "application/pdf",
      ".md": "text/markdown; charset=utf-8",
      ".txt": "text/plain; charset=utf-8",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".doc": "application/msword",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".xls": "application/vnd.ms-excel",
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".ppt": "application/vnd.ms-powerpoint",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".m3u8": "application/vnd.apple.mpegurl",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };
    return map[ext] || "application/octet-stream";
  }
}
function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
