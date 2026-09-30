export * from "./meta.js";
export * from "./user.events.js";
export * from "./notice.events.js";
export * from "./audit.events.js";
import type { UserEvent } from "./user.events.js";
import type { NoticeEvent } from "./notice.events.js";
import type { AuditEvent } from "./audit.events.js";
export type DomainEvent = UserEvent | NoticeEvent | AuditEvent;
//# sourceMappingURL=index.d.ts.map