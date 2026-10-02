# SaaS Admin Server

> 基于 **Node.js 22 + Express 5 + TypeScript 5 + Prisma 7 + PostgreSQL 15 + Redis 7** 的多租户 SaaS 后台管理系统。
> 采用装饰器路由、分层架构、双进程模型、fail-closed 数据权限。

---

## 目录

- [SaaS Admin Server](#saas-admin-server)
  - [目录](#目录)
  - [项目简介](#项目简介)
  - [技术栈](#技术栈)
  - [快速开始](#快速开始)
    - [依赖](#依赖)
    - [启动](#启动)
    - [访问](#访问)
  - [文档地图](#文档地图)
  - [架构总览](#架构总览)
    - [分层架构](#分层架构)
    - [请求生命周期](#请求生命周期)
    - [双进程模型](#双进程模型)
    - [启动流程](#启动流程)
    - [优雅退出](#优雅退出)
  - [目录结构](#目录结构)
  - [核心约定](#核心约定)
    - [密码与会话](#密码与会话)
    - [JWT Payload](#jwt-payload)
    - [多租户隔离](#多租户隔离)
    - [数据权限](#数据权限)
    - [软删除](#软删除)
    - [错误处理](#错误处理)
    - [关联表写入](#关联表写入)
    - [审计日志](#审计日志)
    - [缓存约定](#缓存约定)
    - [定时任务](#定时任务)
    - [Redis 订阅](#redis-订阅)
    - [日志规范](#日志规范)
  - [环境变量](#环境变量)
  - [API 概览](#api-概览)
  - [健康检查与指标](#健康检查与指标)
    - [健康检查](#健康检查)
    - [Prometheus 指标](#prometheus-指标)
    - [告警](#告警)
  - [部署](#部署)
    - [Docker 镜像（建议）](#docker-镜像建议)
    - [双进程部署](#双进程部署)
    - [数据库迁移](#数据库迁移)
    - [连接池规划](#连接池规划)
    - [日志轮转](#日志轮转)
    - [监控大盘建议](#监控大盘建议)
  - [常见坑](#常见坑)
  - [开发规范速查](#开发规范速查)
    - [PR 提交前自查](#pr-提交前自查)
  - [版本演进路线](#版本演进路线)
    - [近期优化路线](#近期优化路线)
  - [参考](#参考)

---

## 项目简介

一个**面向多租户的 SaaS 后台管理系统**，提供：

| 能力域         | 说明                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------- |
| **认证授权**   | 账号密码登录、JWT + Redis 会话、设备管理、强制下线、图形验证码、MFA（TOTP）、账号注销       |
| **RBAC**       | 角色、权限点、菜单、部门，5 级数据权限（全部 / 自定义 / 本部门 / 本部门及以下 / 仅本人）    |
| **工作流**     | 流程定义（BPMN JSON）、实例、任务、会签/或签、排他/并行/包容网关、超时策略、表达式条件      |
| **通知中心**   | 站内信、邮件（全局 + 租户级 SMTP）、短信（可扩展）、Webhook、模板引擎、多渠道派发、失败告警 |
| **文件服务**   | 分片上传、断点续传、合并、对象存储（MinIO / OSS / COS / S3）、本地存储、定期清理            |
| **代码生成器** | 从表结构生成 CRUD 前后端代码、菜单 SQL、导入/导出                                           |
| **审计与监控** | 审计日志（异步队列）、登录日志、审计日报、分区归档、QPS / DB / Server 监控、Prometheus 指标 |
| **系统配置**   | 站点信息、密码策略、上传配置、IP 白黑名单、字典、通知渠道                                   |

---

## 技术栈

| 技术        | 版本   | 用途                                                       |
| ----------- | ------ | ---------------------------------------------------------- |
| Node.js     | 22 LTS | 运行时                                                     |
| Express     | 5.x    | Web 框架                                                   |
| TypeScript  | 5.x    | 类型系统                                                   |
| Prisma      | 7.x    | ORM（`@prisma/adapter-pg` + pg 驱动）                      |
| PostgreSQL  | 15+    | 主数据库（含分区表）                                       |
| Redis       | 7+     | 缓存 / 会话 / 分布式锁 / BullMQ / pub-sub                  |
| Zod         | 4.x    | 参数校验（配套 `@asteasolutions/zod-to-openapi` 9.x）      |
| Jose        | 6.x    | JWT 认证                                                   |
| bcryptjs    | 3.x    | 密码哈希（**不用于字段加密**）                             |
| BullMQ      | 6.x    | 异步任务（merge / report-export / wf-notify / cache-warm） |
| Pino        | 10.x   | 结构化日志                                                 |
| prom-client | 15.x   | 指标暴露                                                   |
| ws          | 8.x    | WebSocket                                                  |
| Handlebars  | 4.x    | 代码生成器模板                                             |

> ⚠️ **Zod 4.x 与 `@asteasolutions/zod-to-openapi` 9.x 配套使用。** 若降级 Zod，必须同步降级 zod-to-openapi，否则 `/api/docs.json` 会 500。

---

## 快速开始

### 依赖

- Node.js ≥ 22
- pnpm ≥ 9
- PostgreSQL ≥ 15
- Redis ≥ 7
- MinIO（可选，或配置其他对象存储）

### 启动

```bash
# 1. 安装依赖
pnpm install

# 2. 准备环境变量
cp .env.example .env.development
# 修改 DATABASE_URL / REDIS_URL / JWT_SECRET / JWT_REFRESH_SECRET / ENCRYPTION_KEY

# 3. 生成 Prisma Client & 迁移
pnpm db:generate
pnpm db:migrate

# 4. 启动（API + Worker 并行）
pnpm dev
# 或分别启动
pnpm dev:server
pnpm dev:worker
```

### 访问

| 服务            | 地址                                                           |
| --------------- | -------------------------------------------------------------- |
| API             | `http://localhost:3000/api/v1`                                 |
| Swagger 文档    | `http://localhost:3000/api/docs`                               |
| 存活探针        | `http://localhost:3000/health/live`                            |
| 就绪探针        | `http://localhost:3000/health/ready`                           |
| Prometheus 指标 | `http://localhost:3000/metrics`（受 `METRICS_WHITELIST` 限制） |

---

## 文档地图

| 我想…            | 看这里                            |
| ---------------- | --------------------------------- |
| 快速跑起来       | [快速开始](#快速开始)             |
| 了解整体架构     | [架构总览](#架构总览)             |
| 理解请求处理流程 | [请求生命周期](#请求生命周期)     |
| 理解多租户模型   | [多租户隔离](#多租户隔离)         |
| 理解数据权限     | [数据权限](#数据权限)             |
| 查看目录结构     | [目录结构](#目录结构)             |
| 了解核心约定     | [核心约定](#核心约定)             |
| 配置环境变量     | [环境变量](#环境变量)             |
| 查看 API 列表    | [API 概览](#api-概览)             |
| 接入监控         | [健康检查与指标](#健康检查与指标) |
| 上线部署         | [部署](#部署)                     |
| 排查线上问题     | [常见坑](#常见坑)                 |
| 编码规范速查     | [开发规范速查](#开发规范速查)     |
| 了解后续演进     | [版本演进路线](#版本演进路线)     |

---

## 架构总览

### 分层架构

项目采用 **5 层分层架构 + 2 入口**，依赖关系**严格单向向下**：

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

**层级依赖约束（ESLint 强制）**：

| 层                  | 可依赖                                              |
| ------------------- | --------------------------------------------------- |
| `config/` `shared/` | 无                                                  |
| `core/`             | `config/` `shared/`                                 |
| `platform/`         | `config/` `shared/` `core/`                         |
| `middleware/`       | `config/` `shared/` `core/` `platform/`             |
| `modules/`          | 上述全部 + 其他 `modules/`（**仅通过 `index.ts`**） |
| `jobs/`             | 上述全部（不含 `middleware/`）                      |
| `bootstrap/`        | 全部                                                |

模块间调用**必须**通过目标模块的 `index.ts`，禁止深路径：

```ts
// ✅
import { AuthService } from "@/modules/auth/index.js";

// ❌
import { AuthService } from "@/modules/auth/service/auth.service.js";
```

### 请求生命周期

请求进入后按固定顺序经过以下中间件（`bootstrap/app.ts`）：

```
入站请求
   │
   ▼
① requestContext()          ── traceId + 耗时 + 指标埋点
   ▼
② cookieParser()            ── 解析 cookie
   ▼
③ issueCsrfToken            ── 无 csrf token 时下发
   ▼
④ csrfGuard                 ── 校验 CSRF（写操作）
   ▼
⑤ cors()                    ── 跨域
   ▼
⑥ helmet()                  ── 安全响应头（CSP / HSTS）
   ▼
⑦ compression()             ── 压缩（跳过已压缩类型）
   ▼
⑧ bodyParser.json/urlencoded── body 解析
   ▼
⑨ auditMiddleware           ── 审计入队（异步）
   ▼
⑩ swagger / static          ── 文档 / 静态资源
   ▼
⑪ health routes / metrics   ── 健康检查 / 指标
   ▼
⑫ globalRateLimit + 分路径限流
   ▼
⑬ authMiddleware            ── JWT + Redis 会话 + 强制下线
   ▼
⑭ tenantResolver            ── 租户解析
   ▼
⑮ dataScopeMiddleware()     ── 数据权限（fail-closed，写 ALS）
   ▼
⑯ DecoratorRouter           ── 业务路由
   ▼
⑰ Sentry error handler      ── 生产环境
   ▼
⑱ notFoundHandler + errorHandler
   ▼
出站响应
```

> ⚠️ **顺序不可调整**。`auth` / `tenant` 的白名单**必须同步**（登录、注册、忘记密码、文档等）。

### 双进程模型

```
┌──────────────────────┐         ┌──────────────────────┐
│  API 进程             │         │  Worker 进程          │
│  node dist/src/index │         │  node dist/src/worker│
│  ─ Express + WS      │         │  ─ BullMQ            │
│  ─ cron（PG 锁互斥）  │         │  ─ 独立连接池         │
│  ─ Redis pub/sub 订阅 │         │                      │
└──────────────────────┘         └──────────────────────┘
         │                                  │
         └───────── 共享 PG + Redis ────────┘
```

**为什么分进程？**

- Worker 处理 CPU 密集任务（PDF 渲染、Excel 导出），避免阻塞 API 事件循环
- Worker 的 Redis 连接池与 API 独立，互不影响
- 独立扩缩容：API 按 QPS 扩，Worker 按队列积压扩

### 启动流程

**API 进程**（`src/index.ts`）：

```
1. startTracing()               ── OTEL 初始化
2. watchListenerLeak()          ── 诊断探针
3. trackTimers()                ── 定时器追踪
4. createApp()                  ── Express 组装
5. startServer(app)             ── HTTP + WebSocket + DB/Redis 探活
6. startSubscribers()           ── Redis pub/sub 订阅
7. startScheduler()             ── cron（withPgLock 互斥）
8. installShutdownHandlers()    ── SIGTERM/SIGINT
9. 泄漏快照（每 5 分钟）
```

**Worker 进程**（`src/worker.ts`）：

```
1. startAllWorkers()            ── BullMQ 4 个 worker
2. installWorkerShutdown()      ── 等当前任务完成后退出
```

### 优雅退出

`SIGTERM` / `SIGINT` 触发后的顺序：

```
1. 通知所有 WS 客户端 server-shutdown
2. 等 1s 让消息送达
3. 关闭 WebSocket（wsManager.closeAll + wss.close）
4. httpServer.close() 停止接收新请求
5. drainAuditQueue() 冲刷审计队列
6. prisma.$disconnect() + redis.quit()
7. 15s 兜底强制退出
```

Worker 的退出逻辑独立（`installWorkerShutdown`），等待当前 BullMQ 任务完成，30s 兜底。

---

## 目录结构

```
src/
├── config/                          # L0 配置层
│   ├── env.ts                       # 环境变量（Zod 校验 + boolStr）
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
│   │   ├── date.ts
│   │   └── excel-mapper.ts
│   ├── http/
│   │   ├── response.ts              # success / error / pageSuccess
│   │   └── agent.ts                 # keep-alive HTTP agents
│   └── types/
│       └── api-response.ts
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
│   │   ├── report.ts
│   │   ├── workflow.ts
│   │   ├── workflow-notify.ts
│   │   └── partitions.ts
│   ├── alert/                       # 告警 webhook
│   ├── audit/                       # 审计队列
│   │   ├── queue.ts                 # pushAudit / drainAuditQueue
│   │   ├── writer.ts                # writeAuditLog / writeAuditBatch
│   │   └── summarize.ts             # 请求/响应摘要 + 脱敏
│   ├── email/service.ts             # 邮件发送（全局 + 租户级 SMTP）
│   ├── excel/service.ts             # parseExcel / generateExcel / importTreeData
│   ├── ws/                          # WebSocket
│   │   ├── manager.ts               # 连接池 + 心跳
│   │   ├── server.ts                # initWebSocketServer
│   │   ├── notice-pubsub.ts
│   │   ├── force-logout.ts          # 强制下线（负缓存 + pub/sub）
│   │   └── upload-notify.ts
│   ├── storage/                     # S3 操作 + 本地 blob + factory
│   ├── swagger/                     # OpenAPI 文档
│   ├── secrets/                     # 环境变量解密
│   └── observability/sentry.ts
│
├── middleware/                      # L3 Express 中间件
│   ├── http/                        # HTTP 基础设施
│   │   ├── request-context.ts       # traceId + 耗时 + 指标
│   │   ├── error-handler.ts
│   │   ├── validator.ts
│   │   └── cache.ts
│   ├── security/                    # 安全链
│   │   ├── auth.ts                  # JWT + Redis 会话 + 强制下线
│   │   ├── tenant.ts                # 租户解析
│   │   ├── data-scope.ts            # 数据权限（fail-closed）
│   │   ├── rbac.ts                  # createRbacMiddleware
│   │   ├── mfa.ts
│   │   ├── ip-rule.ts
│   │   └── rate-limit.ts            # 限流 + 封禁递进
│   └── business/audit.ts            # 审计写入（异步队列）
│
├── modules/                         # L4 业务模块
│   ├── auth/                        # 认证（Controller 拆为 6 个文件）
│   │   ├── controller/              # login/register/profile/menu/misc/tenant-switch/device
│   │   ├── service/                 # auth/token/captcha/password-policy/email-verify/cancel-account
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── rbac/                        # RBAC（角色/权限/平台超管）
│   ├── user/                        # 用户（含 upload 中间件 + 注册事务）
│   ├── tenant/                      # 租户管理
│   ├── dept/                        # 部门（树 + 导入导出）
│   ├── dict-type/ dict-data/        # 字典
│   ├── menu/                        # 菜单管理
│   ├── role/                        # 角色（数据权限、菜单/权限/用户/部门分配）
│   ├── permission/                  # 权限点
│   ├── notice/                      # 通知（站内 / 邮件 / 短信 / Webhook）
│   ├── workflow/                    # 工作流（定义/实例/任务/引擎/审批人/表达式）
│   ├── approval/                    # 部门链审批
│   ├── system/                      # 系统设置
│   ├── file/ upload/                # 文件与上传（含 BullMQ merge）
│   ├── report/                      # 报表（引擎/导出/缓存预热）
│   ├── dashboard/ workbench/ todo/  # 仪表盘 / 工作台 / 待办
│   ├── online/                      # 在线用户
│   ├── ip-rule/                     # IP 白黑名单
│   ├── audit-log/ login-log/        # 日志
│   ├── monitor/                     # 监控（cache/database/server/qps/audit-daily）
│   ├── generator/                   # 代码生成器
│   ├── mfa/                         # MFA 服务
│   └── index.ts                     # 聚合所有 Controller 供 bootstrap 注册
│
├── jobs/                            # 后台任务
│   ├── maintenance/
│   │   ├── aggregate.ts             # 审计日志日聚合
│   │   ├── archive.ts               # 分区归档（keyset pagination）
│   │   ├── partition-manager.ts     # 分区预建 + 过期清理
│   │   └── lock.ts
│   ├── tasks/                       # 各具体任务
│   │   ├── audit-clean.task.ts
│   │   ├── audit-daily.task.ts
│   │   ├── db-slow-query-review.task.ts
│   │   ├── export-retry.task.ts
│   │   ├── file-cleanup.task.ts
│   │   ├── metrics-refresh.task.ts
│   │   ├── partition-monitor.task.ts
│   │   ├── report-cache-warm.task.ts
│   │   ├── report-export-cleanup.task.ts
│   │   └── workflow-timeout.task.ts
│   ├── registry.ts                  # JOB_HANDLERS
│   └── scheduler.ts                 # cron 注册（withPgLock 互斥）
│
├── workers/                         # BullMQ worker 具体实现
│   ├── cache-warm.worker.ts
│   ├── report-export.worker.ts
│   └── wf-notify.worker.ts
│
├── bootstrap/                       # 启动组装
│   ├── app.ts                       # Express 组装
│   ├── server.ts                    # HTTP + WebSocket 启动（返回 wss）
│   ├── subscribers.ts               # Redis pub/sub 订阅
│   ├── shutdown.ts                  # 优雅退出
│   ├── worker.ts                    # Worker 启动 + 关闭
│   └── index.ts
│
├── index.ts                         # API 进程入口（薄入口）
└── worker.ts                        # Worker 进程入口（薄入口）
```

---

## 核心约定

### 密码与会话

**所有密码**只走 bcrypt（`bcryptjs`，salt rounds 由 `BCRYPT_SALT_ROUNDS` 决定，默认 12）：

```ts
import { hashPassword, verifyPassword } from "@/core/security/password.js";

const hashed = await hashPassword(plain);
const ok = await verifyPassword(plain, hashed);
```

> ❌ 禁止再出现 `encryptPassword` / `decryptPassword`。
> `core/security/crypto.ts` 的 `encrypt` / `decrypt` 只用于**需要还原**的字段（如 MFA secret）。
> `core/security/field-encrypt.ts` 的 `encryptField` / `decryptField` 用于字段级加密；`hashField` 用于可查找的哈希（不可逆）。

**登录**（必须携带 `tenantCode`）：

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "tenantCode": "acme",
  "username": "alice",
  "password": "...",
  "deviceId": "optional-uuid",
  "captchaId": "optional",
  "captchaCode": "optional"
}
```

**会话 Redis key 约定**：

| Key                                      | 值           | 说明                   |
| ---------------------------------------- | ------------ | ---------------------- |
| `access:{tenantId}:{userId}:{deviceId}`  | `"valid"`    | 访问令牌有效性         |
| `refresh:{tenantId}:{userId}:{deviceId}` | refreshToken | 刷新令牌               |
| `device:{tenantId}:{userId}:{deviceId}`  | JSON         | 设备元信息             |
| `kicked:{userId}`                        | JSON         | 强制下线标记（TTL 7d） |

`deviceId` 未传时后端自动 `randomUUID()`。同一用户可多设备在线，登出只清当前设备。

### JWT Payload

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

> ❌ **不要再用 `sub` / `role`（单数）**。

### 多租户隔离

- 所有业务表**必须**有 `tenant_id`（`sys_tenant` 例外）
- 所有查询通过 `BaseRepository` 自动附加 `tenant_id`
- 关联表 `createMany` **必须先校验 ID 归属租户**（`assertOwnership`）
- 未认证请求**默认拒绝**指定租户（`ALLOW_UNAUTH_TENANT_HEADER=true` 时允许，仅供内网 mTLS 场景）

### 数据权限

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

> ⚠️ **禁止** `setDataScope(req.dataScopeWhere ?? {})` —— 这会绕过 fail-closed，导致数据权限失效。
> 手写 `findPage` 的 Repository **必须**调用 `this.mergeDataScope(finalWhere)`。

### 软删除

所有表统一 `is_deleted: 0 | 1`。查询默认过滤 `is_deleted = 0`。

不可软删表（如 `sys_audit_log` / `sys_login_log`）需覆写：

```ts
protected isSoftDeleteTable(): boolean {
  return false;
}
```

### 错误处理

统一使用 `@/core/errors.js` 导出的错误类：

```ts
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
} from "@/core/errors.js";

throw new AppError("消息", 400001, 400);
throw new AuthenticationError("未登录");      // 401001 / 401
throw new AuthorizationError("无权限");       // 403001 / 403
throw new NotFoundError("不存在");            // 404001 / 404
throw new ConflictError("冲突");              // 409001 / 409
throw new RateLimitError("限流");             // 429001 / 429
```

> ❌ **禁止**从 `@/middleware/http/error-handler.js` 导入 `AppError`（旧路径，已废弃）。
> `errorHandler` 通过 `instanceof AppError` 判断，**不要定义第二个 AppError 类**。

### 关联表写入

所有 `createMany` 前必须：

1. 校验关联 ID 属于当前租户（`assertOwnership`）
2. 加 `skipDuplicates: true`
3. **空数组时跳过**（Prisma 会报错）

```ts
private async assertOwnership(
  table: "sys_menu" | "sys_permission" | "sys_user" | "sys_dept",
  idField: "menu_id" | "perm_id" | "user_id" | "dept_id",
  ids: string[],
  tenantId: string,
) {
  if (ids.length === 0) return;
  const uniqueIds = [...new Set(ids)];
  const rows = await (prisma as any)[table].findMany({
    where: { [idField]: { in: uniqueIds }, tenant_id: tenantId, is_deleted: 0 },
    select: { [idField]: true },
  });
  if (rows.length !== uniqueIds.length) {
    throw new AppError(`存在无效的 ${idField}`, 400001, 400);
  }
}
```

### 审计日志

走异步队列 `@/platform/audit/index.js` 的 `pushAudit`，**不要**直接 `prisma.sys_audit_log.create`。

- 敏感字段（password / token / secret / phone / email / idCard）自动脱敏
- 请求 body 超 4KB 只保留 `_sha256 + _len + _keys`
- 队列满（2000）时丢最旧 + `audit_dropped_total` 计数 + 告警
- 失败 3 次后落 `logs/audit-fallback.log`
- 审计中间件**跳过** `/api/v1/upload/chunk`（分片上传，高频）

**脱敏字段清单**（`core/security/sensitive-keys.ts`）：

```
password / oldPassword / newPassword / confirmPassword
token / accessToken / refreshToken
secret / apiKey / apiSecret
authorization / cookie
idCard / phone / mobile / email / address
bankAccount / cardNo / taxNo / passport / license
captchaCode / mfaSecret
```

### 缓存约定

**Redis key 前缀**：

| 前缀           | 用途                        |
| -------------- | --------------------------- |
| `access:`      | access token 会话           |
| `refresh:`     | refresh token 会话          |
| `rbac:perms:`  | 权限缓存                    |
| `session:`     | 通用会话                    |
| `kicked:`      | 强制下线标记                |
| `job:lock:`    | 定时任务锁                  |
| `ip-rule:`     | IP 规则缓存                 |
| `login:fail:`  | 登录失败计数                |
| `login:lock:`  | 登录锁定                    |
| `cache:total:` | Repository total 缓存       |
| `cache:ver:`   | Repository total 缓存版本号 |
| `config:`      | 系统配置缓存                |
| `captcha:`     | 图形验证码                  |
| `mfa:`         | MFA 缓存                    |
| `notice:`      | 通知缓存                    |
| `data-scope:`  | 数据权限缓存                |

新增缓存 key 时，**必须**在 `config/constants.ts` 的 `CACHE_GROUPS` 中登记，否则缓存监控面板无法识别。

**清空 Redis**：**禁止** `flushall` / `flushdb`，只按前缀清理：

```ts
const keys = await scanAll("cache:*");
if (keys.length) await redis.del(...keys);
```

### 定时任务

所有 cron 任务必须通过 `withPgLock` 包裹，PostgreSQL 事务级 advisory lock（跨实例互斥）：

```ts
import { withPgLock } from "@/core/lock/index.js";

const done = await withPgLock(async () => {
  await maintainPartitions();
  await archiveExpiredPartitions();
});
if (done === null) logger.info("another instance is running, skip");
```

> ⚠️ **不要**用 Redis `withLock` 做长期任务锁（TTL 到期会自动释放，长任务可能被重复执行）。
> 若必须用 Redis 锁，需自行实现**看门狗续期**。

**TTL 规范**：

- TTL **大于** 单次最长执行时间
- TTL **小于** cron 间隔

### Redis 订阅

`ioredis` 的 `subscribe()` 返回 `Promise<number>`，**不是** Redis 实例：

```ts
// ✅ 正确
await subRedis.subscribe(CHANNEL);
subRedis.on("message", (channel, message) => { /* ... */ });

// ❌ 错误（sub 是 number，没有 .on 方法）
const sub = await subRedis.subscribe(CHANNEL);
sub.on("message", ...);
```

**统一挂载点**：所有订阅的 `message` / `pmessage` 监听器，**必须**在 `subscribers.ts` 或 `core/cache/pubsub.ts` 集中注册，业务代码不直接操作 `subRedis`。

### 日志规范

统一走 `@/platform/logger/index.js` 的 `logger`。**禁止 `console.log`**（会绕过 Pino redact，泄漏敏感字段）。

```ts
import { logger } from "@/platform/logger/index.js";

logger.info({ userId, action }, "user updated");
logger.error({ err }, "operation failed");
```

**必带字段**：

```ts
{
  traceId: string;      // 请求链路（requestContext 自动注入）
  tenantId?: string;
  userId?: string;
  module: string;       // 模块名
  action: string;       // 动作
  duration?: number;    // 耗时（ms）
}
```

Pino 的 `redact` 会自动移除 `password` / `token` / `secret` / `authorization` / `cookie` / `*.phone` / `*.email` 等字段。

---

## 环境变量

| 变量                                                                | 必填      | 默认                       | 说明                                     |
| ------------------------------------------------------------------- | --------- | -------------------------- | ---------------------------------------- |
| `NODE_ENV`                                                          | ✅         | `development`              | `development` / `production` / `test`    |
| `PORT`                                                              | ❌         | `3000`                     | HTTP 端口                                |
| `HOST`                                                              | ❌         | `0.0.0.0`                  | 监听地址                                 |
| `DATABASE_URL`                                                      | ✅         | —                          | PostgreSQL 连接串                        |
| `DATABASE_URL_UNPOOLED`                                             | ❌         | —                          | 无 PgBouncer 的连接串（迁移用）          |
| `DB_POOL_MAX`                                                       | ❌         | `20`                       | 连接池大小                               |
| `DB_IDLE_TIMEOUT_MS`                                                | ❌         | `30000`                    | 空闲超时                                 |
| `DB_CONNECT_TIMEOUT_MS`                                             | ❌         | `5000`                     | 连接超时                                 |
| `REDIS_URL`                                                         | ✅         | —                          | Redis 连接串                             |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_DB`                            | ❌         | `localhost` / `6379` / `0` | Redis 基础配置                           |
| `REDIS_PASSWORD`                                                    | ❌         | —                          | Redis 密码                               |
| `JWT_SECRET`                                                        | ✅         | —                          | ≥32 位                                   |
| `JWT_REFRESH_SECRET`                                                | ✅         | —                          | ≥32 位                                   |
| `JWT_EXPIRES_IN`                                                    | ❌         | `3h`                       | access token 有效期                      |
| `JWT_REFRESH_EXPIRES_IN`                                            | ❌         | `15h`                      | refresh token 有效期                     |
| `ENCRYPTION_KEY`                                                    | ✅         | —                          | AES 密钥，≥32 位                         |
| `SECRET_MASTER_KEY`                                                 | ✅（生产） | —                          | 生产必填，用于解密环境变量               |
| `BCRYPT_SALT_ROUNDS`                                                | ❌         | `12`                       | bcrypt 强度                              |
| `LOG_LEVEL`                                                         | ❌         | `info`                     | trace/debug/info/warn/error/fatal        |
| `BODY_LIMIT`                                                        | ❌         | `10mb`                     | Body 解析上限                            |
| `FRONTEND_URL`                                                      | ❌         | `http://localhost:5680`    | CORS 白名单 + 重置链接（逗号分隔多值）   |
| `MINIO_ENDPOINT`                                                    | ✅         | —                          | 对象存储 endpoint                        |
| `MINIO_PORT`                                                        | ❌         | `9000`                     |                                          |
| `MINIO_USE_SSL`                                                     | ❌         | `false`                    | 字符串 `"true"` / `"false"`              |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`                             | ✅         | —                          |                                          |
| `MINIO_REGION`                                                      | ❌         | `us-east-1`                |                                          |
| `MINIO_BUCKET`                                                      | ✅         | —                          |                                          |
| `MINIO_ARCHIVE_BUCKET`                                              | ❌         | —                          | 归档桶                                   |
| `MINIO_PUBLIC_URL`                                                  | ❌         | —                          | CDN 前缀                                 |
| `MINIO_ENABLED`                                                     | ❌         | `true`                     | `false` 时跳过存储自检                   |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | ❌         | —                          | 邮件发送（未配置时静默跳过）             |
| `METRICS_WHITELIST`                                                 | ❌         | `127.0.0.1,::1`            | `/metrics` 白名单 IP                     |
| `ALERT_WEBHOOK_URL`                                                 | ❌         | —                          | 告警 webhook（未配置时只打日志）         |
| `ALERT_MIN_INTERVAL_MS`                                             | ❌         | `60000`                    | 同 title 告警去重间隔                    |
| `SENTRY_DSN`                                                        | ❌         | —                          | Sentry 接入                              |
| `OTEL_ENABLED`                                                      | ❌         | `true`                     | OpenTelemetry 开关                       |
| `OTEL_EXPORTER_URL`                                                 | ❌         | —                          | OTEL collector endpoint                  |
| `OTEL_SERVICE_NAME`                                                 | ❌         | `antdv`                    | OTEL 服务名                              |
| `APP_NAME`                                                          | ❌         | `Antdv`                    | 应用名（页面标题、邮件署名）             |
| `APP_VERSION`                                                       | ❌         | `1.0.0`                    | 版本号                                   |
| `SYSTEM_NAME`                                                       | ❌         | —                          | 系统名（邮件模板用）                     |
| `ENABLE_DOCS`                                                       | ❌         | `0`                        | 生产环境是否开放 `/api/docs`             |
| `UPLOAD_MAX_FILE_SIZE`                                              | ❌         | `104857600`                | 单文件上限（100MB）                      |
| `UPLOAD_MAX_CHUNK_SIZE`                                             | ❌         | `5242880`                  | 分片大小（5MB）                          |
| `UPLOAD_MAX_BYTES_PER_HOUR`                                         | ❌         | `5000000000`               | 单租户每小时上传上限                     |
| `UPLOAD_ID_RATE_PER_SEC`                                            | ❌         | `200`                      | 单 uploadId 每秒请求上限                 |
| `UPLOAD_ROOT`                                                       | ❌         | —                          | 本地存储根目录                           |
| `ALLOW_UNAUTH_TENANT_HEADER`                                        | ❌         | `false`                    | 允许未认证请求带 `X-Tenant-Id`（内网用） |
| `ALLOW_SELF_KICK`                                                   | ❌         | `false`                    | 允许踢自己                               |
| `TEMPLATE_TENANT_ID`                                                | ✅         | —                          | 模板租户 ID（新租户初始化菜单用）        |
| `AUDIT_LOG_RETENTION_DAYS`                                          | ❌         | `180`                      | 审计日志保留天数                         |
| `LOGIN_LOG_RETENTION_DAYS`                                          | ❌         | `90`                       | 登录日志保留天数                         |
| `NOTICE_SEND_LOG_RETENTION_DAYS`                                    | ❌         | `90`                       | 通知日志保留天数                         |
| `JOB_LOG_RETENTION_DAYS`                                            | ❌         | `60`                       | 任务日志保留天数                         |

> **布尔值陷阱**：`z.coerce.boolean()` 会把 `"false"` 视为 `true`。项目统一用 `boolStr("true"|"false")` 转换。

---

## API 概览

所有业务接口以 `/api/v1` 为前缀。主要模块：

| 模块     | 路径前缀                                                            | 说明                                                                |
| -------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 认证     | `/api/v1/auth`                                                      | 登录、注册、刷新、登出、修改密码、忘记密码、MFA、账号注销、设备管理 |
| 用户     | `/api/v1/user`                                                      | CRUD、导入导出、角色/部门分配、敏感信息查看                         |
| 角色     | `/api/v1/role`                                                      | CRUD、菜单/权限/用户/部门分配、数据权限预览                         |
| 权限     | `/api/v1/permission`                                                | CRUD、导入导出                                                      |
| 菜单     | `/api/v1/menu`                                                      | CRUD、树、按钮、状态切换                                            |
| 部门     | `/api/v1/dept`                                                      | CRUD、树、用户关联                                                  |
| 字典     | `/api/v1/dict-type` `/api/v1/dict-data`                             | 类型 + 数据、树、导入导出                                           |
| 租户     | `/api/v1/tenant`                                                    | CRUD、下拉选项、导入导出                                            |
| 通知     | `/api/v1/notice` `/api/v1/notice-channel` `/api/v1/notice/template` | 通知、渠道、模板                                                    |
| 工作流   | `/api/v1/workflow`                                                  | 定义、实例、任务、流程中心                                          |
| 报表     | `/api/v1/report`                                                    | 引擎、导出、缓存预热                                                |
| 文件     | `/api/v1/upload` `/api/v1/file`                                     | 分片、合并、下载                                                    |
| 审计日志 | `/api/v1/audit-log`                                                 | 列表、详情、导出                                                    |
| 登录日志 | `/api/v1/login-log`                                                 | 列表、导出                                                          |
| 监控     | `/api/v1/monitor/*`                                                 | cache / database / server / qps / audit-daily                       |
| 生成器   | `/api/v1/generator`                                                 | 表列表、详情、建表、预览、下载                                      |
| 待办     | `/api/v1/todo` `/api/v1/todo-group`                                 | 待办、分组                                                          |
| 工作台   | `/api/v1/workbench`                                                 | 概览                                                                |
| 仪表盘   | `/api/v1/dashboard`                                                 | KPI / 趋势 / 分布                                                   |
| 系统配置 | `/api/v1/settings`                                                  | 站点信息、密码策略、上传配置                                        |
| IP 规则  | `/api/v1/ip-rule`                                                   | 白黑名单                                                            |

**完整文档**：运行后访问 `/api/docs`（Swagger UI），或 `/api/docs/json`（OpenAPI JSON）。

**响应格式**：

```ts
// 成功
{ code: 200, message: "操作成功", data: T, timestamp: number, traceId?: string }

// 分页
{ code: 200, message: "查询成功", data: { list, total, pageNum, pageSize, totalPages }, timestamp }

// 失败
{ code: 400001, message: "参数错误", data: null, timestamp }
```

**错误码规范**：`HTTP_STATUS * 1000 + 序号`

| 错误码   | HTTP | 含义              |
| -------- | ---- | ----------------- |
| `400001` | 400  | 参数错误          |
| `401001` | 401  | 未登录 / 令牌失效 |
| `403001` | 403  | 无权限            |
| `404001` | 404  | 资源不存在        |
| `409001` | 409  | 冲突              |
| `429001` | 429  | 限流              |
| `500001` | 500  | 服务器错误        |

---

## 健康检查与指标

### 健康检查

| 路径                | 说明                                                            |
| ------------------- | --------------------------------------------------------------- |
| `GET /health/live`  | 存活探针，返回 `{ status: "ok" }`                               |
| `GET /health/ready` | 就绪探针，检查 DB + Redis 后返回 `{ status: "ready" }` 或 `503` |

用于 K8s / Docker Swarm：

```yaml
livenessProbe:
  httpGet: { path: /health/live, port: 3000 }
  initialDelaySeconds: 10
readinessProbe:
  httpGet: { path: /health/ready, port: 3000 }
  initialDelaySeconds: 5
```

### Prometheus 指标

`GET /metrics`（受 `METRICS_WHITELIST` 限制），暴露：

| 指标                                                 | 类型      | 说明           |
| ---------------------------------------------------- | --------- | -------------- |
| `http_requests_total{method,path,status}`            | Counter   | HTTP 请求数    |
| `http_request_duration_seconds{method,path}`         | Histogram | 请求耗时       |
| `db_query_duration_seconds{operation}`               | Histogram | DB 查询耗时    |
| `db_slow_query_total{operation}`                     | Counter   | 慢查询数       |
| `rp_export_total{tenant,report,type,result}`         | Counter   | 报表导出       |
| `rp_export_duration_seconds{type}`                   | Histogram | 导出耗时       |
| `rp_export_retry_total{type,result}`                 | Counter   | 导出重试       |
| `rp_cache_warm_total{tenant,report,result}`          | Counter   | 缓存预热       |
| `rp_cache_warm_duration_seconds{report}`             | Histogram | 预热耗时       |
| `wf_task_pending{tenant}`                            | Gauge     | 待办任务数     |
| `wf_notification_total{tenant,event,channel,result}` | Counter   | 工作流通知     |
| `partition_size_bytes{table,partition}`              | Gauge     | 分区大小       |
| `partition_row_count{table,partition}`               | Gauge     | 分区行数       |
| `audit_dropped_total`                                | Counter   | 审计队列丢弃数 |

### 告警

`sendAlert({ level, title, message, source, data })` 通过 `ALERT_WEBHOOK_URL` 发出，`data` 会自动脱敏。

告警级别：`info` / `warning` / `error` / `critical`。

同一 `title` 在 `ALERT_MIN_INTERVAL_MS`（默认 60s）内只发一次。

---

## 部署

### Docker 镜像（建议）

```dockerfile
# ---------- Builder ----------
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate && pnpm build

# ---------- Runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/generated ./generated
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live', r => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/src/index.js"]
```

### 双进程部署

| 进程   | 命令                      | 副本数建议          |
| ------ | ------------------------- | ------------------- |
| API    | `node dist/src/index.js`  | ≥ 2（按 QPS 扩）    |
| Worker | `node dist/src/worker.js` | ≥ 1（按队列积压扩） |

**多实例注意事项**：

- cron 由 `withPgLock` 保证只跑一次
- WS 广播通过 Redis pub/sub 跨实例
- 会话存储在 Redis，实例无状态
- 审计队列每实例独立，退出时 `drainAuditQueue` 冲刷

### 数据库迁移

```bash
# 1. 生成迁移（本地）
pnpm db:migrate

# 2. 生产部署
pnpm db:deploy
```

**迁移前 checklist**：

- [ ] 已在 staging 验证
- [ ] 已 `pg_dump` 备份
- [ ] 迁移脚本 review
- [ ] 大表 DDL 使用 `CONCURRENTLY`（如加索引）
- [ ] 回滚方案已准备

### 连接池规划

- PG `max_connections` 建议 **≥ API 副本数 × DB_POOL_MAX + Worker 副本数 × DB_POOL_MAX + 30%**
- Redis 每实例至少 3 个连接（`redis` / `subRedis` / `blockRedis`）+ BullMQ 各队列 1 个

### 日志轮转

`rotating-file-stream`：

- 每天切分
- 单文件 ≤ 10MB
- 保留 30 个

### 监控大盘建议

| 面板         | 指标                                       |
| ------------ | ------------------------------------------ |
| QPS / 错误率 | `rate(http_requests_total[1m])` / 5xx 占比 |
| 响应时间     | `histogram_quantile(0.99, ...)`            |
| DB 健康      | `db_slow_query_total` / 连接池饱和度       |
| Redis 健康   | 内存使用 / 命中率                          |
| 队列积压     | `wf_task_pending` / BullMQ 队列长度        |
| 报表导出     | `rp_export_total` / 失败率                 |
| 审计队列     | `audit_dropped_total`（应恒为 0）          |

---

## 常见坑

| 现象                                              | 原因                                                      | 修复                                               |
| ------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------- |
| `/api/docs.json` 500                              | Zod v4 与旧版 zod-to-openapi 不兼容                       | 升级 `@asteasolutions/zod-to-openapi` 到 9.x       |
| `subscriber.on is not a function`                 | `subscribe()` 返回值当实例用                              | 监听挂 `subRedis` 本身                             |
| 登录报"缺少租户标识"                              | 白名单漏了 auth 路径                                      | 同步 `auth.ts` / `tenant.ts` 白名单                |
| 权限判断不一致                                    | 两套 RBAC 逻辑并存                                        | 统一走 `@/modules/rbac/index.js`                   |
| 定时任务多实例重复执行                            | 用 Redis 锁而非 PG advisory lock                          | 改用 `withPgLock`（xact 版本）                     |
| 数据权限失效 / 越权                               | Controller 里 `setDataScope(req.dataScopeWhere ?? {})`    | 改用 `getDataScopeWhere()`（缺失上下文抛错）       |
| 审计日志只 flush 一次                             | `flushing` 状态未在 finally 重置                          | 已修复（`try/finally`）                            |
| 通知撤回不推给前端                                | `handleNoticeRevoke` 误用 `status !== '1'` 过滤           | 已修复（撤回路径不校验 status）                    |
| 缓存监控面板越权                                  | 无 RBAC + 无前缀白名单                                    | 已修复（`@RequirePermission` + prefix-guard）      |
| 注册可伪造平台超管                                | 依赖 `tenant_code.startsWith("__PLATFORM__")`             | 已修复（拒绝 `__` 前缀 + `is_platform` 字段）      |
| 慢查询只打日志不告警                              | 阈值 5000ms 过高                                          | 已降到 500ms                                       |
| `redis.del(...keys)` 参数溢出                     | 大数组展开                                                | 用 `delChunked`（每批 500）                        |
| Base64 secret 直接 `Buffer.from(secret, "ascii")` | 未做 Base32 解码                                          | 已修复（`core/security/mfa.ts` 用 `base32Decode`） |
| `wss is not defined`                              | `startServer` 未返回 `wss`                                | 已修复（返回 `{ httpServer, wss }`）               |
| `createMany` 报 `data must not be empty`          | 传空数组                                                  | `if (arr.length > 0)` 判断                         |
| 用户创建后角色丢失                                | `createWithRelations` 读 `roleIds`，但上层已转 `role_ids` | 统一字段名或做兼容                                 |
| 通知已读状态被重置                                | `NoticeRepository.update` 无条件重建关联                  | 改 diff 更新                                       |
| 密码重置后哈希强度不一致                          | 硬编码 `hash(pwd, 10)`                                    | 统一用 `hashPassword`                              |
| `pageSize` 传字符串被拒                           | Schema 用 `z.number()`                                    | 改用 `z.coerce.number()`                           |
| 有 `mustChangePassword` 标志但仍能访问            | token 未受限                                              | 签发受限 token（scope 限 `/auth/password`）        |
| 定时任务在高频路径卡死                            | `pg_advisory_lock`（会话级）跨连接失效                    | 用 `pg_try_advisory_xact_lock`（事务级）           |
| 数据权限计算慢                                    | 每次递归查子部门                                          | 缓存部门树（Redis + 本地 LRU）                     |
| WS 消息在实例 A 产生，实例 B 用户收不到           | 直推本实例连接                                            | 通过 Redis pub/sub 广播                            |

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
| 新增错误码      | `4xxxxx`（客户端）/ `5xxxxx`（服务端），不要复用                                                  |
| 新增环境变量    | `config/env.ts` 加 Zod schema，布尔值用 `boolStr("true"/"false")`                                 |
| 修改中间件顺序  | 改 `bootstrap/app.ts`，注意白名单同步                                                             |
| 新增敏感字段    | 加入 `core/security/sensitive-keys.ts` 的 `SET`                                                   |
| 新增加密字段    | 加入 `ENCRYPTED_FIELDS` 清单，统一走 `encryptSensitive`                                           |
| 关联表写入      | 必须 `assertOwnership` + `skipDuplicates: true` + 空数组跳过                                      |
| 手写 `findPage` | 必须调用 `this.mergeDataScope(finalWhere)`                                                        |
| 密码相关        | 只走 `hashPassword` / `verifyPassword`（bcryptjs + env 轮数）                                     |
| 字段加密        | `encryptField` / `decryptField`（可逆）；`hashField`（可查找）                                    |
| 日志            | 走 `logger`，结构化字段，**禁止 `console.log`**                                                   |
| 事务            | 在 Service 层，用 `repository.transaction(cb)`                                                    |
| 跨模块调用      | **只**通过目标模块的 `index.ts`                                                                   |
| 数据库查询      | 显式带 `tenant_id`（`sys_tenant` 例外）                                                           |
| 软删除过滤      | 默认 `is_deleted: 0`，不可软删表覆写 `isSoftDeleteTable()`                                        |

### PR 提交前自查

- [ ] `pnpm lint` 通过
- [ ] `pnpm type-check` 通过
- [ ] 新增/修改有对应单测
- [ ] 新增接口有 `@ApiOperation`
- [ ] 新增写操作有 `@RequirePermission`
- [ ] 新增表查询显式带 `tenant_id`
- [ ] 关联表 `createMany` 有 `assertOwnership` + `skipDuplicates`
- [ ] 新敏感字段加入 `SENSITIVE_KEYS`
- [ ] 无 `console.log` / `any` / `@ts-ignore`
- [ ] 新缓存 key 加入 `CACHE_GROUPS`
- [ ] 新环境变量加入 `.env.example` + `env.ts` schema

---

## 版本演进路线

```
当前：单体 Node.js + PostgreSQL + Redis + MinIO
  ↓
阶段 1：模块化单体（已基本达成）
  - 每个业务模块独立目录、独立测试
  - 模块间通过 Service 调用，不直接跨表
  ↓
阶段 2：服务拆分（按业务域）
  - 认证服务 / 用户服务 / 消息服务 / 文件服务 / 工作流服务
  - 通过 gRPC 或 HTTP 通信
  - 需要：API Gateway + 服务注册
  ↓
阶段 3：微服务 + 事件驱动
  - 引入 Kafka / RabbitMQ 做事件总线
  - CQRS 读写分离
  - 需要：分布式追踪（Jaeger）
```

### 近期优化路线

| 周期 | 目标                                                              |
| ---- | ----------------------------------------------------------------- |
| Q1   | 收敛 P0 安全/数据权限问题；补齐单元测试（≥60%）；密码到期强制改密 |
| Q2   | SMS/Webhook 渠道真实实现；工作流撤销/回退；数据权限性能优化       |
| Q3   | 数据导出异步化；API 版本化；灰度发布；监控大盘                    |
| Q4   | 模块拆分准备；事件总线评估；CQRS 试点                             |

---

## 参考

| 资源            | 地址             |
| --------------- | ---------------- |
| Swagger UI      | `/api/docs`      |
| OpenAPI JSON    | `/api/docs/json` |
| 存活探针        | `/health/live`   |
| 就绪探针        | `/health/ready`  |
| Prometheus 指标 | `/metrics`       |

---

© 2026 SaaS Admin Server · Built with ❤️ using Node.js, TypeScript, Prisma