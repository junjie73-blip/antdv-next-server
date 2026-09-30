import fs from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import { pipeline } from "node:stream/promises";
import { AppError } from "@/core/errors.js";
import type { IStorage, PutObjectInput, PresignedUrlInput } from "./types.js";
import { isBuffer } from "./types.js";

export interface LocalStorageConfig {
  root: string;
  urlPrefix: string;
}

export class LocalStorage implements IStorage {
  readonly type = "local";

  constructor(private readonly cfg: LocalStorageConfig) {}

  async ensure(): Promise<void> {
    await fs.mkdir(this.cfg.root, { recursive: true });
  }

  async putObject(input: PutObjectInput): Promise<void> {
    const fullPath = this.resolvePath(input.key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // ⭐ 类型守卫
    if (isBuffer(input.body)) {
      await fs.writeFile(fullPath, input.body);
      return;
    }

    // ⭐ 用 pipeline 替代 pipe，自带错误传播
    await pipeline(input.body, createWriteStream(fullPath));
  }

  async deleteObject(key: string): Promise<void> {
    await fs.rm(this.resolvePath(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolvePath(key));
      return true;
    } catch {
      return false;
    }
  }

  buildPublicUrl(key: string): string {
    const encoded = key.split("/").map(encodeURIComponent).join("/");
    const prefix = this.cfg.urlPrefix.replace(/\/+$/, "");
    return `${prefix}/${encoded}`;
  }

  async presignedUrl(input: PresignedUrlInput): Promise<string> {
    return this.buildPublicUrl(input.key);
  }

  keyFromUrl(url: string): string | null {
    if (!url) return null;
    const prefix = this.cfg.urlPrefix.replace(/\/+$/, "");
    if (url.startsWith(`${prefix}/`)) {
      return decodeURIComponent(url.slice(prefix.length + 1));
    }
    return null;
  }

  private resolvePath(key: string): string {
    const safeKey = key.replace(/\\/g, "/").replace(/\.\.+/g, "");
    const full = path.resolve(this.cfg.root, safeKey);
    const root = path.resolve(this.cfg.root);
    if (!full.startsWith(root)) {
      throw new AppError("非法的文件路径", 400001, 400);
    }
    return full;
  }
}
