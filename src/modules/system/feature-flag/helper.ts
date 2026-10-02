import { AsyncLocalStorage } from "node:async_hooks";
import { getDataScope } from "@/core/index.js";
import { featureFlagService } from "./singleton.js";

/**
 * 在 controller / service 里调用：
 *   if (await isFeatureOn("new-editor")) { ... }
 */
export async function isFeatureOn(
  flagKey: string,
  overrideCtx?: { userId?: string; tenantId?: string; roles?: string[] },
): Promise<boolean> {
  const ctx = overrideCtx ?? currentCtx();
  return featureFlagService.isEnabled(flagKey, ctx);
}

function currentCtx() {
  try {
    const scope = getDataScope();
    return {
      userId: scope.userId,
      tenantId: scope.tenantId,
      roles: (scope as any).roleCodes ?? [],
    };
  } catch {
    return {};
  }
}
