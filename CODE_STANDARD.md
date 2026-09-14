# SaaS Admin Server - 代码规范

## 1. 命名规范

### 1.1 数据库
- **表名**：小写下划线，前缀 `sys_`（如 `sys_user`）
- **字段**：小写下划线（如 `user_id` / `created_at` / `is_deleted`）
- **主键**：UUID，`xxx_id`（如 `user_id` / `role_id`）
- **关联表**：`sys_主表_从表`（如 `sys_user_role`）
- **关联表唯一键**：`@@unique([a_id, b_id])`（**不含 tenant_id**）

### 1.2 代码
- 变量 / 函数：小驼峰（`userId` / `getUserList`）
- 类名：大驼峰（`UserService` / `BaseRepository`）
- 常量：大写下划线（`SOFT_DELETE_FLAG`）
- 接口：大驼峰 + `I` 前缀（`IBaseRepository`）
- 类型别名：大驼峰（`TokenPayload`）
- 文件：小写中划线 / 小驼峰（`base-repository.ts` / `dictData.ts`）

### 1.3 API
- 请求体 / 响应：小驼峰
- 路由：小写中划线（`/api/v1/dict-type`）

---

## 2. 架构分层

```
Controller → Service/Repository → Prisma → PostgreSQL
```

### 2.1 Controller

- 继承 `BaseController` 或直接用装饰器 `@Controller`
- 参数校验用 Zod（`@Validate` 或 `Schema.parse`）
- **不写业务逻辑**，只做参数处理 + 调用 Service
- 统一 `success(res, data, msg)` / `pageSuccess(...)` 返回

### 2.2 Repository

- 继承 `BaseRepository`
- 覆写钩子：`findPage` 或调用 `this.paginate()`
- **手写 `findPage` 必须**调用 `this.mergeDataScope(finalWhere)`
- 关联表写入前必须 `assertOwnership`（ID 归属校验）
- 所有 `createMany` 加 `skipDuplicates: true`

### 2.3 Service

- 无状态、纯函数优先
- 复杂事务放 Service
- 跨模块调用放 Service

---

## 3. 编码规范

### 3.1 类型安全

- **禁止 `any`**，用 `unknown` + 类型守卫
- 需要忽略类型时用 `// @ts-expect-error`（注释原因），**不用 `@ts-ignore`**
- Prisma 关系名必须和 `schema.prisma` 一致（**注意 `sys_user_role.role` 不是 `sys_role`**）

### 3.2 错误处理

统一 `@/core/errors.js`：

```ts
throw new AppError("消息", 400001, 400);
throw new ValidationError("参数错误");       // 400
throw new AuthenticationError("未登录");     // 401
throw new AuthorizationError("无权限");      // 403
throw new NotFoundError("不存在");           // 404
throw new ConflictError("冲突");             // 409
throw new RateLimitError("限流");            // 429
```

**禁止** 在 `middleware/error-handler.ts` 里再定义 `AppError`。

### 3.3 函数

- 单函数 ≤ 50 行
- 早返回优先，避免深层嵌套
- async/await，不用 Promise.then 链

### 3.4 注释

- 公共 API 用 JSDoc
- 复杂逻辑写"为什么"而不是"做什么"
- 覆写钩子必须说明原因

---

## 4. 安全规范

### 4.1 密码

- **只走 bcrypt**：`bcrypt.hash` / `bcrypt.compare`
- 禁止用 `crypto.encrypt` / `crypto.decrypt` 处理密码
- `ENCRYPTION_KEY` 只用于 AES 字段（如 MFA secret）

### 4.2 会话

- Redis key：`access:{tenantId}:{userId}:{deviceId}` / `refresh:...`
- 撤销会话用 `scanAll("access:*:{userId}:*")`
- `logout` 只清当前 deviceId

### 4.3 多租户

- 所有查询 `tenant_id` 必须显式（除平台级 `sys_tenant`）
- 关联表写入前校验 ID 归属（`assertOwnership`）
- 登录用 `tenantCode + username` 定位用户

### 4.4 数据权限

- 数据范围由 `sys_role.data_scope` 决定
- 中间件自动计算，Repository 自动合并
- **不要手动拼 `deptId` 条件**，让 `mergeDataScope` 处理

### 4.5 软删除

- 所有表统一 `is_deleted`
- 所有查询过滤 `is_deleted: 0`
- 批量删除用 `softDeleteMany`，不要 `delete`

### 4.6 关联表

- `createMany` 加 `skipDuplicates: true`
- 批量写入前 `assertOwnership` 校验租户
- 复合唯一键**不含 tenant_id**（跨租户冲突应被拒绝）

### 4.7 文件

- `deleteFile(url)` 必须 `path.basename` + 路径前缀校验
- 上传分片 `uploadId` 必须 UUID 校验
- 文件名只用于取扩展名，不拼接路径

### 4.8 审计

- 走 `pushAudit`（异步队列），**不直接写库**
- 敏感字段自动脱敏

### 4.9 Redis

- `subscribe()` 返回 number，**监听挂在 `subRedis` 本身**
- 定时任务用 `withLock` 包裹
- key 命名：`{业务}:{标识}`（`access:` / `refresh:` / `rbac:perms:` / `job:lock:`）

---

## 5. 数据库规范

### 5.1 表结构

所有业务表必须包含：

```prisma
tenant_id    String    @db.Uuid
created_at   DateTime  @default(now())
updated_at   DateTime  @updatedAt
created_by   String?   @db.Uuid
updated_by   String?   @db.Uuid
is_deleted   Int       @default(0) @db.SmallInt
```

### 5.2 索引

- `tenant_id` 单列索引
- 常用查询字段组合索引 `@@index([tenant_id, status])`
- 软删除过滤字段 `@@index([is_deleted])`

### 5.3 外键

**禁止数据库外键**，用关联表 + 应用层校验。

### 5.4 迁移

- 迁移文件不修改已提交的
- 用 `pnpm db:migrate` 生成
- 生产用 `pnpm db:deploy`

---

## 6. 关联表 ID 归属校验模式

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

**所有 `updateRoleMenus` / `updateRolePermissions` / `updateRoleUsers` / `updateRoleDepts` / `updateUserRoles` / `updateUserDepts` / `updateDeptUsers` 都必须调用**。

---

## 7. Prisma 关系名易错点

| 关系                             | 正确名         | 错误写法       |
| -------------------------------- | -------------- | -------------- |
| `sys_user_role` → `sys_role`     | `role`         | ~~`sys_role`~~ |
| `sys_user_role` → `sys_user`     | `user`         | ~~`sys_user`~~ |
| `sys_user_dept` → `sys_dept`     | `dept`         | ~~`sys_dept`~~ |
| `sys_notice` → `sys_notice_user` | `target_users` | —              |

**核对 `schema.prisma` 后再写 include / select**。

---

## 8. 审计日志脱敏字段

以下字段在写入 `sys_audit_log.request_params` / `response_data` 前必须替换为 `"***"`：

```
password / oldPassword / newPassword / confirmPassword
token / accessToken / refreshToken
secret / apiKey / apiSecret
authorization / cookie
```

---

## 9. 定时任务规范

所有 cron 任务必须通过 `withLock` 包裹：

```ts
const lockKey = `job:lock:${job.tenant_id}:${job.job_id}`;
const LOCK_TTL = 10 * 60;

const result = await withLock(lockKey, LOCK_TTL, () => runJob(job));
if (result === null) {
  logger.debug({ jobId: job.job_id }, "[job] skipped, lock held");
}
```

TTL 必须：
- **大于** 单次最长执行时间
- **小于** cron 间隔

---

## 10. WebSocket 规范

### 10.1 单例

`wsManager` 是模块级单例，**不要在业务代码里 `new`**。

```ts
import { wsManager } from "@/core/ws/manager.js";

wsManager.sendToUsers(userIds, { type: "notice", data: { ... } });
```

### 10.2 多实例

多实例部署必须通过 Redis pub/sub 广播：

```ts
await redis.publish("notice:push", JSON.stringify({ noticeId }));
```

各实例的 `startNoticeSubscriber()` 收到消息后，通过本地 `wsManager` 推给本实例持有的连接。

### 10.3 消息类型

| type           | 说明                   |
| -------------- | ---------------------- |
| `notice`       | 站内通知               |
| `force-logout` | 强制下线               |
| `connected`    | 连接确认（服务端下发） |

---

## 11. Redis 使用规范

### 11.1 Key 命名

```
{业务前缀}:{标识}
```

| 前缀          | 用途               |
| ------------- | ------------------ |
| `access:`     | access token 会话  |
| `refresh:`    | refresh token 会话 |
| `rbac:perms:` | 权限缓存           |
| `session:`    | 通用会话           |
| `kicked:`     | 强制下线标记       |
| `job:lock:`   | 定时任务锁         |
| `ip-rule:`    | IP 规则缓存        |
| `login:fail:` | 登录失败计数       |
| `login:lock:` | 登录锁定           |
| `pwd:reset:`  | 密码重置令牌       |

### 11.2 订阅

```ts
// ✅ 正确
await subRedis.subscribe(CHANNEL);
subRedis.on("message", (channel, message) => {
  if (channel !== CHANNEL) return;
  // ...
});

// ❌ 错误（subscriber 是 number）
const subscriber = await subRedis.subscribe(CHANNEL);
subscriber.on("message", ...);
```

### 11.3 清空

**禁止**在业务代码里用 `flushall` / `flushdb`。按前缀清理：

```ts
const keys = await scanAll("cache:*");
if (keys.length) await redis.del(...keys);
```

---

## 12. 日志规范

- 统一使用 `@/core/logger/index.js` 的 `logger`
- **生产环境**禁止 `console.log` / `console.error`
- 日志内容**不包含** token / password / secret
- 关键操作日志带 `{ userId, tenantId, ... }` 结构

```ts
// ✅ 正确
logger.info({ userId, tenantId, operation }, "user created");

// ❌ 错误
console.log("user created", user);
logger.info(`user created: ${JSON.stringify(user)}`);
```

---

## 13. 环境变量

- `env.ts` 用 Zod 校验，**启动时校验，失败直接抛错**
- 所有敏感配置走环境变量，**不硬编码**
- `.env.example` 提供完整模板（不含真实值）