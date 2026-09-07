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
import { uploadFile } from "@/config/blob.js"; // 引入封装
import { success, error } from "@/common/utils/response.js";

const UPLOAD_DIR =
  process.env.NODE_ENV === "production"
    ? "/tmp/uploads"
    : path.join(process.cwd(), "uploads");
const TEMP_DIR = path.join(UPLOAD_DIR, "temp");
const FINAL_DIR = path.join(UPLOAD_DIR, "files");
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

// 确保目录存在（开发环境始终创建，生产环境 /tmp 也创建）
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(FINAL_DIR)) fs.mkdirSync(FINAL_DIR, { recursive: true });

// 分片上传临时存储（开发和生产都先存到磁盘临时目录）
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

// 简单上传临时存储（开发：直接存到最终目录；生产：先存到临时目录再上传 Blob）
export const simpleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (process.env.NODE_ENV === "production") {
      cb(null, TEMP_DIR); // 生产暂存到临时目录
    } else {
      cb(null, FINAL_DIR); // 开发直接存到最终目录
    }
  },
  filename: (req, file, cb) => {
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
  /**
   * 简单上传（小文件）
   */
  @Post("/file")
  @ApiOperation("上传小文件", "单文件上传，返回文件URL")
  @ApiResponse(200, "上传成功")
  async uploadFile(@Req() req: Request, @Res() res: Response) {
    simpleUpload.single("file")(req, res, async (err) => {
      if (err) return error(res, "上传失败：" + err.message, 400, 400);
      if (!req.file) return error(res, "请选择文件", 400, 400);

      try {
        let url: string;
        if (process.env.NODE_ENV === "production") {
          // 读取临时文件并上传到 Blob
          const fileContent = fs.readFileSync(req.file.path);
          url = await uploadFile(req.file.filename, fileContent);
          // 删除临时文件
          fs.unlinkSync(req.file.path);
        } else {
          // 开发环境返回本地 URL
          url = `/uploads/files/${req.file.filename}`;
        }
        success(res, { url }, "上传成功");
      } catch (e) {
        console.error(e);
        error(res, "上传失败", 500, 500);
      }
    });
  }

  /**
   * 检查已上传分片索引
   */
  @Get("/check")
  @ApiOperation("检查已上传分片", "根据uploadId返回已上传的分片索引数组")
  @ApiResponse(200, "查询成功")
  async checkChunks(@Req() req: Request, @Res() res: Response) {
    try {
      const uploadId = req.query.uploadId as string;
      if (!uploadId) return error(res, "缺少uploadId参数", 400, 400);
      const dir = path.join(TEMP_DIR, uploadId);
      if (!fs.existsSync(dir)) {
        return success(res, { uploaded: [] });
      }
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

  /**
   * 上传单个分片
   */
  @Post("/chunk")
  @ApiOperation(
    "上传分片",
    "接收文件分片，需携带uploadId, chunkIndex, totalChunks",
  )
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
   * 合并分片，返回最终文件 URL
   */
  @Post("/merge")
  @ApiOperation("合并分片", "将所有分片合并为完整文件，返回最终URL")
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

      // 合并分片到临时文件
      const ext = path.extname(fileName);
      const mergedFileName = `${uuidv4()}${ext}`;
      const mergedPath = path.join(FINAL_DIR, mergedFileName);

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

      // 清理临时分片目录
      fs.rmSync(tempDir, { recursive: true, force: true });

      let url: string;
      if (process.env.NODE_ENV === "production") {
        // 读取合并后的文件并上传到 Blob
        const fileContent = fs.readFileSync(mergedPath);
        url = await uploadFile(fileName, fileContent);
        // 删除本地合并文件
        fs.unlinkSync(mergedPath);
      } else {
        url = `/uploads/files/${mergedFileName}`;
      }

      success(res, { url }, "合并成功");
    } catch (err) {
      console.error(err);
      error(res, "合并失败", 500, 500);
    }
  }
}
