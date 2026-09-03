# 项目结构重构方案

## Context

当前项目存在以下问题需要解决：

1. tsconfig 路径别名 `@core/*` 和 `@middleware/*` 与实际目录 `src/common/core/`、`src/common/middleware/` 不匹配
2. 存在多个重复/废弃/空文件
3. 文件名拼写错误
4. 导入路径不一致

## 重构目标

* 将 `src/common/core/` → `src/core/`，使 `@core/*` 路径别名生效

* 将 `src/common/middleware/` → `src/middleware/`，使 `@middleware/*` 路径别名生效

* 清理 5 个废弃/重复/空文件

* 修复文件名拼写 `indedx.ts` → `index.ts`

* 修复 `error-handler.ts` 的 logger 导入路径

## 重构后目标结构

```
src/
├── index.ts                          # 入口点
├── api/
│   └── index.ts                      # 修复拼写
├── core/                             # @core/* 生效
│   ├── base-controller.ts
│   ├── base-crud-controller.ts
│   ├── base-repository.ts
│   ├── decorators.ts
│   ├── scanner.ts
│   └── swagger.ts
├── middleware/                        # @middleware/* 生效
│   ├── auth.ts
│   ├── ddos.ts
│   ├── error-handler.ts
│   ├── rate-limit.ts
│   └── rbac.ts
├── common/
│   ├── logger/
│   ├── rbac/
│   ├── security/                     # 删除废弃的 rbac.ts
│   └── utils/
├── config/
│   ├── blob.ts
│   ├── database.ts
│   ├── env.ts
│   ├── redis.ts
│   └── server.ts                     # 删除 logger.ts 和 swagger.ts
├── generated/prisma/
├── modules/
│   ├── index.ts
│   └── auth/controller.ts
└── types/
    └── express.d.ts
```

## 详细操作步骤

### 步骤 1：删除 5 个废弃/重复/空文件

| 文件                                  | 原因                                     |
| ----------------------------------- | -------------------------------------- |
| `src/config/logger.ts`              | 未被使用，与 `src/common/logger/index.ts` 重复 |
| `src/config/swagger.ts`             | 未被使用，与 `src/core/swagger.ts` 重复        |
| `src/common/security/rbac.ts`       | 已废弃，被 `src/common/rbac/` 模块取代          |
| `src/common/middleware/tenant.ts`   | 空文件                                    |
| `src/common/middleware/validate.ts` | 未被使用，scanner 有内置校验                     |

### 步骤 2：修复文件名拼写

* `src/api/indedx.ts` → `src/api/index.ts`

### 步骤 3：移动 `src/common/core/` → `src/core/`

移动 6 个文件，更新以下导入：

| 文件                               | 旧导入                                       | 新导入                               |
| -------------------------------- | ----------------------------------------- | --------------------------------- |
| `src/index.ts`                   | `"./common/core/swagger.js"`              | `"@core/swagger.js"`              |
| `src/index.ts`                   | `"./common/core/scanner.js"`              | `"@core/scanner.js"`              |
| `src/modules/auth/controller.ts` | `"@/common/core/base-crud-controller.js"` | `"@core/base-crud-controller.js"` |
| `src/core/scanner.ts`            | `"@common/middleware/rbac.js"`            | `"@middleware/rbac.js"`           |

### 步骤 4：移动 `src/common/middleware/` → `src/middleware/`

移动 5 个文件，更新以下导入：

| 文件                                | 旧导入                                     | 新导入                              |
| --------------------------------- | --------------------------------------- | -------------------------------- |
| `src/index.ts`                    | `"@common/middleware/error-handler.js"` | `"@middleware/error-handler.js"` |
| `src/index.ts`                    | `"./common/middleware/ddos.js"`         | `"@middleware/ddos.js"`          |
| `src/index.ts`                    | `"./common/middleware/rate-limit.js"`   | `"@middleware/rate-limit.js"`    |
| `src/middleware/error-handler.ts` | `"@/config/logger.js"`                  | `"@common/logger/index.js"`      |

### 步骤 5：修复 `src/config/server.ts` 的相对路径

* `"../common/logger/index.js"` → `"@common/logger/index.js"`

### 步骤 6：清理空目录

删除 `src/common/core/` 和 `src/common/middleware/` 空目录。

## 验证

```bash
pnpm build   # TypeScript 编译 + tsc-alias 路径解析
pnpm dev     # 开发服务器启动，验证 /api-docs 和 /health 端点
```

## 无需修改的配置

* `tsconfig.json` -- 路径别名已正确配置，无需修改

* `nodemon.json` -- watch 路径为 `src`，无需修改

* `scripts/generate-modules.ts` -- 扫描 `src/modules/`，无需修改

