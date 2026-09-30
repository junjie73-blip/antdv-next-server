import type { EventMeta } from "./meta.js";
import type { NoticeChannelType } from "../enums/channel.js";

export interface NoticePublishedEvent extends EventMeta {
  eventType: "notice.published";
  payload: {
    noticeId: string;
    title: string;
    targetUserIds: string[];
    channels: NoticeChannelType[];
  };
}

export interface NoticeRevokedEvent extends EventMeta {
  eventType: "notice.revoked";
  payload: {
    noticeId: string;
    targetUserIds: string[];
  };
}

export type NoticeEvent = NoticePublishedEvent | NoticeRevokedEvent;
