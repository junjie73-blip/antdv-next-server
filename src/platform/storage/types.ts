import type { Readable } from "node:stream";

export interface PutObjectInput {
  key: string;
  /** Buffer 或 Node Readable 流 */
  body: Buffer | Readable;
  contentType?: string;
  contentLength?: number;
}

export interface PresignedUrlInput {
  key: string;
  expiresSec: number;
  responseContentType?: string;
  responseContentDisposition?: string;
}

export interface ObjectStat {
  key: string;
  size: number;
  lastModified?: Date;
}
export interface ListObjectsInput {
  prefix: string;
  maxKeys?: number;
}

export interface GetObjectResult {
  body: Readable;
  size?: number;
  contentType?: string;
}
export interface ObjectInfo {
  key: string;
  size: number;
  lastModified?: Date;
}
export interface MultipartInitInput {
  key: string;
  contentType?: string;
}

export interface MultipartInitResult {
  /** 对象存储返回的 uploadId */
  uploadId: string;
  /** 服务端 key */
  key: string;
}

export interface PresignPartInput {
  key: string;
  uploadId: string;
  partNumber: number;
  /** 过期秒数 */
  expiresSec: number;
}

export interface CompleteMultipartInput {
  key: string;
  uploadId: string;
  parts: Array<{ partNumber: number; etag: string }>;
}
export interface IStorage {
  readonly type: string;
  ensure(): Promise<void>;
  putObject(input: PutObjectInput): Promise<void>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  buildPublicUrl(key: string): string;
  presignedUrl(input: PresignedUrlInput): Promise<string>;
  keyFromUrl(url: string): string | null;
  /** ⭐ 列对象（用于分片列举） */
  listObjects(input: ListObjectsInput): Promise<ObjectInfo[]>;

  getObject(key: string): Promise<GetObjectResult>;

  deleteObjects(keys: string[]): Promise<void>;
  /** ⭐ 是否支持原生 Multipart */
  readonly supportsMultipart?: boolean;

  /** ⭐ 初始化 Multipart Upload */
  createMultipartUpload?(input: MultipartInitInput): Promise<MultipartInitResult>;

  /** ⭐ 为单个 Part 生成预签名 URL（客户端直传） */
  presignUploadPart?(input: PresignPartInput): Promise<string>;

  /** ⭐ 完成 Multipart Upload */
  completeMultipartUpload?(input: CompleteMultipartInput): Promise<{ url: string; key: string }>;

  /** ⭐ 中止 Multipart Upload（清理） */
  abortMultipartUpload?(input: { key: string; uploadId: string }): Promise<void>;
}

export interface StorageConfig {
  storage: "local" | "minio" | "oss" | "cos" | "s3";
  localPath?: string;
  localUrl?: string;
  endpoint?: string;
  port?: number;
  useSSL?: boolean;
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  customDomain?: string;
}
/** 类型守卫：区分 Buffer 和 Stream */
export function isBuffer(body: Buffer | Readable): body is Buffer {
  return Buffer.isBuffer(body);
}
