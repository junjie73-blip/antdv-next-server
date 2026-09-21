import type { Request } from "express";

export function getClientIp(req: Request): string {
  let ip = "";

  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    ip = xff.split(",")[0].trim();
  } else if (Array.isArray(xff) && xff.length > 0) {
    ip = xff[0].split(",")[0].trim();
  } else if (typeof req.headers["x-real-ip"] === "string") {
    ip = req.headers["x-real-ip"];
  } else if (req.ip) {
    ip = req.ip;
  } else {
    ip = req.socket?.remoteAddress || "";
  }

  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (ip === "::1") ip = "127.0.0.1";
  return ip || "unknown"; // ⭐
}
