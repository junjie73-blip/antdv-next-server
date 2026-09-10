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
import { v4 as uuidv4 } from "uuid";
import { deleteFile } from "@/config/blob.js"; // 本地存储工具（已移除 Vercel）
import { FileRepository } from "@/modules/file/repository.js";
import { success, error } from "@/common/utils/response.js";

const UPLOAD_ROOT =
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
    const dir = path.join(TEMP_DIR, uploadId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const chunkIndex = req.body.chunkIndex;
    if (chunkIndex === undefined)
      return cb(new Error("chunkIndex is required"), "");
    cb(null, `chunk-${chunkIndex}`);
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
        const filename = req.file.originalname;
        const serverFilename = req.file.filename;
        const url = `/uploads/files/${serverFilename}`;
        const size = req.file.size;
        const mimeType = req.file.mimetype;
        const tenantId = (req as any).tenantId as string;
        const userId = (req as any).user?.userId as string | undefined;

        // 写入数据库
        const fileRecord = await this.fileRepository.createFromUpload({
          filename,
          url,
          size,
          mimeType,
          uploader: userId,
          tenantId,
        });

        success(
          res,
          {
            fileId: fileRecord.file_id,
            filename: fileRecord.filename,
            url: fileRecord.url,
            size: fileRecord.size,
          },
          "上传成功",
        );
      } catch (e: any) {
        console.error("上传写库失败:", e);
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
      const dir = path.join(TEMP_DIR, uploadId);
      if (!fs.existsSync(dir)) return success(res, { uploaded: [] });
      const files = fs.readdirSync(dir);
      const uploaded = files
        .filter((f) => f.startsWith("chunk-"))
        .map((f) => parseInt(f.replace("chunk-", "")));
      success(res, { uploaded });
    } catch (err) {
      console.error(err);
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
        return error(res, "缺少uploadId、fileName或totalChunks", 400, 400);
      }
      const tempDir = path.join(TEMP_DIR, uploadId);
      if (!fs.existsSync(tempDir)) {
        return error(res, "上传临时目录不存在", 404, 404);
      }

      const ext = path.extname(fileName);
      const mergedFileName = `${uuidv4()}${ext}`;
      const mergedPath = path.join(FINAL_DIR, mergedFileName);

      // 合并分片
      const writeStream = fs.createWriteStream(mergedPath);
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(tempDir, `chunk-${i}`);
        if (!fs.existsSync(chunkPath)) {
          writeStream.destroy();
          return error(res, `缺失分片 ${i}`, 400, 400);
        }
        const data = fs.readFileSync(chunkPath);
        writeStream.write(data);
      }
      writeStream.end();

      // 等待写入完成
      await new Promise<void>((resolve) =>
        writeStream.on("finish", () => resolve()),
      );

      // 清理临时分片目录
      fs.rmSync(tempDir, { recursive: true, force: true });

      const stat = fs.statSync(mergedPath);
      const url = `/uploads/files/${mergedFileName}`;
      const tenantId = (req as any).tenantId as string;
      const userId = (req as any).user?.userId as string | undefined;

      // 写入数据库
      const fileRecord = await this.fileRepository.createFromUpload({
        filename: fileName,
        url,
        size: stat.size,
        mimeType: undefined,
        uploader: userId,
        tenantId,
      });

      success(
        res,
        {
          fileId: fileRecord.file_id,
          filename: fileRecord.filename,
          url: fileRecord.url,
          size: fileRecord.size,
        },
        "合并成功",
      );
    } catch (err: any) {
      console.error(err);
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
      console.error(err);
      error(res, "删除失败", 500, 500);
    }
  }
}
