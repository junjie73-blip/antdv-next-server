import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { AppError } from "@/middleware/error-handler.js";
import { deleteFile } from "@/config/blob.js"; // 已是本地实现

export class FileRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.sys_file;
  protected readonly primaryKey = "file_id";

  async findPage(query: BaseQuery, where: any): Promise<PageResult<any>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    const finalWhere: any = {
      ...where,
      tenant_id: query.tenantId,
      is_deleted: 0,
    };
    if (query.keyword) {
      finalWhere.filename = { contains: query.keyword };
    }
    if (query.mimeType) {
      finalWhere.mime_type = { contains: query.mimeType };
    }

    const [list, total] = await Promise.all([
      this.model.findMany({
        where: finalWhere,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      this.model.count({ where: finalWhere }),
    ]);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 上传后写入文件表
   */
  async createFromUpload(data: {
    filename: string;
    url: string;
    size: number;
    mimeType?: string;
    uploader?: string;
    tenantId: string;
  }) {
    return prisma.sys_file.create({
      data: {
        filename: data.filename,
        url: data.url,
        size: data.size,
        mime_type: data.mimeType ?? null,
        uploader: data.uploader ?? null,
        tenant_id: data.tenantId,
        created_at: new Date(),
        is_deleted: 0,
      },
    });
  }

  /**
   * 删除文件（软删除 + 物理删除）
   * 已移除所有 Vercel / 环境分支，统一走本地删除
   */
  async softDelete(
    id: string,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const file = await this.model.findFirst({
      where: { file_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!file) throw new AppError(404, "文件不存在", 404);

    // 尝试删除物理文件（失败不影响软删除）
    if (file.url) {
      try {
        await deleteFile(file.url);
      } catch (e) {
        console.warn("[FileRepository] 删除物理文件失败:", file.url, e);
      }
    }

    return super.softDelete(id, tenantId, userId);
  }
}
