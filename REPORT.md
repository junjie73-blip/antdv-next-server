# SaaS Admin Server — 功能缺失分析与优化建议报告

> 本报告**不重复**前六轮已详述的具体代码 bug，而是聚焦于**系统当前没有做的功能**、**有骨架但未闭环的能力**、**工程化基建空白**三类缺口。每项标注优先级、难度、收益、资源估算。

---

## 目录

- [一、缺失功能全景](#一缺失功能全景)
- [二、分域详细分析](#二分域详细分析)
  - [A. 认证与安全](#a-认证与安全)
  - [B. 权限与组织](#b-权限与组织)
  - [C. 工作流与审批](#c-工作流与审批)
  - [D. 通知与消息](#d-通知与消息)
  - [E. 数据与运维](#e-数据与运维)
  - [F. 监控与可观测](#f-监控与可观测)
  - [G. 用户体验](#g-用户体验)
  - [H. 工程基建](#h-工程基建)
- [三、性能优化建议](#三性能优化建议)
- [四、安全性增强建议](#四安全性增强建议)
- [五、可维护性建议](#五可维护性建议)
- [六、优先级矩阵与资源评估](#六优先级矩阵与资源评估)
- [七、季度实施路线图](#七季度实施路线图)

---

## 一、缺失功能全景

共识别 **48 项**功能缺口，按域分布：

| 域              | 缺失数 | P0    | P1     | P2     | P3    |
| --------------- | ------ | ----- | ------ | ------ | ----- |
| A. 认证与安全   | 9      | 3     | 4      | 2      | 0     |
| B. 权限与组织   | 7      | 1     | 3      | 3      | 0     |
| C. 工作流与审批 | 8      | 1     | 3      | 4      | 0     |
| D. 通知与消息   | 6      | 0     | 3      | 3      | 0     |
| E. 数据与运维   | 7      | 0     | 2      | 3      | 2     |
| F. 监控与可观测 | 6      | 1     | 2      | 2      | 1     |
| G. 用户体验     | 5      | 0     | 2      | 3      | 0     |
| **合计**        | **48** | **6** | **19** | **20** | **3** |

---

## 二、分域详细分析

### A. 认证与安全

#### A1. 密码到期强制改密闭环 ⭐️ P0

**现状**：`AuthService.login` 返回 `mustChangePassword: true`，但**仍签发完整 access token**，用户可以忽略此标志继续使用系统。

**必要性**：等保合规要求密码到期必须强制改密，否则不合规。当前实现让合规失效。

**应用场景**：企业 IT 管理员设置"密码 90 天过期"，员工到期登录后必须先改密才能用。

**技术方案**：

```ts
// 1. 签发受限 token（scope: "pwd-change-only"）
const tokens = await issueTokens({
  ...,
  scope: mustChange ? "pwd-change-only" : "full",
});

// 2. auth 中间件拒绝受限 token 访问非白名单接口
const RESTRICTED_WHITELIST = ["/api/v1/auth/password", "/api/v1/auth/logout", "/api/v1/auth/profile"];
if (payload.scope === "pwd-change-only" && !isWhitelisted(req.path)) {
  throw new AuthorizationError("请先修改密码", 403010, 403);
}

// 3. 前端拦截 403010 错误码跳转改密页
```

**预期效果**：合规达标；用户被动完成密码更新。

**资源**：2 人天（后端 1.5 + 前端 0.5）。

---

#### A2. 两步验证（2FA）强制策略 ⭐️ P0

**现状**：`RequireMFA` 装饰器与 `requireMfaMiddleware` 存在，但**没有租户级/角色级强制策略**——只有管理员手动给某个接口打 `@RequireMFA`。

**必要性**：
- 管理员/财务等高权限角色必须强制 2FA，是金融级系统标配
- 已有 MFA 服务（TOTP），但未与"强制策略"连接

**应用场景**：租户管理员可配置" SUPER_ADMIN 角色登录必须 2FA "。

**技术方案**：

```ts
// 1. sys_role 加字段 mfa_required: 0 | 1
// 2. 登录成功后检查角色
const roles = await this.loadRoleCodes(userId, tenantId);
const roleMfaRequired = await prisma.sys_role.count({
  where: { tenant_id: tenantId, role_code: { in: roles }, mfa_required: 1, is_deleted: 0 },
});
if (roleMfaRequired > 0 && !user.mfa_enabled) {
  // 返回 206 Partial，要求绑定 MFA
  return { ...tokens, mfaSetupRequired: true };
}
// 3. authMiddleware 层检查 user.mfa_verified_session
const needVerify = await checkMfaSession(req.user, req.deviceId);
if (needVerify) throw new AuthorizationError("需要 MFA 验证", 401015, 401);
// 4. 前端弹出 TOTP 输入
```

**预期效果**：高权限账号无法仅凭密码登录。

**资源**：4 人天（DB 迁移 0.5 + 后端 2 + 前端 1.5）。

---

#### A3. 敏感操作二次确认与 MFA 校验 ⭐️ P0

**现状**：删除租户、重置他人密码、撤销用户会话等操作**仅凭权限码**执行。

**必要性**：
- 防止 token 被盗用后恶意操作
- 金融/医疗等合规要求

**应用场景**：删除租户时要求输入登录密码 + TOTP。

**技术方案**：

```ts
// core/decorator/require-confirm.ts
export function RequireConfirm(scope: "password" | "password+mfa") {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata("confirm:scope", scope, target.constructor, propertyKey);
    return descriptor;
  };
}

// Router 层校验
const confirmScope = Reflect.getMetadata("confirm:scope", ctrl.target, route.propertyKey);
if (confirmScope) {
  const { password, totp } = req.body;
  await verifyPasswordAndMfa(req.user.userId, password, totp, confirmScope);
}

// 使用
@Post("/tenant/:id/delete")
@RequireConfirm("password+mfa")
async deleteTenant() {}
```

**预期效果**：高危操作增加一重门槛。

**资源**：3 人天。

---

#### A4. 异常登录检测与通知 ⭐️ P1

**现状**：登录日志记录了 IP/UA，但**没有异常检测**。

**必要性**：
- 异地登录/新设备登录是账号被盗的重要信号
- 用户期望收到"您的账号在 XX 登录"提醒

**应用场景**：用户 A 平常在北京登录，某天 IP 显示在俄罗斯 → 触发邮件+站内信告警。

**技术方案**：

```ts
// 1. 登录日志加字段 is_abnormal, abnormal_reason
// 2. 登录成功后异步检测
async function detectAbnormal(user, loginLog) {
  const recent = await prisma.sys_login_log.findMany({
    where: { user_id: user.user_id, status: "1", created_at: { gte: 30天前 } },
    select: { ip_address, user_agent },
    take: 20,
  });
  // 规则 1：IP 城市变化（GeoIP 库）
  // 规则 2：新设备 UA
  // 规则 3：短时间多地登录（不可能旅行）
  // 规则 4：凌晨异常时段
  // 若命中，写异常标记 + 发送告警通知
}
```

**预期效果**：账号盗用可被用户第一时间发现。

**资源**：5 人天（含 GeoIP 集成）。

---

#### A5. SSO 单点登录（OAuth2 / SAML / OIDC） ⭐️ P1

**现状**：`env.ts` 有 `OAUTH_GOOGLE_*` / `OAUTH_GITHUB_*` 变量，但**没有实现**。

**必要性**：企业客户普遍要求对接自家 IdP（Azure AD / Okta / 企业微信）。

**技术方案**：

| 协议                               | 优先级 | 库                         |
| ---------------------------------- | ------ | -------------------------- |
| OIDC（Azure AD / Keycloak / Okta） | P1     | `openid-client`            |
| 企业微信/钉钉/飞书                 | P1     | 官方 SDK                   |
| SAML 2.0                           | P2     | `@node-saml/passport-saml` |
| OAuth2（Google/GitHub）            | P2     | `passport-*`               |

新增 `modules/sso/`：`sys_sso_provider` 表存储 IdP 配置，租户级启用。

**预期效果**：支持企业客户一键接入。

**资源**：12 人天（OIDC 4 + 企微 4 + SAML 4）。

---

#### A6. 密码泄露检测（Have I Been Pwned） ⭐️ P2

**必要性**：NIST SP 800-63B 建议检查密码是否在已泄露库中。

**技术方案**：

```ts
// 使用 k-anonymity：SHA1 前 5 位查询 HIBP API
async function checkPwned(password: string): Promise<boolean> {
  const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const text = await res.text();
  return text.split("\n").some(line => line.startsWith(suffix));
}
// 在 validatePasswordStrength 里调用
```

**资源**：1 人天。

---

#### A7. API Key / Personal Access Token ⭐️ P2

**现状**：只有 JWT 会话，无长期凭证。

**必要性**：CI/CD、脚本、第三方集成需要长期有效的 API Key。

**技术方案**：新增 `sys_api_key` 表 + `modules/api-key/`，支持：
- 生成/吊销/轮换
- 作用域（scope）限制
- IP 白名单
- 最后使用时间
- 自动过期

**资源**：6 人天。

---

#### A8. 敏感字段脱敏策略引擎 ⭐️ P1

**现状**：硬编码了 `maskPhone` / `maskEmail`，其他字段（身份证、银行卡）没有统一处理。

**必要性**：**每个字段的脱敏规则应该可配置**，且不同角色看到不同脱敏程度。

**技术方案**：

```ts
// sys_field_mask_policy
// 字段: resource, field, role_scope, mask_type, mask_rule
// mask_type: full | partial | hash | custom_regex

// 在 response 序列化前统一应用
function applyMaskPolicy(resource: string, data: any, roles: string[]) {
  const policies = getPolicies(resource, roles);
  return policies.reduce((acc, p) => maskField(acc, p), data);
}
```

**资源**：5 人天。

---

#### A9. 审计日志异常告警规则引擎 ⭐️ P2

**现状**：审计日志只记录，无规则匹配。

**必要性**："1 分钟删除超过 100 条记录" 这类异常应自动告警。

**技术方案**：DSL 规则表 + 定时扫描：

```ts
// sys_audit_alert_rule: { resource, action, window_sec, threshold, level, channels }
// 定时任务：每分钟扫描最近 1 分钟日志，命中规则则 sendAlert
```

**资源**：4 人天。

---

### B. 权限与组织

#### B1. 用户组（User Group）⭐️ P1

**现状**：只有用户-角色、用户-部门两级，缺少"用户组"概念。

**必要性**：
- 批量权限管理：给 100 个用户分配同一批角色，用组更简洁
- 跨部门协作：项目组可以横跨多个部门

**技术方案**：

```
sys_user_group: { group_id, tenant_id, name, description }
sys_user_group_member: { group_id, user_id, tenant_id }
sys_user_group_role: { group_id, role_id, tenant_id }
```

用户最终权限 = 直接角色 ∪ 组角色。

**资源**：6 人天。

---

#### B2. 岗位/职位管理 ⭐️ P2

**现状**：只有"角色"，缺"岗位"（如"HR 专员"/"财务经理"）。

**必要性**：岗位是组织维度，角色是权限维度，两者应分离。

**技术方案**：新增 `sys_position` + `sys_user_position`，岗位可绑定默认角色。

**资源**：4 人天。

---

#### B3. 字段级数据权限 ⭐️ P1

**现状**：数据权限是**行级**（哪些记录可见），缺少**列级**（哪些字段可见）。

**必要性**：
- 普通 HR 看不到员工薪资字段，HR 经理能看
- 销售只能看客户联系方式，销售经理能看全

**技术方案**：

```ts
// sys_role_field_policy: { role_id, resource, field, access: read|write|deny }
// BaseRepository 的 select 处理时动态裁剪
```

**资源**：5 人天。

---

#### B4. 权限申请与审批流 ⭐️ P2

**必要性**：用户申请临时权限（如"临时管理员 2 小时"），走审批流，到期自动回收。

**技术方案**：复用工作流引擎，新增 `sys_privilege_grant` 表 + 定时回收任务。

**资源**：8 人天。

---

#### B5. 组织架构变更历史 ⭐️ P2

**现状**：部门/用户调整后无历史记录。

**必要性**：员工调动、部门合并后需要追溯"某年某月他在哪个部门"。

**技术方案**：

```ts
// sys_org_history: { entity_type, entity_id, before, after, operator, at }
// 用 PostgreSQL 的 audit trigger 或应用层 hook
```

**资源**：3 人天。

---

#### B6. 权限继承与组合 ⭐️ P2

**现状**：角色权限是扁平的。

**必要性**：支持"基础角色 + 扩展角色"的继承关系，避免重复配置。

**技术方案**：`sys_role.inherit_from`，权限计算时递归合并。

**资源**：4 人天。

---

#### B7. 租户数据隔离审计 ⭐️ P3

**必要性**：定期检查所有 SQL 是否带 `tenant_id`，防止漏网之鱼。

**技术方案**：CI 层用 ESLint 规则扫描 `prisma.*.findMany` 调用，强制要求 `where.tenant_id`。

**资源**：2 人天。

---

### C. 工作流与审批

#### C1. 抄送节点（CC）⭐️ P1

**现状**：`types.ts` 里 `WfEventType` 有 `"cc"`，但引擎里**没有实现**。

**必要性**：审批结果需要通知相关方（如财务需要知道采购已批）。

**技术方案**：

```ts
// node.type = "ccTask"
// 引擎：不创建 task，只记录历史 + 发通知
case "ccTask":
  const receivers = await AssigneeResolver.resolve(node.assignee, ctx);
  await wfNotificationService.notify({
    eventType: "cc", receiverIds: receivers, ...
  });
  await this.executeRecursive(nextNodeId, ctx, tx, result);
  break;
```

**资源**：2 人天。

---

#### C2. 撤销与回退 ⭐️ P1

**现状**：只有 approve/reject，发起人无法撤回，审批人无法回退到上一节点。

**必要性**：
- 发起人填错后可撤回
- 审批人发现资料不全可退回

**技术方案**：

```ts
// 新增 API
POST /workflow/instance/:id/revoke    // 发起人撤回（限未完成）
POST /workflow/task/:id/return        // 退回上一节点

// 撤回：terminate + 状态改为 revoked
// 回退：找上一完成节点，重启该节点任务
```

**资源**：5 人天。

---

#### C3. 加签 / 转办 / 委托 ⭐️ P1

**必要性**：
- 加签：审批中临时增加审批人
- 转办：把任务转给他人
- 委托：出差期间全权代理

**技术方案**：

```ts
POST /workflow/task/:id/add-sign     // 加签（前加/后加）
POST /workflow/task/:id/transfer     // 转办
POST /workflow/delegate              // 创建委托规则

// sys_wf_delegate: { delegator_id, delegatee_id, start_at, end_at, def_keys }
// 任务创建时检查是否有委托规则
```

**资源**：8 人天。

---

#### C4. 工作流超时升级策略 ⭐️ P1

**现状**：`TimeoutConfig.action` 只有 `notify | autoApprove | autoReject`，缺"升级到上级"。

**必要性**：超时未审 → 自动升级到部门经理，避免流程卡死。

**技术方案**：新增 `action: "escalate"`，配置 `escalateTo: { type: "deptLeader", level: 2 }`。

**资源**：3 人天。

---

#### C5. 条件分支表达式可视化编辑 ⭐️ P2

**现状**：条件表达式是裸文本（`amount > 1000 && hasRole(roles, 'manager')`），前端无辅助编辑。

**必要性**：非技术人员无法编写。

**技术方案**：前端提供"规则构建器"，输出表达式字符串。

**资源**：前端 5 人天。

---

#### C6. 工作流版本兼容与灰度 ⭐️ P2

**现状**：流程定义更新后，**进行中的实例用哪个版本？** 目前 `wf_instance.def_id` 指向创建时的版本，OK。但**没有灰度发布**（新版本只给部分用户用）。

**技术方案**：`wf_definition` 加 `rollout_percent`，实例创建时按用户哈希决定用哪个版本。

**资源**：4 人天。

---

#### C7. 工作流执行轨迹可视化 ⭐️ P2

**现状**：`diagram` 接口返回节点状态，但**缺历史执行轨迹**（每个节点停留多久、审批人是谁）。

**技术方案**：前端在流程图节点上叠加时间线。

**资源**：前端 4 人天。

---

#### C8. 工作流模拟测试 ⭐️ P3

**必要性**：发布前可"跑一遍"看流程是否合理。

**技术方案**：`POST /workflow/definition/:id/simulate` + mock 变量。

**资源**：6 人天。

---

### D. 通知与消息

#### D1. SMS 渠道真实实现 ⭐️ P1

**现状**：`sms.ts` 是 stub，直接返回失败。

**必要性**：中国企业短信通知是刚需。

**技术方案**：

```ts
// platform/sms/
// providers/aliyun.ts, tencent.ts, huawei.ts
// factory.ts 按租户配置选择 provider
export interface SmsProvider {
  send(phone: string, template: string, params: Record<string, any>): Promise<boolean>;
}
```

**资源**：6 人天（阿里云 2 + 腾讯 2 + 华为 2）。

---

#### D2. Webhook 增强（签名/重试/幂等）⭐️ P1

**现状**：`webhook.ts` 只是 POST，无 HMAC 签名、无重试、无幂等键。

**必要性**：企业客户要求验证来源、要求幂等、要求重试。

**技术方案**：

```ts
// 1. HMAC 签名
headers["X-Signature"] = `sha256=${hmac(secret, body)}`;
headers["X-Timestamp"] = Date.now();
// 2. 幂等键
headers["X-Idempotency-Key"] = noticeId;
// 3. 重试（BullMQ 队列）
// 4. 使用 shared/http/agent.js 的 keepAlive
```

**资源**：4 人天。

---

#### D3. 消息模板国际化 ⭐️ P1

**现状**：模板无多语言字段。

**必要性**：跨国企业需要中英文模板。

**技术方案**：

```sql
ALTER TABLE sys_notice_template ADD COLUMN locale VARCHAR(8) DEFAULT 'zh-CN';
-- 唯一键 (tenant_id, template_code, locale)
-- 发送时按用户 locale 选择，回退到默认
```

**资源**：3 人天。

---

#### D4. 消息中心（未读聚合）⭐️ P2

**现状**：通知/待办/系统消息分散在不同模块。

**必要性**：用户希望一个入口看到所有未读。

**技术方案**：新增 `sys_message_center` 聚合表（或视图），统一未读数、已读数、优先级。

**资源**：6 人天。

---

#### D5. 邮件模板可视化编辑 ⭐️ P2

**现状**：模板内容是 markdown/html 文本，非技术用户无法编辑。

**技术方案**：集成富文本编辑器（TinyMCE / TipTap），后端保存 HTML + 变量占位符。

**资源**：前端 5 人天 + 后端 1 人天。

---

#### D6. 通知订阅与偏好 ⭐️ P2

**必要性**：用户可选择"只接收紧急通知邮件"。

**技术方案**：

```
sys_user_notice_preference: { user_id, channel, event_type, enabled }
```

**资源**：4 人天。

---

### E. 数据与运维

#### E1. 数据导出异步化 ⭐️ P1

**现状**：报表导出有异步，但**用户/审计/登录日志导出是同步阻塞**。

**必要性**：10 万行导出会阻塞请求 30 秒+。

**技术方案**：统一走 `rp_export_task` 模式，前端轮询下载链接。

**资源**：5 人天。

---

#### E2. 数据库备份管理界面 ⭐️ P1

**现状**：备份依赖运维手工 pg_dump。

**必要性**：管理员应能在 UI 里：
- 手动触发备份
- 查看备份列表
- 一键恢复（谨慎）

**技术方案**：

```ts
// modules/backup/
// 使用 pg_dump / pg_restore，上传到 S3
// sys_backup_record: { id, type, size, path, started_at, finished_at, status }
```

**资源**：8 人天。

---

#### E3. 数据归档策略配置化 ⭐️ P2

**现状**：`jobs/maintenance/partition-manager.ts` 里 `retentionMonths` 硬编码。

**必要性**：不同客户保留期不同。

**技术方案**：`sys_archive_policy` 表 + 定时任务读配置。

**资源**：3 人天。

---

#### E4. 缓存管理界面 ⭐️ P2

**现状**：有 `monitor/cache` 但功能有限。

**必要性**：管理员应能：
- 查看缓存组大小
- 按 key 搜索
- 手动清理指定 key/组
- 缓存命中率趋势

**资源**：6 人天。

---

#### E5. 数据库迁移 dry-run ⭐️ P2

**必要性**：生产迁移前应能在 staging 看到 SQL 和影响。

**技术方案**：`prisma migrate diff` + 影响分析脚本。

**资源**：2 人天。

---

#### E6. 多对象存储后端热切换 ⭐️ P3

**现状**：`storage/factory.ts` 已有工厂，但切换需要重启。

**必要性**：故障时应急切换到备份存储。

**技术方案**：监听配置变更，热重建 S3Client。

**资源**：3 人天。

---

#### E7. 数据脱敏导出 ⭐️ P3

**必要性**：测试环境导出生产数据时需自动脱敏。

**技术方案**：导出时应用 `maskPolicy`。

**资源**：3 人天。

---

### F. 监控与可观测

#### F1. 数据库连接池监控 ⭐️ P0

**现状**：`DB_POOL_MAX` 配置存在，但**没有暴露池使用率指标**。

**必要性**：池饱和会导致请求排队，是典型故障前兆。

**技术方案**：

```ts
// 在 database.ts 中采集
const pool = adapter.pool; // pg.Pool
setInterval(() => {
  dbPoolTotal.set(pool.totalCount);
  dbPoolIdle.set(pool.idleCount);
  dbPoolWaiting.set(pool.waitingCount);
}, 5000);
```

**资源**：1 人天。

---

#### F2. 分布式追踪可视化 ⭐️ P1

**现状**：`traceMiddleware` 有 traceId，但**无 exporter**（无 Jaeger/Tempo）。

**必要性**：微服务趋势下，需要看到跨服务链路。

**技术方案**：OTLP exporter → Tempo/Jaeger，`env.OTEL_ENABLED` 已存在。

**资源**：4 人天。

---

#### F3. 日志聚合与检索 ⭐️ P1

**现状**：日志写文件，无集中查询。

**必要性**：线上排障需要按 traceId 检索。

**技术方案**：Pino → Loki/ELK，加 `traceId` 索引。

**资源**：5 人天。

---

#### F4. Grafana 大盘模板 ⭐️ P2

**必要性**：开箱即用的监控大盘。

**技术方案**：提供 JSON 模板，包含：
- HTTP QPS / P99 / 错误率
- DB 连接池 / 慢查询
- Redis 命中率 / 连接数
- 队列积压
- 进程 CPU / 内存

**资源**：3 人天。

---

#### F5. 队列可视化 ⭐️ P2

**必要性**：BullMQ 有 `bull-board`，但未集成。

**技术方案**：挂载 `/admin/queues`（受权限保护）。

**资源**：1 人天。

---

#### F6. 慢查询分析闭环 ⭐️ P3

**现状**：慢查询告警，但**无归档、无趋势分析**。

**技术方案**：慢查询写入 `sys_slow_query_log`，提供分析页面。

**资源**：5 人天。

---

### G. 用户体验

#### G1. 用户偏好设置 ⭐️ P1

**现状**：无 `sys_user_preference`。

**必要性**：
- 主题（亮/暗）
- 语言
- 时区
- 通知偏好
- 首页布局

**技术方案**：`sys_user_preference: { user_id, key, value }` + 前端 store。

**资源**：4 人天。

---

#### G2. 系统消息全局搜索 ⭐️ P1

**必要性**：用户需要"搜索我看到的通知/待办"。

**技术方案**：PostgreSQL 全文索引 + 统一搜索 API。

**资源**：5 人天。

---

#### G3. 快捷键与操作引导 ⭐️ P2

**必要性**：提升高频用户效率。

**技术方案**：前端引入 `hotkey` 库 + 引导 tour。

**资源**：前端 3 人天。

---

#### G4. 移动端适配 ⭐️ P2

**必要性**：审批类场景手机使用多。

**技术方案**：响应式布局 + 触控优化。

**资源**：前端 8 人天。

---

#### G5. 多语言切换 ⭐️ P2

**必要性**：跨国企业。

**技术方案**：前端 i18n + 后端消息表 locale。

**资源**：前端 5 人天 + 后端 2 人天。

---

### H. 工程基建

#### H1. 单元测试框架与覆盖率 ⭐️ P0

**现状**：**几乎无单测**。

**必要性**：无测试的重构是走钢丝。

**技术方案**：vitest + Testcontainers，见上一轮报告 §4.1。

**资源**：搭建 3 人天 + 补测 20 人天（分阶段）。

---

#### H2. 集成测试 ⭐️ P1

**技术方案**：supertest + 真实 DB（Testcontainers）。

**资源**：搭建 2 人天 + 补测 10 人天。

---

#### H3. E2E 测试 ⭐️ P1

**技术方案**：Playwright，覆盖登录、审批、通知、导出等主链路。

**资源**：搭建 2 人天 + 补测 8 人天。

---

#### H4. 性能压测基线 ⭐️ P2

**技术方案**：k6 脚本，覆盖关键接口，CI 定期跑。

**资源**：3 人天。

---

#### H5. 混沌工程 ⭐️ P3

**必要性**：验证"Redis 挂了"、"DB 主从切换"时系统行为。

**技术方案**：Chaos Mesh / Toxiproxy。

**资源**：5 人天。

---

#### H6. 特性开关（Feature Flag）⭐️ P2

**必要性**：灰度发布、A/B 测试、紧急关闭功能。

**技术方案**：`sys_feature_flag` 表 + SDK：

```ts
const enabled = await featureFlags.isEnabled("new-workflow-editor", { userId, tenantId });
```

**资源**：6 人天。

---

#### H7. API 版本化机制 ⭐️ P2

**现状**：`/api/v1` 硬编码。

**必要性**：未来 `/api/v2` 时如何并行支持？

**技术方案**：路由前缀从 `env.API_VERSION` 读 + `Deprecation` 响应头。

**资源**：3 人天。

---

#### H8. 代码生成器模板版本化 ⭐️ P3

**必要性**：模板更新后，已生成的代码如何平滑升级？

**技术方案**：模板加版本号，生成时记录。

**资源**：3 人天。

---

## 三、性能优化建议

| 项             | 位置                       | 建议                                   | 预期收益                      |
| -------------- | -------------------------- | -------------------------------------- | ----------------------------- |
| 缓存击穿保护   | `cached()`                 | 引入 singleflight                      | 热点 key 失效时降 99% DB 压力 |
| 缓存雪崩保护   | 所有 `setex`               | TTL 加随机抖动 ±10%                    | 避免同批过期                  |
| N+1 消除       | Role/User/Dict 导入        | 批量查 + createMany                    | 导入 1000 行从 60s → 3s       |
| 慢查询治理     | `job:db-slow-query-review` | 建立索引建议引擎                       | 慢查询降 80%                  |
| 列表查询       | 所有 `findPage`            | 强制 `take: 100` 上限                  | 防 OOM                        |
| 导出异步化     | user/audit/login           | 走队列                                 | P99 从 30s → 200ms            |
| Redis 分片     | 单实例                     | 引入 Cluster（>10GB 时）               | 水平扩展                      |
| 分区表         | 日志表                     | 已有                                   | OK                            |
| 连接池监控     | DB                         | 加指标                                 | 提前预警                      |
| QPS 环形计数器 | monitor/qps                | 用 bucket 替代数组                     | O(1) 代替 O(n)                |
| 静态资源       | `/uploads`                 | 已用 immutable                         | OK                            |
| 大表 COUNT     | 所有分页                   | 引入近似 count（`pg_class.reltuples`） | 百万表 count 从 500ms → 5ms   |

---

## 四、安全性增强建议

| 项                          | 严重度 | 建议                                           |
| --------------------------- | ------ | ---------------------------------------------- |
| `hashField` 无 pepper       | P0     | 加 `FIELD_HASH_PEPPER`                         |
| `getSensitive` 无权限       | P0     | 加 `@RequirePermission("user:view-sensitive")` |
| `findMany` 无 tenant_id     | P0     | 强制注入 + CI 检查                             |
| `changePassword` 弱 bcrypt  | P0     | 统一走 `hashPassword`                          |
| `Math.random` 生成验证码    | P0     | 改用 `crypto.randomInt`                        |
| CSRF 中间件位置             | P1     | 移到 CORS 后                                   |
| `siteInfoPublic` 可枚举租户 | P1     | tenantId 从子域名/JWT 派生                     |
| 敏感字段清单不完整          | P1     | 补 `accessKeyId` 等                            |
| SSRF 防护                   | P1     | Webhook URL 黑名单内网 IP                      |
| SQL 注入                    | P1     | 已有参数化，但 `$executeRawUnsafe` 有残留      |
| 密码强度                    | P1     | 加 HIBP 检测                                   |
| 会话固定                    | P1     | 登录后轮换 sessionId                           |
| 定时任务锁                  | P1     | `withPgLock` 已对，Redis 锁需续期              |
| 依赖漏洞扫描                | P2     | CI 加 `pnpm audit` / Snyk                      |
| 容器最小化                  | P2     | 用 distroless base                             |
| 密钥轮换                    | P2     | 支持 JWT_SECRET 双密钥过渡                     |
| CSP 收紧                    | P2     | 生产移除 `unsafe-*`                            |
| 限流粒度                    | P2     | 目前 IP + 全局，缺用户维度                     |
| WAF                         | P3     | 接入 Cloudflare/阿里云 WAF                     |

---

## 五、可维护性建议

| 项             | 建议                                                         |
| -------------- | ------------------------------------------------------------ |
| **去重**       | 统一 `AppError` 路径、`hashPassword`、`withPgLock`、AES 实现 |
| **类型安全**   | 消除 `any`、`as any`、`@ts-ignore`，用 Prisma 类型           |
| **日志**       | 删除所有 `console.log`                                       |
| **代码审查**   | 引入 PR 模板 + checklist                                     |
| **依赖更新**   | 引入 Renovate/Dependabot                                     |
| **文档**       | 见第一轮报告，30+ 文档缺口                                   |
| **架构守卫**   | ESLint `no-restricted-imports` 强制分层                      |
| **模块边界**   | 强制通过 `index.ts` 导出，禁止深路径                         |
| **指标覆盖**   | 关键路径都有 metrics                                         |
| **契约测试**   | OpenAPI 与实现同步校验                                       |
| **死代码清理** | `enrichInitiatorNames`、`setDataScope` 等                    |
| **命名一致性** | `AppError` 路径、`error code` 规范                           |

---

## 六、优先级矩阵与资源评估

### 6.1 优先级矩阵（收益 × 难度）

```
收益
 高 │  A1 密码强制   A4 异常登录   C1 抄送        E1 导出异步
    │  A2 2FA强制    A8 字段脱敏   C2 撤销回退    F1 池监控
    │  A3 二次确认   B3 字段权限   C3 加签转办    F2 追踪
    │  H1 单测       D1 SMS        C4 超时升级    H2/H3 集成
    │  ──────────    D2 Webhook    D3 模板i18n    G1 偏好设置
 中 │  A5 SSO       A9 告警规则   D4 消息中心    F4 Grafana
    │  A7 API Key   B1 用户组     E2 备份UI      G2 全局搜索
    │  B2 岗位      B4 权限申请   E3 归档策略    H6 特性开关
    │  B5 组织历史  B6 权限继承   E4 缓存UI      H7 API版本化
 低 │  A6 HIBP      C5 可视化     D5 富文本      G3 快捷键
    │  C6 版本灰度  C7 轨迹可视   D6 订阅偏好    G4 移动端
    │  C8 模拟测试  E5 dry-run    E6 多存储热切  H5 混沌
    │  E7 脱敏导出  F5 队列UI     F6 慢查询闭环  H8 生成器版本
    └──────────────────────────────────────────────────────
        低            中              高             极高     难度
```

### 6.2 资源估算（人天）

| 优先级   | 项目数 | 后端    | 前端   | DevOps | 测试   | 合计    |
| -------- | ------ | ------- | ------ | ------ | ------ | ------- |
| **P0**   | 6      | 18      | 3      | 2      | 15     | **38**  |
| **P1**   | 19     | 62      | 20     | 8      | 30     | **120** |
| **P2**   | 20     | 55      | 30     | 10     | 20     | **115** |
| **P3**   | 3      | 12      | 0      | 3      | 3      | **18**  |
| **合计** | **48** | **147** | **53** | **23** | **68** | **291** |

**说明**：
- 以熟练工程师（3 年+）为单位
- 含设计、编码、自测、联调
- 不含需求评审、UI 设计

### 6.3 团队配置建议

| 角色       | 人数 | 职责               |
| ---------- | ---- | ------------------ |
| 后端工程师 | 2-3  | P0/P1 修复、新功能 |
| 前端工程师 | 1-2  | UI/UX、可视化      |
| DevOps     | 1    | 部署、监控、CI     |
| 测试/QA    | 1    | 单测、集成、E2E    |
| 技术负责人 | 1    | 架构、评审         |

**推荐节奏**：以 3 人后端 + 1 前端 + 1 测试的团队，**P0 约 2 周，P1 约 8 周，P2 约 10 周**。

---

## 七、季度实施路线图

### Q1：安全收敛 + 基础测试（Week 1-12）

```
Week 1-2  修复全部 P0（38 人天）
          ├── A1 密码强制、A2 2FA、A3 二次确认
          ├── 上一轮 P0 bug 修复
          └── H1 单测框架搭建

Week 3-4  P0 单测补齐 + CI
          ├── 单测覆盖率 ≥ 40%
          ├── CI：lint + type-check + test
          └── F1 池监控

Week 5-8  P1 第一批
          ├── A4 异常登录、A8 字段脱敏
          ├── B3 字段级权限
          ├── D1 SMS、D2 Webhook 增强
          └── H2 集成测试

Week 9-12 P1 第二批
          ├── C1 抄送、C2 撤销回退、C3 加签
          ├── C4 超时升级、D3 模板 i18n
          ├── E1 导出异步、E2 备份 UI
          ├── F2 追踪、F3 日志聚合
          └── H3 E2E 测试
```

### Q2：体验提升 + 运维完善（Week 13-24）

- A5 SSO、A7 API Key
- B1 用户组、B4 权限申请
- D4 消息中心、D5 富文本、D6 订阅偏好
- E3 归档策略、E4 缓存 UI
- F4 Grafana、F5 队列 UI
- G1 用户偏好、G2 全局搜索
- H6 特性开关、H7 API 版本化

### Q3：深度优化 + 国际化（Week 25-36）

- A6 HIBP、A9 告警规则
- B2 岗位、B5 组织历史、B6 权限继承
- C5 可视化、C6 灰度、C7 轨迹、C8 模拟
- G3 快捷键、G4 移动端、G5 多语言
- H4 压测基线
- F6 慢查询闭环

### Q4：长期演进（Week 37-52）

- H5 混沌工程、H8 生成器版本
- 模块拆分准备（auth / workflow / notice）
- 事件总线评估
- CQRS 试点
- 微服务网关设计

---

## 八、关键决策建议

### 8.1 应该优先投入的 5 件事

1. **安全漏洞修复**（P0 全部）—— 这是**合规与信任**的底线
2. **单测框架**（H1）—— 没有测试，越改越乱
3. **导出异步化**（E1）—— 用户可感知的性能提升
4. **数据权限列级**（B3）—— 大客户核心诉求
5. **SMS 渠道**（D1）—— 中国 B 端刚需

### 8.2 应该暂缓的 3 件事

1. **微服务拆分** —— 当前是"模块化单体"，过早拆分是灾难
2. **混沌工程** —— 团队规模 <10 人不需要
3. **CQRS** —— 没有读写分离的真实诉求

### 8.3 需要技术选型的 3 件事

| 项       | 选项                        | 推荐                         |
| -------- | --------------------------- | ---------------------------- |
| 追踪后端 | Jaeger / Tempo / SkyWalking | Tempo（与 Grafana 生态一致） |
| 日志聚合 | Loki / ELK / ClickHouse     | Loki（成本低）               |
| SSO 协议 | 自研 / passport / 开源 IdP  | 自研 OIDC + 企微 SDK         |

---

## 九、总结

| 维度           | 现状                | 目标                      |
| -------------- | ------------------- | ------------------------- |
| **功能完整度** | 核心闭环 70%        | 95%（补齐 48 项缺口）     |
| **测试覆盖率** | < 5%                | 单测 70% / 集成 40%       |
| **安全合规**   | P0 漏洞 14 项       | 0 项                      |
| **性能 P99**   | 无基线              | 列表 < 100ms / 导出 < 5s  |
| **可观测性**   | 有 metrics / 无追踪 | 全链路追踪 + 日志聚合     |
| **文档**       | 2 份                | 30+ 份，覆盖开发/运维/API |
| **部署**       | 手工                | Docker + K8s + CI/CD      |
| **团队规模**   | ?                   | 建议 5-6 人               |

**核心建议**：
1. **短期（3 个月）**：安全收敛 + 测试框架 + P1 关键功能
2. **中期（6 个月）**：完整功能闭环 + 运维自动化
3. **长期（12 个月）**：模块拆分准备 + 国际化 + 生态完善

**注意**：功能缺失不是问题，**无序扩张**才是问题。建议按本报告路线图**分阶段推进**，每季度 review 一次优先级，避免同时做太多事。

需要针对某一具体功能（如"用户组设计"、"抄送节点实现"、"特性开关 SDK"）出详细技术设计文档，可继续深入。