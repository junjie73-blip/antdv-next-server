import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { WfDefinitionRepository } from "../repository/definition.repository.js";
import { ExpressionEvaluator } from "./expression-evaluator.js";
import { WorkflowValidator } from "./workflow-validator.js";
import type {
  WfDefinitionCreateDTO,
  WfDefinitionUpdateDTO,
  WorkflowDefinitionJSON,
} from "../schema.js";

export class WfDefinitionService {
  private repo = new WfDefinitionRepository();
  private validator = new WorkflowValidator();

  /* ============================================================
   * 列表
   * ============================================================ */
  async list(params: {
    tenantId: string;
    keyword?: string;
    category?: string;
    status?: string;
    pageNum: number;
    pageSize: number;
  }) {
    return this.repo.findPage(params, {});
  }

  /* ============================================================
   * 详情
   * ============================================================ */
  async detail(id: string, tenantId: string) {
    const def = await this.repo.findById(id, tenantId);
    if (!def) throw new AppError("流程定义不存在", 404001, 404);
    return def;
  }

  /* ============================================================
   * 创建
   * ============================================================ */
  async create(dto: WfDefinitionCreateDTO, tenantId: string, userId: string) {
    // 1. 深度校验 BPMN 定义
    this.validator.validate(dto.definition);

    // 2. 生成下一个版本号
    const version = await this.repo.getNextVersion(dto.defKey, tenantId);

    // 3. 创建
    const created = await this.repo.create({
      tenant_id: tenantId,
      def_key: dto.defKey,
      def_name: dto.defName,
      version,
      category: dto.category ?? null,
      description: dto.description ?? null,
      definition: dto.definition as any,
      definition_xml: dto.definitionXml ?? null,
      form_schema: (dto.formSchema ?? null) as any,
      var_schema: (dto.varSchema ?? null) as any,
      status: dto.status ?? "0",
      created_by: userId,
      updated_by: userId,
    });

    logger.info(
      { defId: created.def_id, defKey: dto.defKey, version },
      "[wf-def] 创建成功",
    );

    return created;
  }

  /* ============================================================
   * 更新
   * ============================================================ */
  async update(
    id: string,
    dto: WfDefinitionUpdateDTO,
    tenantId: string,
    userId: string,
  ) {
    const existing = await this.repo.findById(id, tenantId);
    if (!existing) throw new AppError("流程定义不存在", 404001, 404);

    // 已发布的版本不允许直接修改，只能新建版本
    if (existing.status === "1") {
      throw new AppError("已发布的流程不可修改，请创建新版本", 400001, 400);
    }

    if (dto.definition) {
      this.validator.validate(dto.definition);
    }

    await this.repo.update(id, {
      def_name: dto.defName,
      category: dto.category,
      description: dto.description,
      definition: dto.definition as any,
      definition_xml: dto.definitionXml,
      form_schema: dto.formSchema as any,
      var_schema: dto.varSchema as any,
      updated_by: userId,
    });

    logger.info({ defId: id, tenantId }, "[wf-def] 更新成功");
  }

  /* ============================================================
   * 发布
   * ============================================================ */
  async publish(id: string, tenantId: string, userId: string) {
    const def = await this.repo.findById(id, tenantId);
    if (!def) throw new AppError("流程定义不存在", 404001, 404);

    if (def.status === "1") {
      throw new AppError("流程已发布", 400001, 400);
    }

    // 发布前再校验一次（防止手工改库绕过）
    this.validator.validate(
      def.definition as unknown as WorkflowDefinitionJSON,
    );

    // 停用旧版本
    await this.repo.deactivateOtherVersions(def.def_key, tenantId, def.version);

    await this.repo.update(id, {
      status: "1",
      updated_by: userId,
    });

    logger.info(
      { defId: id, defKey: def.def_key, version: def.version },
      "[wf-def] 已发布",
    );
  }

  /* ============================================================
   * 新版本
   * ============================================================ */
  async newVersion(id: string, tenantId: string, userId: string) {
    const source = await this.repo.findById(id, tenantId);
    if (!source) throw new AppError("流程定义不存在", 404001, 404);

    const nextVersion = await this.repo.getNextVersion(
      source.def_key,
      tenantId,
    );

    const created = await this.repo.create({
      tenant_id: tenantId,
      def_key: source.def_key,
      def_name: source.def_name,
      version: nextVersion,
      category: source.category,
      description: source.description,
      definition: source.definition as any,
      definition_xml: source.definition_xml,
      form_schema: source.form_schema as any,
      var_schema: source.var_schema as any,
      status: "0",
      created_by: userId,
      updated_by: userId,
    });

    logger.info(
      { sourceId: id, newId: created.def_id, version: nextVersion },
      "[wf-def] 新建版本",
    );

    return created;
  }

  /* ============================================================
   * 删除
   * ============================================================ */
  async remove(id: string, tenantId: string, userId: string) {
    const def = await this.repo.findById(id, tenantId);
    if (!def) throw new AppError("流程定义不存在", 404001, 404);

    if (def.status === "1") {
      throw new AppError("已发布的流程不可删除", 400001, 400);
    }

    const instanceCount = await this.repo.countActiveInstances(id, tenantId);
    if (instanceCount > 0) {
      throw new AppError(
        `存在 ${instanceCount} 个运行中的流程实例，无法删除`,
        400001,
        400,
      );
    }

    await this.repo.softDelete(id, tenantId, userId);
    logger.info({ defId: id, tenantId }, "[wf-def] 删除成功");
  }

  /* ============================================================
   * 校验（编辑器调用，不落库）
   * ============================================================ */
  validate(definition: WorkflowDefinitionJSON) {
    this.validator.validate(definition);
    return { valid: true };
  }

  /* ============================================================
   * 导入 XML（前端 bpmn-js 导出的 XML → JSON）
   * ============================================================ */
  async importXml(xml: string, tenantId: string) {
    // 只做格式校验，不做业务校验
    if (!xml.includes("<bpmn:definitions")) {
      throw new AppError("不是合法的 BPMN XML", 400001, 400);
    }

    // XML 解析为 JSON（如需要，也可直接存储 XML，由前端解析）
    // 这里只返回基础信息
    const defKey = extractFromXml(xml, "process", "id") ?? "imported";
    const defName = extractFromXml(xml, "process", "name") ?? "导入流程";

    return {
      defKey,
      defName,
      xml,
      /** 前端可以拿到 XML 后加载到画布，再触发保存 */
    };
  }
}

function extractFromXml(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<[^>]*${tag}[^>]*${attr}="([^"]*)"`, "i");
  const m = xml.match(regex);
  return m?.[1] ?? null;
}
