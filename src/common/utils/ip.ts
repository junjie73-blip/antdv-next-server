import type { Request } from "express";

/**
 * 从 Express 请求中提取真实客户端 IP
 * 优先级：X-Forwarded-For > X-Real-IP > req.ip > socket.remoteAddress
 */
export function getClientIp(req: Request): string {
  let ip = "";

  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    ip = xff.split(",")[0].trim();
  } else if (typeof req.headers["x-real-ip"] === "string") {
    ip = req.headers["x-real-ip"];
  } else {
    ip = req.ip || req.socket?.remoteAddress || "";
  }

  // 归一化 IPv4 映射
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  if (ip === "::1") return "127.0.0.1";
}
