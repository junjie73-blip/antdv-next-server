import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { createGzip } from "node:zlib";
import { PassThrough } from "node:stream";
import { getSystemStorage } from "@/platform/storage/system.js";

const BATCH = 5_000;

export async function archivePartition(
  table: string,
  partition: string,
): Promise<string | null> {
  const total = await prisma.$queryRawUnsafe<{ cnt: bigint }[]>(
    `SELECT COUNT(*)::bigint AS cnt FROM "${partition}"`,
  );
  if (!total[0] || total[0].cnt === 0n) {
    logger.info({ partition }, "[archive] empty partition, skip");
    return null;
  }

  const m = /_p(\d{4})(\d{2})$/.exec(partition);
  const year = m?.[1] ?? "unknown";
  const key = `audit-archive/${table}/${year}/${partition}.ndjson.gz`;

  const gz = createGzip({ level: 6 });
  const pass = new PassThrough();
  gz.pipe(pass);

  // ⭐ 用系统级 storage，绕过租户配置
  const storage = getSystemStorage();

  const uploadPromise = storage.putObject({
    key,
    body: pass,
    contentType: "application/gzip",
  });

  let lastCreatedAt: Date | null = null;
  let lastLogId: string | null = null;
  let written = 0;

  while (true) {
    let rows: Record<string, unknown>[];
    if (lastCreatedAt && lastLogId) {
      rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT * FROM "${partition}"
          WHERE (created_at, log_id) > ($1, $2)
          ORDER BY created_at, log_id
          LIMIT ${BATCH}`,
        lastCreatedAt,
        lastLogId,
      );
    } else {
      rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT * FROM "${partition}"
          ORDER BY created_at, log_id
          LIMIT ${BATCH}`,
      );
    }

    if (rows.length === 0) break;

    for (const r of rows) {
      const line = JSON.stringify(r, (_k, v) =>
        typeof v === "bigint" ? v.toString() : v,
      );
      if (!gz.write(line + "\n")) {
        await new Promise((resolve) => gz.once("drain", resolve));
      }
      written++;
    }

    const last = rows[rows.length - 1];
    lastCreatedAt = last.created_at as Date;
    lastLogId = last.log_id as string;

    if (rows.length < BATCH) break;
  }

  gz.end();
  await uploadPromise;

  logger.info(
    { partition, rows: written, key, bucket: (storage as any).cfg?.bucket },
    "[archive] partition archived",
  );
  return key;
}

export async function archiveAndDrop(
  table: string,
  partition: string,
): Promise<void> {
  if (!/^[a-z][a-z0-9_]*_p\d{6}$/.test(partition)) {
    throw new Error(`Invalid partition name: ${partition}`);
  }
  const key = await archivePartition(table, partition);
  if (!key) {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${partition}"`);
    return;
  }
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${partition}"`);

  logger.info(
    { table, partition, key },
    "[archive] partition archived and dropped",
  );
}
