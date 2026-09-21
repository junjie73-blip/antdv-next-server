# SaaS Admin Server

基于 Node.js + Express + TypeScript + Prisma + PostgreSQL + Redis 的多租户 SaaS 后台管理系统。

## 技术栈

| 技术        | 版本   | 用途                                                  |
| ----------- | ------ | ----------------------------------------------------- |
| Node.js     | 22 LTS | 运行时                                                |
| Express     | 5.x    | Web 框架                                              |
| TypeScript  | 5.x    | 类型系统                                              |
| Prisma      | 7.x    | ORM（`@prisma/adapter-pg` + pg 驱动）                 |
| PostgreSQL  | 15+    | 主数据库（分区表）                                    |
| Redis       | 7+     | 缓存 / 会话 / 分布式锁 / BullMQ / pub/sub             |
| Zod         | 4.x    | 参数校验（配套 `@asteasolutions/zod-to-openapi` 9.x） |
| Jose        | 6.x    | JWT 认证                                              |
| bcryptjs    | 3.x    | 密码哈希（⚠️ 不用于字段加密）                          |
| BullMQ      | 6.x    | 异步任务（merge worker）                              |
| Pino        | 10.x   | 结构化日志                                            |
| prom-client | 15.x   | 指标暴露                                              |
| ws          | 8.x    | WebSocket                                             |

> ⚠️ **Zod 4.x 与 `@asteasolutions/zod-to-openapi` 9.x 配套使用。** 若降级 Zod，必须同步降级 zod-to-openapi，否则 `/api/docs.json` 会 500。

---

## 快速开始

```bash
pnpm install
cp .env.example .env.development
# 修改 DATABASE_URL / REDIS_URL / JWT_SECRET / JWT_REFRESH_SECRET / ENCRYPTION_KEY

pnpm db:generate
pnpm db:migrate
pnpm dev          # 同时起 API + Worker（concurrently）
# 或分别启动：
pnpm dev:server
pnpm dev:worker
```

访问：

- API：`http://localhost:3000/api/v1`
- Swagger：`http://localhost:3000/api/docs`
- 健康检查：`/health/live`（存活）/ `/health/ready`（就绪）
- 指标：`/metrics`（受 `METRICS_WHITELIST` 限制）

---

## 项目结构

项目采用 **5 层分层架构 + 2 入口**，依赖关系单向向下：

```
L0  config/  +  shared/     ← 配置 + 纯工具（无依赖）
L1  core/                   ← 框架基础设施（无业务，无状态）
L2  platform/               ← 平台能力（有状态，可被业务用）
L3  middleware/             ← Express 中间件（横切关注点）
L4  modules/                ← 业务模块（按领域划分）
─────────────────────────────
     bootstrap/             ← 组装所有层（唯一允许依赖 modules）
     jobs/                  ← 后台任务
```

```
src/
├── config/                          # L0 配置层
│   ├── env.ts                       # 环境变量（Zod 校验 + boolStr 防 coerce 陷阱）
│   ├── database.ts                  # Prisma 客户端（显式连接池）
│   ├── redis.ts                     # Redis 连接（redis/subRedis/blockRedis）
│   ├── storage.ts                   # S3 客户端 + ensureBucket
│   ├── constants.ts                 # CACHE_GROUPS / SCAN_* 等常量
│   └── index.ts
│
├── shared/                          # L0 共享工具层
│   ├── utils/
│   │   ├── case-convert.ts          # snake_case ⇄ camelCase
│   │   ├── ip.ts                    # getClientIp（XFF/X-Real-IP 解析）
│   │   └── date.ts
│   ├── http/
│   │   ├── response.ts              # success / error / pageSuccess
│   │   └── agent.ts                 # keep-alive HTTP agents
│   └── types/
│       └── api-response.ts          # ApiResponse / PageResponse
│
├── core/                            # L1 框架基础设施
│   ├── decorator/                   # 装饰器路由
│   │   ├── controller.ts            # @Controller
│   │   ├── route.ts                 # @Get/@Post/@Put/@Delete/@Patch/@Head/@Options/@All
│   │   ├── middleware.ts            # @UseMiddleware
│   │   ├── permission.ts            # @RequirePermission
│   │   ├── require-mfa.ts           # @RequireMFA
│   │   ├── swagger.ts               # @ApiOperation/@ApiBody/@ApiQuery/@ApiResponse/@ApiTags
│   │   ├── validator.ts             # @Validate/@Body/@Query/@Param/@Req/@Res/@CurrentUser
│   │   ├── scanner.ts               # ControllerScanner
│   │   ├── router.ts                # DecoratorRouter
│   │   ├── metadata.ts              # METADATA_KEYS
│   │   └── types.ts
│   ├── base/                        # Base 三件套
│   │   ├── controller.ts            # 抽象 Controller（fail-closed 数据权限）
│   │   ├── repository.ts            # 通用 Repository（版本号失效 total 缓存）
│   │   └── service.ts
│   ├── cache/                       # 缓存抽象
│   │   ├── lru.ts                   # createLru 工厂
│   │   ├── redis-client.ts          # scanAll / delChunked / session / cache 工具
│   │   ├── cached.ts                # cached({ key, ttl, loader, nullTtl })
│   │   └── pubsub.ts                # 跨实例失效广播
│   ├── concurrency/pool.ts          # mapPool / heavyPool (p-limit)
│   ├── context/                     # AsyncLocalStorage
│   │   ├── trace.ts                 # traceId
│   │   ├── data-scope.ts            # 数据权限（fail-closed）
│   │   └── request-memo.ts          # 请求级去重
│   ├── security/                    # 安全原语
│   │   ├── crypto.ts                # AES-256-GCM 整体加密（MFA secret 等）
│   │   ├── field-encrypt.ts         # 字段级加密 + 哈希 + 脱敏
│   │   ├── password.ts              # hashPassword / verifyPassword（bcryptjs）
│   │   ├── mfa.ts                   # TOTP（RFC 4648 Base32）
│   │   ├── sensitive-keys.ts        # 统一敏感字段清单
│   │   └── redact.ts                # deepRedact
│   ├── lock/
│   │   ├── distributed.ts           # Redis SET NX + Lua 释放
│   │   └── pg-advisory.ts           # PG advisory lock（xact 版本）
│   ├── diagnostics/leak-detector.ts # 监听器 / 定时器追踪
│   ├── errors.ts                    # AppError 家族（唯一来源）
│   └── index.ts
│
├── platform/                        # L2 平台能力
│   ├── logger/                      # Pino + redact + rotating files
│   ├── metrics/                     # prom-client（单 registry）
│   │   ├── registry.ts              # ⭐ 唯一 registry
│   │   ├── http.ts                  # http/metrics + metricsMiddleware
│   │   ├── business.ts              # 业务指标
│   │   └── log-tables.ts
│   ├── alert/                       # 告警 webhook（不依赖 logger，避免循环）
│   ├── audit/                       # 审计队列
│   │   ├── queue.ts                 # pushAudit / drainAuditQueue
│   │   ├── writer.ts                # writeAuditLog / writeAuditBatch
│   │   └── summarize.ts             # 请求/响应摘要 + 脱敏
│   ├── mail/service.ts              # 邮件发送（支持全局 + 租户级 SMTP）
│   ├── excel/service.ts             # parseExcel / generateExcel / importTreeData
│   ├── ws/                          # WebSocket
│   │   ├── manager.ts               # 连接池 + 心跳
│   │   ├── server.ts                # initWebSocketServer
│   │   ├── notice-pubsub.ts         # 通知推送
│   │   ├── force-logout.ts          # 强制下线（负缓存 + pub/sub）
│   │   └── upload-notify.ts         # 上传 merge 完成通知
│   ├── storage/                     # S3 操作 + 本地 blob
│   ├── swagger/                     # OpenAPI 文档
│   └── observability/sentry.ts
│
├── middleware/                      # L3 Express 中间件
│   ├── http/                        # HTTP 基础设施
│   │   ├── request-context.ts       # traceId + 耗时 + 指标（合并 timing）
│   │   ├── error-handler.ts         # 全局错误处理
│   │   ├── validator.ts             # Zod 校验中间件
│   │   └── cache.ts                 # ETag / Cache-Control
│   ├── security/                    # 安全链
│   │   ├── auth.ts                  # JWT + Redis 会话 + 强制下线
│   │   ├── tenant.ts                # 租户解析
│   │   ├── data-scope.ts            # 数据权限（fail-closed，走 ALS）
│   │   ├── rbac.ts                  # createRbacMiddleware
│   │   ├── mfa.ts                   # MFA 校验
│   │   ├── ip-rule.ts               # IP 白黑名单
│   │   └── rate-limit.ts            # 限流 + 封禁递进
│   └── business/audit.ts            # 审计写入（异步队列）
│
├── modules/                         # L4 业务模块
│   ├── auth/                        # 认证（Controller 拆分为 6 个文件）
│   │   ├── controller/              # login/register/profile/menu/misc/tenant-switch
│   │   ├── service/                 # auth/token/captcha/password-policy
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── rbac/                        # RBAC（角色/权限/平台超管）
│   │   ├── controller/
│   │   ├── service/                 # permission / role / platform
│   │   ├── repository.ts
│   │   └── types.ts
│   ├── user/                        # 用户（含 upload 中间件 + 注册事务）
│   ├── tenant/                      # 租户管理
│   ├── dept/                        # 部门（树 + 导入导出）
│   ├── dict/                        # 字典（合并 type + data + excel service）
│   ├── menu/                        # 菜单管理
│   ├── role/                        # 角色（数据权限、菜单/权限/用户/部门分配）
│   ├── permission/                  # 权限点
│   ├── notice/                      # 通知（站内 / 邮件 / 短信 / Webhook）
│   ├── config/                      # 系统配置
│   ├── file/ upload/                # 文件与上传（含 BullMQ merge）
│   ├── dashboard/                   # 仪表盘
│   ├── workbench/ todo/             # 工作台 / 待办
│   ├── online/                      # 在线用户
│   ├── ip-rule/                     # IP 白黑名单
│   ├── audit-log/ login-log/        # 日志
│   ├── generator/                   # 代码生成器（模板 + naming/type-mapper）
│   ├── monitor/cache/               # 缓存监控（⭐ RBAC + 前缀白名单）
│   ├── mfa/                         # MFA 服务
│   └── index.ts                     # 聚合所有 Controller 供 bootstrap 注册
│
├── jobs/                            # 后台任务
│   ├── maintenance/
│   │   ├── aggregate.ts             # 审计日志日聚合
│   │   ├── archive.ts               # 分区归档（keyset pagination）
│   │   └── partition-manager.ts     # 分区预建 + 过期清理
│   └── scheduler.ts                 # cron 注册（withPgLock 互斥）
│
├── bootstrap/                       # 启动组装
│   ├── app.ts                       # Express 组装
│   ├── server.ts                    # HTTP + WebSocket 启动（返回 wss）
│   ├── subscribers.ts               # Redis pub/sub 订阅
│   ├── shutdown.ts                  # 优雅退出
│   └── worker.ts                    # BullMQ worker 启动
│
├── index.ts                         # API 进程入口（薄入口）
├── worker.ts                        # Worker 进程入口（薄入口）
└── generated/prisma/                # Prisma 生成（不要手改）
```

### 目录层级约束（ESLint 强制）

| 层                  | 可依赖                                          |
| ------------------- | ----------------------------------------------- |
| `config/` `shared/` | 无                                              |
| `core/`             | `config/` `shared/`                             |
| `platform/`         | `config/` `shared/` `core/`                     |
| `middleware/`       | `config/` `shared/` `core/` `platform/`         |
| `modules/`          | 上述全部 + 其他 `modules/`（仅通过 `index.ts`） |
| `jobs/`             | 上述全部（不含 `middleware/`）                  |
| `bootstrap/`        | 全部                                            |

模块间调用**必须**通过目标模块的 `index.ts`，禁止深路径：

```ts
// ✅
import { AuthService } from "@/modules/auth/index.js";

// ❌
import { AuthService } from "@/modules/auth/service/auth.service.js";
```

---

## 核心约定

### 密码

**所有密码**只走 bcrypt（`bcryptjs`，salt rounds 由 `BCRYPT_SALT_ROUNDS` 决定，默认 12）：

```ts
import { hash, compare } from "bcryptjs";

const hashed = await hash(plain, parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "12", 10));
const ok = await compare(plain, hashed);
```

> ❌ 禁止再出现 `encryptPassword` / `decryptPassword`。
> `core/security/crypto.ts` 的 `encrypt` / `decrypt` 只用于**需要还原**的字段（如 MFA secret）。
> `core/security/field-encrypt.ts` 的 `encryptField` / `decryptField` 用于字段级加密；`hashField` 用于可查找的哈希（不可逆）。

### 登录与会话

**登录**（必须携带 `tenantCode`）：

```ts
POST /api/v1/auth/login
{ tenantCode: "acme", username: "alice", password: "...", deviceId?: "...", captchaId?, captchaCode? }
```

**会话 key 约定**：

```
access:{tenantId}:{userId}:{deviceId}   = "valid"
refresh:{tenantId}:{userId}:{deviceId}  = refreshToken
kicked:{userId}                          = { reason, at }  (TTL 7d)
```

`deviceId` 未传时后端自动 `randomUUID()`。同一用户可以多设备在线，登出只清当前设备。

### JWT payload

```ts
{
  userId: string;
  tenantId: string;
  username: string;
  roles: string[];
  deviceId: string;
  type: "access" | "refresh";
}
```

**不要再用 `sub` / `role`（单数）**。

### 忘记密码

```ts
POST /api/v1/auth/forgot-password
{ tenantCode, username, oldPassword, newPassword }
```

校验旧密码后更新，并**撤销该用户所有会话**。

### 多租户

- 所有业务表必须有 `tenant_id`
- 所有查询通过 `BaseRepository` 自动附加 `tenant_id`
- 关联表 `createMany` **必须先校验 ID 归属租户**
- 未认证请求**默认拒绝**指定租户（`ALLOW_UNAUTH_TENANT_HEADER=true` 时才允许，仅供内网 mTLS 场景）

### 数据权限（fail-closed）

数据权限挂在 `sys_role.data_scope`（1-5 级），由 `middleware/security/data-scope.ts` 计算：

| 值  | 含义                      |
| --- | ------------------------- |
| 1   | 全部                      |
| 2   | 自定义（`sys_role_dept`） |
| 3   | 本部门                    |
| 4   | 本部门及以下              |
| 5   | 仅本人                    |

**计算失败 → 抛 `AppError`，绝不放行全量数据**（fail-closed）。中间件通过 `AsyncLocalStorage` 传递 `whereScope`：

```ts
// Repository 里通过 BaseController 的 applyDataScope() 自动读取
// 或手动调用：
import { getDataScopeWhere } from "@/core/context/data-scope.js";
this.repository.setDataScope(getDataScopeWhere());
```

⚠️ **禁止** `setDataScope(req.dataScopeWhere ?? {})` —— 这会绕过 fail-closed，导致数据权限失效。

手写 `findPage` 的 Repository **必须**调用 `this.mergeDataScope(finalWhere)`。

### 软删除

所有表统一 `is_deleted: 0 | 1`。查询默认过滤 `is_deleted = 0`。
审计日志表（`sys_audit_log` / `sys_login_log`）等**不可软删表**需覆盖 `isSoftDeleteTable()` 返回 `false`。

### 错误处理

统一使用 `@/core/errors.js` 导出的错误类：

```ts
import { AppError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, ValidationError } from "@/core/errors.js";

throw new AppError("消息", 400001, 400);
throw new AuthenticationError("...");
throw new AuthorizationError("...");
throw new NotFoundError("...");
throw new ConflictError("...");
```

`errorHandler` 通过 `instanceof AppError` 判断，**不要再定义第二个 `AppError` 类**。
⚠️ **禁止**从 `@/middleware/error-handler.js` 导入 `AppError`（旧路径，已废弃）。

### 关联表写入

所有 `createMany` 前必须：

1. 校验关联 ID 属于当前租户（`assertOwnership`）；
2. 加 `skipDuplicates: true`。

### 审计日志

走异步队列 `@/platform/audit/index.js` 的 `pushAudit`，**不要**直接 `prisma.sys_audit_log.create`。

- 敏感字段（password / token / secret / phone / email / idCard）自动脱敏
- 请求 body 超 4KB 只保留 `_sha256 + _len + _keys`
- 队列满（2000）时丢最旧 + `audit_dropped_total` 计数 + 告警
- 失败 3 次后落 `logs/audit-fallback.log`

审计中间件**跳过** `/api/v1/upload/chunk`（分片上传，高频）。

### 缓存监控（⭐ 需 RBAC）

`/api/v1/monitor/cache/*` 全部要求 `system:cache:manage` 权限。

缓存前缀有**白名单**（来自 `CACHE_GROUPS`），且显式禁止访问：

```
access:  refresh:  session:  bull:  rate-limit:  rbac:
login:fail:  login:lock:  user:force-logout:  kicked:  upload:
```

`DELETE /monitor/cache/all`（flushdb）**已移除**，只能按前缀组清空。

### 定时任务

`withPgLock(fn)` 包裹，PostgreSQL 事务级 advisory lock（跨实例互斥）：

```ts
import { withPgLock } from "@/core/lock/index.js";

const done = await withPgLock(async () => {
  await maintainPartitions();
  await archiveExpiredPartitions();
});
if (done === null) logger.info("another instance is running, skip");
```

⚠️ **不要**用 Redis `withLock` 做长期任务锁（TTL 到期会自动释放，长任务可能被重复执行）。

### Redis 订阅

`ioredis` 的 `subscribe()` 返回 `Promise<number>`，**不是** Redis 实例：

```ts
// ✅ 正确
await subRedis.subscribe(CHANNEL);
subRedis.on("message", (channel, message) => { ... });

// ❌ 错误
const sub = await subRedis.subscribe(CHANNEL);
sub.on("message", ...);  // sub 是 number
```

### 日志

统一走 `@/platform/logger/index.js` 的 `logger`。**禁止 `console.log`**（会绕过 Pino redact，泄漏敏感字段）。

```ts
import { logger } from "@/platform/logger/index.js";

logger.info({ userId, action }, "user updated");
logger.error({ err }, "operation failed");
```

Pino 的 `redact` 会自动移除 `password` / `token` / `secret` / `authorization` / `cookie` / `*.phone` / `*.email` 等字段。

---

## 环境变量

| 变量                                                                        | 必填 | 说明                                                                 |
| --------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------- |
| `DATABASE_URL`                                                              | ✅    | PostgreSQL 连接串                                                    |
| `DB_POOL_MAX`                                                               | ❌    | 连接池大小（默认 20）                                                |
| `REDIS_URL`                                                                 | ✅    | Redis 连接串                                                         |
| `JWT_SECRET`                                                                | ✅    | ≥32 位                                                               |
| `JWT_REFRESH_SECRET`                                                        | ✅    | ≥32 位                                                               |
| `ENCRYPTION_KEY`                                                            | ✅    | AES 密钥，≥32 位                                                     |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET` | ✅    | 对象存储                                                             |
| `MINIO_ENABLED`                                                             | ❌    | 默认 `true`；`false` 时跳过存储自检                                  |
| `MINIO_USE_SSL`                                                             | ❌    | 字符串 `"true"` / `"false"`（非 coerce，防 `"false"` → `true` 陷阱） |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM`                       | ❌    | 邮件发送（未配置时 `sendMail` 静默跳过）                             |
| `FRONTEND_URL`                                                              | ❌    | CORS 白名单 + 重置链接跳转（逗号分隔多值）                           |
| `ALERT_WEBHOOK_URL`                                                         | ❌    | 告警 webhook（未配置时只打日志）                                     |
| `METRICS_WHITELIST`                                                         | ❌    | `/metrics` 白名单 IP（默认 `127.0.0.1,::1`）                         |
| `ALLOW_UNAUTH_TENANT_HEADER`                                                | ❌    | 默认 `false`；`true` 时未认证请求可带 `X-Tenant-Id`                  |

---

## 启动架构

### 双进程模型

```
┌──────────────────────┐         ┌──────────────────────┐
│  API 进程             │         │  Worker 进程          │
│  node dist/src/index │         │  node dist/src/worker│
│  ─ Express + WS      │         │  ─ BullMQ merge      │
│  ─ cron（withPgLock）│         │  ─ 独立连接池         │
│  ─ Redis pub/sub 订阅 │         │                      │
└──────────────────────┘         └──────────────────────┘
         │                                  │
         └───────── 共享 PG + Redis ────────┘
```

**API 进程**：`src/index.ts`
```
1) 诊断探针（watchListenerLeak / trackTimers）
2) createApp() → Express 组装
3) startServer() → HTTP + WebSocket + DB/Redis 探活
4) startSubscribers() → Redis pub/sub
5) startScheduler() → cron（withPgLock 互斥）
6) installShutdownHandlers() → SIGTERM/SIGINT
```

**Worker 进程**：`src/worker.ts`
```
1) startMergeWorker() → BullMQ worker
2) installWorkerShutdown() → 等当前任务完成后退出
```

### 优雅退出流程

`SIGTERM` / `SIGINT` 触发：

1. 通知所有 WS 客户端 `server-shutdown`
2. 等 1s 让消息送达
3. 关闭 WebSocket（`wsManager.closeAll` + `wss.close`）
4. `httpServer.close()` 停止接收新请求
5. `drainAuditQueue()` 冲刷审计队列
6. `prisma.$disconnect()` + `redis.quit()`
7. 15s 兜底强制退出

### 关键中间件注册顺序

`bootstrap/app.ts` 中的顺序（**不可调整**）：

```ts
requestContext()                    // ① traceId + 耗时 + 指标
cors(...)                           // ②
helmet(...)                         // ③
compression(...)                    // ④
bodyParser.json/urlencoded          // ⑤
auditMiddleware                     // ⑥ 审计（body 解析后）
swaggerRouter / express.static      // ⑦
health routes / metrics             // ⑧
globalRateLimit + 各类 limiter      // ⑨
authMiddleware                      // ⑩ 认证
tenantResolver                      // ⑪ 租户解析
dataScopeMiddleware()               // ⑫ 数据权限（fail-closed）
DecoratorRouter                     // ⑬ 业务路由
Sentry.setupExpressErrorHandler     // ⑭ 生产
notFoundHandler / errorHandler      // ⑮ 兜底
```

`auth.ts` 和 `tenant.ts` 的**白名单必须同步**（登录、注册、忘记密码、文档等）。

---

## 部署注意

- **多实例**：cron 由 `withPgLock` 保证只跑一次；WS 广播通过 Redis pub/sub 跨实例
- **进程退出**：`drainAuditQueue()` 冲刷审计队列（最多等 15s，超时强退）
- **Worker 独立部署**：避免与 API 进程抢 CPU；同一镜像，`command: node dist/src/worker.js`
- **DB 连接池**：`DB_POOL_MAX` 之和不超过 PG `max_connections` 的 80%
- **Redis 内存**：total 缓存用版本号失效（写时 `INCR cache:ver:*`），旧版本 key 靠 TTL 自然过期
- **日志轮转**：`rotating-file-stream` 每天 / 10MB，保留 30 个

---

## 常见坑

| 现象                                              | 原因                                                   | 修复                                                  |
| ------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| `/api/v1/docs.json` 500                           | Zod v4 与旧版 zod-to-openapi 不兼容                    | 升级 `@asteasolutions/zod-to-openapi` 到 9.x          |
| `subscriber.on is not a function`                 | `subscribe()` 返回值当实例用                           | 监听挂 `subRedis` 本身                                |
| 登录报"缺少租户标识"                              | 白名单漏了 auth 路径                                   | 同步 `auth.ts` / `tenant.ts` 白名单                   |
| 权限判断不一致                                    | 两套 RBAC 逻辑并存                                     | 统一走 `@/modules/rbac/index.js`                      |
| 定时任务多实例重复执行                            | 用 Redis 锁而非 PG advisory lock                       | 改用 `withPgLock`                                     |
| 数据权限失效 / 越权                               | Controller 里 `setDataScope(req.dataScopeWhere ?? {})` | 改用 `getDataScopeWhere()`（缺失上下文抛错）          |
| 审计日志只 flush 一次                             | `flushing` 状态未在 finally 重置                       | 已修复（`try/finally`）                               |
| 通知撤回不推给前端                                | `handleNoticeRevoke` 误用 `status !== '1'` 过滤        | 已修复（撤回路径不校验 status）                       |
| 缓存监控面板越权                                  | 无 RBAC + 无前缀白名单                                 | 已修复（`@RequirePermission` + `prefix-guard.ts`）    |
| 注册可伪造平台超管                                | 依赖 `tenant_code.startsWith("__PLATFORM__")`          | 已修复（拒绝 `__` 前缀 + `is_platform` 字段）         |
| 慢查询只打日志不告警                              | 阈值 5000ms 过高                                       | 已降到 500ms                                          |
| `redis.del(...keys)` 参数溢出                     | 大数组展开                                             | 用 `delChunked`（每批 500）                           |
| Base64 secret 直接 `Buffer.from(secret, "ascii")` | 未做 Base32 解码                                       | 已修复（`core/security/mfa.ts` 用 `base32Decode`）    |
| `wss is not defined`                              | `startServer` 未返回 `wss`                             | 已修复（返回 `{ httpServer, wss }`，`index.ts` 解构） |

---

## 开发规范速查

| 场景            | 做法                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------- |
| 新增业务模块    | `modules/<name>/{controller,service,repository,schema,types}.ts` + `index.ts`                     |
| 新增接口        | `@Controller` + `@Get/@Post/...`，必须加 `@ApiOperation`                                          |
| 新增权限        | `@RequirePermission("resource:action")`，权限码进 `modules/rbac/types.ts` 的 `SYSTEM_PERMISSIONS` |
| 新增缓存        | 前缀必须加入 `config/constants.ts` 的 `CACHE_GROUPS`                                              |
| 新增告警        | `sendAlert({ level, title, message, source, data })`，`data` 会自动脱敏                           |
| 新增定时任务    | `jobs/scheduler.ts` 注册 + `withPgLock` 包裹                                                      |
| 新增 Redis 频道 | 在 `platform/ws/` 或 `core/cache/pubsub.ts` 集中管理                                              |
| 新增错误码      | 4xxxxx（客户端）/ 5xxxxx（服务端），不要复用                                                      |
| 新增环境变量    | `config/env.ts` 加 Zod schema，布尔值用 `boolStr("true"/"false")`                                 |
| 修改中间件顺序  | 改 `bootstrap/app.ts`，注意白名单同步                                                             |

---

## 参考

- API 文档：`/api/v1/docs`（运行中动态生成）
- 健康检查：`/health/live`、`/health/ready`
- 指标：`/metrics`