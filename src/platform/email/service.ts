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
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
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

  try {
    const info = await transporter.sendMail({ from, ...rest });
    logger.info(
      { to: rest.to, subject: rest.subject, messageId: info.messageId },
      "[mail] sent",
    );
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    logger.error(
      { err, to: rest.to, subject: rest.subject },
      "[mail] send failed",
    );
    return { success: false, error: err?.message ?? String(err) };
  }
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
