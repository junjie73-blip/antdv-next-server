# 项目开发规范

## 1. 目录与文件命名

- **模块目录**: kebab-case (如 `user-role`, `notifications`)
- **文件命名**: 小写，controller/repository/schema 固定后缀
- **类命名**: PascalCase，Controller 结尾

## 2. 代码风格

- 使用 TypeScript 严格模式（已配置 `strictPropertyInitialization: false`）
- 优先使用 `async/await`，避免回调地狱
- 所有异步路由处理器必须 try-catch，由 BaseController.addRoute 自动包裹
- 任何 Promise 必须 await 或 return，禁止裸 Promise

## 3. 模块开发规范

每个业务模块必须包含：
```plain
modules/{module-name}/
├── controller.ts   # 继承 BaseCrudController 或手动装饰器路由
├── repository.ts   # 继承 BaseRepository 或自定义 Prisma 查询
└── schema.ts       # Zod Schema（用于校验 + OpenAPI 文档）
```

### Controller 规范
- 必须加 `@Controller("/path")` 装饰器
- 继承 `BaseCrudController` 可获得标准 CRUD，额外接口用装饰器手动声明
- 权限使用 `defaultPermissions` 或方法装饰器 `@RequirePermission`
- 响应格式统一: `{ success: boolean, data?: T, message?: string, code?: number }`

### Repository 规范
- 优先继承 `BaseRepository<T>`，获得 findById/findMany/create/update/delete/restore
- 复杂查询（多表关联、聚合）可在子类中自定义方法
- 所有查询必须携带 `tenantId` 和 `deletedAt: null`
- 禁止在 Repository 中直接返回密码哈希等敏感字段

### Schema 规范
- 所有请求参数使用 Zod 定义
- 导出 Schema 使用 `.openapi("Name")` 以便生成文档
- 枚举值与 Prisma Schema 严格一致

## 4. 安全规范

- **认证**: 所有业务接口（除登录/注册/健康检查）必须通过 `authMiddleware`
- **鉴权**: 敏感操作使用 `@RequirePermission` 或 `defaultPermissions`
- **租户隔离**: 所有数据库操作必须过滤 `tenantId`
- **密码**: 使用 bcryptjs 哈希，cost=12
- **SQL 注入**: 禁止字符串拼接 SQL，必须使用 Prisma ORM
- **XSS**: 输出到前端的 HTML 内容需转义（通知 content 字段）

## 5. API 设计规范

- RESTful 风格，资源名使用复数名词
- 成功响应: `200/201` + `{ success: true, data }`
- 参数错误: `400/422` + `{ success: false, message, errors }`
- 未认证: `401`
- 无权限: `403`
- 不存在: `404`
- 服务端错误: `500`

## 6. 数据库规范

- 所有表必须包含: `id (cuid)`, `createdAt`, `updatedAt`, `deletedAt (软删除)`, `tenantId`
- 所有表必须包含 `status` 字段 (ACTIVE/INACTIVE/PENDING/EXPIRED/LOCKED)
- 索引规范: 所有外键、tenantId、status、deletedAt 组合加索引
- 唯一约束必须包含 `tenantId` 和 `deletedAt`（支持软删除后重新创建）

## 7. 日志与审计

- 业务操作必须记录审计日志: `auditLog(action, tenantId, userId, details)`
- 访问日志由中间件自动记录
- 错误日志使用 `logger.error()`，包含上下文信息

## 8. Git 提交规范
```plain
type(scope): subject
type:
feat: 新功能
fix: 修复
docs: 文档
style: 格式
refactor: 重构
perf: 性能
test: 测试
chore: 构建/工具
example:
feat(user): add password change api
fix(auth): resolve tenantId missing in login query
```
## 9. 环境配置规范

- 开发环境使用 `.env.development`
- 生产环境使用 `.env`
- 敏感密钥（JWT_SECRET, 数据库密码）禁止提交到 Git
- Vercel 部署使用 `vercel-build` 脚本（migrate + build）