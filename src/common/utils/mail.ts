import nodemailer, { Transporter } from "nodemailer";
import { logger } from "@core/logger/index.js";

let transporter: Transporter | null = null;
let initialized = false;

function getTransporter(): Transporter | null {
  if (initialized) return transporter;
  initialized = true;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn("[mail] SMTP 未配置，邮件发送功能将跳过");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export interface MailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

/**
 * 发送邮件
 * - 未配置 SMTP 时静默跳过（只打 warn），不抛异常
 * - 调用方不需要 try/catch
 */
export async function sendMail(input: MailInput): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    logger.warn(
      { to: input.to, subject: input.subject },
      "[mail] SMTP not configured, skip sending",
    );
    return false;
  }
  try {
    const from = process.env.SMTP_FROM ?? "no-reply@localhost";
    await t.sendMail({ from, ...input });
    logger.info({ to: input.to, subject: input.subject }, "[mail] sent");
    return true;
  } catch (err) {
    logger.error({ err, to: input.to }, "[mail] send failed");
    return false;
  }
}

export function isMailReady(): boolean {
  return getTransporter() !== null;
}
