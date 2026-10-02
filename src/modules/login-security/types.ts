import type { AbnormalType } from "./constants.js";

/** 登录上下文（检测输入） */
export interface LoginContext {
  tenantId: string;
  userId: string;
  username: string;
  ip: string;
  userAgent: string;
  deviceId?: string | null;
  loginAt: Date;
  /** 当前登录日志 ID（用于回写结果） */
  logId?: string;
}

/** GeoIP 结果 */
export interface GeoInfo {
  country?: string;
  province?: string;
  city?: string;
  isp?: string;
  /** 经纬度 */
  latitude?: number;
  longitude?: number;
  /** 是否成功解析 */
  resolved: boolean;
}

/** 历史登录记录（精简） */
export interface HistoryLogin {
  logId: string;
  ip: string;
  userAgent: string | null;
  deviceId?: string | null;
  createdAt: Date;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** 规则执行上下文 */
export interface RuleContext {
  current: LoginContext;
  currentGeo: GeoInfo;
  currentFingerprint: string;
  history: HistoryLogin[];
}

/** 规则结果 */
export interface RuleResult {
  hit: boolean;
  type: AbnormalType;
  reason?: string;
  /** 附加数据（可选，用于通知） */
  metadata?: Record<string, unknown>;
}

/** 检测汇总 */
export interface DetectResult {
  isAbnormal: boolean;
  type?: AbnormalType;
  reason?: string;
  geo: GeoInfo;
  fingerprint: string;
  hits: RuleResult[];
}
