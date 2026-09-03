# 功能模块生成 & 字段映射改造方案

## Context

为 `src/modules/` 下创建 10 个功能模块（auth/user/tenant/role/dept/menu/permission/dict/notice/audit），每个模块对应 Prisma schema 中的模型。核心挑战是 Prisma 模型使用 snake\_case 字段命名（`user_id`、`tenant_id`、`is_deleted`），而现有 `BaseRepository` 硬编码了 camelCase 字段名（`id`、`tenantId`、`deletedAt`），需要先改造基础设施。

## 改造范围

### Phase 1: 基础设施改造（3 个文件）

**1.1** **`src/core/base-repository.ts`** **— 引入 FieldMapping 配置**

新增 `FieldMapping` 接口，让构造函数接受字段名映射：

```ts
interface FieldMapping {
  pk: string;              // 主键字段名，默认 "id"
  tenantId: string;        // 租户字段名，默认 "tenantId"
  softDelete?: string;     // 软删除字段，undefined = 不支持软删除
  createdAt?: string;      // 创建时间
  updatedAt?: string;      // 更新时间
}
```

所有内部方法（findById/findMany/create/update/delete/restore/findDeleted）使用 `this.fieldMapping` 替代硬编码字段名。

**1.2** **`src/middleware/auth.ts`** **— 修复 Prisma 模型名**

* `prisma.user` → `prisma.sys_user`

* `user.id` → `user.user_id`，`user.tenantId` → `user.tenant_id`

**1.3** **`src/common/rbac/service.ts`** **— 修复 Prisma 模型名**

* `prisma.userRole` → `prisma.sys_user_role`

* 关联表字段名同步修正

### Phase 2: 模块实现（10 个模块）

**通用模板**（适用于 permission/notice/role/tenant）：

每个标准 CRUD 模块包含：

* Zod 查询/创建/更新 schema

* 实例化 `BaseRepository` 时传入对应 `FieldMapping`

* 重写 `toResponse()` 调用 `keysToCamelCase()`

| 模块             | 路径                                    | 模型                                | 特化处理                           |
| -------------- | ------------------------------------- | --------------------------------- | ------------------------------ |
| **permission** | `/api/permissions`                    | sys\_permission                   | 标准 CRUD                        |
| **tenant**     | `/api/tenants`                        | sys\_tenant                       | 主键=租户字段，findMany 不传 tenantId   |
| **role**       | `/api/roles`                          | sys\_role                         | CRUD + 分配权限/菜单                 |
| **user**       | `/api/users`                          | sys\_user                         | CRUD + 重置密码 + 分配角色             |
| **dept**       | `/api/depts`                          | sys\_dept                         | CRUD + 部门树                     |
| **menu**       | `/api/menus`                          | sys\_menu                         | CRUD + 菜单树                     |
| **notice**     | `/api/notices`                        | sys\_notice                       | CRUD + 发布通知                    |
| **dict**       | `/api/dict-types` + `/api/dict-datas` | sys\_dict\_type + sys\_dict\_data | 两个 Controller                  |
| **audit**      | `/api/audit-logs`                     | sys\_audit\_log                   | 继承 BaseController，只读查询         |
| **auth**       | `/api/auth`                           | sys\_user                         | 继承 BaseController，登录/登出/刷新/MFA |

### Phase 3: 收尾

* 更新 `src/modules/index.ts` 注册所有控制器

* 更新 `README.md` 项目结构

* 编译验证

## 验证

```bash
pnpm build   # TypeScript 编译
pnpm dev     # 启动，检查 [Debug] 日志确认路由数量
# 访问 /api-docs 确认 Swagger 文档
```

