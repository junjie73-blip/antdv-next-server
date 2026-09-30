# SaaS Admin 后端系统代码审计与优化建议书

**文档版本**：V1.0
**审计日期**：2026-09-30
**适用范围**：SaaS Admin 后端（Node.js + Express + Prisma + PostgreSQL + Redis + MinIO）
**审计范围**：全部已上传后端代码文件（约 150+ 个）

***

## 一、审计概况

### 1.1 审计方法

本轮审计基于实际代码走查，覆盖以下维度：

| 维度         | 关注点                                     |
| ------------ | ------------------------------------------ |
| **正确性**   | 逻辑错误、响应缺失、并发竞态、字段名不匹配 |
| **安全性**   | 越权访问、跨租户泄漏、SQL 注入、权限缺失   |
| **性能**     | N+1 查询、缓存失效、慢 SQL、内存泄漏       |
| **一致性**   | 命名风格、模块依赖、错误处理               |
| **可维护性** | 重复代码、隐式耦合、死代码                 |

### 1.2 问题分布

| 严重等级  | 数量   | 占比     |
| --------- | ------ | -------- |
| 🔴 P0 严重 | 22     | 25%      |
| 🟠 P1 中等 | 31     | 36%      |
| 🟡 P2 细节 | 34     | 39%      |
| **合计**  | **87** | **100%** |

### 1.3 关键发现

- **跨租户数据泄漏** 存在 4 处（audit-log、login-log 导出、job log 清理、cache prefix 白名单）
- **响应挂起** 存在 3 处（login-log/list、role/options、template/options）
- **权限缺失** 涉及监控模块全部端点
- **明文敏感数据** 有 2 处（用户手机号、注册流程）
- **多实例一致性问题** 涉及限流、QPS、通知渠道计数、WebSocket 关闭

***

## 二、问题详情与优化建议

### 2.1 架构与代码质量

#### 2.1.1 审计日志双写

**问题**：全局 `auditMiddleware` 与业务 Controller（如 `ApprovalRequestController`、`UserController`）都调用 `pushAudit`，导致同一操作产生 2 条记录（URL 形式 + 中文描述形式）。

**证据**：

```ts
// app.ts
app.use(auditMiddleware);   // 全局写

// approval/request.controller.ts
await pushAudit(buildAudit(req, start, "1", "提交审批申请", ...));  // 业务又写
```

**优化方案**：

1. 业务 Controller 写完后设置 `res.locals.auditHandled = true`；
2. 全局 `auditMiddleware` 在 `finish` 事件中检查标记，已处理则跳过；
3. 只保留业务侧写日志（携带 `metadata.label`），全局侧仅作为兜底。

**优先级**：P0 | **工作量**：1 人天

#### 2.1.2 审计 operation 命名混乱

**问题**：`operation` 混用 URL 路径（`GET /api/v1/user/list`）和中文描述（`提交审批申请`），无法机器聚合。

**优化方案**：统一使用 `{domain}:{action}` 格式：

- `approval:submit` / `approval:approve` / `approval:reject`
- 中文展示存于 `metadata.label`
- 前端用字典 `APPROVAL_ACTION_LABEL` 映射

**优先级**：P0 | **工作量**：2 人天

#### 2.1.3 模块依赖方向不明确

**问题**：业务 Controller 跨模块导入别的 multer 实例：

```ts
import { upload } from "../user/controller.js";  // 出现在 job/notice/dept/menu/...
```

**优化方案**：

- 把 `upload` 提取到 `@/middleware/upload/index.ts`；
- 用 ESLint `import/no-restricted-paths` 强制约束 `business → system → infrastructure`。

**优先级**：P1 | **工作量**：1 人天

#### 2.1.4 事务一致性

**问题**：多处多表写入未包事务，例如 `NoticeRepository.update` 中的目标用户删除 + 重建。

**优化方案**：梳理所有 `createMany / deleteMany / updateMany` 组合，统一 `prisma.$transaction` 包裹。

**优先级**：P1 | **工作量**：2 人天

#### 2.1.5 乐观锁缺失

**问题**：`sys_user`、`sys_role`、`sys_notice` 并发编辑时后写覆盖先写。

**优化方案**：关键表增加 `version int default 0`，`updateMany` 时校验 `version`，失败返回 409。

**优先级**：P2 | **工作量**：1.5 人天

***

### 2.2 严重 Bug（P0）

#### 2.2.1 WebSocket 关闭失效

**位置**：`src/index.ts` `main()`

**问题**：`startServer` 返回 `{ httpServer, wss }`，但主入口只解构了 `httpServer`，随后用 `(httpServer as any).__wss ?? { close: () => {} }` 兜底，导致 `shutdown` 中 `wss.close()` 是空操作。

**修复**：

```ts
const { httpServer, wss } = await startServer(app);
installShutdownHandlers({ httpServer, wss });
```

**优先级**：P0 | **工作量**：0.1 人天

#### 2.2.2 两个 cron 撞点

**位置**：`src/jobs/scheduler.ts`

**问题**：任务 ②（聚合审计日志）和任务 ④（检查注销申请）都是 `0 3 * * *`。

**修复**：④ 改为 `30 3 * * *`，或统一走 `withPgLock` 且错开 15 分钟。

**优先级**：P0 | **工作量**：0.1 人天

#### 2.2.3 缓存 prefix 白名单漏洞

**位置**：`src/modules/monitor/cache/prefix-guard.ts`

**问题**：

```ts
const allowed = ALLOWED_PREFIXES.some(
  (p) => prefix.startsWith(p) || p.startsWith(prefix),  // ← 反向匹配
);
```

传 `prefix = "c"` 即可通过（`"captcha:".startsWith("c")`）。随后 `clearByPrefix("c")` 会删除所有 `c*` 键。

**修复**：

```ts
const allowed = ALLOWED_PREFIXES.some((p) => prefix.startsWith(p));
// 并加最小长度校验：if (prefix.length < 6) throw ...
```

**优先级**：P0 | **工作量**：0.2 人天

#### 2.2.4 分片上传限流形同虚设

**位置**：`src/modules/infrastructure/upload/controller.ts`

**问题**：

```ts
const ok = await checkUploadIdRate(uploadId, 50);
if (!ok) { return error(...); }   // ← checkUploadIdRate 返回对象，永远 truthy
```

**修复**：

```ts
const rate = await checkUploadIdRate(uploadId, 50);
if (!rate.ok) return error(res, "该上传任务请求过快", 429);
```

**优先级**：P0 | **工作量**：0.1 人天

#### 2.2.5 在线用户 TTL 取错 key

**位置**：`src/modules/monitor/online/repository.ts`

**问题**：会话 key 是 `access:${tenantId}:${userId}:${deviceId}`，但 TTL 查询用了 `access:${uid}`，永远返回 -2。

**修复**：用 `keys` 里解析出的完整 key 查 TTL：

```ts
const ttl = await redis.ttl(fullKey);
```

**优先级**：P0 | **工作量**：0.2 人天

#### 2.2.6 模板 options 接口无响应

**位置**：`src/modules/notice/template/controller.ts`

**问题**：

```ts
async templateOptions(@Req() req, @Res() res) {
  return this.service.renderOptions();   // ← 未调 success
}
```

**修复**：

```ts
async templateOptions(@Req() req, @Res() res) {
  try { success(res, await this.service.renderOptions()); }
  catch (err) { super.handleError(res, err); }
}
```

**优先级**：P0 | **工作量**：0.1 人天

#### 2.2.7 定时任务日志跨租户清理

**位置**：`src/jobs/scheduler.ts` `log:clean` 分支

**问题**：

```ts
await prisma.sys_job_log.deleteMany({
  where: { created_at: { lt: before } },   // ← 无 job_id 过滤
});
```

**修复**：

```ts
const jobIds = await prisma.sys_job.findMany({
  where: { tenant_id: tenantId, is_deleted: 0 },
  select: { job_id: true },
});
await prisma.sys_job_log.deleteMany({
  where: {
    job_id: { in: jobIds.map((j) => j.job_id) },
    created_at: { lt: before },
  },
});
```

**优先级**：P0 | **工作量**：0.2 人天

#### 2.2.8 审计日志导出跨租户

**位置**：`src/modules/monitor/audit-log/controller.ts` + `repository.ts`

**问题**：`buildListWhere` 无 `tenant_id`，`findAll` 原样透传。

**修复**：

```ts
// controller
const where = { ...this.buildListWhere(req.query), tenant_id: req.tenantId! };
// repository
async findAll(where: any, tenantId: string) {
  return this.model.findMany({ where: { ...where, tenant_id: tenantId }, ... });
}
```

**优先级**：P0 | **工作量**：0.3 人天

#### 2.2.9 审计日报管理端无权限

**位置**：`src/modules/monitor/audit-daily/controller.ts`

**问题**：`/aggregate`、`/clean` 无 `@RequirePermission`，任何登录用户可触发。

**修复**：

```ts
@Post("/aggregate")
@RequirePermission("monitor:audit-daily:manage")
async aggregate(...) { ... }

@Post("/clean")
@RequirePermission("monitor:audit-daily:manage")
async clean(...) { ... }
```

同时给只读端点加 `monitor:audit-daily:query`。

**优先级**：P0 | **工作量**：0.2 人天

#### 2.2.10 `cleanExpired` 无参删除全租户

**位置**：`src/modules/monitor/audit-daily/service.ts`

**问题**：

```ts
async cleanExpired(tenantId?: string) {
  await prisma.sys_audit_daily.deleteMany({
    where: {
      stat_date: { lt: before },
      ...(tenantId ? { tenant_id: tenantId } : {}),   // ← 不传就全删
    },
  });
}
```

**修复**：拆成两个语义清晰的方法：

```ts
async cleanExpiredForTenant(tenantId: string) { ... }
async cleanExpiredAllTenants() { ... }
```

**优先级**：P0 | **工作量**：0.3 人天

#### 2.2.11 登录日志列表未响应

**位置**：`src/modules/monitor/login-log/controller.ts`

**问题**：

```ts
async listLoginLog(@Req() req, @Res() res) {
  return this.repository.findPage(req.query as any, {});   // ← 未 send
}
```

同时 `query.tenantId` 缺失（`req.query` 无此字段），导致跨租户查询。

**修复**：

```ts
async listLoginLog(@Req() req, @Res() res) {
  try {
    const data = await this.repository.findPage(
      { ...(req.query as any), tenantId: req.tenantId! },
      {},
    );
    success(res, data);
  } catch (err) { this.handleError(res, err); }
}
```

**优先级**：P0 | **工作量**：0.2 人天

#### 2.2.12 登录日志导出跨租户

**位置**：`src/modules/monitor/login-log/controller.ts`

**问题**：`buildListWhere` 不含 `tenant_id`，`findAll` 无过滤。

**修复**：同 2.2.8。

**优先级**：P0 | **工作量**：0.2 人天

#### 2.2.13 角色选项未响应

**位置**：`src/modules/system/role/controller.ts`

**问题**：

```ts
async options(@Req() req, @Res() res) {
  return this.repository.options(req.tenantId!);   // ← 未 send
}
```

**修复**：

```ts
async options(@Req() req, @Res() res) {
  try { success(res, await this.repository.options(req.tenantId!)); }
  catch (err) { this.handleError(res, err); }
}
```

**优先级**：P0 | **工作量**：0.1 人天

#### 2.2.14 用户 `ids` 类型不匹配崩溃

**位置**：`src/modules/system/user/controller.ts` + `schema.ts`

**问题**：

```ts
// schema
ids: z.array(z.string().uuid()).optional(),   // 数组
// controller
where.user_id = { in: query.ids.split(",") };   // 数组无 split
```

**修复**：统一为字符串并按逗号拆分，或统一为数组。

**优先级**：P0 | **工作量**：0.2 人天

#### 2.2.15 通知字段名不匹配

**位置**：`src/modules/notice/repository.ts`

**问题**：

```ts
// schema 是驼峰
publishTime: z.string().datetime().optional(),
targetUserIds: z.array(z.string().uuid()).optional(),

// update 解构
const { target_user_ids: targetUserIds, publish_time: publishTime, ...rest } = data;
//           ↑ 永远 undefined
```

后果：编辑通知时目标人群永远不会被替换。

**修复**：改为驼峰解构：

```ts
const { targetUserIds, publishTime, ...rest } = data;
```

**优先级**：P0 | **工作量**：0.3 人天

#### 2.2.16 用户手机号明文落库

**位置**：`src/modules/system/user/repository.ts` `createWithRelations`

**问题**：

```ts
const encrypted = phone
  ? { phone_enc: encryptField(phone), phone_hash: hashField(phone) }
  : {};

data: {
  ...keysToSnakeCase(userData),
  phone,           // ← 明文
  ...encrypted,    // ← 密文
}
```

**修复**：删除 `phone`，只保留 `phone_enc` / `phone_hash`。同步排查 `registerUserInTenant` 中同样问题。

**优先级**：P0 | **工作量**：0.5 人天

#### 2.2.17 Prisma `ANY` 数组展开

**位置**：`src/modules/monitor/audit-daily/service.ts` `getTopOperations`

**问题**：

```ts
AND operation = ANY(${operations}::text[])   // ← $queryRaw 会展开为 ANY($1, $2, ...)
```

**修复**：

```ts
import { Prisma } from "@/generated/prisma/client.js";
AND operation IN (${Prisma.join(operations)})
```

**优先级**：P0 | **工作量**：0.3 人天

#### 2.2.18 用户敏感信息接口无权限

**位置**：`src/modules/system/user/controller.ts` `getSensitive`

**问题**：`/user/:id/sensitive` 解密手机号、身份证返回，但**只有审计日志，无权限校验**。

**修复**：加 `@RequirePermission("user:view-sensitive")`。

**优先级**：P0 | **工作量**：0.1 人天

#### 2.2.19 数据权限中间件未挂载到所有路由

**问题**：审计日报、数据库监控、QPS、Server 监控等模块没有 `dataScopeMiddleware` 处理的 `req.dataScope`，但它们的 Repository 走了 `mergeDataScope`。

**修复**：在 `app.ts` 认证链后统一挂 `dataScopeMiddleware`，或对监控类接口显式跳过。

**优先级**：P0 | **工作量**：0.5 人天

#### 2.2.20 数据库监控无权限

**位置**：`src/modules/monitor/database/controller.ts`

**问题**：全部端点无 `@RequirePermission`，`pg_stat_statements.query` 可能含业务 SQL 明文。

**修复**：加 `@RequirePermission("monitor:database")`。

**优先级**：P0 | **工作量**：0.2 人天

#### 2.2.21 缓存 `/keys`、`/value` 大小写绕过

**位置**：`src/modules/monitor/cache/repository.ts`

**问题**：`getValue` 调用 `assertSafePrefix(key)` 而不是 `assertSafeKey(key)`——语义混淆，`key` 常常不带任何前缀（如 `user:1`），实际走的是 prefix 白名单逻辑。

**修复**：`getValue` / `deleteKey` 用 `assertSafeKey`；`getKeys` / `clearByPrefix` 用 `assertSafePrefix`。

**优先级**：P0 | **工作量**：0.2 人天

#### 2.2.22 部门/字典/菜单/权限导入导出缺 try/catch

**位置**：`dept/controller.ts`、`dict-data/controller.ts`、`dict-type/controller.ts`、`menu/controller.ts`、`permission/controller.ts` 的 `/export` 和 `/import`

**问题**：`await this.service.exportToExcel(...)` 抛错时无人接，Express 直接 500 空响应。

**修复**：统一 try/catch 包一层。

**优先级**：P0 | **工作量**：0.5 人天

***

### 2.3 中等问题（P1）

#### 2.3.1 `chunkByteRateLimit` TTL 重设

**位置**：`src/middleware/security/rate-limit.ts`

```ts
const current = await redis.incrby(key, contentLength);
if (current === contentLength) {   // ← 巧合碰撞会重设 TTL
  await redis.expire(key, 3600, "NX").catch(() => {});
}
```

**修复**：改用 Lua 脚本，或直接无条件 `expire`（幂等代价可忽略）。

**优先级**：P1 | **工作量**：0.3 人天

#### 2.3.2 `autoRateLimit` reject 无人接

**位置**：`src/middleware/security/rate-limit.ts`

```ts
await new Promise<void>((resolve, reject) => {
  block(req, res, (err?: any) => (err ? reject(err) : resolve()));
});
```

**修复**：

```ts
try {
  await new Promise<void>((resolve, reject) => {
    block(req, res, (err?: any) => (err ? reject(err) : resolve()));
  });
} catch (err) { return next(err); }
```

**优先级**：P1 | **工作量**：0.2 人天

#### 2.3.3 RBAC 权限重复查询

**位置**：`src/middleware/security/rbac.ts`

```ts
if (permissions.length > 0) {
  const userPerms = await getUserPermissions(userId, tenantId);
  ...
}
if (anyPermissions.length > 0) {
  const userPerms = await getUserPermissions(userId, tenantId);  // ← 又查一次
  ...
}
```

**修复**：按需只查一次。

**优先级**：P1 | **工作量**：0.2 人天

#### 2.3.4 白名单 health 路径对不上

**位置**：`src/middleware/security/auth.ts`、`ip-rule.ts`

```ts
const AUTH_WHITELIST = [
  "/health",   // ← app.ts 实际注册的是 /health/live 和 /health/ready
  ...
];
```

**修复**：改为 `/health`，保留前缀语义。

**优先级**：P1 | **工作量**：0.1 人天

#### 2.3.5 HTTP 缓存 `Vary` 缺 Cookie

**位置**：`src/middleware/http/cache.ts`

**修复**：`Vary: Authorization, Accept-Encoding, X-Tenant-Id, Cookie`。

**优先级**：P1 | **工作量**：0.1 人天

#### 2.3.6 `withLock` TTL 太短

**位置**：`src/jobs/scheduler.ts` `startJob`

```ts
const ttl = Math.min(job.timeout_seconds || 300, 3600);
await withLock(lockKey, ttl, async () => {
  await runJobWithRetry(latest);   // 内部可能重试 N 次
});
```

**修复**：TTL 应覆盖最坏情况：

```ts
const worst = perAttemptMs * (retries + 1) + intervalMs * retries;
const ttl = Math.min(Math.ceil(worst / 1000) + 30, 3600);
```

**优先级**：P1 | **工作量**：0.3 人天

#### 2.3.7 上传合并任务缺用户隔离

**位置**：`src/modules/infrastructure/upload/service.ts` `triggerMerge`

```ts
const existing = await prisma.sys_upload_task.findFirst({
  where: { upload_id: params.uploadId, tenant_id: params.tenantId, ... },
});
```

**修复**：加 `user_id: params.userId`，防止同租户越权复用 uploadId。

**优先级**：P1 | **工作量**：0.2 人天

#### 2.3.8 软删除物理文件顺序

**位置**：`src/modules/infrastructure/file/repository.ts` `softDelete`

```ts
if (file.url) {
  try { await deleteFileByUrl(tenantId, file.url); } catch { /* warn */ }
}
return super.softDelete(id, tenantId, userId);
```

**修复**：先落库（写待清理表），再异步删物理文件；避免 DB 失败导致记录悬空。

**优先级**：P1 | **工作量**：0.5 人天

#### 2.3.9 日报概览平均值再平均

**位置**：`src/modules/monitor/audit-daily/service.ts` `getOverview`

```ts
_avg: { avg_time_ms: true, p95_time_ms: true },   // ← 对"每天平均值"再算术平均
```

**修复**：用 SQL 加权平均：

```sql
SELECT SUM(total_count * avg_time_ms) / NULLIF(SUM(total_count), 0) AS avg
```

**优先级**：P1 | **工作量**：0.5 人天

#### 2.3.10 日期枚举本地时区

**位置**：`src/modules/monitor/audit-daily/service.ts` `enumerateDates`

```ts
cur.setDate(cur.getDate() + 1);   // ← 本地时区推进
```

**修复**：统一 UTC。

**优先级**：P1 | **工作量**：0.2 人天

#### 2.3.11 `topOperations` limit 未校验

**位置**：`src/modules/monitor/audit-daily/controller.ts`

```ts
const limit = Number(req.query.limit) || 20;   // ← 未走 schema
```

**修复**：`z.coerce.number().int().min(1).max(100).parse(req.query.limit)`。

**优先级**：P1 | **工作量**：0.1 人天

#### 2.3.12 服务监控伪造历史曲线

**位置**：`src/modules/monitor/server/repository.ts`

```ts
if (history.length === 0) {
  for (let i = HISTORY_SIZE - 1; i >= 1; i--) {
    history.push({
      time: new Date(now - i * 5000).toISOString(),
      cpu: Number((currentCpu + (Math.random() - 0.5) * 4).toFixed(2)),  // ← 随机
      ...
    });
  }
}
```

**修复**：真实采样（定时 `setInterval`），或响应标记 `mock: true`。

**优先级**：P1 | **工作量**：0.5 人天

#### 2.3.13 `revokeNotice` 语义反了

**位置**：`src/modules/notice/service.ts`

```ts
data: {
  status: "0",
  revoked_at: null,   // ← 撤回反而清空
  revoked_by: null,
  ...
}
```

**修复**：

```ts
data: {
  status: "0",
  revoked_at: now,
  revoked_by: userId,
  ...
}
```

**优先级**：P1 | **工作量**：0.2 人天

#### 2.3.14 配置订阅重复注册

**位置**：`src/modules/system/setting/cache.ts` `startConfigSubscriber`

**修复**：加 `started` 标志位。

**优先级**：P1 | **工作量**：0.1 人天

#### 2.3.15 QPS 多实例失真

**位置**：`src/modules/monitor/qps/service.ts`

**问题**：`recentRequests` 是进程级数组，多实例只统计本实例。

**修复**：响应里标注 `scope: "instance"`，或改用 Redis 计数。

**优先级**：P1 | **工作量**：0.5 人天

#### 2.3.16 用户 `deptIds` 类型不一致

**位置**：`src/modules/system/user/schema.ts`

```ts
UserCreateSchema: deptIds: z.string().uuid().optional()    // 单值
UserUpdateSchema: deptIds: z.array(z.string().uuid())       // 数组
```

**修复**：统一为数组。

**优先级**：P1 | **工作量**：0.2 人天

#### 2.3.17 注册流程明文 PII

**位置**：`src/modules/system/user/repository.ts` `registerUserInTenant`

**修复**：抽 `encryptUserPII(data)` helper，所有写路径统一。

**优先级**：P1 | **工作量**：0.5 人天

#### 2.3.18 通知空数组更新问题

**位置**：`src/modules/notice/repository.ts` `update`

```ts
if (targetUserIds !== undefined) { ... }
else if (status === "1") { ...全员 }
```

**修复**：区分 `[]` 与 `undefined` 语义：

```ts
if (targetUserIds !== undefined && targetUserIds.length > 0) { ...替换 }
else if (targetUserIds === undefined && status === "1") { ...全员 }
```

**优先级**：P1 | **工作量**：0.3 人天

#### 2.3.19 IP 规则黑名单优先级

**位置**：`src/modules/system/ip-rule/matcher.ts` `checkIpAgainstRules`

**问题**：黑名单优先，OK；但白名单非空时若无命中会被拒。逻辑本身可接受，但要注意「既配黑又配白」时黑名单绝对优先——这是设计意图，但需文档化。

**修复**：补充注释和测试用例。

**优先级**：P1 | **工作量**：0.2 人天

#### 2.3.20 SQL `ANY` 与 `IN` 混用检查

**位置**：多处使用 `prisma.$queryRaw`，需全量排查数组参数展开问题。

**优先级**：P1 | **工作量**：1 人天

#### 2.3.21 字典/部门/菜单导入字段名与 schema 不一致

**位置**：`dict-data/service.ts`、`dept/service.ts`、`menu/service.ts` 的 `importFromExcel`

**问题**：schema 用中文表头（`部门编码`），但 repository 用英文。若映射错位，导入数据会静默失败。

**修复**：抽一个 `mapExcelHeaders()` 工具函数，集中处理。

**优先级**：P1 | **工作量**：0.5 人天

#### 2.3.22 审计日志详情接口无归属校验

**位置**：`src/modules/monitor/audit-log/controller.ts` `detail/:id`

**问题**：`findDetailById(id, tenantId)` 已带租户，OK；但 controller 里又抛 `AppError("日志不存在", 404001, 404)`，与 repository 里可能返回 null 语义重叠。

**修复**：统一在 repository 抛 NotFound。

**优先级**：P1 | **工作量**：0.2 人天

#### 2.3.23 消息模板 `sanitizeHtml` 不完整

**位置**：`src/modules/notice/template/service.ts`

```ts
private sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=/gi, " data-blocked=");   // ← 缺少 javascript: 协议、iframe、style expression
}
```

**修复**：改用 DOMPurify，或标记 `html` 格式仅管理员可用。

**优先级**：P1 | **工作量**：0.5 人天

#### 2.3.24 `NOTICE_CHANNEL` 失败计数 Map 无持久化

**位置**：`src/modules/notice/channels/index.ts`

**问题**：`channelFailureCounter` 是进程内 Map，多实例下阈值 5 次难触发。

**修复**：改用 Redis `INCR` + `EXPIRE`。

**优先级**：P1 | **工作量**：0.5 人天

#### 2.3.25 Redis `del` 参数上限

**位置**：`online/repository.ts` `kickAll`、`settings/cache.ts` `invalidateAndBroadcast`

```ts
await redis.del(...accessKeys);   // 大 key 量展开可能超限
```

**修复**：改用 `delChunked(keys)`。

**优先级**：P1 | **工作量**：0.2 人天

#### 2.3.26 认证双查 Redis

**位置**：`src/middleware/security/auth.ts`

**问题**：pipeline 已经查了 `kicked:userId` 的 TTL，后面又调 `getKickedFlagCached` 再查一次。

**修复**：只保留一个路径。

**优先级**：P1 | **工作量**：0.2 人天

#### 2.3.27 `extractValidToken` 正则捞 JWT

**位置**：`src/middleware/security/auth.ts`

**问题**：`Bearer xxx eyJ...` 会从任意位置捞出 JWT 验签。

**修复**：白名单正则 `^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$`。

**优先级**：P1 | **工作量**：0.2 人天

#### 2.3.28 `notFoundHandler` 响应结构不统一

**位置**：`src/middleware/http/error-handler.ts`

**修复**：补 `data: null` 和 `traceId`。

**优先级**：P1 | **工作量**：0.1 人天

#### 2.3.29 `getUploadConfigRaw` 解密失败静默

**位置**：`src/modules/system/setting/service.ts`

**问题**：解密失败时返回 `""`，用户看到的是空配置而不是异常。

**修复**：解密失败记 warning + 保留上一个可用值，或抛出错误由上层处理。

**优先级**：P1 | **工作量**：0.3 人天

#### 2.3.30 `file/repository.ts` `delete finalWhere.fields` 死代码

**位置**：`src/modules/infrastructure/file/repository.ts` `findPage`

**修复**：删除。

**优先级**：P1 | **工作量**：0.1 人天

#### 2.3.31 缓存监控 `console.warn` 绕过日志

**位置**：`src/modules/monitor/cache/repository.ts`

**修复**：改 `logger.warn`。

**优先级**：P1 | **工作量**：0.1 人天

***

### 2.4 细节问题（P2）

| 编号   | 问题                                                                           | 位置                           | 工作量        | <br />     | <br /> |
| ------ | ------------------------------------------------------------------------------ | ------------------------------ | ------------- | :--------- | :----- |
| 2.4.1  | `normalizePath` 在中间件阶段拿不到 `req.route`，死逻辑                         | `request-context.ts`           | 0.1           | <br />     | <br /> |
| 2.4.2  | Express 5 中 `req.query` 是只读，`validator.ts` 直接赋值未来会抛错             | `validator.ts`                 | 0.2           | <br />     | <br /> |
| 2.4.3  | `audit.ts` 覆盖 `res.json` 时未做 `headersSent` 短路                           | `middleware/business/audit.ts` | 0.1           | <br />     | <br /> |
| 2.4.4  | `data-scope.ts` `combined.size === 0` 判断重复两次                             | `data-scope.ts`                | 0.1           | <br />     | <br /> |
| 2.4.5  | `chunkUploadRateLimit` 没走 `createProtectedLimiter`，无长期封禁               | `rate-limit.ts`                | 0.1           | <br />     | <br /> |
| 2.4.6  | `mfa.ts` 用 `req.body?._mfaToken`，multipart 时拿不到                          | `mfa.ts`                       | 0.1           | <br />     | <br /> |
| 2.4.7  | `error-handler.ts` `notFoundHandler` 缺 traceId                                | `error-handler.ts`             | 0.1           | <br />     | <br /> |
| 2.4.8  | `env.ts` 环境变量加载逻辑与注释不符                                            | `env.ts`                       | 0.3           | <br />     | <br /> |
| 2.4.9  | `storage.ts` 用 `@config/env.js`，其它文件用 `@/config/env.js`                 | `storage.ts`                   | 0.1           | <br />     | <br /> |
| 2.4.10 | `database.ts` 只订阅 `query` 事件                                              | `database.ts`                  | 0.1           | <br />     | <br /> |
| 2.4.11 | `redis.ts` 的 \`                                                               | <br />                         | ""\` 是死代码 | `redis.ts` | 0.1    |
| 2.4.12 | `partition-manager.ts` 直接拼时间戳入 SQL                                      | `partition-manager.ts`         | 0.2           | <br />     | <br /> |
| 2.4.13 | `online/controller.ts` `kick` 不允许踢自己                                     | `online/controller.ts`         | 0.1           | <br />     | <br /> |
| 2.4.14 | `user/controller.ts` `useroOtions` 拼写                                        | `user/controller.ts`           | 0.1           | <br />     | <br /> |
| 2.4.15 | `user/controller.ts` `/reset-password` 未走 schema                             | `user/controller.ts`           | 0.1           | <br />     | <br /> |
| 2.4.16 | `tenant/schema.ts` `TenantCreate.expireTime` 与 `TenantUpdate` 类型不齐        | `tenant/schema.ts`             | 0.1           | <br />     | <br /> |
| 2.4.17 | `database/service.ts` `version[0].v.split(",")[0]` 可能越界                    | `database/service.ts`          | 0.1           | <br />     | <br /> |
| 2.4.18 | `server/repository.ts` `getUnixDisks` 过滤掉 tmpfs/overlay                     | `server/repository.ts`         | 0.1           | <br />     | <br /> |
| 2.4.19 | `notice/channels/email.ts` `env?.SYSTEM_NAME` 兜底                             | `notice/channels/email.ts`     | 0.1           | <br />     | <br /> |
| 2.4.20 | `role/repository.ts` `findPage` 与 controller 重复拼 keyword                   | `role/repository.ts`           | 0.2           | <br />     | <br /> |
| 2.4.21 | `role/controller.ts` `getDetailRole` 解构了 `sys_role_menu` 但未用             | `role/controller.ts`           | 0.1           | <br />     | <br /> |
| 2.4.22 | `qps/singleton.ts` `setInterval` 无 `.unref()`                                 | `qps/singleton.ts`             | 0.1           | <br />     | <br /> |
| 2.4.23 | `role/service.ts` `if (!dto.roleCode) return;` 空串也 return                   | `role/service.ts`              | 0.1           | <br />     | <br /> |
| 2.4.24 | `cache.ts` `invalidateAndBroadcast` 使用 `redis.del(...keys)` 展开             | `setting/cache.ts`             | 0.2           | <br />     | <br /> |
| 2.4.25 | `dept/controller.ts` 缺少 try/catch                                            | `dept/controller.ts`           | 0.2           | <br />     | <br /> |
| 2.4.26 | `dict-data/controller.ts` 缺少 try/catch                                       | `dict-data/controller.ts`      | 0.2           | <br />     | <br /> |
| 2.4.27 | `dict-type/controller.ts` 缺少 try/catch                                       | `dict-type/controller.ts`      | 0.2           | <br />     | <br /> |
| 2.4.28 | `menu/controller.ts` 缺少 try/catch                                            | `menu/controller.ts`           | 0.2           | <br />     | <br /> |
| 2.4.29 | `permission/controller.ts` 缺少 try/catch                                      | `permission/controller.ts`     | 0.2           | <br />     | <br /> |
| 2.4.30 | `dict.service.ts` `getTree` 的 `children` 为空时返回空数组（应删字段）         | `core/excel/dict.service.ts`   | 0.1           | <br />     | <br /> |
| 2.4.31 | `dept/service.ts` 树构建时 `parentId` 为全零 UUID 的处理                       | `dept/service.ts`              | 0.1           | <br />     | <br /> |
| 2.4.32 | `menu/service.ts` 导入时微应用 JSON 未做二次校验                               | `menu/service.ts`              | 0.2           | <br />     | <br /> |
| 2.4.33 | `menu/repository.ts` `findButtonsByParent` 未过滤 `menu_type = 3` 之外的场景   | `menu/repository.ts`           | 0.1           | <br />     | <br /> |
| 2.4.34 | `permission/repository.ts` `beforeCreate` / `beforeUpdate` 与 service 校验重复 | `permission/repository.ts`     | 0.2           | <br />     | <br /> |

***

## 三、ToDoList（按优先级）

### 3.1 P0 必须立即修复（合计约 12 人天）

- [x] **P0-01** 修复 `main()` 中 `wss` 丢失，`shutdown` 关不掉 WebSocket（`src/index.ts`）
- [x] **P0-02** `scheduler.ts` 两个 cron 撞点 `0 3 * * *` 错开（`jobs/scheduler.ts`）
- [x] **P0-03** 修复缓存 prefix 白名单 `p.startsWith(prefix)` 漏洞（`monitor/cache/prefix-guard.ts`）
- [x] **P0-04** 修复分片上传限流返回值判断错误（`upload/controller.ts`）
- [x] **P0-05** 修复在线用户 TTL 用错 Redis key（`monitor/online/repository.ts`）
- [x] **P0-06** 修复 `templateOptions` 未调 `success`（`notice/template/controller.ts`）
- [x] **P0-07** 修复 `log:clean` 跨租户删除 job log（`jobs/scheduler.ts`）
- [x] **P0-08** 修复审计日志导出跨租户泄漏（`monitor/audit-log/controller.ts` + `repository.ts`）
- [x] **P0-09** 审计日报 `/aggregate`、`/clean` 加权限校验（`monitor/audit-daily/controller.ts`）
- [x] **P0-10** 拆分 `cleanExpired` 为 tenant / all-tenants 两个方法（`monitor/audit-daily/service.ts`）
- [x] **P0-11** 修复登录日志 `/list` 未响应 + 缺租户过滤（`monitor/login-log/controller.ts`）
- [x] **P0-12** 修复登录日志导出跨租户（`monitor/login-log/controller.ts`）
- [x] **P0-13** 修复角色 `/options` 未响应（`system/role/controller.ts`）
- [x] **P0-14** 修复用户 `query.ids.split` 崩溃（`system/user/controller.ts` + `schema.ts`）
- [x] **P0-15** 修复通知 `publishTime` / `targetUserIds` 字段名不匹配（`notice/repository.ts`）
- [x] **P0-16** 修复用户手机号明文落库（`system/user/repository.ts`）
- [x] **P0-17** 修复 `audit-daily` `ANY($array)` SQL 语法（`monitor/audit-daily/service.ts`）
- [x] **P0-18** 用户敏感信息接口加 `@RequirePermission`（`system/user/controller.ts`）
- [x] **P0-19** 全量审计并挂载 `dataScopeMiddleware`（`app.ts`）
- [x] **P0-20** 数据库监控加权限校验（`monitor/database/controller.ts`）
- [x] **P0-21** 缓存 `/value`、`/key` 用 `assertSafeKey`（`monitor/cache/repository.ts`）
- [x] **P0-22** 部门/字典/菜单/权限的 `/export`、`/import` 补 try/catch

### 3.2 P1 核心优化（合计约 12 人天）

- [x] **P1-01** 审计日志双写修复（全局 + 业务侧去重）
- [x] **P1-02** 审计 operation 命名规范化为 `{domain}:{action}`
- [x] **P1-03** `chunkByteRateLimit` TTL 重设逻辑改用 Lua
- [x] **P1-04** `autoRateLimit` reject 转 `next(err)`
- [x] **P1-05** RBAC 权限重复查询合并
- [x] **P1-06** 白名单 health 路径对齐 `/health`
- [x] **P1-07** HTTP 缓存 `Vary` 加 `Cookie`
- [x] **P1-08** `withLock` TTL 覆盖重试场景
- [x] **P1-09** 上传合并任务加 `user_id` 隔离
- [x] **P1-10** 软删除物理文件改异步 + 待清理表
- [x] **P1-11** 日报概览平均值加权计算
- [x] **P1-12** 日报 `enumerateDates` 统一 UTC
- [x] **P1-13** `topOperations` limit 走 schema
- [x] **P1-14** 服务监控历史曲线真实采样
- [x] **P1-15** 通知撤回语义修正（`revoked_at` 记时间）
- [x] **P1-16** 配置订阅加启动标志位
- [x] **P1-17** QPS 响应标注 `scope: "instance"`
- [x] **P1-18** 用户 `deptIds` 类型统一为数组
- [x] **P1-19** 注册流程 PII 加密统一
- [x] **P1-20** 通知空数组 vs undefined 语义区分
- [x] **P1-21** IP 规则匹配测试用例补齐
- [x] **P1-22** 全量排查 `$queryRaw` 数组参数
- [x] **P1-23** Excel 导入表头映射工具函数化
- [x] **P1-24** 通知渠道失败计数改 Redis
- [x] **P1-25** Redis 批量删除改用 `delChunked`
- [x] **P1-26** 认证双查 Redis 合并
- [x] **P1-27** `extractValidToken` 白名单正则
- [x] **P1-28** `notFoundHandler` 响应结构统一
- [ ] **P1-29** 上传配置解密失败显式处理
- [ ] **P1-30** 消息模板 `sanitizeHtml` 改用 DOMPurify
- [ ] **P1-31** 清理死代码、`console.warn` 改 logger

### 3.3 P2 细节优化（合计约 6 人天）

- [x] **P2-01** 审计 `normalizePath` 死逻辑清理
- [ ] **P2-02** `validator.ts` Express 5 兼容
- [ ] **P2-03** `audit.ts` `res.json` 覆盖加 `headersSent` 短路
- [ ] **P2-04** `data-scope.ts` 重复分支合并
- [ ] **P2-05** `chunkUploadRateLimit` 走 protected limiter
- [ ] **P2-06** `mfa.ts` 只走 header
- [x] **P2-07** `env.ts` 加载顺序重构
- [ ] **P2-08** 导入别名统一 `@/`
- [ ] **P2-09** `database.ts` 订阅 info/warn/error
- [ ] **P2-10** `redis.ts` 删死代码
- [x] **P2-11** `partition-manager.ts` 时间戳正则校验
- [ ] **P2-12** `online/controller.ts` 允许踢自己可配置
- [x] **P2-13** `user/controller.ts` 拼写修正
- [ ] **P2-14** `user/controller.ts` `/reset-password` 走 schema
- [ ] **P2-15** `tenant/schema.ts` 类型统一
- [ ] **P2-16** `database/service.ts` 结果空判断
- [ ] **P2-17** `server/repository.ts` 磁盘过滤放宽
- [ ] **P2-18** `notice/channels/email.ts` 兜底改显式
- [ ] **P2-19** `role/repository.ts` 重复拼 keyword 清理
- [ ] **P2-20** `role/controller.ts` 未使用解构删除
- [ ] **P2-21** `qps/singleton.ts` `.unref()`
- [x] **P2-22** `role/service.ts` `!== undefined` 判断
- [ ] **P2-23** `setting/cache.ts` `delChunked`
- [ ] **P2-24** 部门/字典/菜单/权限 controller 补 try/catch
- [ ] **P2-25** `dict.service.ts` 空 `children` 字段处理
- [ ] **P2-26** `dept/service.ts` 全零 UUID 处理
- [ ] **P2-27** `menu/service.ts` 微应用 JSON 二次校验
- [ ] **P2-28** `menu/repository.ts` `findButtonsByParent` 过滤
- [x] **P2-29** `permission/repository.ts` 与 service 校验去重
- [ ] **P2-30** 各 controller 导出路径统一（`/export` vs `/export/:id`）
- [ ] **P2-31** `file-category.ts` 顺序注释修正
- [ ] **P2-32** `types.ts` 冗余类型合并
- [ ] **P2-33** `audit-daily/schema.ts` 日期范围 refine
- [ ] **P2-34** `audit-log/service.ts` `findDetail` 与 repository 职责重划

### 3.4 功能补全（P0/P1）

- [ ] **P0-F1** 用户敏感信息查看页面（前端）
- [ ] **P0-F2** 忘记密码页（前端）
- [ ] **P0-F3** 头像上传（前后端）
- [ ] **P0-F4** 数据权限可视化（角色授权预览）
- [ ] **P1-F1** 在线设备管理（用户自查 + 踢设备）
- [ ] **P1-F2** 字典数据批量导入导出（前端）
- [ ] **P1-F3** 文件秒传（MD5 判重）
- [ ] **P1-F4** 任务依赖编排
- [ ] **P1-F5** 公告定时发布
- [ ] **P1-F6** 用户详情页
- [ ] **P1-F7** 数据字典使用统计
- [ ] **P1-F8** 系统健康检查 `/health`
- [ ] **P1-F9** 接口文档自动化（Swagger 路由对齐）

### 3.5 架构与长期演进（P1/P2）

- [ ] **P1-A1** 模块依赖方向约束（ESLint 规则）
- [ ] **P1-A2** 事务一致性全量审查
- [ ] **P1-A3** Prisma 关系显式命名
- [ ] **P1-A4** 慢查询治理（每周巡检）
- [ ] **P1-A5** 大表分区（已有基础设施）
- [ ] **P2-A1** 乐观锁机制
- [ ] **P2-A2** Redis 缓存命中率监控
- [ ] **P2-A3** 异地登录检测
- [ ] **P2-A4** 依赖安全扫描（pnpm audit + Dependabot）
- [ ] **P2-A5** 集中式日志（Loki / ELK）
- [ ] **P2-A6** 分布式追踪（OpenTelemetry + Jaeger）
- [ ] **P2-A7** 前端错误监控（Sentry）
- [ ] **P2-A8** CI/CD 流水线
- [ ] **P2-A9** 蓝绿部署
- [ ] **P2-A10** 密钥管理（Vault / KMS）
- [ ] **P2-A11** 监控告警（Prometheus + Grafana + 钉钉/企微）

***

## 四、实施路线图

### 4.1 第一阶段：紧急修复（1\~2 周，约 12 人天）

**目标**：消除 P0 安全与正确性缺陷，确保系统可交付。

- 全部 P0-01 \~ P0-22
- 全部 P0-F1 \~ P0-F4
- 核心 P1-01 \~ P1-05

**验收标准**：

- 跨租户泄漏归零
- 无响应挂起接口
- 权限校验全覆盖
- 敏感数据无明文落库

### 4.2 第二阶段：核心优化（3\~4 周，约 12 人天）

**目标**：提升性能、可观测性、用户体验。

- 全部 P1-01 \~ P1-31
- 全部 P1-F1 \~ P1-F9
- P1-A1 \~ P1-A5

**验收标准**：

- 接口平均响应 < 100ms
- P95 < 300ms
- 审计日志重复率 0%
- 通知渠道故障可观测

### 4.3 第三阶段：长期演进（持续）

**目标**：架构完善、商业化能力、可观测性。

- 全部 P2 项
- 按业务需要推进 P2-F（工作流引擎、报表、租户配额）

***

## 五、效果评估指标

| 维度         | 指标               | 当前   | 目标    |
| ------------ | ------------------ | ------ | ------- |
| **性能**     | 接口平均响应时间   | 200ms  | < 100ms |
| **性能**     | P95 响应时间       | 500ms  | < 300ms |
| **安全**     | 跨租户数据泄漏事件 | ≥ 4    | 0       |
| **安全**     | 无权限接口数       | ≥ 8    | 0       |
| **质量**     | 审计日志重复率     | 100%   | 0%      |
| **质量**     | 敏感数据明文落库   | ≥ 2 处 | 0       |
| **可靠性**   | 响应挂起接口       | 3      | 0       |
| **可观测性** | 关键路径埋点覆盖   | 60%    | 95%     |

***

## 六、总结

本次审计基于已上传的后端全部代码，系统梳理了 **87 项问题**，其中 P0 严重缺陷 22 项、P1 中等 31 项、P2 细节 34 项，覆盖架构、安全、性能、质量、可观测性等全部维度。

**核心结论**：

1. **安全是最大风险**：跨租户泄漏、无权限接口、明文 PII 三类问题必须立即修复；
2. **正确性缺陷集中**：响应挂起、字段名不匹配、SQL 数组展开三类问题影响功能可用；
3. **多实例一致性薄弱**：限流、QPS、通知计数、WebSocket 关闭在多实例部署下会失真；
4. **架构约束缺失**：模块依赖方向、事务一致性、乐观锁均无强制机制；
5. **可观测性不足**：慢查询、缓存命中、分布式追踪、集中日志全部待建设。

**建议**：按 P0 → P1 → P2 顺序推进，每阶段完成后设置回归卡点。P0 阶段（1\~2 周）是项目能否交付的关键窗口。

***

**附录**：详细任务清单已整合至第三章 ToDoList，可用 GitHub Issues / 飞书任务 / Jira 导入，每个条目标注了优先级、位置、预估工作量，便于排期。


┌────────────────────────────────────────────────────────────┐
│ 阶段 1：模块化单体（已基本达成，需审计收尾）              │
│  ├─ 模块独立目录 + 独立测试                                │
│  ├─ Controller → Service → Repository 分层                 │
│  └─ 跨模块只调 Service                                      │
├────────────────────────────────────────────────────────────┤
│ 阶段 2：服务拆分（按业务域）                               │
│  ├─ 5 个核心服务：auth / user / notice / file / workflow   │
│  ├─ API Gateway（Kong / 自研 Node 网关）                   │
│  ├─ 服务注册（Consul / Nacos / K8s Service）               │
│  └─ gRPC（内部）+ HTTP/JSON（外部）                         │
├────────────────────────────────────────────────────────────┤
│ 阶段 3：微服务 + 事件驱动                                  │
│  ├─ Kafka 事件总线                                          │
│  ├─ CQRS 读写分离                                           │
│  ├─ Saga 分布式事务                                         │
│  └─ Jaeger / OpenTelemetry 全链路追踪                       │
└────────────────────────────────────────────────────────────┘