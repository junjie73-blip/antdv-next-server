/**
 * 敏感字段清单
 *
 * ⚠️ 归一化规则：小写 + 去除 `_` 和 `-`
 *   accessKey   → accesskey
 *   accessKeyId → accesskeyid
 *   secret_key  → secretkey
 */

const RAW_KEYS = [
  // ============ 密码 / 凭证 ============
  "password",
  "oldpassword",
  "newpassword",
  "confirmpassword",
  "passwd",
  "pwd",

  // ============ Token / 会话 ============
  "token",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "sessionid",
  "jsessionid",
  "csrf",
  "csrftoken",
  "xsrf",

  // ============ 密钥 / Secret ============
  "secret",
  "apikey",
  "apisecret",
  "privatekey",
  "publickey",
  "masterkey",
  "encryptionkey",
  "signingkey",
  "signature",
  "jwtsecret",
  "hmacsecret",
  "clientsecret",
  "clientid",
  "appsecret",
  "appid",
  "appkey",

  // ============ 云存储 AccessKey / SecretKey ============
  "accesskey",
  "accesskeyid",
  "accesskeysecret",
  "secretkey",
  "secretid",
  "minioaccesskey",
  "miniosecretkey",
  "ossaccesskeyid",
  "ossaccesskeysecret",
  "cossecretid",
  "cossecretkey",
  "s3accesskeyid",
  "s3accesskeysecret",

  // ============ SMTP ============
  "smtppass",
  "smtpuser",
  "smtpsecret",
  "smtppassword",

  // ============ Webhook / 回调 ============
  "webhooksecret",
  "webhooktoken",
  "webhooksign",

  // ============ 个人身份 ============
  "idcard",
  "idcardno",
  "idcardnumber",
  "phone",
  "mobile",
  "tel",
  "email",
  "address",
  "homeaddress",
  "bankaccount",
  "bankcard",
  "cardno",
  "taxno",
  "passport",
  "passportno",
  "license",
  "drivinglicense",
  "realname",
  "birthday",
  "birthdate",

  // ============ 验证码 / MFA ============
  "captchacode",
  "verifycode",
  "smscode",
  "emailcode",
  "mfasecret",
  "mfacode",
  "totp",
  "totpsecret",
  "backupcode",
  "recoverycode",

  // ============ 加密后字段（防解密后误记日志）============
  "idcardenc",
  "phoneenc",
  "emailenc",
  "passwordenc",

  // ============ 连接串（含密码）============
  "databaseurl",
  "redisurl",
  "dburl",
  "mongourl",
] as const;

const SET: ReadonlySet<string> = Object.freeze(new Set(RAW_KEYS));

export function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[_-]/g, "");
}

export function isSensitive(k: string): boolean {
  return SET.has(normalizeKey(k));
}

export const SENSITIVE_KEYS = SET;

/**
 * 供监控/测试：遍历所有已知敏感 key
 */
export function listSensitiveKeys(): string[] {
  return [...SET].sort();
}

/**
 * 判断一批 key 是否包含敏感字段
 */
export function hasSensitiveKey(keys: string[]): boolean {
  return keys.some((k) => isSensitive(k));
}
