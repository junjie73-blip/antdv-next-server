// ⚠️ 此文件由 scripts/generate-modules.ts 自动生成，请勿手动修改。
// 重新生成: pnpm generate:modules
// CI 校验: pnpm generate:modules:check

import AuditLogController from "./audit-log/controller.js";
import AuthLoginController from "./auth/controller/login.controller.js";
import AuthMenuController from "./auth/controller/menu.controller.js";
import AuthMiscController from "./auth/controller/misc.controller.js";
import AuthProfileController from "./auth/controller/profile.controller.js";
import AuthRegisterController from "./auth/controller/register.controller.js";
import AuthTenantSwitchController from "./auth/controller/tenant-switch.controller.js";
import CacheController from "./cache/controller.js";
import ConfigController from "./config/controller.js";
import DashboardController from "./dashboard/controller.js";
import DeptController from "./dept/controller.js";
import DictDataController from "./dict-data/controller.js";
import DictTypeController from "./dict-type/controller.js";
import FileController from "./file/controller.js";
import GeneratorController from "./generator/controller.js";
import IpRuleController from "./ip-rule/controller.js";
import JobController from "./job/controller.js";
import JobJobLogController from "./job/job-log.controller.js";
import LoginLogController from "./login-log/controller.js";
import MenuController from "./menu/controller.js";
import MfaController from "./mfa/controller.js";
import NoticeChannelController from "./notice/channel.controller.js";
import NoticeController from "./notice/controller.js";
import NoticeMyNoticeController from "./notice/my-notice.controller.js";
import OnlineController from "./online/controller.js";
import PermissionController from "./permission/controller.js";
import RbacPermissionController from "./rbac/controller/permission.controller.js";
import RbacRoleController from "./rbac/controller/role.controller.js";
import RoleController from "./role/controller.js";
import ServerController from "./server/controller.js";
import TenantController from "./tenant/controller.js";
import TodoGroupController from "./todo-group/controller.js";
import TodoController from "./todo/controller.js";
import UploadController from "./upload/controller.js";
import UserController from "./user/controller.js";
import WorkbenchController from "./workbench/controller.js";

export const controllers = [
  AuditLogController,
  AuthLoginController,
  AuthMenuController,
  AuthMiscController,
  AuthProfileController,
  AuthRegisterController,
  AuthTenantSwitchController,
  CacheController,
  ConfigController,
  DashboardController,
  DeptController,
  DictDataController,
  DictTypeController,
  FileController,
  GeneratorController,
  IpRuleController,
  JobController,
  JobJobLogController,
  LoginLogController,
  MenuController,
  MfaController,
  NoticeChannelController,
  NoticeController,
  NoticeMyNoticeController,
  OnlineController,
  PermissionController,
  RbacPermissionController,
  RbacRoleController,
  RoleController,
  ServerController,
  TenantController,
  TodoGroupController,
  TodoController,
  UploadController,
  UserController,
  WorkbenchController,
] as const;
