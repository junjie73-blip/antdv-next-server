# @saas/contracts

SaaS Admin 各服务共享的契约包：

## 内容

- **enums/** — 共享枚举（状态、角色、渠道、审计操作）
- **errors/** — 统一错误码
- **types/** — 跨服务类型（ApiResponse、AuthUser、UserProfile）
- **events/** — 事件契约（阶段三使用）
- **proto/** — gRPC 协议定义
- **utils/** — 分页、校验等工具

## 使用

```ts
import { ERROR_CODE, AUDIT_OP, type AuthUser } from "@saas/contracts";
import { STATUS, DATA_SCOPE } from "@saas/contracts/enums";
import { buildPageResponse } from "@saas/contracts/utils";