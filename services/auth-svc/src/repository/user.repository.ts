import { prisma } from "../config/database.js";

export class UserRepository {
  /** 按租户 + 用户名查用户（登录用） */
  async findByUsername(tenantId: string, username: string) {
    return prisma.sys_user.findFirst({
      where: { tenant_id: tenantId, username, is_deleted: 0 },
    });
  }

  /** 按 ID 查 */
  async findById(userId: string, tenantId: string) {
    return prisma.sys_user.findFirst({
      where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
    });
  }

  /** 更新最后登录信息 */
  async updateLastLogin(userId: string, ip: string) {
    await prisma.sys_user.update({
      where: { user_id: userId },
      data: { last_login_ip: ip, last_login_time: new Date() },
    });
  }
}
