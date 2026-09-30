import COS from "cos-nodejs-sdk-v5";
import type { Readable } from "node:stream";
import type { IStorage, PutObjectInput, PresignedUrlInput } from "./types.js";
import { isBuffer } from "./types.js";

export interface CosStorageConfig {
  region: string;
  bucket: string;
  secretId: string;
  secretKey: string;
  customDomain?: string;
}

export class CosStorage implements IStorage {
  readonly type = "cos";
  private client: COS;

  constructor(private readonly cfg: CosStorageConfig) {
    this.client = new COS({
      SecretId: cfg.secretId,
      SecretKey: cfg.secretKey,
    });
  }

  async ensure(): Promise<void> {}

  async putObject(input: PutObjectInput): Promise<void> {
    // ⭐ COS 类型宽松，Buffer 和 Stream 都能直接传
    const body: Buffer | Readable = input.body;

    await new Promise<void>((resolve, reject) => {
      this.client.putObject(
        {
          Bucket: this.cfg.bucket,
          Region: this.cfg.region,
          Key: input.key,
          Body: body,
          ContentType: input.contentType,
          ContentLength: input.contentLength,
        },
        (err) => (err ? reject(err) : resolve()),
      );
    });
  }

  async deleteObject(key: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.client.deleteObject(
        { Bucket: this.cfg.bucket, Region: this.cfg.region, Key: key },
        (err) => (err ? reject(err) : resolve()),
      );
    });
  }

  async exists(key: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.client.headObject(
        { Bucket: this.cfg.bucket, Region: this.cfg.region, Key: key },
        (err) => resolve(!err),
      );
    });
  }

  buildPublicUrl(key: string): string {
    const encoded = key.split("/").map(encodeURIComponent).join("/");
    if (this.cfg.customDomain) {
      return `${this.cfg.customDomain.replace(/\/+$/, "")}/${encoded}`;
    }
    return `https://${this.cfg.bucket}.cos.${this.cfg.region}.myqcloud.com/${encoded}`;
  }

  async presignedUrl(input: PresignedUrlInput): Promise<string> {
    return new Promise((resolve, reject) => {
      this.client.getObjectUrl(
        {
          Bucket: this.cfg.bucket,
          Region: this.cfg.region,
          Key: input.key,
          Sign: true,
          Expires: input.expiresSec,
        },
        (err, data) => (err ? reject(err) : resolve(data.Url)),
      );
    });
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
