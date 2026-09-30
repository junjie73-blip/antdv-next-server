import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  ApiOperation,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4, validate as isUuid } from "uuid";
import { FileRepository } from "@/modules/infrastructure/file/repository.js";
import { success, error } from "@/shared/http/response.js";
import { UploadService } from "./service.js";
import { checkUploadIdRate } from "@/middleware/security/rate-limit.js";
import { SettingsService } from "@/modules/system/setting/service.js";
import { UploadConfigDTO } from "@/modules/system/setting/schema.js";
export interface NormalizedUploadCfg {
  /** 当前存储类型 */
  storage: "local" | "minio" | "oss" | "cos" | "s3";

  /** 单文件大小上限（字节） */
  maxSizeBytes: number;

  /** 允许的扩展名（小写，不含点） */
  allowedTypes: string[];

  /** 原始配置（如需完整字段） */
  raw: UploadConfigDTO;
}
const settingsService = new SettingsService();
export async function getUploadCfg(
  tenantId: string,
): Promise<NormalizedUploadCfg> {
  const cfg = await settingsService.getUploadConfig(tenantId);

  return {
    storage: (cfg.storage as NormalizedUploadCfg["storage"]) ?? "local",
    maxSizeBytes: (cfg.maxSize || 10) * 1024 * 1024,
    allowedTypes: (cfg.allowedTypes || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    raw: cfg,
  };
}
/**
 * ⭐ 校验上传文件是否合规
 * - 返回 null 表示通过
 * - 返回 string 表示错误消息
 */
export function validateUploadFile(
  file: { size: number; originalname: string; mimetype?: string },
  cfg: NormalizedUploadCfg,
): string | null {
  // 1. 大小
  if (file.size > cfg.maxSizeBytes) {
    const mb = (cfg.maxSizeBytes / 1024 / 1024).toFixed(0);
    return `文件超过 ${mb} MB 限制`;
  }

  // 2. 类型
  if (cfg.allowedTypes.length > 0) {
    const ext = extOf(file.originalname);
    if (!ext) {
      return `无法识别文件类型：${file.originalname}`;
    }
    if (!cfg.allowedTypes.includes(ext)) {
      return `不支持的文件类型「.${ext}」，允许：${cfg.allowedTypes
        .map((t) => `.${t}`)
        .join(", ")}`;
    }
  }

  return null;
}

/**
 * 取扩展名（小写，不含点）
 */
function extOf(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx < 0) return "";
  return filename.slice(idx + 1).toLowerCase();
}
export const UPLOAD_ROOT =
  process.env.UPLOAD_ROOT || path.join(process.cwd(), "uploads");
const TEMP_DIR = path.join(UPLOAD_ROOT, "temp");
const CHUNK_SIZE = 5 * 1024 * 1024;

for (const dir of [UPLOAD_ROOT, TEMP_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ============ 分片上传存储（保留本地临时文件，合并后再上传 COS） ============
const chunkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadId = req.body.uploadId;
    if (!uploadId) return cb(new Error("uploadId is required"), "");
    if (!isUuid(uploadId)) return cb(new Error("uploadId must be uuid"), "");
    const dir = path.join(TEMP_DIR, uploadId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const chunkIndex = req.body.chunkIndex;
    const idx = Number(chunkIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx > 100000)
      return cb(new Error("chunkIndex invalid"), "");
    cb(null, `chunk-${idx}`);
  },
});
const chunkUpload = multer({
  storage: chunkStorage,
  limits: { fileSize: CHUNK_SIZE * 2 },
});

// ============ 简单上传存储（内存存储，直接上传 COS） ============
export const simpleUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
const fixFileNameEncoding = (name: string): string => {
  if (!name) return name;
  try {
    // 将 latin1 解码的字符串重新按 latin1 编码为 Buffer，再按 utf8 解码
    const buf = Buffer.from(name, "latin1");
    const decoded = buf.toString("utf8");
    // 检查是否包含替换字符 (�)，如果没有，说明成功还原
    if (!decoded.includes("\uFFFD")) {
      return decoded;
    }
  } catch (e) {
    // 忽略错误
  }
  return name;
};
@Controller("/upload", { tags: ["文件上传"] })
export default class UploadController {
  private fileRepository = new FileRepository();
  private service = new UploadService(this.fileRepository);

  /**
   * 简单上传（小文件）
   * Buffer → COS → 写入 sys_file 表
   */
  @Post("/file")
  @ApiOperation("上传小文件", "上传到 COS 并写入文件表，返回文件ID和URL")
  @ApiResponse(200, "上传成功")
  async uploadFile(@Req() req, @Res() res) {
    simpleUpload.single("file")(req, res, async (err) => {
      if (err) return error(res, "上传失败：" + err.message, 400, 400);
      if (!req.file) return error(res, "请选择文件", 400, 400);

      const tenantId = (req as any).tenantId;
      const userId = (req as any).user?.userId;

      // ⭐ 二次校验大小 + 类型
      const cfg = await getUploadCfg(tenantId);
      const errMsg = validateUploadFile(req.file, cfg);
      if (errMsg) return error(res, errMsg, 400, 400);
      if (req.file.size > cfg.maxSizeBytes) {
        return error(
          res,
          `文件超过 ${cfg.maxSizeBytes / 1024 / 1024} MB`,
          400,
          400,
        );
      }
      const ext = path.extname(req.file.originalname).slice(1).toLowerCase();
      if (cfg.allowedTypes.length > 0 && !cfg.allowedTypes.includes(ext)) {
        return error(res, `不支持的文件类型：${ext}`, 400, 400);
      }

      try {
        const result = await this.service.saveSimpleFile({
          originalName: fixFileNameEncoding(req.file.originalname),
          buffer: req.file.buffer,
          mimeType: req.file.mimetype,
          size: req.file.size,
          tenantId,
          userId,
        });
        success(res, result, "上传成功");
      } catch (e: any) {
        error(res, e?.message || "上传失败", 500, 500);
      }
    });
  }

  @Get("/check")
  @ApiOperation("检查已上传分片", "根据uploadId返回已上传的分片索引数组")
  @ApiResponse(200, "查询成功")
  async checkChunks(@Req() req: Request, @Res() res: Response) {
    try {
      const uploadId = req.query.uploadId as string;
      if (!uploadId) return error(res, "缺少uploadId参数", 400, 400);
      success(res, await this.service.checkChunks(uploadId));
    } catch (err) {
      error(res, "检查分片失败", 500, 500);
    }
  }

  @Post("/chunk")
  @ApiOperation(
    "上传分片",
    "接收文件分片（先落本地临时目录，merge 时统一上传 COS）",
  )
  @ApiResponse(200, "分片上传成功")
  async uploadChunk(@Req() req: Request, @Res() res: Response) {
    chunkUpload.single("file")(req, res, async (err) => {
      if (err) return error(res, "分片上传失败：" + err.message, 400, 400);
      if (!req.file) return error(res, "未接收到文件", 400, 400);
      const { chunkIndex, uploadId } = req.body;

      const rate = await checkUploadIdRate(uploadId, 50);
      if (!rate.ok) {
        return error(
          res,
          `该上传任务请求过快（${rate.current}/${rate.limit}），请稍后重试`,
          429,
        );
      }
      if (chunkIndex === undefined)
        return error(res, "缺少chunkIndex", 400, 400);
      success(res, { chunkIndex }, "分片上传成功");
    });
  }

  /**
   * 合并分片 → COS → 写入文件表
   */
  @Post("/merge")
  @ApiOperation("合并分片", "合并后上传 COS 并写入文件表，返回文件ID和URL")
  @ApiResponse(200, "合并成功")
  async mergeChunks(@Req() req: Request, @Res() res: Response) {
    try {
      const { uploadId, filename, totalChunks, mimeType, totalSize } = req.body;
      if (!uploadId || !filename || !totalChunks || !mimeType) {
        return error(res, "缺少参数", 400, 400);
      }

      const tenantId = (req as any).tenantId;
      const cfg = await getUploadCfg(tenantId);

      // ⭐ 如果前端传了 totalSize，可以提前校验
      if (totalSize && Number(totalSize) > cfg.maxSizeBytes) {
        const mb = (cfg.maxSizeBytes / 1024 / 1024).toFixed(0);
        return error(res, `文件超过 ${mb} MB 限制`, 400, 400);
      }

      // ⭐ 类型校验
      if (cfg.allowedTypes.length > 0) {
        const ext = filename.slice(filename.lastIndexOf(".") + 1).toLowerCase();
        if (!cfg.allowedTypes.includes(ext)) {
          return error(res, `不支持的文件类型「.${ext}」`, 400, 400);
        }
      }

      const { taskId, status } = await this.service.triggerMerge({
        uploadId,
        fileName: filename,
        totalChunks: Number(totalChunks),
        tenantId,
        userId: (req as any).user?.userId,
        mimeType,
      });

      success(res, { taskId, status }, "任务已提交");
    } catch (err: any) {
      error(res, err?.message || "提交失败", 500, 500);
    }
  }
  @Get("/merge/status")
  @ApiOperation("查询合并任务状态", "返回 status / progress / url 等")
  @ApiResponse(200, "查询成功")
  async getMergeStatus(@Req() req: Request, @Res() res: Response) {
    try {
      const taskId = req.query.taskId as string;
      if (!taskId) return error(res, "缺少taskId", 400, 400);
      const result = await this.service.getTaskStatus(
        taskId,
        (req as any).tenantId,
      );
      success(res, result);
    } catch (err: any) {
      error(res, err?.message || "查询失败", 500, 500);
    }
  }
  /**
   * 根据 URL 删除 COS 上的对象（仅删文件，不删数据库记录）
   */
  @Post("/delete")
  @ApiOperation("删除文件", "根据 URL 删除 COS 上的文件")
  @ApiResponse(200, "删除成功")
  async deleteFile(@Req() req: Request, @Res() res: Response) {
    try {
      const { url } = req.body;
      if (!url) return error(res, "缺少url参数", 400, 400);

      const tenantId = (req as any).tenantId;

      // ⭐ 传 tenantId
      await this.service.removeFile(url, tenantId);

      const file = await this.service.findByUrl(url, tenantId);
      if (!file) return error(res, "文件不存在", 400, 400);
      await this.service.softDelete(file.file_id);
      success(res, null, "删除成功");
    } catch (err: any) {
      error(res, err?.message || "删除失败", 500, 500);
    }
  }
  @Get("/tasks")
  @ApiOperation(
    "查询上传任务列表",
    "返回当前用户正在上传/合并中的任务，用于刷新页面后恢复进度",
  )
  @ApiResponse(200, "查询成功")
  async listTasks(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const tenantId = (req as any).tenantId;
      if (!userId) return error(res, "请先登录", 401, 401);

      const status = (req.query.status as string) || "all";
      const page = Number(req.query.pageNum) || 1;
      const pageSize = Number(req.query.pageSize) || 20;

      const result = await this.service.listUploadingTasks({
        userId,
        tenantId,
        status,
        page,
        pageSize,
      });

      success(res, result);
    } catch (err: any) {
      error(res, err?.message || "查询失败", 500, 500);
    }
  }

  @Post("/tasks/cancel")
  @ApiOperation("取消上传任务", "批量取消，同时清理本地分片")
  async cancelTasks(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const tenantId = (req as any).tenantId;
      if (!userId) return error(res, "请先登录", 401, 401);

      const { taskIds } = req.body;
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        return error(res, "缺少taskIds", 400, 400);
      }

      const result = await this.service.cancelTasks({
        taskIds,
        userId,
        tenantId,
      });

      success(res, result, "已取消");
    } catch (err: any) {
      error(res, err?.message || "取消失败", 500, 500);
    }
  }
  @Get("/preview")
  @ApiOperation("获取文件预览地址", "返回临时签名 URL，浏览器 inline 展示")
  @ApiResponse(200, "获取成功")
  async previewFile(@Req() req, @Res() res) {
    try {
      const fileId = req.query.fileId as string;
      if (!fileId) return error(res, "缺少 fileId", 400, 400);

      const tenantId = (req as any).tenantId;
      const file = await this.service.findByFileId(fileId, tenantId);
      if (!file) return error(res, "文件不存在", 404, 404);

      // ⭐ 传 tenantId
      const previewUrl = await this.service.buildPreviewUrl(file.url, tenantId);
      success(res, { url: previewUrl, expiresIn: 15 * 60 });
    } catch (err: any) {
      error(res, err?.message || "获取预览地址失败", 500, 500);
    }
  }

  @Get("/download")
  @ApiOperation("获取文件下载地址", "返回临时签名 URL，浏览器强制下载")
  @ApiResponse(200, "获取成功")
  async downloadFile(@Req() req: Request, @Res() res: Response) {
    try {
      const fileId = req.query.fileId as string;
      const url = req.query.url as string;
      if (!fileId && !url) return error(res, "缺少 fileId 或 url", 400, 400);

      const tenantId = (req as any).tenantId;
      let targetUrl = url;
      let fileName = (req.query.fileName as string) || "download";

      if (fileId) {
        const file = await this.service.findByFileId(fileId, tenantId);
        if (!file) return error(res, "文件不存在", 404, 404);
        targetUrl = file.url;
        fileName = file.filename;
      }

      // ⭐ 传 tenantId
      const downloadUrl = await this.service.buildDownloadUrl(
        targetUrl,
        fileName,
        tenantId,
      );
      success(res, { url: downloadUrl, fileName, expiresIn: 15 * 60 });
    } catch (err: any) {
      error(res, err?.message || "获取下载地址失败", 500, 500);
    }
  }
}
