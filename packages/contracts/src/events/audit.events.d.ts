import type { EventMeta } from "./meta.js";
export interface AuditLogCreatedEvent extends EventMeta {
    eventType: "audit.log.created";
    payload: {
        logId: string;
        operation: string;
        method: string;
        requestUrl: string;
        status: string;
        executeTime: number;
    };
}
export type AuditEvent = AuditLogCreatedEvent;
//# sourceMappingURL=audit.events.d.ts.map