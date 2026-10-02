import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantProbeCtx {
  tenantId: string;
  repoName?: string;
  method?: string;
}

export const tenantProbeStorage = new AsyncLocalStorage<TenantProbeCtx>();

/* ============================================================
 * ⭐ 返回类型显式声明，避免被字面量收窄
 * ============================================================ */
export interface TenantProbeResult {
  leaked: boolean;
  count: number;
  samples: Array<Record<string, unknown>>;
}

export interface TenantProbeOptions {
  /** 扫描条数上限，默认 100 */
  sampleLimit?: number;
  /** 泄漏样本采集上限，默认 5 */
  pickLimit?: number;
}

export function probeCrossTenant<T>(
  data: T | T[] | null | undefined,
  opts: TenantProbeOptions = {},
): TenantProbeResult {
  const { sampleLimit = 100, pickLimit = 5 } = opts;

  const ctx = tenantProbeStorage.getStore();
  if (!ctx?.tenantId) {
    return { leaked: false, count: 0, samples: [] };
  }

  const rows: unknown[] = Array.isArray(data)
    ? data
    : data == null
      ? []
      : [data];
  const limit = Math.min(rows.length, sampleLimit);

  let leaked = 0;
  const samples: Array<Record<string, unknown>> = [];

  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;

    // 没有 tenant_id 字段的记录跳过（无法判断归属）
    if (!("tenant_id" in r)) continue;

    if (r.tenant_id !== ctx.tenantId) {
      leaked++;
      if (samples.length < pickLimit) {
        samples.push({
          tenant_id: r.tenant_id,
          id:
            r.id ??
            r.user_id ??
            r.role_id ??
            r.notice_id ??
            r.task_id ??
            r.instance_id ??
            r.dept_id ??
            r.menu_id ??
            undefined,
        });
      }
    }
  }

  return { leaked: leaked > 0, count: leaked, samples };
}
