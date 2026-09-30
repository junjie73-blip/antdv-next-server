import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { deleteFileByUrl } from "@/platform/storage/factory.js";

const MAX_RETRY = 5;

export async function runFileCleanupTask(): Promise<string> {
  const now = new Date();
  const pending = await prisma.sys_file_pending_delete.findMany({
    where: {
      next_retry: { lte: now },
      retry_count: { lt: MAX_RETRY },
    },
    take: 200,
  });

  let ok = 0;
  let failed = 0;

  for (const row of pending) {
    try {
      await deleteFileByUrl(row.tenant_id, row.url);
      await prisma.sys_file_pending_delete.delete({ where: { id: row.id } });
      ok++;
    } catch (e: any) {
      const retry = row.retry_count + 1;
      const backoffMs = Math.min(2 ** retry * 60_000, 24 * 3600_000);
      await prisma.sys_file_pending_delete.update({
        where: { id: row.id },
        data: {
          retry_count: retry,
          next_retry: new Date(Date.now() + backoffMs),
          last_error: String(e?.message ?? e).slice(0, 500),
        },
      });
      failed++;
    }
  }

  logger.info({ ok, failed, total: pending.length }, "[file-cleanup] done");
  return `已清理 ${ok} 个文件，失败 ${failed} 个`;
}
