import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import type { GenTemplateEntity, GenTemplateVersionEntity } from "./types.js";

export class GenTemplateRepository {
  async findById(id: string, tenantId: string) {
    return prisma.gen_template.findFirst({
      where: { template_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
  }

  async findByKey(key: string, tenantId: string) {
    return prisma.gen_template.findFirst({
      where: { template_key: key, tenant_id: tenantId, is_deleted: 0 },
    });
  }

  /** 加载所有启用的模板（含当前版本内容） */
  async loadAllWithCurrent(tenantId: string) {
    const tpls = await prisma.gen_template.findMany({
      where: { tenant_id: tenantId, is_deleted: 0, status: "1" },
    });
    if (tpls.length === 0) return [];

    const versions = await prisma.gen_template_version.findMany({
      where: {
        tenant_id: tenantId,
        template_id: { in: tpls.map((t) => t.template_id) },
        is_current: 1,
      },
    });
    const versionMap = new Map(versions.map((v) => [v.template_id, v]));

    return tpls
      .map((t) => {
        const v = versionMap.get(t.template_id);
        if (!v) return null;
        return {
          templateKey: t.template_key,
          category: t.category,
          version: v.version,
          content: v.content,
        };
      })
      .filter(Boolean) as Array<{
      templateKey: string;
      category: string;
      version: number;
      content: string;
    }>;
  }

  async findPage(
    tenantId: string,
    query: {
      pageNum?: number;
      pageSize?: number;
      category?: string;
      keyword?: string;
    },
  ) {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (pageNum - 1) * pageSize;

    const where: any = { tenant_id: tenantId, is_deleted: 0 };
    if (query.category) where.category = query.category;
    if (query.keyword) where.template_name = { contains: query.keyword };

    const [list, total] = await Promise.all([
      prisma.gen_template.findMany({
        where,
        orderBy: [{ category: "asc" }, { template_key: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.gen_template.count({ where }),
    ]);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** 列出所有版本 */
  async listVersions(templateId: string, tenantId: string) {
    return prisma.gen_template_version.findMany({
      where: { template_id: templateId, tenant_id: tenantId },
      orderBy: { version: "desc" },
      select: {
        version_id: true,
        version: true,
        changelog: true,
        is_current: true,
        created_at: true,
        created_by: true,
      },
    });
  }

  async findVersion(templateId: string, version: number, tenantId: string) {
    return prisma.gen_template_version.findFirst({
      where: { template_id: templateId, version, tenant_id: tenantId },
    });
  }

  /** 创建模板 + 首个版本（事务） */
  async createWithFirstVersion(data: {
    tenantId: string;
    templateKey: string;
    templateName: string;
    category: string;
    content: string;
    changelog?: string;
    userId?: string;
  }): Promise<string> {
    return prisma.$transaction(async (tx) => {
      const tpl = await tx.gen_template.create({
        data: {
          tenant_id: data.tenantId,
          template_key: data.templateKey,
          template_name: data.templateName,
          category: data.category,
          current_version: 1,
          status: "1",
          created_by: data.userId,
          updated_by: data.userId,
        },
      });

      await tx.gen_template_version.create({
        data: {
          template_id: tpl.template_id,
          tenant_id: data.tenantId,
          version: 1,
          content: data.content,
          changelog: data.changelog ?? "初始版本",
          is_current: 1,
          created_by: data.userId,
        },
      });

      return tpl.template_id;
    });
  }

  /** 追加新版本（事务） */
  async appendVersion(data: {
    templateId: string;
    tenantId: string;
    content: string;
    changelog?: string;
    userId?: string;
  }): Promise<number> {
    return prisma.$transaction(async (tx) => {
      const tpl = await tx.gen_template.findFirst({
        where: {
          template_id: data.templateId,
          tenant_id: data.tenantId,
          is_deleted: 0,
        },
        select: { current_version: true },
      });
      if (!tpl) throw new AppError("模板不存在", 404001, 404);

      const nextVersion = tpl.current_version + 1;

      // 旧版本取消 current
      await tx.gen_template_version.updateMany({
        where: {
          template_id: data.templateId,
          tenant_id: data.tenantId,
          is_current: 1,
        },
        data: { is_current: 0 },
      });

      await tx.gen_template_version.create({
        data: {
          template_id: data.templateId,
          tenant_id: data.tenantId,
          version: nextVersion,
          content: data.content,
          changelog: data.changelog ?? null,
          is_current: 1,
          created_by: data.userId,
        },
      });

      await tx.gen_template.update({
        where: { template_id: data.templateId },
        data: {
          current_version: nextVersion,
          updated_by: data.userId,
          updated_at: new Date(),
        },
      });

      return nextVersion;
    });
  }

  /** 回滚（把指定 version 设为 current） */
  async rollback(
    templateId: string,
    tenantId: string,
    version: number,
    userId?: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const v = await tx.gen_template_version.findFirst({
        where: { template_id: templateId, tenant_id: tenantId, version },
      });
      if (!v) throw new AppError("目标版本不存在", 404001, 404);

      await tx.gen_template_version.updateMany({
        where: { template_id: templateId, tenant_id: tenantId, is_current: 1 },
        data: { is_current: 0 },
      });

      await tx.gen_template_version.update({
        where: { version_id: v.version_id },
        data: { is_current: 1 },
      });

      await tx.gen_template.update({
        where: { template_id: templateId },
        data: {
          current_version: version,
          updated_by: userId,
          updated_at: new Date(),
        },
      });
    });
  }

  async softDelete(id: string, tenantId: string, userId?: string) {
    const r = await prisma.gen_template.updateMany({
      where: { template_id: id, tenant_id: tenantId, is_deleted: 0 },
      data: { is_deleted: 1, updated_by: userId, updated_at: new Date() },
    });
    if (r.count === 0) throw new AppError("模板不存在", 404001, 404);
  }
  async updateName(
    id: string,
    tenantId: string,
    name: string,
    userId?: string,
  ) {
    const r = await prisma.gen_template.updateMany({
      where: { template_id: id, tenant_id: tenantId, is_deleted: 0 },
      data: { template_name: name, updated_by: userId, updated_at: new Date() },
    });
    if (r.count === 0) throw new AppError("模板不存在", 404001, 404);
  }
}
