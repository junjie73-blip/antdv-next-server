import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { invalidateIpRuleCache } from "./cache.js";
import { matchIp } from "./matcher.js";

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

  async checkIp(ip: string, tenantId: string) {
    const rules = await this.model.findMany({
      where: { tenant_id: tenantId, is_deleted: 0, status: "1" },
    });
    const black = rules.find(
      (r: any) => r.rule_type === "black" && matchIp(ip, r.ip_pattern),
    );
    if (black) return { allowed: false, reason: "命中黑名单" };
    const white = rules.filter((r: any) => r.rule_type === "white");
    if (
      white.length > 0 &&
      !white.some((r: any) => matchIp(ip, r.ip_pattern))
    ) {
      return { allowed: false, reason: "不在白名单" };
    }
    return { allowed: true };
  }
}
