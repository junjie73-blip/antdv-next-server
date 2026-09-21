const SET = new Set([
  // 密码/凭证
  "password",
  "oldpassword",
  "newpassword",
  "confirmpassword",
  "secret",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "apikey",
  "privatekey",
  // 个人身份
  "idcard",
  "phone",
  "mobile",
  "email",
  "address",
  "bankaccount",
  "cardno",
  "taxno",
  "passport",
  "license",
  // 验证码
  "captchacode",
  "mfasecret",
]);

export function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[_-]/g, "");
}

export function isSensitive(k: string): boolean {
  return SET.has(normalizeKey(k));
}

export const SENSITIVE_KEYS = SET;
