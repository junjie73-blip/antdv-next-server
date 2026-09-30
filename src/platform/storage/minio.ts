import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import type { IStorage, PutObjectInput, PresignedUrlInput } from "./types.js";
import { isBuffer } from "./types.js";

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

export class MinioStorage implements IStorage {
  readonly type = "minio";
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
      }),
      maxAttempts: 3,
    });
  }

  async ensure(): Promise<void> {}

  async putObject(input: PutObjectInput): Promise<void> {
    // ⭐ 类型守卫后 body 收窄为 Buffer 或 Readable，与 SDK 兼容
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

    // 此时 input.body 是 Readable
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
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.cfg.bucket, Key: key }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.cfg.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  buildPublicUrl(key: string): string {
    const encoded = key.split("/").map(encodeURIComponent).join("/");
    const prefix = this.cfg.publicUrl?.replace(/\/+$/, "");

    if (prefix && prefix.startsWith("/")) {
      return `${prefix}/${this.cfg.bucket}/${encoded}`;
    }

    if (prefix) {
      return `${prefix}/${encoded}`;
    }
    const proto = this.cfg.useSSL ? "https" : "http";
    const defaultPort = this.cfg.useSSL ? 443 : 80;
    const portPart =
      this.cfg.port && this.cfg.port !== defaultPort ? `:${this.cfg.port}` : "";
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
        return rest.startsWith(bucketPrefix)
          ? rest.slice(bucketPrefix.length)
          : rest;
      }
    }

    if (prefix) {
      const p = `${prefix}/`;
      if (url.startsWith(p)) {
        return safeDecode(url.slice(p.length));
      }
    }

    try {
      const u = new URL(url);
      const pathname = safeDecode(u.pathname.replace(/^\/+/, ""));
      const bucketPrefix = `${this.cfg.bucket}/`;
      return pathname.startsWith(bucketPrefix)
        ? pathname.slice(bucketPrefix.length)
        : pathname;
    } catch {
      return null;
    }
  }

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
