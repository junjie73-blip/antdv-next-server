/**
 * 判断 IP 是否匹配规则
 * 支持：精确 IP、CIDR（如 192.168.1.0/24）、通配（如 192.168.1.*）
 */
export function matchIp(ip: string, pattern: string): boolean {
  if (!ip || !pattern) return false;

  // 精确匹配
  if (ip === pattern) return true;

  // CIDR
  if (pattern.includes("/")) {
    return matchCidr(ip, pattern);
  }

  // 通配符
  if (pattern.includes("*")) {
    const regex = new RegExp(
      `^${pattern.replace(/\./g, "\\.").replace(/\*/g, "\\d+")}$`,
    );
    return regex.test(ip);
  }

  return false;
}

function matchCidr(ip: string, cidr: string): boolean {
  const [subnet, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  const ipNum = ipToNumber(ip);
  const subNum = ipToNumber(subnet);
  if (ipNum === null || subNum === null) return false;
  if (bits < 0 || bits > 32) return false;

  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipNum & mask) === (subNum & mask);
}

function ipToNumber(ip: string): number | null {
  // 处理 IPv4
  if (ip.includes(":")) return null; // IPv6 暂不支持，可扩展
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return null;
  if (parts.some((p) => isNaN(p) || p < 0 || p > 255)) return null;
  return (
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
  );
}

/**
 * 从规则集合中判断是否允许访问
 */
export function checkIpAgainstRules(
  ip: string,
  rules: { white: string[]; black: string[] },
): { allowed: boolean; reason?: string } {
  // 1. 黑名单优先
  for (const pattern of rules.black) {
    if (matchIp(ip, pattern)) {
      return { allowed: false, reason: "命中黑名单" };
    }
  }

  // 2. 白名单非空时，必须命中
  if (rules.white.length > 0) {
    const hit = rules.white.some((p) => matchIp(ip, p));
    if (!hit) {
      return { allowed: false, reason: "不在白名单中" };
    }
  }

  return { allowed: true };
}
