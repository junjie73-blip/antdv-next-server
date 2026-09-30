/** 所有事件必须包含的元信息 */
export interface EventMeta {
    eventId: string;
    eventType: string;
    eventVersion: string;
    occurredAt: string;
    tenantId: string;
    userId?: string;
    traceId?: string;
    source: string;
}
/** 事件处理器 */
export type EventHandler<E> = (event: E) => Promise<void>;
/** 事件主题 */
export declare const EVENT_TOPICS: {
    readonly USER: "user.events";
    readonly NOTICE: "notice.events";
    readonly AUDIT: "audit.events";
    readonly FILE: "file.events";
};
export type EventTopic = (typeof EVENT_TOPICS)[keyof typeof EVENT_TOPICS];
//# sourceMappingURL=meta.d.ts.map