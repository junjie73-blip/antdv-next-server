import { FileRepository } from "./repository.js";
import { BaseService } from "@/core/base/service.js";

export class FileService extends BaseService<FileRepository> {
  constructor(repository: FileRepository) {
    super(repository);
  }

  async listFiles(query: any) {
    return this.repository.findPage(query, {});
  }

  async removeFile(id: string, tenantId: string, userId?: string) {
    await this.assertExists(id, tenantId, "文件");
    await this.repository.softDelete(id, tenantId, userId);
  }
}
