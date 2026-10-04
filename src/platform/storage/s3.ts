import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  UploadPartCommand,
  CreateMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  IStorage,
  PutObjectInput,
  PresignedUrlInput,
  ListObjectsInput,
  ObjectInfo,
  GetObjectResult,
  CompleteMultipartInput,
  PresignPartInput,
  MultipartInitResult,
  MultipartInitInput,
} from "./types.js";
import { isBuffer } from "./types.js";

export interface S3StorageConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  customDomain?: string;
}

export class S3Storage implements IStorage {
  readonly type = "s3";
  private client: S3Client;

  constructor(private readonly cfg: S3StorageConfig) {
    this.client = new S3Client({
      region: cfg.region,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.accessKeySecret,
      },
      ...(cfg.endpoint ? { endpoint: cfg.endpoint } : {}),
      ...(cfg.forcePathStyle ? { forcePathStyle: true } : {}),
    });
  }

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
    } catch {
      return false;
    }
  }

  /** ⭐ 列对象 */
  async listObjects(input: ListObjectsInput): Promise<ObjectInfo[]> {
    const out: ObjectInfo[] = [];
    let token: string | undefined;
    const max = input.maxKeys ?? 1000;

    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.cfg.bucket,
          Prefix: input.prefix,
          MaxKeys: Math.min(1000, max - out.length),
          ContinuationToken: token,
        }),
      );

      for (const o of res.Contents ?? []) {
        if (!o.Key) continue;
        out.push({
          key: o.Key,
          size: Number(o.Size ?? 0),
          lastModified: o.LastModified,
        });
        if (out.length >= max) break;
      }

      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token && out.length < max);

    return out;
  }

  /** ⭐ 下载对象 */
  async getObject(key: string): Promise<GetObjectResult> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.cfg.bucket, Key: key }));
    return {
      body: res.Body as any,
      size: res.ContentLength,
      contentType: res.ContentType,
    };
  }

  /** ⭐ 批量删除 */
  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    // S3 DeleteObjects 单次最多 1000
    const BATCH = 1000;
    for (let i = 0; i < keys.length; i += BATCH) {
      const batch = keys.slice(i, i + BATCH);
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.cfg.bucket,
          Delete: { Objects: batch.map((k) => ({ Key: k })), Quiet: true },
        }),
      );
    }
  }

  buildPublicUrl(key: string): string {
    const encoded = key.split("/").map(encodeURIComponent).join("/");
    if (this.cfg.customDomain) {
      return `${this.cfg.customDomain.replace(/\/+$/, "")}/${encoded}`;
    }
    return `https://${this.cfg.bucket}.s3.${this.cfg.region}.amazonaws.com/${encoded}`;
  }

  async presignedUrl(input: PresignedUrlInput): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: this.cfg.bucket,
      Key: input.key,
      ResponseContentType: input.responseContentType,
      ResponseContentDisposition: input.responseContentDisposition,
    });
    return getSignedUrl(this.client, cmd, { expiresIn: input.expiresSec });
  }

  keyFromUrl(url: string): string | null {
    if (!url) return null;
    if (this.cfg.customDomain) {
      const prefix = this.cfg.customDomain.replace(/\/+$/, "") + "/";
      if (url.startsWith(prefix)) {
        return decodeURIComponent(url.slice(prefix.length).split("?")[0]);
      }
    }
    try {
      return decodeURIComponent(new URL(url).pathname.replace(/^\/+/, ""));
    } catch {
      return null;
    }
  }
  /* ============================================================
   * ⭐ Multipart Upload
   * ============================================================ */

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
    return getSignedUrl(this.client, cmd, { expiresIn: input.expiresSec });
  }

  async completeMultipartUpload(
    input: CompleteMultipartInput,
  ): Promise<{ url: string; key: string }> {
    // ⭐ 按 partNumber 升序排列（S3 要求）
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
}
