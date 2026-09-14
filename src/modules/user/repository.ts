import { BaseRepository } from "@/core/base-repository.js";
import { prisma } from "@/config/database.js";
import { BaseQuery, PageResult } from "@/types/base-repository.js";
import {
  keysToSnakeCase,
  keysToCamelCase,
} from "@/common/utils/case-convert.js";
import * as XLSX from "xlsx";
import { AppError } from "@/middleware/error-handler.js";
import { UserCreateDto, UserImportRowSchema } from "./schema.js";
import { verifyPassword, hashPassword } from "@/common/utils/crypto.js";
import { v4 as uuidv4 } from "uuid";
import { copyMenusFromTemplate } from "../menu/service.js";
const TEMPLATE_TENANT_CODE = "__TEMPLATE__";
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

    const scopedWhere = this.mergeDataScope(finalWhere);

    const [rawList, total] = await Promise.all([
      this.model.findMany({
        where: scopedWhere,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
        include: {
          sys_user_dept: { include: { dept: true } },
          sys_user_role: { include: { role: true } },
        },
      }),
      this.model.count({ where: scopedWhere }),
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
      throw new AppError("用户不存在", 404, 404);
    }

    if (data.username) {
      const duplicate = await this.findUserByUsername(
        data.username,
        tenantId,
        id,
      );
      if (duplicate) {
        throw new AppError("用户名已存在", 409, 409);
      }
    }

    const { role_ids: roleIds, dept_ids: deptIds, password, ...rest } = data;
    //  密码字段若存在，需要哈希（通常更新密码会走专门接口，此处可忽略或处理）
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await hashPassword(password);
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
      const created: any[] = [];
      for (const u of users) {
        const { roleIds, deptIds, password, ...rest } = u;
        const user: any = await tx.sys_user.create({
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
        created.push(user as any);
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
        .map((ur) => ur.role?.role_name)
        .filter(Boolean)
        .join(","),
      部门: (u.sys_user_dept as any[])
        .map((ud) => ud.dept?.dept_name)
        .filter(Boolean)
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
    if (!sheetName) throw new AppError("Excel文件为空", 400, 400);
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];
    if (rows.length === 0) throw new AppError("Excel中没有数据", 400, 400);

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
        const hashedPassword = await hashPassword("123456");
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
    if (roleIds.length > 0) {
      const validCount = await prisma.sys_role.count({
        where: { role_id: { in: roleIds }, tenant_id: tenantId, is_deleted: 0 },
      });
      if (validCount !== roleIds.length) {
        throw new AppError("存在无效的角色ID", 400, 400);
      }
    }
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
    if (deptIds.length > 0) {
      const validCount = await prisma.sys_dept.count({
        where: { dept_id: { in: deptIds }, tenant_id: tenantId, is_deleted: 0 },
      });
      if (validCount !== deptIds.length) {
        throw new AppError("存在无效的部门ID", 400, 400);
      }
    }
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
    const hashedPassword = await hashPassword(password);

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
  /**
   * 根据租户编码查询租户（同时校验租户名称是否匹配）
   */
  async findTenantByCodeAndName(tenantCode: string, tenantName: string) {
    return prisma.sys_tenant.findFirst({
      where: {
        tenant_code: tenantCode,
        tenant_name: tenantName,
        is_deleted: 0,
        status: "1",
      },
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

  /**
   * 在已存在的租户下注册用户
   */
  async registerUserInTenant(data: {
    tenantId: string;
    tenantName: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
    realName?: string;
  }) {
    const { tenantId, tenantName, username, password, email, phone, realName } =
      data;
    const hashedPassword = await hashPassword(password);

    const TEMPLATE_TENANT_ID = process.env.TEMPLATE_TENANT_ID;
    if (!TEMPLATE_TENANT_ID) {
      throw new Error("缺少环境变量 TEMPLATE_TENANT_ID");
    }

    return prisma.$transaction(
      async (tx) => {
        // 1) 校验用户名在该租户下唯一
        const existUser = await tx.sys_user.findFirst({
          where: { tenant_id: tenantId, username, is_deleted: 0 },
        });
        if (existUser) {
          throw new AppError(`用户名 '${username}' 在租户下已存在`, 409, 409);
        }

        // 2) 【关键】判断该租户是否已经初始化过菜单
        const existingMenus = await tx.sys_menu.findMany({
          where: { tenant_id: tenantId, is_deleted: 0, is_platform: 0 },
          select: { menu_id: true },
        });

        let menuIds: string[];

        if (existingMenus.length === 0) {
          // 2a) 租户还没有菜单 → 从模板新增一份（INSERT，不碰模板行）
          menuIds = await copyMenusFromTemplate(
            tx,
            TEMPLATE_TENANT_ID,
            tenantId,
          );
        } else {
          // 2b) 已有菜单 → 直接复用，不重复插入
          menuIds = existingMenus.map((m) => m.menu_id);
        }

        // 3) 查找或创建租户管理员角色（幂等，避免重复角色）
        let role = await tx.sys_role.findFirst({
          where: {
            tenant_id: tenantId,
            role_code: "tenant_admin",
            is_deleted: 0,
          },
        });

        if (!role) {
          role = await tx.sys_role.create({
            data: {
              tenant_id: tenantId,
              role_code: "tenant_admin",
              role_name: "租户管理员",
              description: "系统自动创建的租户管理员角色",
              data_scope: "1",
              status: "1",
              sort_order: 0,
              is_deleted: 0,
            },
          });
        }

        // 4) 角色绑定全部菜单（用 skipDuplicates 保证幂等，不会重复）
        if (menuIds.length > 0) {
          await tx.sys_role_menu.createMany({
            data: menuIds.map((menuId) => ({
              role_id: role!.role_id,
              menu_id: menuId,
              tenant_id: tenantId,
            })),
            skipDuplicates: true, // ← 关键：已存在的绑定跳过
          });
        }

        // 5) 创建用户
        const user = await tx.sys_user.create({
          data: {
            tenant_id: tenantId,
            username,
            password: hashedPassword,
            email: email ?? null,
            phone: phone ?? null,
            real_name: realName ?? null,
            status: "1",
            is_deleted: 0,
          },
        });

        // 6) 用户绑定角色（幂等）
        await tx.sys_user_role.createMany({
          data: [
            {
              user_id: user.user_id,
              role_id: role.role_id,
              tenant_id: tenantId,
            },
          ],
          skipDuplicates: true,
        });

        return user;
      },
      {
        timeout: 30000,
        isolationLevel: "ReadCommitted",
      },
    );
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

  /**
   * 从模板租户复制菜单、权限、角色到新租户
   */
  async initTenantData(tenantId: string, userId: string) {
    // 1. 查找模板租户
    const templateTenant = await prisma.sys_tenant.findFirst({
      where: { tenant_code: TEMPLATE_TENANT_CODE, is_deleted: 0 },
    });
    if (!templateTenant) {
      console.warn("[initTenantData] 模板租户不存在，跳过初始化");
      return;
    }
    const templateId = templateTenant.tenant_id;

    return prisma.$transaction(async (tx) => {
      // ========== 2. 复制菜单 ==========
      const templateMenus = await tx.sys_menu.findMany({
        where: { tenant_id: templateId, is_deleted: 0, is_platform: 0 },
        orderBy: { sort_order: "asc" },
      });

      // 菜单ID映射表：模板菜单ID → 新菜单ID
      const menuIdMap = new Map<string, string>();

      // 按层级复制（父菜单在前），因为要维护 parent_id
      // 简单起见先按 parent_id 排序
      const menuTree = buildSortedMenus(templateMenus);

      for (const menu of menuTree) {
        const newMenuId = uuidv4();
        menuIdMap.set(menu.menu_id, newMenuId);

        // 处理 parent_id 映射
        const newParentId = menu.parent_id
          ? menuIdMap.get(menu.parent_id) ||
            "00000000-0000-0000-0000-000000000000"
          : "00000000-0000-0000-0000-000000000000";

        await tx.sys_menu.create({
          data: {
            menu_id: newMenuId,
            tenant_id: tenantId,
            parent_id: newParentId,
            menu_name: menu.menu_name,
            menu_type: menu.menu_type,
            icon: menu.icon,
            path: menu.path,
            component: menu.component,
            permission: menu.permission,
            sort_order: menu.sort_order,
            status: menu.status,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: userId,
            updated_by: userId,
            is_deleted: 0,
          },
        });
      }

      // ========== 3. 复制权限点 ==========
      const templatePerms = await tx.sys_permission.findMany({
        where: { tenant_id: templateId, is_deleted: 0 },
      });

      const permIdMap = new Map<string, string>();
      for (const perm of templatePerms) {
        const newPermId = uuidv4();
        permIdMap.set(perm.perm_id, newPermId);

        await tx.sys_permission.create({
          data: {
            perm_id: newPermId,
            tenant_id: tenantId,
            perm_code: perm.perm_code,
            perm_name: perm.perm_name,
            resource_type: perm.resource_type,
            action: perm.action,
            description: perm.description,
            status: perm.status,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: userId,
            updated_by: userId,
            is_deleted: 0,
          },
        });
      }

      // ========== 4. 创建超级管理员角色 ==========
      const superRole = await tx.sys_role.create({
        data: {
          tenant_id: tenantId,
          role_code: "SUPER_ADMIN",
          role_name: "超级管理员",
          description: "系统内置最高权限角色",
          status: "1",
          sort_order: 0,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: userId,
          updated_by: userId,
          is_deleted: 0,
        },
      });

      // ========== 5. 角色关联所有新菜单 ==========
      if (menuIdMap.size > 0) {
        await tx.sys_role_menu.createMany({
          data: Array.from(menuIdMap.values()).map((newMenuId) => ({
            role_id: superRole.role_id,
            menu_id: newMenuId,
            tenant_id: tenantId,
          })),
        });
      }

      // ========== 6. 角色关联所有新权限 ==========
      if (permIdMap.size > 0) {
        await tx.sys_role_permission.createMany({
          data: Array.from(permIdMap.values()).map((newPermId) => ({
            role_id: superRole.role_id,
            perm_id: newPermId,
            tenant_id: tenantId,
          })),
        });
      }

      // ========== 7. 用户绑定超级管理员角色 ==========
      await tx.sys_user_role.create({
        data: {
          user_id: userId,
          role_id: superRole.role_id,
          tenant_id: tenantId,
        },
      });
      await tx.sys_notice_channel.create({
        data: {
          tenant_id: tenantId,
          channel_type: "in_app",
          enabled: 1,
          config: null,
          remark: "系统默认渠道",
        },
      });
      return {
        roleId: superRole.role_id,
        menuCount: menuIdMap.size,
        permCount: permIdMap.size,
      };
    });
  }
  /**
   * 创建租户
   */
  async createTenant(data: {
    tenantCode: string;
    tenantName: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  }) {
    return prisma.sys_tenant.create({
      data: {
        tenant_code: data.tenantCode,
        tenant_name: data.tenantName,
        contact_name: data.contactName ?? null,
        contact_phone: data.contactPhone ?? null,
        contact_email: data.contactEmail ?? null,
        status: "1",
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: 0,
      },
    });
  }
}
/**
 * 菜单按层级排序（父菜单在前），保证 parent_id 能被正确映射
 */
function buildSortedMenus(menus: any[]) {
  const byId = new Map(menus.map((m) => [m.menu_id, m]));
  const sorted: any[] = [];
  const visited = new Set<string>();

  function visit(menu: any) {
    if (visited.has(menu.menu_id)) return;
    if (menu.parent_id && byId.has(menu.parent_id)) {
      visit(byId.get(menu.parent_id));
    }
    if (!visited.has(menu.menu_id)) {
      visited.add(menu.menu_id);
      sorted.push(menu);
    }
  }

  menus.forEach(visit);
  return sorted;
}
