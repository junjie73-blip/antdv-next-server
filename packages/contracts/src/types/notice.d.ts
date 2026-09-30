import type { NoticeChannelType, NoticePriority } from "../enums/channel.js";
export interface NoticeSummary {
    noticeId: string;
    title: string;
    noticeType: number;
    priority: NoticePriority;
    isTop: number;
    publishTime: string;
    isRead: 0 | 1;
}
export interface NoticeDetail extends NoticeSummary {
    content: string | null;
    targetUserIds: string[];
}
export interface SendNoticeInput {
    tenantId: string;
    noticeId?: string;
    title: string;
    content?: string;
    channels?: NoticeChannelType[];
    receiversByChannel?: Partial<Record<NoticeChannelType, string[]>>;
    templateId?: string;
}
//# sourceMappingURL=notice.d.ts.map