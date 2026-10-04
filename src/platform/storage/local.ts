import fs from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import { pipeline } from "node:stream/promises";
import { AppError } from "@/core/errors.js";
import type {
  IStorage,
  PutObjectInput,
  PresignedUrlInput,
  GetObjectResult,
  ObjectInfo,
} from "./types.js";
import { isBuffer } from "./types.js";
import { createReadStream } from "node:fs";

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
  async listObjects(input: { prefix: string; maxKeys?: number }): Promise<ObjectInfo[]> {
    const basePath = this.resolvePath(input.prefix);
    const results: ObjectInfo[] = [];

    // ⭐ 提前提取，供闭包使用
    const rootDir = this.cfg.root;
    const maxKeys = input.maxKeys ?? 1000;

    async function walk(dir: string) {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          await walk(full);
        } else {
          const stat = await fs.stat(full);
          // ⭐ 用 rootDir 而不是 this.cfg.root
          const key = path.relative(rootDir, full).replace(/\\/g, "/");
          results.push({ key, size: stat.size, lastModified: stat.mtime });
          if (results.length >= maxKeys) return;
        }
      }
    }

    await walk(basePath);
    return results;
  }

  async getObject(key: string): Promise<GetObjectResult> {
    const full = this.resolvePath(key);
    const stat = await fs.stat(full);
    return {
      body: createReadStream(full),
      size: stat.size,
    };
  }

  async deleteObjects(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => this.deleteObject(k)));
  }
}
