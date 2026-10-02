import { AppError } from "@/core/errors.js";
import { FieldMaskRepository } from "../repository.js";
import { getPolicyMap, setPolicyMap, invalidatePolicyMap } from "../cache.js";
import { applyMask, matchRoleScope } from "../matcher.js";
import type { PolicyMap } from "../types.js";
import type {
  FieldMaskCreateDTO,
  FieldMaskUpdateDTO,
  FieldMaskListDTO,
} from "../schema.js";

export class FieldMaskService {
  private repo = new FieldMaskRepository();

  /* ============================================================
   * CRUD
   * ============================================================ */
  async list(tenantId: string, query: FieldMaskListDTO) {
    return this.repo.findPage(tenantId, query);
  }

  async detail(id: string, tenantId: string) {
    const p = await this.repo.findById(id, tenantId);
    if (!p) throw new AppError("策略不存在", 404001, 404);
    return p;
  }

  async create(dto: FieldMaskCreateDTO, tenantId: string, userId?: string) {
    const dup = await this.repo.findDuplicate(
      tenantId,
      dto.resource,
      dto.field,
      dto.roleScope,
    );
    if (dup) throw new AppError("该资源/字段/角色范围已有策略", 409001, 409);

    const id = await this.repo.create({ ...dto, tenantId, userId });
    await invalidatePolicyMap(tenantId);
    return { policyId: id };
  }

  async update(
    id: string,
    dto: FieldMaskUpdateDTO,
    tenantId: string,
    userId?: string,
  ) {
    await this.repo.update(id, tenantId, dto, userId);
    await invalidatePolicyMap(tenantId);
  }

  async remove(id: string, tenantId: string, userId?: string) {
    await this.repo.softDelete(id, tenantId, userId);
    await invalidatePolicyMap(tenantId);
  }

  /* ============================================================
   * 加载策略 map（缓存）
   * ============================================================ */
  async loadPolicyMap(tenantId: string): Promise<PolicyMap> {
    const cached = await getPolicyMap(tenantId);
    if (cached) return cached;

    const rows = await this.repo.listEnabled(tenantId);
    const map: PolicyMap = {};
    for (const r of rows) {
      map[r.resource] ??= {};
      map[r.resource][r.field] ??= {};
      map[r.resource][r.field][r.role_scope] = {
        type: r.mask_type,
        rule: r.mask_rule,
      };
    }

    await setPolicyMap(tenantId, map);
    return map;
  }

  /* ============================================================
   * ⭐ 应用脱敏（供 response.ts 调用）
   * ============================================================ */
  async applyTo(
    data: unknown,
    resource: string,
    tenantId: string,
    userRoles: string[],
  ): Promise<unknown> {
    if (!data) return data;

    const map = await this.loadPolicyMap(tenantId);
    const policies = map[resource];
    if (!policies) return data;

    const apply = (obj: unknown): unknown => {
      if (Array.isArray(obj)) return obj.map(apply);
      if (obj && typeof obj === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          const fieldPolicies = policies[k];
          if (fieldPolicies) {
            // 优先匹配最具体的角色范围：先"具体角色"，后"all"
            let matched: { type: string; rule: string | null } | null = null;
            for (const [scope, p] of Object.entries(fieldPolicies)) {
              if (scope !== "all" && matchRoleScope(scope, userRoles)) {
                matched = p;
                break;
              }
            }
            if (!matched && fieldPolicies["all"])
              matched = fieldPolicies["all"];

            if (matched) {
              out[k] = applyMask(v, { type: matched.type, rule: matched.rule });
              continue;
            }
          }
          out[k] = apply(v);
        }
        return out;
      }
      return obj;
    };

    return apply(data);
  }
}

export const fieldMaskService = new FieldMaskService();
