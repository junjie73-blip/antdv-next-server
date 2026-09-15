import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { FileRepository } from "../file/repository.js";
import { deleteFile } from "@/config/blob.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@core/logger/index.js";

export const UPLOAD_ROOT =
  process.env.UPLOAD_ROOT || path.join(process.cwd(), "uploads");
export const TEMP_DIR = path.join(UPLOAD_ROOT, "temp");
export const FINAL_DIR = path.join(UPLOAD_ROOT, "files");

export class UploadService {
  constructor(private readonly fileRepo: FileRepository) {}

  async ensureDirs() {
    for (const dir of [UPLOAD_ROOT, TEMP_DIR, FINAL_DIR]) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /** 保存简单上传文件 */
  async saveSimpleFile(params: {
    originalName: string;
    buffer: Buffer;
    mimeType: string;
    size: number;
    tenantId: string;
    userId?: string;
  }) {
    await this.ensureDirs();

    const ext = path.extname(params.originalName);
    const serverFilename = `${randomUUID()}${ext}`;
    const filePath = path.join(FINAL_DIR, serverFilename);

    await fs.writeFile(filePath, params.buffer);

    const url = `/uploads/files/${serverFilename}`;
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
        .map((f) => parseInt(f.replace("chunk-", ""), 10));
      return { uploaded };
    } catch {
      return { uploaded: [] };
    }
  }

  /** 合并分片 */
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

    const ext = path.extname(params.fileName);
    const mergedFileName = `${randomUUID()}${ext}`;
    const mergedPath = path.join(FINAL_DIR, mergedFileName);

    const writeStream = (await import("fs")).createWriteStream(mergedPath);
    for (let i = 0; i < params.totalChunks; i++) {
      const chunkPath = path.join(tempDir, `chunk-${i}`);
      try {
        const data = await fs.readFile(chunkPath);
        writeStream.write(data);
      } catch {
        writeStream.destroy();
        throw new AppError(`缺失分片 ${i}`, 400001, 400);
      }
    }
    writeStream.end();
    await new Promise<void>((resolve) => writeStream.on("finish", resolve));

    await fs.rm(tempDir, { recursive: true, force: true });

    const stat = await fs.stat(mergedPath);
    const url = `/uploads/files/${mergedFileName}`;
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

  /** 删除物理文件 */
  async removeFile(url: string) {
    await deleteFile(url);
  }

  /** 清理 24 小时前的临时目录（由定时任务调用） */
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
}
