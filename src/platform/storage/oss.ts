import OSS from "ali-oss";
import type {
  IStorage,
  PutObjectInput,
  PresignedUrlInput,
  GetObjectResult,
  ObjectInfo,
  CompleteMultipartInput,
  MultipartInitInput,
  MultipartInitResult,
  PresignPartInput,
} from "./types.js";
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
        ...(input.contentType ? { headers: { "Content-Type": input.contentType } } : {}),
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
        ...(input.responseContentType ? { "content-type": input.responseContentType } : {}),
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
  async listObjects(input: { prefix: string; maxKeys?: number }): Promise<ObjectInfo[]> {
    const res = await this.client.list(
      {
        prefix: input.prefix,
        "max-keys": input.maxKeys ?? 1000,
      },
      {},
    );
    return (res.objects ?? []).map((o) => ({
      key: o.name,
      size: Number(o.size),
      lastModified: o.lastModified ? new Date(o.lastModified) : undefined,
    }));
  }

  async getObject(key: string): Promise<GetObjectResult> {
    const res = await this.client.getStream(key);
    return { body: res.stream as any, size: res.res.headers["content-length"] as any };
  }

  async deleteObjects(keys: string[]): Promise<void> {
    await this.client.deleteMulti(keys, { quiet: true });
  }
  async createMultipartUpload(input: MultipartInitInput): Promise<MultipartInitResult> {
    const res = await this.client.initMultipartUpload(input.key, {
      ...(input.contentType ? { mime: input.contentType } : {}),
    });
    return { uploadId: res.uploadId, key: input.key };
  }

  async presignUploadPart(input: PresignPartInput): Promise<string> {
    return this.client.signatureUrl(input.key, {
      method: "PUT",
      expires: input.expiresSec,
      subResource: {
        partNumber: String(input.partNumber),
        uploadId: input.uploadId,
      },
    });
  }

  async completeMultipartUpload(
    input: CompleteMultipartInput,
  ): Promise<{ url: string; key: string }> {
    const sorted = [...input.parts].sort((a, b) => a.partNumber - b.partNumber);
    await this.client.completeMultipartUpload(
      input.key,
      input.uploadId,
      sorted.map((p) => ({ number: p.partNumber, etag: p.etag })),
    );
    return { url: this.buildPublicUrl(input.key), key: input.key };
  }

  async abortMultipartUpload(input: { key: string; uploadId: string }): Promise<void> {
    await this.client.abortMultipartUpload(input.key, input.uploadId);
  }
}
