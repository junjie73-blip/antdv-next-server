import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { createGzip } from "node:zlib";
import { PassThrough } from "node:stream";
import { uploadStream } from "@/platform/storge/index.js";

const BATCH = 5_000;

/**
 * 归档单个分区到 MinIO（NDJSON.gz）
 * 返回归档对象的 key；空分区返回 null
 *
 * ⭐ 前提：该分区在归档期间无写入（归档前已 detach / 无新数据）
 *    使用 keyset pagination 避免 LIMIT/OFFSET 在并发写入时漏行
 */
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

  const uploadPromise = uploadStream({
    key,
    body: pass,
    metadata: { table, partition, rows: String(total[0].cnt) },
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
    { partition, rows: written, key },
    "[archive] partition archived",
  );
  return key;
}

export async function archiveAndDrop(
  table: string,
  partition: string,
): Promise<void> {
  const key = await archivePartition(table, partition);
  if (!key) {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${partition}"`);
    return;
  }
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${partition}"`);
}
