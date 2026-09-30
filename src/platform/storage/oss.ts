import OSS from "ali-oss";
import type { IStorage, PutObjectInput, PresignedUrlInput } from "./types.js";
import { isBuffer } from "./types.js";

export interface OssStorageConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  endpoint?: string;
  customDomain?: string;
}

export class OssStorage implements IStorage {
  readonly type = "oss";
  private client: OSS;

  constructor(private readonly cfg: OssStorageConfig) {
    this.client = new OSS({
      region: cfg.region,
      accessKeyId: cfg.accessKeyId,
      accessKeySecret: cfg.accessKeySecret,
      bucket: cfg.bucket,
      ...(cfg.endpoint ? { endpoint: cfg.endpoint } : {}),
    });
  }

  async ensure(): Promise<void> {}

  async putObject(input: PutObjectInput): Promise<void> {
    if (isBuffer(input.body)) {
      // put：支持 headers
      await this.client.put(input.key, input.body, {
        ...(input.contentType
          ? { headers: { "Content-Type": input.contentType } }
          : {}),
      });
      return;
    }

    // ⭐ putStream：用 mime 代替 headers
    await this.client.putStream(input.key, input.body, {
      ...(input.contentType ? { mime: input.contentType } : {}),
      ...(input.contentLength ? { contentLength: input.contentLength } : {}),
    } as OSS.PutStreamOptions);
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.head(key);
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
    return `https://${this.cfg.bucket}.${this.cfg.region}.aliyuncs.com/${encoded}`;
  }

  async presignedUrl(input: PresignedUrlInput): Promise<string> {
    const options: OSS.SignatureUrlOptions = {
      expires: input.expiresSec,
    };
    if (input.responseContentType || input.responseContentDisposition) {
      options.response = {
        ...(input.responseContentType
          ? { "content-type": input.responseContentType }
          : {}),
        ...(input.responseContentDisposition
          ? { "content-disposition": input.responseContentDisposition }
          : {}),
      };
    }
    return this.client.signatureUrl(input.key, options);
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
