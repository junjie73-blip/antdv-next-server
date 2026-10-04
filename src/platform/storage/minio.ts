import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  // ⭐ Multipart
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import type {
  IStorage,
  PutObjectInput,
  PresignedUrlInput,
  GetObjectResult,
  ListObjectsInput,
  ObjectInfo,
  MultipartInitInput,
  MultipartInitResult,
  PresignPartInput,
  CompleteMultipartInput,
} from "./types.js";
import { isBuffer } from "./types.js";
import { Agent as HttpsAgent } from "node:https";
import { Agent as HttpAgent } from "node:http";
/* ============================================================
 * 配置
 * ============================================================ */
export interface MinioStorageConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  publicUrl?: string;
}

/* ============================================================
 * 常量
 * ============================================================ */
/** S3 `DeleteObjects` 单次最多 1000 个 key */
const DELETE_BATCH_SIZE = 1000;

/** `listObjects` 单页最多 1000 个 */
const LIST_PAGE_SIZE = 1000;
const httpsAgent = new HttpsAgent({
  keepAlive: true,
  keepAliveMsecs: 15_000,
  maxSockets: 100,
  maxFreeSockets: 20,
  timeout: 30_000,
});

const httpAgent = new HttpAgent({
  keepAlive: true,
  keepAliveMsecs: 15_000,
  maxSockets: 100,
  maxFreeSockets: 20,
  timeout: 30_000,
});
/* ============================================================
 * MinioStorage
 * ============================================================ */
export class MinioStorage implements IStorage {
  readonly type = "minio";
  readonly supportsMultipart = true;
  private client: S3Client;

  constructor(private readonly cfg: MinioStorageConfig) {
    const proto = cfg.useSSL ? "https" : "http";
    const defaultPort = cfg.useSSL ? 443 : 80;
    const portPart = cfg.port && cfg.port !== defaultPort ? `:${cfg.port}` : "";

    this.client = new S3Client({
      region: cfg.region,
      endpoint: `${proto}://${cfg.endpoint}${portPart}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: cfg.accessKey,
        secretAccessKey: cfg.secretKey,
      },
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 3_000,
        requestTimeout: 10 * 60_000,
        httpsAgent,
        httpAgent,
      }),
      maxAttempts: 3,
    });
  }

  /* ========== 基础 ========== */
  async ensure(): Promise<void> {}

  async putObject(input: PutObjectInput): Promise<void> {
    if (isBuffer(input.body)) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.cfg.bucket,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
          ContentLength: input.body.length,
        }),
      );
      return;
    }
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.cfg.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        ContentLength: input.contentLength,
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
      return true;
    } catch (err: any) {
      if (err?.$metadata?.httpStatusCode === 404) return false;
      return false;
    }
  }

  async getObject(key: string): Promise<GetObjectResult> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
    if (!res.Body) throw new Error(`getObject: empty body for key=${key}`);
    return {
      body: res.Body as any,
      size: typeof res.ContentLength === "number" ? res.ContentLength : undefined,
      contentType: res.ContentType,
    };
  }

  async listObjects(input: ListObjectsInput): Promise<ObjectInfo[]> {
    const out: ObjectInfo[] = [];
    const max = input.maxKeys ?? 1000;
    let continuationToken: string | undefined;
    let pageCount = 0;
    const MAX_PAGES = 100;

    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.cfg.bucket,
          Prefix: input.prefix,
          MaxKeys: Math.min(LIST_PAGE_SIZE, max - out.length),
          ContinuationToken: continuationToken,
        }),
      );

      for (const obj of res.Contents ?? []) {
        if (!obj.Key) continue;
        out.push({
          key: obj.Key,
          size: Number(obj.Size ?? 0),
          lastModified: obj.LastModified,
        });
        if (out.length >= max) break;
      }

      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
      pageCount++;
      if (pageCount >= MAX_PAGES) break;
    } while (continuationToken && out.length < max);

    return out;
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    for (let i = 0; i < keys.length; i += DELETE_BATCH_SIZE) {
      const batch = keys.slice(i, i + DELETE_BATCH_SIZE);
      const res = await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.cfg.bucket,
          Delete: { Objects: batch.map((k) => ({ Key: k })), Quiet: true },
        }),
      );
      if (res.Errors && res.Errors.length > 0) {
        const first = res.Errors[0];
        throw new Error(`deleteObjects 部分失败：${first?.Key} → ${first?.Message}`);
      }
    }
  }

  /* ========== URL ========== */
  buildPublicUrl(key: string): string {
    const encoded = key.split("/").map(encodeURIComponent).join("/");
    const prefix = this.cfg.publicUrl?.replace(/\/+$/, "");

    if (prefix && prefix.startsWith("/")) {
      return `${prefix}/${this.cfg.bucket}/${encoded}`;
    }
    if (prefix) return `${prefix}/${encoded}`;

    const proto = this.cfg.useSSL ? "https" : "http";
    const defaultPort = this.cfg.useSSL ? 443 : 80;
    const portPart = this.cfg.port && this.cfg.port !== defaultPort ? `:${this.cfg.port}` : "";
    return `${proto}://${this.cfg.endpoint}${portPart}/${this.cfg.bucket}/${encoded}`;
  }

  async presignedUrl(input: PresignedUrlInput): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: this.cfg.bucket,
      Key: input.key,
      ResponseContentType: input.responseContentType,
      ResponseContentDisposition: input.responseContentDisposition,
    });
    const url = await getSignedUrl(this.client, cmd, {
      expiresIn: input.expiresSec,
    });
    return this.toRelativeUrl(url);
  }

  keyFromUrl(url: string): string | null {
    if (!url) return null;
    const prefix = this.cfg.publicUrl?.replace(/\/+$/, "");

    if (prefix && prefix.startsWith("/")) {
      const p = `${prefix}/`;
      if (url.startsWith(p)) {
        const rest = safeDecode(url.slice(p.length));
        const bucketPrefix = `${this.cfg.bucket}/`;
        return rest.startsWith(bucketPrefix) ? rest.slice(bucketPrefix.length) : rest;
      }
    }

    if (prefix) {
      const p = `${prefix}/`;
      if (url.startsWith(p)) return safeDecode(url.slice(p.length));
    }

    try {
      const u = new URL(url);
      const pathname = safeDecode(u.pathname.replace(/^\/+/, ""));
      const bucketPrefix = `${this.cfg.bucket}/`;
      return pathname.startsWith(bucketPrefix) ? pathname.slice(bucketPrefix.length) : pathname;
    } catch {
      return null;
    }
  }

  /* ========== Multipart ========== */
  async createMultipartUpload(input: MultipartInitInput): Promise<MultipartInitResult> {
    const res = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.cfg.bucket,
        Key: input.key,
        ContentType: input.contentType,
      }),
    );
    if (!res.UploadId) {
      throw new Error("createMultipartUpload: 未返回 UploadId");
    }
    return { uploadId: res.UploadId, key: input.key };
  }

  async presignUploadPart(input: PresignPartInput): Promise<string> {
    const cmd = new UploadPartCommand({
      Bucket: this.cfg.bucket,
      Key: input.key,
      UploadId: input.uploadId,
      PartNumber: input.partNumber,
    });
    const url = await getSignedUrl(this.client, cmd, {
      expiresIn: input.expiresSec,
    });
    return this.toRelativeUrl(url);
  }

  async completeMultipartUpload(
    input: CompleteMultipartInput,
  ): Promise<{ url: string; key: string }> {
    if (input.parts.length === 0) {
      throw new Error("completeMultipartUpload: parts 不能为空");
    }
    const sorted = [...input.parts].sort((a, b) => a.partNumber - b.partNumber);
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.cfg.bucket,
        Key: input.key,
        UploadId: input.uploadId,
        MultipartUpload: {
          Parts: sorted.map((p) => ({
            PartNumber: p.partNumber,
            ETag: p.etag,
          })),
        },
      }),
    );
    return { url: this.buildPublicUrl(input.key), key: input.key };
  }

  async abortMultipartUpload(input: { key: string; uploadId: string }): Promise<void> {
    await this.client.send(
      new AbortMultipartUploadCommand({
        Bucket: this.cfg.bucket,
        Key: input.key,
        UploadId: input.uploadId,
      }),
    );
  }

  /* ========== 私有 ========== */
  private toRelativeUrl(signedUrl: string): string {
    if (!this.cfg.publicUrl || !this.cfg.publicUrl.startsWith("/")) {
      return signedUrl;
    }
    try {
      const u = new URL(signedUrl);
      const prefix = this.cfg.publicUrl.replace(/\/+$/, "");
      return `${prefix}${u.pathname}${u.search}`;
    } catch {
      return signedUrl;
    }
  }
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
