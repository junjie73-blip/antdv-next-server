# Antdv-Next-Server

基于 Node.js + Express + TypeScript + Prisma + PostgreSQL + Redis 的 SaaS 后台管理服务端。

## 技术栈

- **运行时**: Node.js 20 + TSX (开发) / tsc (生产)
- **框架**: Express 4 + 装饰器路由扫描
- **ORM**: Prisma + Neon PostgreSQL Adapter
- **缓存**: Upstash Redis (REST API)
- **存储**: Vercel Blob
- **文档**: Swagger UI (zod-to-openapi 自动生成)
- **安全**: JWT (jose) + bcryptjs + MFA/TOTP + Helmet + CORS + RateLimit + DDoS防护

## 项目结构

src/
├── common/
│   ├── core/           # 核心框架 (装饰器、扫描器、BaseController、BaseCrudController)
│   ├── middleware/     # Express 中间件 (auth, rbac, tenant, rate-limit, ddos, error-handler)
│   ├── rbac/           # RBAC 权限服务 (constants, service, cache, init)
│   ├── security/       # JWT, MFA, Crypto
│   ├── logger/         # Pino 日志 + 审计日志
│   └── utils/          # 响应工具
├── config/             # 配置 (database, redis, env, server)
├── modules/            # 业务模块 (每个模块: controller + repository + schema)
│   ├── auth/           # 认证 (注册/登录/刷新/登出/MFA)
│   ├── user/           # 用户管理
│   ├── user-role/      # 用户角色分配
│   ├── roles/          # 角色管理
│   ├── permissions/    # 权限管理
│   ├── menus/          # 菜单管理
│   ├── notifications/  # 通知系统
│   ├── dictionaries/   # 数据字典
│   ├── upload/         # 分片文件上传
│   └── logs/           # 日志查询
├── index.ts            # 应用入口

## 快速开始

### 1. 安装依赖
pnpm install

### 2. 配置环境变量
复制 .env 并填写数据库、Redis、Blob 等配置。

### 3. 数据库迁移
pnpm db:migrate

### 4. 生成 Prisma Client
pnpm db:generate

### 5. 开发运行
pnpm dev

### 6. 构建
pnpm build

## API 文档

启动后访问: http://localhost:3000/api-docs

## 核心设计

### 装饰器路由
使用自定义装饰器 (@Controller, @Get, @Post, @Body, @Query 等) 声明式定义路由，
scanner.ts 自动扫描并注册到 Express Router，同时生成 OpenAPI 文档。

### BaseCrudController
继承后自动获得 CRUD 接口 (list, getById, create, update, delete)，
只需配置 repository 和 schemas。

### RBAC 权限
- 系统预设角色: OWNER / ADMIN / MEMBER / VIEWER
- 权限粒度: resource:action (如 user:read, user:write)
- 支持角色校验、权限校验、菜单树按角色过滤
- Redis 缓存用户权限，变更时自动失效

### 多租户
所有业务表包含 tenantId 字段，API 通过 query/header/user 解析租户上下文，
数据库层通过 Prisma where 条件隔离。

### 软删除
所有业务表包含 deletedAt 字段，BaseRepository 自动过滤 deletedAt = null 的记录，
支持 restore 恢复。

## 环境变量说明

| 变量                                         | 说明                                      |
| -------------------------------------------- | ----------------------------------------- |
| DATABASE_URL                                 | Neon PostgreSQL 连接字符串 (带 pgbouncer) |
| DATABASE_URL_UNPOOLED                        | 无连接池的数据库 URL (用于 migrate)       |
| REDIS_URL / KV_REST_API_URL                  | Upstash Redis REST 地址                   |
| BLOB_READ_WRITE_TOKEN                        | Vercel Blob Token                         |
| JWT_SECRET / JWT_REFRESH_SECRET              | JWT 签名密钥 (至少32位)                   |
| RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX        | 全局限流配置                              |
| UPLOAD_MAX_FILE_SIZE / UPLOAD_MAX_CHUNK_SIZE | 上传限制                                  |
| MFA_ISSUER                                   | MFA 二维码发行者名称                      |