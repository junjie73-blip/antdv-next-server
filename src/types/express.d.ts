import type { DataScopeContext } from "@/core/context/data-scope-context.js";
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        username: string;
        roles?: string[];
      };
      tenantId?: string;
      deviceId?: string;
      dataScope?: DataScopeContext;
      __responseBody?: unknown;
      __errorMsg?: string;
    }
  }
}
