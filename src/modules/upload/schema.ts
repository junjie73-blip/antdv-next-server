import { z } from "zod";

export const InitUploadBody = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().max(100),
  size: z.number().int().min(1).max(104857600),
  totalChunks: z.number().int().min(1).max(100),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const UploadChunkBody = z.object({
  uploadId: z.string(),
  chunkIndex: z.number().int().min(0),
  data: z.string(),
});

export const CompleteUploadBody = z.object({
  uploadId: z.string(),
});

export const UploadQuery = z.object({
  tenantId: z.string(),
});

// 单文件上传 Body（Express 用 multer 或 raw body，这里用 base64）
export const SingleUploadBody = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().max(100),
  data: z.string(), // base64 encoded file
  tenantId: z.string(),
});

export const FileListQuery = z.object({
  tenantId: z.string(),
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]).optional(),
});
