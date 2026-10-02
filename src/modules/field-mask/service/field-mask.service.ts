// src/modules/field-mask/service/field-mask.service.ts
import { AppError } from "@/core/errors.js";
import { FieldMaskRepository } from "../repository.js";
import { invalidatePolicyMap } from "../cache.js";
import { applyMask } from "../matcher.js";
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
    // 名称唯一
    const dupName = await this.repo.findByName(dto.name, tenantId);
    if (dupName)
      throw new AppError(`策略名称「${dto.name}」已存在`, 409001, 409);

    // 字段路径唯一
    const dupField = await this.repo.findByField(dto.field, tenantId);
    if (dupField)
      throw new AppError(`字段「${dto.field}」已有脱敏策略`, 409001, 409);

    const id = await this.repo.create(dto, tenantId, userId);
    await invalidatePolicyMap(tenantId);
    return { policyId: id };
  }

  async update(
    id: string,
    dto: FieldMaskUpdateDTO,
    tenantId: string,
    userId?: string,
  ) {
    const existing = await this.repo.findById(id, tenantId);
    if (!existing) throw new AppError("策略不存在", 404001, 404);

    // 名称唯一（排除自己）
    if (dto.name !== undefined && dto.name !== existing.name) {
      const dup = await this.repo.findByName(dto.name, tenantId, id);
      if (dup) throw new AppError(`策略名称「${dto.name}」已存在`, 409001, 409);
    }

    // 字段路径唯一（排除自己）
    if (dto.field !== undefined && dto.field !== existing.field) {
      const dup = await this.repo.findByField(dto.field, tenantId, id);
      if (dup)
        throw new AppError(`字段「${dto.field}」已有脱敏策略`, 409001, 409);
    }

    await this.repo.update(id, dto, tenantId, userId);
    await invalidatePolicyMap(tenantId);
  }

  async remove(id: string, tenantId: string, userId?: string) {
    await this.repo.softDelete(id, tenantId, userId);
    await invalidatePolicyMap(tenantId);
  }

  /* ============================================================
   * 脱敏执行（供 response.ts 调用）
   * ============================================================ */
  /**
   * @param data      原始响应数据
   * @param tenantId  租户
   * @param policies  当前租户的启用策略列表
   */
  applyTo(
    data: unknown,
    policies: Array<{
      field: string;
      mask_type: string;
      pattern: string | null;
      replace_char: string;
      keep_prefix: number;
      keep_suffix: number;
    }>,
  ): unknown {
    if (!data || policies.length === 0) return data;

    // field 可能是 "user.phone" 这种点分路径
    const apply = (obj: unknown, path: string[] = []): unknown => {
      if (Array.isArray(obj)) {
        return obj.map((item) => apply(item, path));
      }
      if (!obj || typeof obj !== "object") return obj;

      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(
        obj as Record<string, unknown>,
      )) {
        const currentPath = [...path, key];
        const pathStr = currentPath.join(".");

        // 命中策略
        const policy = policies.find((p) => p.field === pathStr);
        if (policy && value != null) {
          out[key] = applyMask(String(value), {
            type: policy.mask_type,
            rule: policy.pattern,
            replaceChar: policy.replace_char,
            keepPrefix: policy.keep_prefix,
            keepSuffix: policy.keep_suffix,
          });
          continue;
        }

        out[key] = apply(value, currentPath);
      }
      return out;
    };

    return apply(data);
  }
}

export const fieldMaskService = new FieldMaskService();
