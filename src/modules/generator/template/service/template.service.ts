import { AppError } from "@/core/errors.js";
import { GenTemplateRepository } from "../repository.js";
import {
  getTemplateCache,
  setTemplateCache,
  invalidateTemplateCache,
} from "../cache.js";
import type {
  TemplateCreateDTO,
  TemplateUpdateDTO,
  TemplateListDTO,
} from "../schema.js";

export class GenTemplateService {
  private repo = new GenTemplateRepository();

  async list(tenantId: string, query: TemplateListDTO) {
    return this.repo.findPage(tenantId, query);
  }

  async detail(id: string, tenantId: string) {
    const tpl = await this.repo.findById(id, tenantId);
    if (!tpl) throw new AppError("模板不存在", 404001, 404);

    const [versions, current] = await Promise.all([
      this.repo.listVersions(id, tenantId),
      this.repo.findVersion(id, tpl.current_version, tenantId),
    ]);

    return { ...tpl, versions, currentContent: current?.content ?? null };
  }

  async create(dto: TemplateCreateDTO, tenantId: string, userId?: string) {
    const exists = await this.repo.findByKey(dto.templateKey, tenantId);
    if (exists) throw new AppError("模板 key 已存在", 409001, 409);

    const id = await this.repo.createWithFirstVersion({
      tenantId,
      templateKey: dto.templateKey,
      templateName: dto.templateName,
      category: dto.category,
      content: dto.content,
      changelog: dto.changelog,
      userId,
    });

    await invalidateTemplateCache(tenantId);
    return { templateId: id };
  }

  /** 更新：内容变化时自动创建新版本 */
  async update(
    id: string,
    dto: TemplateUpdateDTO,
    tenantId: string,
    userId?: string,
  ) {
    const tpl = await this.repo.findById(id, tenantId);
    if (!tpl) throw new AppError("模板不存在", 404001, 404);

    if (dto.content !== undefined) {
      await this.repo.appendVersion({
        templateId: id,
        tenantId,
        content: dto.content,
        changelog: dto.changelog,
        userId,
      });
    }

    if (dto.templateName !== undefined) {
      await this.repo.updateName(id, tenantId, dto.templateName, userId);
    }

    await invalidateTemplateCache(tenantId);
  }

  async rollback(
    id: string,
    version: number,
    tenantId: string,
    userId?: string,
  ) {
    await this.repo.rollback(id, tenantId, version, userId);
    await invalidateTemplateCache(tenantId);
  }

  async remove(id: string, tenantId: string, userId?: string) {
    await this.repo.softDelete(id, tenantId, userId);
    await invalidateTemplateCache(tenantId);
  }

  /* ============================================================
   * 供 generator 模块调用：加载模板
   * ============================================================ */
  async loadForGenerator(tenantId: string) {
    const cached = await getTemplateCache(tenantId);
    if (cached) return cached;

    const list = await this.repo.loadAllWithCurrent(tenantId);
    await setTemplateCache(tenantId, list);
    return list;
  }
}

export const genTemplateService = new GenTemplateService();
