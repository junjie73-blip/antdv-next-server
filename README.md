# SaaS Admin Server

基于 Node.js + Express + TypeScript + Prisma + PostgreSQL + Redis 的多租户 SaaS 后台管理系统。

## 技术栈

| 技术       | 版本 | 用途      |
| ---------- | ---- | --------- |
| Node.js    | 20+  | 运行时    |
| Express    | 4.18 | Web 框架  |
| TypeScript | 5.0+ | 类型系统  |
| Prisma     | 5.0+ | ORM       |
| PostgreSQL | 15+  | 主数据库  |
| Redis      | 7+   | 缓存/会话 |
| Zod        | 3.0+ | 参数校验  |
| Jose       | 6.0+ | JWT 认证  |

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```
### 2. 配置环境变量
复制 .env 并修改数据库连接信息。
```
### 3. 数据库迁移
```bash
pnpm db:generate
pnpm db:migrate

```
### 4. 启动开发服务器
```bash
pnpm dev
```

## 项目结构
```plain
src/
├── config/          # 环境变量、数据库、Redis 等配置
├── core/            # 核心基础设施
│   ├── base-controller.ts      # 抽象 Controller 基类
│   ├── base-crud-controller.ts # CRUD Controller 模板（自动注册增删改查路由）
│   ├── base-repository.ts      # 通用 Repository（CRUD + 软删除 + 分页 + 字段映射）
│   ├── decorators.ts           # 路由装饰器（@Controller, @Get, @Post 等）
│   ├── scanner.ts              # 路由扫描注册 + Zod 校验 + Swagger 文档生成
│   └── swagger.ts              # Swagger UI 挂载
├── middleware/       # 全局中间件
│   ├── auth.ts      # JWT 认证
│   ├── ddos.ts      # DDoS 防护
│   ├── error-handler.ts  # 全局错误处理
│   ├── rate-limit.ts     # 频率限制
│   └── rbac.ts      # RBAC 权限校验
├── common/
│   ├── logger/      # 日志（Pino 多目标输出）
│   ├── rbac/        # RBAC 服务（角色/权限缓存查询）
│   ├── security/    # JWT / AES 加密 / MFA
│   └── utils/       # 工具函数（命名转换、统一响应格式）
├── modules/         # 业务模块（每个模块继承 BaseCrudController）
│   ├── auth/        # 认证授权（登录/登出/刷新/用户信息/MFA）
│   ├── user/        # 用户管理
│   ├── tenant/      # 租户管理
│   ├── dict/        # 数据字典（字典类型 + 字典数据）
│   ├── menu/        # 菜单管理
│   ├── permission/  # 权限控制
│   ├── role/        # 角色管理
│   ├── dept/        # 部门管理
│   ├── notice/      # 通知管理
│   └── audit/       # 审计日志（只读）
├── generated/prisma/ # Prisma 生成的客户端代码
└── types/           # 全局类型声明
```

## 核心特性
- 多租户架构: 基于 tenant_id 的数据隔离
- 注解式路由: 装饰器自动生成路由和 Swagger 文档
- 基础组件: BaseController + BaseRepository 实现 CRUD 复用
- 软删除: 所有表统一软删除机制
- RBAC 权限: 角色-权限-菜单三级控制
- 多因素认证: TOTP 基于时间的一次性密码
- 审计日志: 自动记录所有操作


