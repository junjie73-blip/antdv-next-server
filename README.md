# SaaS Admin Server

基于 Node.js + Express + TypeScript + Prisma + PostgreSQL + Redis 的多租户 SaaS 后台管理系统。

## 技术栈

| 技术       | 版本   | 用途                                                                     |
| ---------- | ------ | ------------------------------------------------------------------------ |
| Node.js    | 20+    | 运行时                                                                   |
| Express    | 4.18   | Web 框架                                                                 |
| TypeScript | 5.0+   | 类型系统                                                                 |
| Prisma     | 5.0+   | ORM                                                                      |
| PostgreSQL | 15+    | 主数据库                                                                 |
| Redis      | 7+     | 缓存 / 会话 / 分布式锁                                                   |
| Zod        | 3.23.x | 参数校验（**不要升级到 v4**，`@asteasolutions/zod-to-openapi` 暂不兼容） |
| Jose       | 6.0+   | JWT 认证                                                                 |
| bcryptjs   | 2.4+   | 密码哈希                                                                 |

---

## 快速开始

```bash
pnpm install
cp .env.example .env.development
# 修改 DATABASE_URL / REDIS_URL / JWT_SECRET / JWT_REFRESH_SECRET / ENCRYPTION_KEY

pnpm db:generate
pnpm db:migrate
pnpm dev
```

访问：
- API：`http://localhost:3000/api/v1`
- Swagger：`http://localhost:3000/api/docs`

---

## 项目结构

```
src/
├── config/                 # 环境变量、数据库、Redis、blob 存储
├── core/
│   ├── base-controller.ts        # 抽象 Controller 基类
│   ├── base-repository.ts        # 通用 Repository（含数据权限合并）
│   ├── errors.ts                 # 统一错误类（AppError 及子类）
│   ├── logger/                   # Pino 日志
│   ├── mail/                     # 邮件发送（可选）
│   ├── audit/                    # 审计日志异步队列
│   ├── scheduler/                # 分布式锁（Redis SET NX + Lua 释放）
│   ├── swagger/                  # OpenAPI 文档
│   ├── ws/                       # WebSocket（manager / server / force-logout）
│   ├── redis/                    # Redis pub/sub
│   └── decorator/                # 路由装饰器（@Controller / @Get / @Post）
├── middleware/
│   ├── auth.ts                   # JWT 认证 + 多设备会话
│   ├── tenant-resolver.ts        # 租户识别
│   ├── data-scope.ts             # 数据权限中间件
│   ├── ddos.ts                   # DDoS 防护
│   ├── rate-limit.ts             # 频率限制
│   ├── error-handler.ts          # 全局错误处理
│   └── audit.ts                  # 审计写入（异步队列）
├── common/
│   ├── rbac/                     # RBAC 服务（角色/权限 Redis 缓存）
│   └── utils/                    # 命名转换、统一响应、crypto、ip、mail
├── modules/                      # 业务模块（每个模块继承 BaseController）
│   ├── auth/                     # 登录/注册/刷新/忘记密码/MFA
│   ├── user/                     # 用户管理
│   ├── tenant/                   # 租户管理
│   ├── dict-type/ dict-data/     # 数据字典
│   ├── menu/                     # 菜单管理
│   ├── permission/               # 权限点
│   ├── role/                     # 角色（含数据权限、菜单/权限/用户/部门分配）
│   ├── dept/                     # 部门管理
│   ├── notice/                   # 通知公告（多渠道：站内 / 邮件 / 短信 / Webhook）
│   ├── audit-log/ login-log/     # 日志
│   ├── file/ upload/             # 文件管理
│   ├── job/                      # 定时任务（分布式锁）
│   ├── dashboard/                # 仪表盘
│   ├── workbench/ todo/          # 工作台 / 待办
│   ├── online/                   # 在线用户
│   ├── ip-rule/                  # IP 白黑名单
│   ├── config/                   # 系统配置
│   └── monitor/                  # 缓存 / 服务器监控
└── generated/prisma/             # Prisma 生成的客户端（不要手改）
```

---

## 核心约定

### 密码

**所有密码**只走 bcrypt：

```ts
import { hash, compare } from "bcryptjs";

const hashed = await hash(plain, 10);
const ok = await compare(plain, hashed);
```

> ❌ 禁止再出现 `encryptPassword` / `decryptPassword`。`crypto.ts` 里的 `encrypt` / `decrypt` 只用于**需要还原**的字段（如 MFA secret）。

### 登录与会话

**登录**（必须携带 `tenantCode`）：

```ts
POST /api/v1/auth/login
{ tenantCode: "acme", username: "alice", password: "...", deviceId?: "..." }
```

**会话 key 约定**：

```
access:{tenantId}:{userId}:{deviceId}   = "valid"
refresh:{tenantId}:{userId}:{deviceId}  = refreshToken
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

### 数据权限

数据权限挂在 `sys_role.data_scope`（1-5 级），由 `dataScopeMiddleware` 计算，`BaseRepository.mergeDataScope` 合并：

| 值  | 含义                      |
| --- | ------------------------- |
| 1   | 全部                      |
| 2   | 自定义（`sys_role_dept`） |
| 3   | 本部门                    |
| 4   | 本部门及以下              |
| 5   | 仅本人                    |

手写 `findPage` 的 Repository **必须**调用 `this.mergeDataScope(finalWhere)`。

### 软删除

所有表统一 `is_deleted: 0 | 1`。查询默认过滤 `is_deleted = 0`。

### 错误处理

统一使用 `@/core/errors.js` 导出的错误类：

```ts
throw new AppError("消息", 400001, 400);
throw new AuthenticationError("...");
throw new AuthorizationError("...");
throw new NotFoundError("...");
throw new ConflictError("...");
```

`errorHandler` 通过 `instanceof AppError` 判断，**不要再定义第二个 `AppError` 类**。

### 关联表写入

所有 `createMany` 前必须：

1. 校验关联 ID 属于当前租户（`assertOwnership`）；
2. 加 `skipDuplicates: true`。

### 审计日志

走异步队列 `@/core/audit/queue.js` 的 `pushAudit`，**不要**直接 `prisma.sys_audit_log.create`。

敏感字段（password / token / secret）自动脱敏。

### 定时任务

`withLock(key, ttl, fn)` 包裹，Redis 分布式锁：

```ts
await withLock(`job:lock:${tenantId}:${jobId}`, 600, () => runJob(job));
```

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

---

## 环境变量

| 变量                                                  | 必填 | 说明              |
| ----------------------------------------------------- | ---- | ----------------- |
| `DATABASE_URL`                                        | ✅    | PostgreSQL 连接串 |
| `REDIS_URL`                                           | ✅    | Redis 连接串      |
| `JWT_SECRET`                                          | ✅    | ≥32 位            |
| `JWT_REFRESH_SECRET`                                  | ✅    | ≥32 位            |
| `ENCRYPTION_KEY`                                      | ✅    | AES 密钥，≥32 位  |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | ❌    | 忘记密码邮件      |
| `FRONTEND_URL`                                        | ❌    | 重置链接跳转      |

---

## 关键中间件注册顺序

```ts
// app.ts
app.use("/api/docs", swaggerRouter);           // 文档
app.use("/uploads", express.static(...));      // 静态
app.get("/health", healthCheck);

app.use("/api/v1", authMiddleware);            // 认证
app.use("/api/v1", tenantResolver);            // 租户识别
app.use("/api/v1", dataScopeMiddleware());     // 数据权限
app.use("/api/v1", businessRouter);            // 业务
```

`auth.ts` 和 `tenant-resolver.ts` 的**白名单必须同步**（登录、注册、忘记密码、文档等）。

---

## 部署注意

- **多实例**：定时任务、Redis 订阅由分布式锁保证只跑一次
- **进程退出**：`drainAuditQueue()` 冲刷审计队列
- **WS 广播**：多实例通过 Redis pub/sub 广播 `force-logout` / `notice:push`

---

## 常见坑

| 现象                              | 原因                                          | 修复                               |
| --------------------------------- | --------------------------------------------- | ---------------------------------- |
| `/api/docs.json` 500              | zod v4 与 zod-to-openapi 不兼容               | 降 zod 到 3.23.x                   |
| `subscriber.on is not a function` | subscribe 返回值当实例用                      | 监听挂 `subRedis` 本身             |
| 登录报"缺少租户标识"              | 白名单漏了 auth 路径                          | 同步 auth / tenant-resolver 白名单 |
| 权限判断不一致                    | `permission.ts` 与 `rbac/service.ts` 两套逻辑 | 统一走 `service.ts`                |
| 定时任务多实例重复执行            | 无分布式锁                                    | `withLock` 包裹                    |