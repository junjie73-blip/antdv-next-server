import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { IStorage, PutObjectInput, PresignedUrlInput } from "./types.js";
import { isBuffer } from "./types.js";

export interface S3StorageConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
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
}
