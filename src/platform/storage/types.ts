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

export interface IStorage {
  readonly type: string;
  ensure(): Promise<void>;
  putObject(input: PutObjectInput): Promise<void>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  buildPublicUrl(key: string): string;
  presignedUrl(input: PresignedUrlInput): Promise<string>;
  keyFromUrl(url: string): string | null;
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
