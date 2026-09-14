import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import { AppError } from "@/core/errors.js";
import { deleteFile } from "@/config/blob.js";

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
    if (query.keyword) finalWhere.filename = { contains: query.keyword };
    if (query.mimeType) finalWhere.mime_type = { contains: query.mimeType };

    const [rawList, total] = await Promise.all([
      this.model.findMany({
        where: finalWhere,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      this.model.count({ where: finalWhere }),
    ]);

    // ========== 批量解析 uploader → username ==========
    const uploaderIds = [
      ...new Set(rawList.map((f: any) => f.uploader).filter(Boolean)),
    ];
    let userMap = new Map<
      string,
      { username: string; realName: string | null }
    >();
    if (uploaderIds.length > 0) {
      const users = await prisma.sys_user.findMany({
        where: {
          user_id: { in: uploaderIds as string[] },
          tenant_id: query.tenantId,
        },
        select: { user_id: true, username: true, real_name: true },
      });
      userMap = new Map(
        users.map((u) => [
          u.user_id,
          { username: u.username, realName: u.real_name },
        ]),
      );
    }

    const list = rawList.map((f: any) => {
      const uploader = userMap.get(f.uploader);
      return {
        ...f,
        // 覆盖 uploader 字段为用户名；同时保留原始 id
        uploader: uploader?.username ?? null,
        uploaderId: f.uploader ?? null,
        uploaderRealName: uploader?.realName ?? null,
      };
    });

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

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

  async softDelete(
    id: string,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const file = await this.model.findFirst({
      where: { file_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!file) throw new AppError("文件不存在", 404001, 404);

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
