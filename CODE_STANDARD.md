# SaaS Admin Server - 代码规范

## 1. 命名规范

### 1.1 数据库层面
- **表名**: 小写下划线，前缀 `sys_`，如 `sys_user`、`sys_role`
- **字段名**: 小写下划线，如 `user_id`、`created_at`、`is_deleted`
- **主键**: UUID 类型，字段名 `xxx_id`，如 `user_id`、`role_id`
- **关联表**: `sys_主表_从表`，如 `sys_user_role`

### 1.2 代码层面
- **变量/函数**: 小驼峰，如 `userId`、`getUserList()`
- **类名**: 大驼峰，如 `UserService`、`BaseRepository`
- **常量**: 大写下划线，如 `SOFT_DELETE_FLAG`、`SESSION_PREFIX`
- **接口名**: 大驼峰前缀 I，如 `IBaseRepository`、`IControllerHooks`
- **类型别名**: 大驼峰，如 `TokenPayload`、`PageResult`

### 1.3 API 层面
- **请求参数**: 小驼峰，如 `pageNum`、`dictCode`
- **响应字段**: 小驼峰，如 `userId`、`createdAt`
- **路由路径**: 小写中划线，如 `/api/v1/dict-type`、`/user-roles`

## 2. 架构规范

### 2.1 分层结构
```plain
Controller (控制器层)
↓ 调用
Service / Repository (业务/数据层)
↓ 调用
Prisma Client (ORM 层)
↓ 调用
PostgreSQL (数据库层)
```

### 2.2 继承规范
- 新模块优先继承 `BaseController` 和 `BaseRepository`
- 必须实现抽象方法和属性
- 通过重写钩子方法实现业务扩展
- 自定义方法应遵循单一职责原则

### 2.3 文件组织
```plain
modules/模块名/
├── controller.ts      # 控制器（继承 BaseController）
├── service.ts         # 业务服务（可选）
├── repository.ts      # 数据仓库（继承 BaseRepository）
├── types.ts           # 模块类型定义
```

## 3. 编码规范

### 3.1 函数规范
- 单一职责，函数长度不超过 50 行
- 使用 async/await，禁止回调地狱
- 错误处理使用 AppError 抛出，由全局中间件捕获

### 3.2 类型安全
- 禁止使用 any，使用 unknown 替代
- 接口定义优先于类型别名
- 泛型参数必须提供约束

### 3.3 注释规范
- 公共 API 必须添加 JSDoc
- 复杂逻辑添加行内注释
- 钩子方法重写必须说明原因

## 4. 安全规范

- 所有接口默认需要认证（auth: false 显式关闭）
- 敏感操作必须校验权限
- 密码使用 bcrypt 哈希，敏感字段使用 AES 加密
- 所有删除操作必须是软删除
- 审计日志自动记录所有写操作

## 5. 数据库规范

- 禁止使用外键约束，使用关联表
- 所有表必须包含: created_at, updated_at, created_by, updated_by, is_deleted
- 所有查询必须过滤 is_deleted = 0
- 租户隔离通过 tenant_id 实现