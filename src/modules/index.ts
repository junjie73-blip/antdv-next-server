// ⚠️ 此文件由 scripts/generate-modules.ts 自动生成，请勿手动修改。
// 重新生成: pnpm generate:modules
// CI 校验: pnpm generate:modules:check

import ApprovalFlowController from "./approval/controller/flow.controller.js";
import ApprovalLogController from "./approval/controller/log.controller.js";
import ApprovalRequestController from "./approval/controller/request.controller.js";
import ArchivePolicyArchivePolicyController from "./archive-policy/controller/archive-policy.controller.js";
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
import ExportController from "./export/controller.js";
import FieldMaskFieldMaskController from "./field-mask/controller/field-mask.controller.js";
import GeneratorController from "./generator/controller.js";
import GeneratorTemplateTemplateController from "./generator/template/controller/template.controller.js";
import InfrastructureFileController from "./infrastructure/file/controller.js";
import InfrastructureJobController from "./infrastructure/job/controller.js";
import InfrastructureJobJobLogController from "./infrastructure/job/job-log.controller.js";
import InfrastructureUploadController from "./infrastructure/upload/controller.js";
import LoginSecurityLoginSecurityController from "./login-security/controller/login-security.controller.js";
import MessageMyMessageController from "./message/controller/my-message.controller.js";
import MonitorAuditDailyController from "./monitor/audit-daily/controller.js";
import MonitorAuditLogController from "./monitor/audit-log/controller.js";
import MonitorCacheController from "./monitor/cache/controller.js";
import MonitorCacheCacheController from "./monitor/cache/controller/cache.controller.js";
import MonitorDatabaseController from "./monitor/database/controller.js";
import MonitorLoginLogController from "./monitor/login-log/controller.js";
import MonitorLogsController from "./monitor/logs/controller.js";
import MonitorOnlineController from "./monitor/online/controller.js";
import MonitorQpsController from "./monitor/qps/controller.js";
import MonitorServerController from "./monitor/server/controller.js";
import MonitorSlowQuerySlowQueryController from "./monitor/slow-query/controller/slow-query.controller.js";
import NoticePreferencePreferenceController from "./notice-preference/controller/preference.controller.js";
import NoticeChannelController from "./notice/channel.controller.js";
import NoticeController from "./notice/controller.js";
import NoticeMyNoticeController from "./notice/my-notice.controller.js";
import QueueController from "./queue/controller.js";
import RbacPermissionController from "./rbac/controller/permission.controller.js";
import RbacRoleController from "./rbac/controller/role.controller.js";
import ReportDatasetController from "./report/controller/dataset.controller.js";
import ReportExportTaskController from "./report/controller/export-task.controller.js";
import ReportReportController from "./report/controller/report.controller.js";
import StorageBackendStorageBackendController from "./storage-backend/controller/storage-backend.controller.js";
import SystemBackupController from "./system/backup/controller.js";
import SystemDeptController from "./system/dept/controller.js";
import SystemDictDataController from "./system/dict-data/controller.js";
import SystemDictTypeController from "./system/dict-type/controller.js";
import SystemFeatureFlagController from "./system/feature-flag/controller.js";
import SystemIpRuleController from "./system/ip-rule/controller.js";
import SystemMenuController from "./system/menu/controller.js";
import SystemMfaController from "./system/mfa/controller.js";
import SystemPermissionController from "./system/permission/controller.js";
import SystemRoleController from "./system/role/controller.js";
import SystemSettingController from "./system/setting/controller.js";
import SystemTenantIsolationController from "./system/tenant-isolation/controller.js";
import SystemTenantController from "./system/tenant/controller.js";
import SystemUserController from "./system/user/controller.js";
import TemplateController from "./template/controller.js";
import UserGroupUserGroupController from "./user-group/controller/user-group.controller.js";
import WorkflowCenterCenterController from "./workflow-center/controller/center.controller.js";
import WorkflowCcController from "./workflow/controller/cc.controller.js";
import WorkflowDefinitionController from "./workflow/controller/definition.controller.js";
import WorkflowDelegateController from "./workflow/controller/delegate.controller.js";
import WorkflowInstanceController from "./workflow/controller/instance.controller.js";
import WorkflowMyCcController from "./workflow/controller/my-cc.controller.js";
import WorkflowTaskTransferController from "./workflow/controller/task-transfer.controller.js";
import WorkflowTaskController from "./workflow/controller/task.controller.js";

export const controllers = [
  ApprovalFlowController,
  ApprovalLogController,
  ApprovalRequestController,
  ArchivePolicyArchivePolicyController,
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
  ExportController,
  FieldMaskFieldMaskController,
  GeneratorController,
  GeneratorTemplateTemplateController,
  InfrastructureFileController,
  InfrastructureJobController,
  InfrastructureJobJobLogController,
  InfrastructureUploadController,
  LoginSecurityLoginSecurityController,
  MessageMyMessageController,
  MonitorAuditDailyController,
  MonitorAuditLogController,
  MonitorCacheController,
  MonitorCacheCacheController,
  MonitorDatabaseController,
  MonitorLoginLogController,
  MonitorLogsController,
  MonitorOnlineController,
  MonitorQpsController,
  MonitorServerController,
  MonitorSlowQuerySlowQueryController,
  NoticePreferencePreferenceController,
  NoticeChannelController,
  NoticeController,
  NoticeMyNoticeController,
  QueueController,
  RbacPermissionController,
  RbacRoleController,
  ReportDatasetController,
  ReportExportTaskController,
  ReportReportController,
  StorageBackendStorageBackendController,
  SystemBackupController,
  SystemDeptController,
  SystemDictDataController,
  SystemDictTypeController,
  SystemFeatureFlagController,
  SystemIpRuleController,
  SystemMenuController,
  SystemMfaController,
  SystemPermissionController,
  SystemRoleController,
  SystemSettingController,
  SystemTenantIsolationController,
  SystemTenantController,
  SystemUserController,
  TemplateController,
  UserGroupUserGroupController,
  WorkflowCenterCenterController,
  WorkflowCcController,
  WorkflowDefinitionController,
  WorkflowDelegateController,
  WorkflowInstanceController,
  WorkflowMyCcController,
  WorkflowTaskTransferController,
  WorkflowTaskController,
] as const;
