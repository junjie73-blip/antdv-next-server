// ⚠️ 此文件由 scripts/generate-modules.ts 自动生成，请勿手动修改。
// 重新生成: pnpm generate:modules
// CI 校验: pnpm generate:modules:check

import ApprovalFlowController from "./approval/controller/flow.controller.js";
import ApprovalLogController from "./approval/controller/log.controller.js";
import ApprovalRequestController from "./approval/controller/request.controller.js";
import AuthDeviceController from "./auth/controller/device.controller.js";
import AuthLoginController from "./auth/controller/login.controller.js";
import AuthMenuController from "./auth/controller/menu.controller.js";
import AuthMiscController from "./auth/controller/misc.controller.js";
import AuthProfileController from "./auth/controller/profile.controller.js";
import AuthRegisterController from "./auth/controller/register.controller.js";
import AuthTenantSwitchController from "./auth/controller/tenant-switch.controller.js";
import BusinessDashboardController from "./business/dashboard/controller.js";
import BusinessTodoGroupController from "./business/todo-group/controller.js";
import BusinessTodoController from "./business/todo/controller.js";
import BusinessWorkbenchController from "./business/workbench/controller.js";
import GeneratorController from "./generator/controller.js";
import InfrastructureCacheController from "./infrastructure/cache/controller.js";
import InfrastructureFileController from "./infrastructure/file/controller.js";
import InfrastructureJobController from "./infrastructure/job/controller.js";
import InfrastructureJobJobLogController from "./infrastructure/job/job-log.controller.js";
import InfrastructureOnlineController from "./infrastructure/online/controller.js";
import InfrastructureUploadController from "./infrastructure/upload/controller.js";
import MessageTemplateController from "./message/template/controller.js";
import MonitorAuditDailyController from "./monitor/audit-daily/controller.js";
import MonitorAuditLogController from "./monitor/audit-log/controller.js";
import MonitorDatabaseController from "./monitor/database/controller.js";
import MonitorLoginLogController from "./monitor/login-log/controller.js";
import MonitorQpsController from "./monitor/qps/controller.js";
import MonitorServerController from "./monitor/server/controller.js";
import NoticeChannelController from "./notice/channel.controller.js";
import NoticeController from "./notice/controller.js";
import NoticeMyNoticeController from "./notice/my-notice.controller.js";
import RbacPermissionController from "./rbac/controller/permission.controller.js";
import RbacRoleController from "./rbac/controller/role.controller.js";
import SystemDeptController from "./system/dept/controller.js";
import SystemDictDataController from "./system/dict-data/controller.js";
import SystemDictTypeController from "./system/dict-type/controller.js";
import SystemIpRuleController from "./system/ip-rule/controller.js";
import SystemMenuController from "./system/menu/controller.js";
import SystemMfaController from "./system/mfa/controller.js";
import SystemPermissionController from "./system/permission/controller.js";
import SystemRoleController from "./system/role/controller.js";
import SystemSettingController from "./system/setting/controller.js";
import SystemTenantController from "./system/tenant/controller.js";
import SystemUserController from "./system/user/controller.js";

export const controllers = [
  ApprovalFlowController,
  ApprovalLogController,
  ApprovalRequestController,
  AuthDeviceController,
  AuthLoginController,
  AuthMenuController,
  AuthMiscController,
  AuthProfileController,
  AuthRegisterController,
  AuthTenantSwitchController,
  BusinessDashboardController,
  BusinessTodoGroupController,
  BusinessTodoController,
  BusinessWorkbenchController,
  GeneratorController,
  InfrastructureCacheController,
  InfrastructureFileController,
  InfrastructureJobController,
  InfrastructureJobJobLogController,
  InfrastructureOnlineController,
  InfrastructureUploadController,
  MessageTemplateController,
  MonitorAuditDailyController,
  MonitorAuditLogController,
  MonitorDatabaseController,
  MonitorLoginLogController,
  MonitorQpsController,
  MonitorServerController,
  NoticeChannelController,
  NoticeController,
  NoticeMyNoticeController,
  RbacPermissionController,
  RbacRoleController,
  SystemDeptController,
  SystemDictDataController,
  SystemDictTypeController,
  SystemIpRuleController,
  SystemMenuController,
  SystemMfaController,
  SystemPermissionController,
  SystemRoleController,
  SystemSettingController,
  SystemTenantController,
  SystemUserController,
] as const;
