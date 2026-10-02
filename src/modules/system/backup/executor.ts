import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { stat, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";
import path from "node:path";
import os from "node:os";
import { logger } from "@/platform/logger/index.js";
import { env } from "@/config/env.js";
import { BackupRepository } from "./repository.js";
import {
  backupTotal,
  backupLastSuccessTimestamp,
} from "@/platform/metrics/backup.js";
import { getSystemStorage } from "@/platform/storage/system.js";

const BACKUP_TMP_DIR = path.join(os.tmpdir(), "saas-backups");

export class BackupExecutor {
  constructor(private repo: BackupRepository) {}

  /**
   * 执行一次完整备份：
   * 1. 更新记录状态 → running
   * 2. pg_dump | gzip > tmpFile
   * 3. 计算 sha256
   * 4. 上传 S3
   * 5. 更新记录 → completed
   */
  async execute(
    backupId: string,
    opts: { retainDays?: number } = {},
  ): Promise<void> {
    const record = await this.repo.findById(backupId);
    if (!record) throw new Error(`Backup ${backupId} not found`);
    if (record.status !== "pending")
      throw new Error(`Invalid status: ${record.status}`);

    const startAt = Date.now();
    await this.repo.updateStatus(backupId, { status: "running" });
    const storage = await getSystemStorage();
    const dbUrl = new URL(env.DATABASE_URL);
    const database = dbUrl.pathname.slice(1);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${database}-${timestamp}.sql.gz`;
    const tmpFile = path.join(BACKUP_TMP_DIR, `${backupId}.sql.gz`);

    await ensureDir(BACKUP_TMP_DIR);

    try {
      // ---- 1. pg_dump | gzip ----
      await this.runPgDump(dbUrl, database, tmpFile);
      logger.info({ backupId, tmpFile }, "[backup] pg_dump done");

      // ---- 2. 计算大小 + sha256 ----
      const st = await stat(tmpFile);
      const checksum = await sha256File(tmpFile);

      // ---- 3. 上传 S3 ----
      const key = `backups/${database}/${fileName}`;
      await storage.putObject({
        key,
        body: createReadStream(tmpFile),
        contentType: "application/gzip",
        contentLength: st.size,
      });
      logger.info({ backupId, key, size: st.size }, "[backup] uploaded");

      // ---- 4. 更新记录 ----
      const retainDays = opts.retainDays ?? 30;
      await this.repo.updateStatus(backupId, {
        status: "completed",
        storageKey: key,
        fileName,
        fileSize: BigInt(st.size),
        checksum,
        durationMs: Date.now() - startAt,
        finishedAt: new Date(),
        retainUntil: new Date(Date.now() + retainDays * 86_400_000),
      });

      logger.info(
        { backupId, durationMs: Date.now() - startAt },
        "[backup] completed",
      );
    } catch (err: any) {
      logger.error({ err, backupId }, "[backup] failed");
      await this.repo.updateStatus(backupId, {
        status: "failed",
        errorMsg: (err?.message ?? "unknown").slice(0, 1000),
        durationMs: Date.now() - startAt,
        finishedAt: new Date(),
      });
      throw err;
    } finally {
      backupTotal.labels("completed", record.trigger_type).inc();
      backupLastSuccessTimestamp.set(Math.floor(Date.now() / 1000));
      // 清理临时文件
      await unlink(tmpFile).catch(() => {});
    }
  }

  /**
   * pg_dump --no-owner --no-acl | gzip -6 > tmpFile
   * 大库流式执行，避免内存暴涨。
   */
  private runPgDump(
    dbUrl: URL,
    database: string,
    outFile: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const dump = spawn(
        "pg_dump",
        [
          "-h",
          dbUrl.hostname,
          "-p",
          dbUrl.port || "5432",
          "-U",
          dbUrl.username,
          "-d",
          database,
          "--no-owner",
          "--no-acl",
          "--format=plain",
        ],
        {
          env: { ...process.env, PGPASSWORD: dbUrl.password },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      const gzip = createGzip({ level: 6 });
      const out = createWriteStream(outFile);

      let stderr = "";
      dump.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
        if (stderr.length > 4096) stderr = stderr.slice(-4096);
      });

      dump.on("error", (err) => reject(err));
      dump.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`pg_dump exited with code ${code}: ${stderr}`));
        }
      });

      pipeline(dump.stdout, gzip, out)
        .then(() => resolve())
        .catch(reject);
    });
  }
}

async function ensureDir(dir: string) {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(dir, { recursive: true });
}

async function sha256File(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(file);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}
