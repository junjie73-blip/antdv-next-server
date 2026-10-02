import { AppError } from "@/core/errors.js";
import { StorageBackendRepository } from "../repository.js";
import { invalidateActiveBackend } from "../cache.js";
import { encryptSensitive, decryptSensitive } from "../sensitive.js";
import { SENSITIVE_CONFIG_KEYS } from "../constants.js";
import { invalidateStorage } from "@/platform/storage/factory.js";
import type {
  StorageBackendCreateDTO,
  StorageBackendUpdateDTO,
  StorageBackendListDTO,
} from "../schema.js";

const MASK = "******";

export class StorageBackendService {
  private repo = new StorageBackendRepository();

  /* ============================================================
   * 列表（配置脱敏）
   * ============================================================ */
  async list(tenantId: string, query: StorageBackendListDTO) {
    const page = await this.repo.findPage(tenantId, query);
    return {
      ...page,
      list: page.list.map((b) => this.maskBackend(b)),
    };
  }

  /* ============================================================
   * 详情
   * ============================================================ */
  async detail(id: string, tenantId: string) {
    const b = await this.repo.findById(id, tenantId);
    if (!b) throw new AppError("存储后端不存在", 404001, 404);
    return this.maskBackend(b);
  }

  /* ============================================================
   * 创建
   * ============================================================ */
  async create(
    dto: StorageBackendCreateDTO,
    tenantId: string,
    userId?: string,
  ) {
    // 同类型同名唯一
    const exists = await this.repo.findByType(tenantId, dto.backendType);
    if (exists && exists.backend_name === dto.backendName) {
      throw new AppError("该类型已存在同名后端", 409001, 409);
    }

    // 加密敏感字段
    const encryptedConfig = encryptSensitive(dto.config, SENSITIVE_CONFIG_KEYS);

    const id = await this.repo.create({
      tenantId,
      backendType: dto.backendType,
      backendName: dto.backendName,
      config: encryptedConfig,
      priority: dto.priority,
      remark: dto.remark,
      userId,
    });

    return { backendId: id };
  }

  /* ============================================================
   * 更新
   * ============================================================ */
  async update(
    id: string,
    dto: StorageBackendUpdateDTO,
    tenantId: string,
    userId?: string,
  ) {
    const b = await this.repo.findById(id, tenantId);
    if (!b) throw new AppError("存储后端不存在", 404001, 404);

    let config = dto.config;
    if (config) {
      // 已加密的字段先解密，再合并新值，再加密
      const decrypted = decryptSensitive(
        b.config as Record<string, unknown>,
        SENSITIVE_CONFIG_KEYS,
      );
      const merged = { ...decrypted };
      for (const [k, v] of Object.entries(config)) {
        if (v === MASK) continue; // 前端传 ****** 表示不修改
        merged[k] = v;
      }
      config = encryptSensitive(merged, SENSITIVE_CONFIG_KEYS);
    }

    await this.repo.update(
      id,
      tenantId,
      {
        backendName: dto.backendName,
        config,
        priority: dto.priority,
        remark: dto.remark,
      },
      userId,
    );

    if (b.is_active === 1) {
      await invalidateActiveBackend(tenantId);
      invalidateStorage(tenantId);
    }
  }

  /* ============================================================
   * 激活（热切换）
   * ============================================================ */
  async activate(id: string, tenantId: string, userId?: string) {
    const b = await this.repo.findById(id, tenantId);
    if (!b) throw new AppError("存储后端不存在", 404001, 404);
    if (b.is_healthy === 0) {
      throw new AppError("该后端健康检查失败，无法激活", 400002, 400);
    }

    await this.repo.activate(id, tenantId, userId);
    await invalidateActiveBackend(tenantId);
    invalidateStorage(tenantId);
  }

  /* ============================================================
   * 删除
   * ============================================================ */
  async remove(id: string, tenantId: string, userId?: string) {
    await this.repo.softDelete(id, tenantId, userId);
    await invalidateActiveBackend(tenantId);
  }

  /* ============================================================
   * 脱敏
   * ============================================================ */
  private maskBackend(b: any) {
    const config = { ...(b.config ?? {}) };
    for (const k of SENSITIVE_CONFIG_KEYS) {
      if (config[k]) config[k] = MASK;
    }
    return { ...b, config };
  }
}

export const storageBackendService = new StorageBackendService();
