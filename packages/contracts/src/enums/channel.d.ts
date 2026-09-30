export declare const NOTICE_CHANNEL: {
    readonly IN_APP: "in_app";
    readonly EMAIL: "email";
    readonly SMS: "sms";
    readonly WEBHOOK: "webhook";
    readonly WECHAT_WORK: "wechat_work";
    readonly DINGTALK: "dingtalk";
};
export type NoticeChannelType = (typeof NOTICE_CHANNEL)[keyof typeof NOTICE_CHANNEL];
export declare const NOTICE_PRIORITY: {
    readonly NORMAL: 0;
    readonly IMPORTANT: 1;
    readonly URGENT: 2;
};
export type NoticePriority = (typeof NOTICE_PRIORITY)[keyof typeof NOTICE_PRIORITY];
//# sourceMappingURL=channel.d.ts.map