import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import {
  keysToSnakeCase,
  keysToCamelCase,
} from "@/common/utils/case-convert.js";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import { AppError } from "@/middleware/error-handler.js";
import { UserCreateDto, UserImportRowSchema } from "./schema.js";
import { Prisma } from "@/generated/prisma/index.js";
import { encrypt } from "@/common/utils/crypto.js";

export class UserRepository extends BaseRepository<any, any, any, any> {
  protected readonly primaryKey = "user_id";
  protected readonly model = prisma.sys_user;

  /**
   * 分页查询用户（带角色、部门过滤），重写基类方法
   */
  async findPage(query: BaseQuery, where: any): Promise<PageResult<any>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    const finalWhere: any = {
      ...where,
      tenant_id: query.tenantId,
      is_deleted: 0,
    };

    // 处理 deptId 过滤（包含子部门）
    if (query.deptId) {
      const deptIds = await this.getAllChildDeptIds(
        query.deptId as string,
        query.tenantId,
      );
      finalWhere.sys_user_dept = {
        some: {
          dept_id: { in: deptIds },
        },
      };
    }

    // 如果还有 roleId 过滤，类似处理
    if (query.roleId) {
      finalWhere.sys_user_role = {
        some: {
          role_id: query.roleId,
        },
      };
    }

    const [rawList, total] = await Promise.all([
      this.model.findMany({
        where: finalWhere,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
        include: {
          sys_user_dept: { include: { dept: true } },
          sys_user_role: { include: { role: true } },
        },
      }),
      this.model.count({ where: finalWhere }),
    ]);

    // 转换数据结构（扁平化 role 和 dept）
    const list = rawList.map((user: any) => {
      const { sys_user_role, sys_user_dept, ...rest } = user;
      return {
        ...rest,
        roles:
          sys_user_role?.map((ur: any) => ({
            roleName: ur.role?.role_name,
            roleId: ur.role?.role_id,
          })) || [],
        deptId: sys_user_dept?.[0]?.dept?.dept_id || null,
        deptName: sys_user_dept?.[0]?.dept?.dept_name || "",
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
  /**
   * 根据用户名查找用户（用于唯一性检查）
   */
  async findUserByUsername(
    username: string,
    tenantId: string,
    excludeId?: string,
  ) {
    const where: any = {
      tenant_id: tenantId,
      username,
      is_deleted: 0,
    };
    if (excludeId) where.user_id = { not: excludeId };
    return this.model.findFirst({ where });
  }

  /**
   * 获取用户详情（含角色、部门）
   */
  async findUserDetail(id: string, tenantId: string) {
    return this.model.findFirst({
      where: { user_id: id, tenant_id: tenantId, is_deleted: 0 },
      // @ts-ignore
      include: {
        sys_user_role: {
          include: { role: { select: { role_id: true, role_name: true } } },
        },
        sys_user_dept: {
          include: { dept: { select: { dept_id: true, dept_name: true } } },
        },
      },
    });
  }

  /**
   * 创建用户（覆盖基类方法，处理密码哈希和关联）
   */
  async create(data: any, tenantId: string, userId?: string): Promise<any> {
    return this.createWithRelations(data, tenantId, userId);
  }

  /**
   * 更新用户（覆盖基类方法，处理关联更新和唯一性）
   */
  async update(
    id: string,
    data: any,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const existing = await this.findUserDetail(id, tenantId);
    if (!existing) {
      throw new AppError(404, "用户不存在", 404);
    }

    if (data.username) {
      const duplicate = await this.findUserByUsername(
        data.username,
        tenantId,
        id,
      );
      if (duplicate) {
        throw new AppError(409, "用户名已存在", 409);
      }
    }

    const { role_ids: roleIds, dept_ids: deptIds, password, ...rest } = data;
    //  密码字段若存在，需要哈希（通常更新密码会走专门接口，此处可忽略或处理）
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = encrypt(password);
    }

    return prisma.$transaction(async (tx) => {
      // 1. 更新用户主体（排除关联字段）
      if (Object.keys(rest).length > 0 || hashedPassword) {
        await tx.sys_user.update({
          where: { user_id: id },
          data: {
            ...rest,
            ...(hashedPassword && { password: hashedPassword }),
            updated_by: userId,
            updated_at: new Date(),
          },
        });
      }

      // 2. 处理部门关联（若传入了 dept_ids）
      if (deptIds !== undefined) {
        // 删除旧关联
        await tx.sys_user_dept.deleteMany({
          where: { user_id: id, tenant_id: tenantId },
        });

        // 若 dept_ids 非空，则创建新关联（支持单个字符串或数组）
        if (deptIds) {
          const deptArray = Array.isArray(deptIds) ? deptIds : [deptIds];
          await tx.sys_user_dept.createMany({
            data: deptArray.map((deptId: string) => ({
              user_id: id,
              dept_id: deptId,
              tenant_id: tenantId,
              is_primary: 1,
            })),
          });
        }
      }

      // 3. 处理角色关联（若传入了 role_ids）
      if (roleIds !== undefined) {
        await tx.sys_user_role.deleteMany({
          where: { user_id: id, tenant_id: tenantId },
        });

        if (roleIds && roleIds.length > 0) {
          const roleArray = Array.isArray(roleIds) ? roleIds : [roleIds];
          await tx.sys_user_role.createMany({
            data: roleArray.map((roleId: string) => ({
              user_id: id,
              role_id: roleId,
              tenant_id: tenantId,
            })),
          });
        }
      }

      // 返回更新后的用户（包含关联信息，可选）
      return tx.sys_user.findUnique({
        where: { user_id: id },
        include: {
          sys_user_dept: { include: { dept: true } },
          sys_user_role: { include: { role: true } },
        },
      });
    });
  }

  /**
   * 批量创建用户（用于导入），与 create 类似但跳过唯一性检查（在调用前已检查）
   */
  async batchCreateUsers(
    users: any[],
    tenantId: string,
    userId?: string,
  ): Promise<any[]> {
    return prisma.$transaction(async (tx) => {
      const created = [];
      for (const u of users) {
        const { roleIds, deptIds, password, ...rest } = u;
        const user = await tx.sys_user.create({
          data: {
            // @ts-ignore
            ...keysToSnakeCase(rest),
            password,
            tenant_id: tenantId,
            created_by: userId,
            updated_by: userId,
            created_at: new Date(),
            updated_at: new Date(),
            is_deleted: 0,
          },
        });
        if (roleIds?.length) {
          await tx.sys_user_role.createMany({
            data: roleIds.map((roleId: string) => ({
              user_id: user.user_id,
              role_id: roleId,
              tenant_id: tenantId,
            })),
          });
        }
        if (deptIds?.length) {
          await tx.sys_user_dept.createMany({
            data: deptIds.map((deptId: string) => ({
              user_id: user.user_id,
              dept_id: deptId,
              tenant_id: tenantId,
            })),
          });
        }
        created.push(user);
      }
      return created;
    });
  }

  /**
   * 导出用户数据并返回 Excel Buffer
   * @param where - 查询条件（不含 tenant_id）
   * @param tenantId - 租户 ID
   */
  async exportUsersToExcel(where: any, tenantId: string): Promise<Buffer> {
    const finalWhere = { ...where, tenant_id: tenantId, is_deleted: 0 };
    const users = await this.model.findMany({
      where: finalWhere,
      // @ts-ignore
      include: {
        sys_user_role: { include: { role: true } },
        sys_user_dept: { include: { dept: true } },
      },
      orderBy: { created_at: "asc" },
    });

    const data = users.map((u) => ({
      用户名: u.username,
      真实姓名: u.real_name || "",
      手机号: u.phone || "",
      邮箱: u.email || "",
      性别: u.gender === 1 ? "男" : u.gender === 2 ? "女" : "未知",
      状态: u.status === "1" ? "启用" : "禁用",
      角色: (u.sys_user_role as any[])
        .map((ur) => ur.sys_role?.role_name)
        .join(","),
      部门: (u.sys_user_dept as any[])
        .map((ud) => ud.sys_dept?.dept_name)
        .join(","),
      创建时间: u.created_at.toISOString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "用户数据");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  /**
   * 从 Excel 文件 Buffer 导入用户
   * @param fileBuffer - 上传的 Excel 文件 Buffer
   * @param tenantId - 租户 ID
   * @param userId - 操作人 ID
   * @returns 导入结果统计
   */
  async importUsersFromExcel(
    fileBuffer: Buffer,
    tenantId: string,
    userId?: string,
  ): Promise<{ successCount: number; failCount: number; errors: string[] }> {
    // 1. 解析 Excel
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new AppError(400, "Excel文件为空", 400);
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];
    if (rows.length === 0) throw new AppError(400, "Excel中没有数据", 400);

    // 2. 逐行校验并转换
    const successList: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel 行号（跳过表头）
      try {
        // 基础数据转换
        const parsedRow = {
          username: String(row["用户名"] || "").trim(),
          realName: String(row["真实姓名"] || "").trim() || undefined,
          phone: String(row["手机号"] || "").trim() || undefined,
          email: String(row["邮箱"] || "").trim() || undefined,
          gender: row["性别"] === "男" ? 1 : row["性别"] === "女" ? 2 : 0,
          status: row["状态"] === "禁用" ? "0" : "1",
          roleCodes: String(row["角色编码"] || "").trim(),
          deptCodes: String(row["部门编码"] || "").trim(),
        };

        // 使用 Zod 校验字段格式
        UserImportRowSchema.parse(parsedRow);

        // 检查用户名是否已存在
        const exist = await this.findUserByUsername(
          parsedRow.username,
          tenantId,
        );
        if (exist) throw new Error(`用户名 '${parsedRow.username}' 已存在`);

        // 解析角色编码为 ID
        const roleIds: string[] = [];
        if (parsedRow.roleCodes) {
          const codes = parsedRow.roleCodes
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
          const roles = await prisma.sys_role.findMany({
            where: { tenant_id: tenantId, role_code: { in: codes } },
          });
          if (roles.length !== codes.length)
            throw new Error("存在无效的角色编码");
          roleIds.push(...roles.map((r) => r.role_id));
        }

        // 解析部门编码为 ID
        const deptIds: string[] = [];
        if (parsedRow.deptCodes) {
          const codes = parsedRow.deptCodes
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
          const depts = await prisma.sys_dept.findMany({
            where: { tenant_id: tenantId, dept_code: { in: codes } },
          });
          if (depts.length !== codes.length)
            throw new Error("存在无效的部门编码");
          deptIds.push(...depts.map((d) => d.dept_id));
        }

        // 默认密码：123456
        const hashedPassword = await bcrypt.hash("123456", 10);
        successList.push({
          username: parsedRow.username,
          password: hashedPassword,
          real_name: parsedRow.realName,
          phone: parsedRow.phone,
          email: parsedRow.email,
          gender: parsedRow.gender,
          status: parsedRow.status,
          roleIds,
          deptIds,
        });
      } catch (e: any) {
        errors.push(
          `第${rowNum}行：${e.message || e.errors?.[0]?.message || "数据无效"}`,
        );
      }
    }

    // 3. 批量插入有效数据
    let successCount = 0;
    if (successList.length > 0) {
      const created = await this.batchCreateUsers(
        successList,
        tenantId,
        userId,
      );
      successCount = created.length;
    }

    return { successCount, failCount: errors.length, errors };
  }
  async updateUserRoles(userId: string, roleIds: string[], tenantId: string) {
    await prisma.$transaction([
      prisma.sys_user_role.deleteMany({
        where: { user_id: userId, tenant_id: tenantId },
      }),
      prisma.sys_user_role.createMany({
        data: roleIds.map((roleId) => ({
          user_id: userId,
          role_id: roleId,
          tenant_id: tenantId,
        })),
      }),
    ]);
  }

  async findUserRoles(userId: string, tenantId: string) {
    const roles = await prisma.sys_user_role.findMany({
      where: { user_id: userId, tenant_id: tenantId },
      include: { role: true },
    });
    return roles.map((r) => r.role);
  }
  async updateUserDepts(userId: string, deptIds: string[], tenantId: string) {
    await prisma.$transaction([
      prisma.sys_user_dept.deleteMany({
        where: { user_id: userId, tenant_id: tenantId },
      }),
      prisma.sys_user_dept.createMany({
        data: deptIds.map((deptId) => ({
          user_id: userId,
          dept_id: deptId,
          tenant_id: tenantId,
          is_primary: 0,
        })),
      }),
    ]);
  }

  async findUserDepts(userId: string, tenantId: string) {
    const depts = await prisma.sys_user_dept.findMany({
      where: { user_id: userId, tenant_id: tenantId },
      include: { dept: true },
    });
    return depts.map((d) => d.dept);
  }
  /**
   * 创建用户并关联角色/部门
   */
  async createWithRelations(data: any, tenantId: string, userId?: string) {
    // 从 data 中解构出 deptIds 和 roleIds，剩余部分才是用户表字段
    const {
      dept_ids: deptIds,
      role_ids: roleIds,
      password,
      ...userData
    } = data;
    // 密码哈希提前进行
    const hashedPassword = await bcrypt.hash(password, 10);

    return prisma.$transaction(async (tx) => {
      // 1. 创建用户主体
      const user = await tx.sys_user.create({
        data: {
          // @ts-ignore
          ...keysToSnakeCase(userData),
          password: hashedPassword,
          tenant_id: tenantId,
          created_by: userId,
          updated_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
          is_deleted: 0,
        },
      });

      // 2. 处理部门关联
      if (deptIds && deptIds.length > 0) {
        // 兼容 deptIds 可能是单个字符串或数组
        const deptArray = Array.isArray(deptIds) ? deptIds : [deptIds];
        await tx.sys_user_dept.createMany({
          data: deptArray.map((deptId: string) => ({
            user_id: user.user_id,
            dept_id: deptId,
            tenant_id: tenantId,
            is_primary: 0,
          })),
        });
      }

      // 3. 处理角色关联
      if (roleIds && roleIds.length > 0) {
        const roleArray = Array.isArray(roleIds) ? roleIds : [roleIds];
        await tx.sys_user_role.createMany({
          data: roleArray.map((roleId: string) => ({
            user_id: user.user_id,
            role_id: roleId,
            tenant_id: tenantId,
          })),
        });
      }

      return user;
    });
  }

  // 查找租户
  async findTenantByCode(tenantCode: string) {
    return prisma.sys_tenant.findUnique({
      where: { tenant_code: tenantCode },
    });
  }

  // 在租户内查找用户名
  async findUserByUsernameInTenant(
    username: string,
    tenantId: string,
    excludeId?: string,
  ) {
    const where: any = {
      tenant_id: tenantId,
      username,
      is_deleted: 0,
    };
    if (excludeId) where.user_id = { not: excludeId };
    return this.model.findFirst({ where });
  }

  // 注册租户和用户（事务）
  async registerTenantWithUser(data: {
    tenantCode: string;
    tenantName: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
  }) {
    const { tenantCode, tenantName, username, password, email, phone } = data;
    const hashedPassword = await encrypt(password);

    return prisma.$transaction(async (tx) => {
      // 1. 创建租户
      const tenant = await tx.sys_tenant.create({
        data: {
          tenant_code: tenantCode,
          tenant_name: tenantName,
          status: "1",
          created_at: new Date(),
          updated_at: new Date(),
          is_deleted: 0,
        },
      });

      // 2. 创建用户并绑定租户
      const user = await tx.sys_user.create({
        data: {
          tenant_id: tenant.tenant_id,
          username,
          password: hashedPassword,
          email,
          phone,
          status: "1",
          created_at: new Date(),
          updated_at: new Date(),
          is_deleted: 0,
        },
      });

      // 3. 可选：创建默认角色并关联用户（如超级管理员）
      // 如果需要，可在此创建超级管理员角色并绑定，参照之前的注册逻辑

      return { tenant, user };
    });
  }
  async getAllChildDeptIds(
    parentDeptId: string,
    tenantId: string,
  ): Promise<string[]> {
    // 查询所有部门（未删除），用于构建树
    const allDepts = await prisma.sys_dept.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
      select: { dept_id: true, parent_id: true },
    });

    // 构建 parent -> children 映射
    const childrenMap: Record<string, string[]> = {};
    for (const dept of allDepts) {
      const parentId = dept.parent_id || "root";
      if (!childrenMap[parentId]) childrenMap[parentId] = [];
      childrenMap[parentId].push(dept.dept_id);
    }

    // 收集所有后代 ID
    const result: string[] = [];
    function dfs(deptId: string) {
      result.push(deptId);
      const children = childrenMap[deptId] || [];
      for (const child of children) {
        dfs(child);
      }
    }
    dfs(parentDeptId);
    return result;
  }
}
