import type { EventMeta } from "./meta.js";
export interface UserCreatedEvent extends EventMeta {
    eventType: "user.created";
    payload: {
        userId: string;
        username: string;
        email?: string;
        phone?: string;
        deptId?: string;
        roleIds: string[];
    };
}
export interface UserUpdatedEvent extends EventMeta {
    eventType: "user.updated";
    payload: {
        userId: string;
        changes: Record<string, unknown>;
    };
}
export interface UserDeletedEvent extends EventMeta {
    eventType: "user.deleted";
    payload: {
        userId: string;
        username: string;
    };
}
export type UserEvent = UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent;
//# sourceMappingURL=user.events.d.ts.map