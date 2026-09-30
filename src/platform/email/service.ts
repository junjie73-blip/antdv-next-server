import nodemailer, { Transporter } from "nodemailer";
import { logger } from "@/platform/logger/index.js";
import { env } from "@/config/env.js";

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
  from: string;
}

const MAX_CUSTOM_TRANSPORTERS = 50;

let globalTransporter: Transporter | null = null;
let globalInitialized = false;

const customTransporters = new Map<string, Transporter>();

function buildTransport(cfg: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure ?? cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });
}

function resolveGlobalConfig(): SmtpConfig | null {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.SMTP_FROM;
  const port = Number(env.SMTP_PORT ?? 465);
  if (!host || !user || !pass || !from) return null;
  return { host, port, user, pass, from };
}

function getGlobalTransporter(): Transporter | null {
  if (globalInitialized) return globalTransporter;
  globalInitialized = true;
  const cfg = resolveGlobalConfig();
  if (!cfg) {
    logger.warn("[mail] SMTP 未配置，邮件发送功能将跳过");
    return null;
  }
  globalTransporter = buildTransport(cfg);
  logger.info(
    { host: cfg.host, port: cfg.port },
    "[mail] 全局 transporter 已初始化",
  );
  return globalTransporter;
}

function getCustomTransporter(cfg: SmtpConfig): Transporter {
  const key = `${cfg.host}:${cfg.port}:${cfg.user}`;
  const hit = customTransporters.get(key);
  if (hit) {
    customTransporters.delete(key);
    customTransporters.set(key, hit);
    return hit;
  }
  if (customTransporters.size >= MAX_CUSTOM_TRANSPORTERS) {
    const oldest = customTransporters.keys().next().value as string | undefined;
    if (oldest) {
      customTransporters.get(oldest)?.close();
      customTransporters.delete(oldest);
    }
  }
  const t = buildTransport(cfg);
  customTransporters.set(key, t);
  logger.info({ key }, "[mail] 租户 transporter 已创建");
  return t;
}

export interface MailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  from?: string;
  smtp?: SmtpConfig;
}

export interface MailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export async function sendMail(input: MailInput): Promise<boolean> {
  return (await sendMailDetailed(input)).success;
}

export async function sendMailDetailed(input: MailInput): Promise<MailResult> {
  const { smtp, from: customFrom, ...rest } = input;

  let transporter: Transporter | null;
  let from: string;

  if (smtp) {
    transporter = getCustomTransporter(smtp);
    from = customFrom ?? smtp.from;
  } else {
    transporter = getGlobalTransporter();
    from = customFrom ?? env.SMTP_FROM ?? "no-reply@localhost";
  }

  if (!transporter) {
    logger.warn(
      { to: rest.to, subject: rest.subject },
      "[mail] SMTP not configured, skip sending",
    );
    return { success: false, error: "SMTP not configured" };
  }

  const MAX_RETRY = 2;
  let lastErr: any = null;

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const info = await transporter.sendMail({ from, ...rest });
      logger.info(
        {
          to: rest.to,
          subject: rest.subject,
          messageId: info.messageId,
          attempt,
        },
        "[mail] sent",
      );
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      lastErr = err;
      // 认证错误不重试
      if (err.code === "EAUTH") {
        logger.error({ err, host: from }, "[mail] auth failed");
        break;
      }
      // 最后一次失败也不重试
      if (attempt < MAX_RETRY) {
        logger.warn({ err, attempt }, "[mail] send failed, retrying...");
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  logger.error(
    { err: lastErr, to: rest.to, subject: rest.subject },
    "[mail] send failed (all attempts)",
  );
  return { success: false, error: lastErr?.message ?? String(lastErr) };
}

export function isMailReady(): boolean {
  return getGlobalTransporter() !== null;
}

export function isSmtpConfigValid(cfg: any): cfg is SmtpConfig {
  return !!(
    cfg &&
    typeof cfg.host === "string" &&
    cfg.host &&
    typeof cfg.user === "string" &&
    cfg.user &&
    typeof cfg.pass === "string" &&
    cfg.pass &&
    typeof cfg.from === "string" &&
    cfg.from
  );
}

export function parseSmtpConfig(cfg: Record<string, any>): SmtpConfig | null {
  const host = cfg.host ?? cfg.smtpHost ?? cfg.server ?? cfg.hostName;
  const port = Number(cfg.port ?? cfg.smtpPort ?? cfg.smtp_port ?? 465);
  const user = cfg.user ?? cfg.smtpUser ?? cfg.username ?? cfg.account;
  const pass =
    cfg.pass ?? cfg.smtpPass ?? cfg.password ?? cfg.authCode ?? cfg.passwd;
  const from = normalizeFrom(cfg.from ?? cfg.smtpFrom ?? cfg.sender, user);
  const secure = cfg.secure ?? port === 465;
  const result = { host, port, user, pass, from, secure };
  return isSmtpConfigValid(result) ? result : null;
}

function normalizeFrom(raw: any, fallbackUser: string): string {
  if (typeof raw !== "string" || !raw.trim()) return fallbackUser;
  const s = raw.trim();
  if (/^[^<>]+<[^<>@\s]+@[^<>\s]+>$/.test(s)) return s;
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) return s;
  const m = s.match(/([^@\s]+@[^@\s]+\.[^@\s]+)/);
  if (m) return m[1];
  return fallbackUser;
}

export async function sendVerifyCode(
  email: string,
  code: string,
  purpose: string,
) {
  const subject = `【${env.APP_NAME}】${purpose}验证码`;
  const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #f8fafc;">
        <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <h2 style="margin: 0 0 8px; font-size: 20px; color: #0f172a;">${purpose}</h2>
          <p style="margin: 0 0 24px; font-size: 14px; color: #64748b;">您正在进行${purpose}操作，请使用以下验证码完成验证：</p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563eb; font-family: 'Courier New', monospace;">${code}</span>
          </div>
          <p style="margin: 0; font-size: 13px; color: #94a3b8;">验证码 5 分钟内有效，请勿泄露给他人。</p>
          <p style="margin: 8px 0 0; font-size: 13px; color: #94a3b8;">如果这不是您的操作，请忽略此邮件。</p>
          <hr style="margin: 32px 0 16px; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="margin: 0; font-size: 12px; color: #cbd5e1; text-align: center;">${env.APP_NAME} · 系统自动发送，请勿回复</p>
        </div>
      </div>
    `;

  try {
    await sendMail({
      from: `"${env.APP_NAME}" <${env.SMTP_FROM}>`,
      to: email,
      subject,
      html,
    });
    logger.info({ email, purpose }, "[email] verify code sent");
  } catch (err) {
    logger.error({ err, email }, "[email] send failed");
    throw err;
  }
}
