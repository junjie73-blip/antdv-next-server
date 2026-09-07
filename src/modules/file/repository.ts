import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { AppError } from "@/middleware/error-handler.js";
import { deleteFile } from "@/config/blob.js";
import path from "path";
import fs from "fs";
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
   * 删除文件记录（软删除）并尝试删除实际文件（可选）
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

    // 调用删除实际文件逻辑（开发/生产）
    if (process.env.NODE_ENV === "production") {
      // 使用 deleteFile 封装删除 Vercel Blob 文件
      await deleteFile(file.url);
    } else {
      const filePath = path.join(process.cwd(), file.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    return super.softDelete(id, tenantId, userId);
  }
}
