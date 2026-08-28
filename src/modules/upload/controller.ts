import {
  Controller,
  Post,
  Get,
  Delete,
  Tag,
  Summary,
  Body,
  Query,
  Params,
  Response as ApiResponse,
  RequirePermission,
  Middleware,
} from "@common/core/decorators.js";
import { UploadRepository } from "./repository.js";
import {
  InitUploadBody,
  UploadChunkBody,
  CompleteUploadBody,
  UploadQuery,
  SingleUploadBody,
  FileListQuery,
} from "./schema.js";
import { put, del } from "@vercel/blob";
import { z } from "zod";
import { randomUUID } from "crypto";
import { env } from "@config/env.js";
import { authMiddleware } from "@common/middleware/auth.js";

@Controller("/upload")
export default class UploadController {
  private repo = new UploadRepository();
  private maxChunkSize = parseInt(env.UPLOAD_MAX_CHUNK_SIZE, 10);

  protected defaultPermissions = {
    list: ["file:read"],
    create: ["file:upload"],
    delete: ["file:delete"],
  };

  // ========== 分片上传（已有）==========
  @Tag("文件上传")
  @Summary("初始化分片上传")
  @Middleware(authMiddleware)
  @Body(InitUploadBody)
  @Query(UploadQuery)
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.object({
        uploadId: z.string(),
        chunkSize: z.number(),
        maxChunks: z.number(),
      }),
    }),
    "初始化成功",
  )
  @Post("/init")
  async init(req: any, res: any) {
    const { tenantId } = req.query;
    const { filename, mimeType, size, totalChunks, metadata } = req.body;

    const uploadId = randomUUID();
    const chunkSize = Math.ceil(size / totalChunks);

    if (chunkSize > this.maxChunkSize) {
      return res.status(400).json({
        success: false,
        message: `单分片大小不能超过 ${this.maxChunkSize / 1024 / 1024}MB`,
      });
    }

    await this.repo.create({
      uploadId,
      tenantId,
      userId: req.user?.id,
      filename,
      mimeType,
      size,
      totalChunks,
      uploadType: "CHUNKED",
    });

    res.json({
      success: true,
      data: { uploadId, chunkSize, maxChunks: totalChunks },
    });
  }

  @Tag("文件上传")
  @Summary("上传分片")
  @Middleware(authMiddleware)
  @Body(UploadChunkBody)
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.object({
        received: z.number(),
        total: z.number(),
        percent: z.number(),
      }),
    }),
    "分片上传成功",
  )
  @Post("/chunk")
  async chunk(req: any, res: any) {
    const { uploadId, chunkIndex, data } = req.body;
    const upload = await this.repo.findByUploadId(uploadId);

    if (!upload) {
      return res
        .status(404)
        .json({ success: false, message: "上传任务不存在" });
    }

    const buffer = Buffer.from(data, "base64");
    if (buffer.length > this.maxChunkSize) {
      return res.status(400).json({ success: false, message: "分片大小超限" });
    }

    const chunkPath = `chunks/${uploadId}/${chunkIndex}`;
    await put(chunkPath, buffer, {
      access: "private",
      token: env.BLOB_READ_WRITE_TOKEN,
    });

    const received = await this.repo.updateChunkProgress(uploadId, chunkIndex);

    res.json({
      success: true,
      data: {
        received,
        total: upload.totalChunks,
        percent: Math.round((received / upload.totalChunks) * 100),
      },
    });
  }

  @Tag("文件上传")
  @Summary("完成上传并合并")
  @Middleware(authMiddleware)
  @Body(CompleteUploadBody)
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.object({ url: z.string(), filename: z.string() }),
    }),
    "合并成功",
  )
  @Post("/complete")
  async complete(req: any, res: any) {
    const { uploadId } = req.body;
    const upload = await this.repo.findByUploadId(uploadId);

    if (!upload || upload.status === "COMPLETED") {
      return res
        .status(400)
        .json({ success: false, message: "上传任务无效或已完成" });
    }

    const receivedChunks = await this.repo.getChunkProgress(uploadId);
    if (receivedChunks.length < upload.totalChunks) {
      return res.status(400).json({
        success: false,
        message: `分片未全部上传 (${receivedChunks.length}/${upload.totalChunks})`,
      });
    }

    const chunks: Buffer[] = [];
    for (let i = 0; i < upload.totalChunks; i++) {
      const { url } = await fetch(
        `https://blob.vercel-storage.com/chunks/${uploadId}/${i}`,
        {
          headers: { authorization: `Bearer ${env.BLOB_READ_WRITE_TOKEN}` },
        },
      )
        .then((r) => r.json())
        .catch(() => ({ url: null }));

      if (!url) {
        return res
          .status(500)
          .json({ success: false, message: `分片 ${i} 读取失败` });
      }

      const chunk = await fetch(url).then((r) => r.arrayBuffer());
      chunks.push(Buffer.from(chunk));
    }

    const merged = Buffer.concat(chunks);
    const finalPath = `uploads/${upload.tenantId}/${uploadId}-${upload.filename}`;
    const blob = await put(finalPath, merged, {
      access: "public",
      token: env.BLOB_READ_WRITE_TOKEN,
      contentType: upload.mimeType,
    });

    await Promise.all(
      Array.from({ length: upload.totalChunks }, (_, i) =>
        del(`chunks/${uploadId}/${i}`, {
          token: env.BLOB_READ_WRITE_TOKEN,
        }).catch(() => {}),
      ),
    );

    const record = await this.repo.complete(uploadId, blob.url);

    res.json({
      success: true,
      data: { url: blob.url, filename: record.filename },
    });
  }

  @Tag("文件上传")
  @Summary("查询上传进度")
  @Middleware(authMiddleware)
  @Params(z.object({ uploadId: z.string() }))
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.object({
        status: z.string(),
        received: z.number(),
        total: z.number(),
        percent: z.number(),
      }),
    }),
    "查询成功",
  )
  @Get("/progress/:uploadId")
  async progress(req: any, res: any) {
    const { uploadId } = req.params;
    const upload = await this.repo.findByUploadId(uploadId);

    if (!upload) {
      return res
        .status(404)
        .json({ success: false, message: "上传任务不存在" });
    }

    const received =
      upload.status === "COMPLETED"
        ? upload.totalChunks
        : (await this.repo.getChunkProgress(uploadId)).length;

    res.json({
      success: true,
      data: {
        status: upload.status,
        received,
        total: upload.totalChunks,
        percent: Math.round((received / upload.totalChunks) * 100),
      },
    });
  }

  // ========== 单文件直接上传（新增）==========
  @Tag("文件上传")
  @Summary("单文件直接上传（小文件）")
  @Middleware(authMiddleware)
  @RequirePermission("file:upload")
  @Body(SingleUploadBody)
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.object({ url: z.string(), filename: z.string(), id: z.string() }),
    }),
    "上传成功",
  )
  @Post("/single")
  async single(req: any, res: any) {
    const { filename, mimeType, data, tenantId } = req.body;
    const buffer = Buffer.from(data, "base64");

    const maxSize = parseInt(env.UPLOAD_MAX_FILE_SIZE, 10);
    if (buffer.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: `文件大小不能超过 ${maxSize / 1024 / 1024}MB`,
      });
    }

    const uploadId = randomUUID();
    const path = `uploads/${tenantId}/${uploadId}-${filename}`;

    const blob = await put(path, buffer, {
      access: "public",
      token: env.BLOB_READ_WRITE_TOKEN,
      contentType: mimeType,
    });

    const record = await this.repo.create({
      uploadId,
      tenantId,
      userId: req.user?.id,
      filename,
      mimeType,
      size: buffer.length,
      totalChunks: 1,
      uploadType: "SINGLE",
    });

    await this.repo.complete(uploadId, blob.url);

    res.json({
      success: true,
      data: { url: blob.url, filename, id: record.id },
    });
  }

  // ========== 文件列表（新增）==========
  @Tag("文件上传")
  @Summary("查询上传文件列表")
  @Middleware(authMiddleware)
  @RequirePermission("file:read")
  @Query(FileListQuery)
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.array(z.any()),
      total: z.number(),
    }),
    "查询成功",
  )
  @Get("/files")
  async listFiles(req: any, res: any) {
    const { tenantId, page = "1", limit = "20", status } = req.query;
    const result = await this.repo.findByTenant(
      tenantId,
      Number(page),
      Number(limit),
      status,
    );
    res.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  }

  // ========== 删除文件（新增）==========
  @Tag("文件上传")
  @Summary("删除上传文件")
  @Middleware(authMiddleware)
  @RequirePermission("file:delete")
  @Delete("/files/:id")
  async deleteFile(req: any, res: any) {
    const { id } = req.params;
    const { tenantId } = req.query;

    const file = await this.repo.findById(id, tenantId);
    if (!file) {
      return res.status(404).json({ success: false, message: "文件不存在" });
    }

    // 删除 Blob
    if (file.blobUrl) {
      await del(file.blobUrl, { token: env.BLOB_READ_WRITE_TOKEN }).catch(
        () => {},
      );
    }

    await this.repo.deleteById(id, tenantId);
    res.json({ success: true });
  }
}
