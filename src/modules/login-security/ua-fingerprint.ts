import { UAParser } from "ua-parser-js";

/**
 * 从 User-Agent 提取稳定的设备指纹
 * 使用：os.name + os.version(主) + browser.name + browser.version(主)
 * 目的：忽略小版本升级带来的差异
 */
export function buildFingerprint(ua: string | null | undefined): string {
  if (!ua) return "unknown";

  try {
    const parser = new UAParser(ua);
    const browser = parser.getBrowser();
    const os = parser.getOS();

    const browserMajor = browser.version?.split(".")[0] ?? "";
    const osMajor = os.version?.split(".")[0] ?? "";

    return [
      (os.name ?? "unknown").toLowerCase(),
      osMajor,
      (browser.name ?? "unknown").toLowerCase(),
      browserMajor,
    ]
      .filter(Boolean)
      .join("|");
  } catch {
    return "unknown";
  }
}

/**
 * 提取浏览器可读名称（用于通知）
 */
export function describeUa(ua: string | null | undefined): {
  browser: string;
  os: string;
  device: string;
} {
  if (!ua) return { browser: "未知", os: "未知", device: "未知" };
  try {
    const parser = new UAParser(ua);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();
    return {
      browser: browser.name
        ? `${browser.name} ${browser.version ?? ""}`.trim()
        : "未知",
      os: os.name ? `${os.name} ${os.version ?? ""}`.trim() : "未知",
      device: device.type
        ? `${device.vendor ?? ""} ${device.model ?? ""}`.trim() || device.type
        : "桌面端",
    };
  } catch {
    return { browser: "未知", os: "未知", device: "未知" };
  }
}
