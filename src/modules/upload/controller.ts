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
import { deleteFile } from "@/config/blob.js"; // 本地存储工具（已移除 Vercel）
import { FileRepository } from "@/modules/file/repository.js";
import { success, error } from "@/common/utils/response.js";
import { UploadService } from "./service.js";

export const UPLOAD_ROOT =
  process.env.UPLOAD_ROOT || path.join(process.cwd(), "uploads");
const TEMP_DIR = path.join(UPLOAD_ROOT, "temp");
const FINAL_DIR = path.join(UPLOAD_ROOT, "files");
const CHUNK_SIZE = 5 * 1024 * 1024;

for (const dir of [UPLOAD_ROOT, TEMP_DIR, FINAL_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ============ 分片上传存储 ============
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

// ============ 简单上传存储 ============
export const simpleStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, FINAL_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
export const simpleUpload = multer({
  storage: simpleStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

@Controller("/upload", { tags: ["文件上传"] })
export default class UploadController {
  private fileRepository = new FileRepository();
  private service = new UploadService(this.fileRepository);

  /**
   * 简单上传（小文件）
   * 上传成功后写入 sys_file 表
   */
  @Post("/file")
  @ApiOperation("上传小文件", "上传后写入文件表，返回文件ID和URL")
  @ApiResponse(200, "上传成功")
  async uploadFile(@Req() req: Request, @Res() res: Response) {
    simpleUpload.single("file")(req, res, async (err) => {
      if (err) return error(res, "上传失败：" + err.message, 400, 400);
      if (!req.file) return error(res, "请选择文件", 400, 400);
      try {
        const result = await this.service.saveSimpleFile({
          originalName: req.file.originalname,
          buffer: req.file.buffer,
          mimeType: req.file.mimetype,
          size: req.file.size,
          tenantId: (req as any).tenantId,
          userId: (req as any).user?.userId,
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
  @ApiOperation("上传分片", "接收文件分片")
  @ApiResponse(200, "分片上传成功")
  async uploadChunk(@Req() req: Request, @Res() res: Response) {
    chunkUpload.single("file")(req, res, (err) => {
      if (err) return error(res, "分片上传失败：" + err.message, 400, 400);
      if (!req.file) return error(res, "未接收到文件", 400, 400);
      const { chunkIndex } = req.body;
      if (chunkIndex === undefined)
        return error(res, "缺少chunkIndex", 400, 400);
      success(res, { chunkIndex }, "分片上传成功");
    });
  }

  /**
   * 合并分片，写入文件表，返回文件信息
   */
  @Post("/merge")
  @ApiOperation("合并分片", "合并后写入文件表，返回文件ID和URL")
  @ApiResponse(200, "合并成功")
  async mergeChunks(@Req() req: Request, @Res() res: Response) {
    try {
      const { uploadId, fileName, totalChunks } = req.body;
      if (!uploadId || !fileName || !totalChunks) {
        return error(res, "缺少参数", 400, 400);
      }
      const result = await this.service.mergeChunks({
        uploadId,
        fileName,
        totalChunks: Number(totalChunks),
        tenantId: (req as any).tenantId,
        userId: (req as any).user?.userId,
      });
      success(res, result, "合并成功");
    } catch (err: any) {
      error(res, err?.message || "合并失败", 500, 500);
    }
  }

  /**
   * 根据 URL 删除物理文件（仅删文件，不删数据库记录）
   */
  @Post("/delete")
  @ApiOperation("删除物理文件", "根据URL删除本地文件")
  @ApiResponse(200, "删除成功")
  async deleteFile(@Req() req: Request, @Res() res: Response) {
    try {
      const { url } = req.body;
      if (!url) return error(res, "缺少url参数", 400, 400);
      await deleteFile(url);
      success(res, null, "删除成功");
    } catch (err) {
      error(res, "删除失败", 500, 500);
    }
  }
}
