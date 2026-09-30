/** UUID 校验（v4 简化） */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v) {
    return typeof v === "string" && UUID_RE.test(v);
}
/** 非空字符串 */
export function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
}
/** 邮箱（简化） */
export function isEmail(v) {
    return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
/** 手机号（中国） */
export function isChinaPhone(v) {
    return typeof v === "string" && /^1[3-9]\d{9}$/.test(v);
}
//# sourceMappingURL=validate.js.map