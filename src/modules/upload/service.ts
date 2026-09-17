import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import Cos from "cos-nodejs-sdk-v5";
import { FileRepository } from "../file/repository.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@core/logger/index.js";
import { env } from "@/config/env.js";
import { prisma } from "@/config/database.js";

export const UPLOAD_ROOT =
  process.env.UPLOAD_ROOT || path.join(process.cwd(), "uploads");
export const TEMP_DIR = path.join(UPLOAD_ROOT, "temp");
export const FINAL_DIR = path.join(UPLOAD_ROOT, "files");

export class UploadService {
  private readonly cos: Cos;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly fileRepo: FileRepository) {
    if (!env.COS_BUCKET || !env.COS_REGION) {
      throw new Error("COS_BUCKET or COS_REGION is not set");
    }
    this.bucket = env.COS_BUCKET;
    this.region = env.COS_REGION;
    this.cos = new Cos({
      SecretId: env.COS_SECRET_ID,
      SecretKey: env.COS_SECRET_KEY,
    });
  }

  async ensureDirs() {
    for (const dir of [UPLOAD_ROOT, TEMP_DIR, FINAL_DIR]) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // ==================== COS 底层封装 ====================

  /** 生成对外可访问的 URL */
  private buildCosUrl(key: string): string {
    if (env.COS_DOMAIN) {
      return `${env.COS_DOMAIN.replace(/\/+$/, "")}/${key}`;
    }
    return `https://${this.bucket}.cos.${this.region}.myqcloud.com/${key}`;
  }

  /** 从 URL 反解 COS Key（支持自定义域名、默认域名、旧本地路径） */
  private keyFromUrl(url: string): string | null {
    if (!url) return null;

    if (env.COS_DOMAIN) {
      const prefix = env.COS_DOMAIN.replace(/\/+$/, "") + "/";
      if (url.startsWith(prefix)) return url.slice(prefix.length);
    }

    const cosHost = `${this.bucket}.cos.${this.region}.myqcloud.com/`;
    const idx = url.indexOf(cosHost);
    if (idx !== -1) return url.slice(idx + cosHost.length);

    // 兼容历史的本地路径
    if (url.startsWith("/uploads/files/")) {
      return `files/${url.replace("/uploads/files/", "")}`;
    }
    return null;
  }

  /** 简单上传（小文件）：Body 为 Buffer/Stream */
  private putObject(
    key: string,
    body: Buffer,
    mimeType?: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cos.putObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
          Body: body,
          ContentType: mimeType,
        },
        (err) => (err ? reject(err) : resolve()),
      );
    });
  }

  /** 大文件分片上传（内部自动切分 + 并发上传） */
  private sliceUploadFile(key: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cos.sliceUploadFile(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
          FilePath: filePath,
          // 如需断点续传，可传入 CacheFilePath
          // CacheFilePath: path.join(TEMP_DIR, `${path.basename(key)}.cache`),
        },
        (err) => (err ? reject(err) : resolve()),
      );
    });
  }

  private deleteObject(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.cos.deleteObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
        },
        (err) => (err ? reject(err) : resolve()),
      );
    });
  }

  // ==================== 业务方法 ====================

  /** 简单上传：Buffer → COS → 落库 */
  async saveSimpleFile(params: {
    originalName: string;
    buffer: Buffer;
    mimeType: string;
    size: number;
    tenantId: string;
    userId?: string;
  }) {
    const ext = path.extname(params.originalName);
    const key = `files/${randomUUID()}${ext}`;

    // 上传到 COS
    await this.putObject(key, params.buffer, params.mimeType);

    const url = this.buildCosUrl(key);
    const record = await this.fileRepo.createFromUpload({
      filename: params.originalName,
      url,
      size: params.size,
      mimeType: params.mimeType,
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

  /** 合并分片 → COS → 落库 */
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
    const mergedFileName = `${randomUUID()}${ext}`;
    const mergedPath = path.join(FINAL_DIR, mergedFileName);
    const key = `files/${mergedFileName}`;

    // 1) 本地合并（顺序追加，避免一次性载入内存）
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

    // 2) 上传到 COS，无论成功失败都清理本地
    try {
      await this.sliceUploadFile(key, mergedPath);
    } catch (e: any) {
      logger.error({ err: e?.message, key }, "[upload] COS 分片上传失败");
      throw new AppError("上传到 COS 失败", 500002, 500);
    } finally {
      await fs.rm(mergedPath, { force: true });
      await fs.rm(tempDir, { recursive: true, force: true });
    }

    // 3) 落库
    const url = this.buildCosUrl(key);
    const record = await this.fileRepo.createFromUpload({
      filename: params.fileName,
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

  /** 删除物理文件（仅删 COS 对象，不动数据库记录） */
  async removeFile(url: string) {
    const key = this.keyFromUrl(url);
    if (!key) throw new AppError("无法从 URL 解析文件 Key", 400002, 400);
    await this.deleteObject(key);
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
    // 用你现有的 query builder / ORM 风格替换
    const row = await prisma.sys_file.findFirst({
      where: { url, tenant_id: tenantId },
    });
    return row ?? null;
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
}
