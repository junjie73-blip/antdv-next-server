import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { invalidateIpRuleCache } from "./cache.js";

export class IpRuleRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_ip_rule;
  protected readonly primaryKey = "rule_id";

  async findPage(query: any, where: any) {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;
    const finalWhere: any = {
      ...where,
      tenant_id: query.tenantId,
      is_deleted: 0,
    };
    if (query.ruleType) finalWhere.rule_type = query.ruleType;
    if (query.ipPattern) finalWhere.ip_pattern = { contains: query.ipPattern };
    if (query.status) finalWhere.status = query.status;
    const scopedWhere = this.mergeDataScope(finalWhere);
    const [list, total] = await Promise.all([
      this.model.findMany({
        where: scopedWhere,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      this.model.count({ where: scopedWhere }),
    ]);
    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** 判断 IP 是否被允许 */
  async checkIp(ip: string, tenantId: string) {
    const rules = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0, status: "1" },
    });
    // 黑名单优先
    const black = rules.find(
      (r) => r.rule_type === "black" && matchIp(ip, r.ip_pattern),
    );
    if (black) return { allowed: false, reason: "命中黑名单" };
    const white = rules.filter((r) => r.rule_type === "white");
    if (white.length > 0) {
      const matched = white.some((r) => matchIp(ip, r.ip_pattern));
      if (!matched) return { allowed: false, reason: "不在白名单" };
    }
    return { allowed: true };
  }
  async create(data: any, tenantId: string, userId?: string) {
    const result = await super.create(data, tenantId, userId);
    await invalidateIpRuleCache(tenantId);
    return result;
  }

  async update(id: string, data: any, tenantId: string, userId?: string) {
    const result = await super.update(id, data, tenantId, userId);
    await invalidateIpRuleCache(tenantId);
    return result;
  }

  async softDelete(id: string, tenantId: string, userId?: string) {
    const result = await super.softDelete(id, tenantId, userId);
    await invalidateIpRuleCache(tenantId);
    return result;
  }
}

/** 简单 IP 匹配：支持精确和 CIDR */
function matchIp(ip: string, pattern: string): boolean {
  if (!pattern.includes("/")) return ip === pattern;
  const [subnet, bitsStr] = pattern.split("/");
  const bits = Number(bitsStr);
  const ipNum = ipToNum(ip);
  const subNum = ipToNum(subnet);
  if (ipNum === null || subNum === null) return false;
  const mask = bits === 0 ? 0 : ~((1 << (32 - bits)) - 1);
  return (ipNum & mask) === (subNum & mask);
}

function ipToNum(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255))
    return null;
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}
