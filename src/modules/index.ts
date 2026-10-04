// ⚠️ 此文件由 scripts/generate-modules.ts 自动生成，请勿手动修改。
// 重新生成: pnpm generate:modules
// CI 校验: pnpm generate:modules:check
//
// 末尾的 hash 块用于感知 controller 文件内部实现的变化，
// 每次内容变化都会触发此文件重写。

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
import OrgHistoryController from "./org-history/controllers/controller.js";
import OrgHistorySnapshotController from "./org-history/controllers/snapshot.controller.js";
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
  OrgHistoryController,
  OrgHistorySnapshotController,
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

// ---- controller content hashes (sha256, 16 hex chars) ----
// ./approval/controller/flow.controller.js  1e86d40041247bef
// ./approval/controller/log.controller.js  783b8da9d5416a31
// ./approval/controller/request.controller.js  e9b88aab5b91afba
// ./archive-policy/controller/archive-policy.controller.js  97bd6462259bbf33
// ./auth/controller/device.controller.js  cd3e888b751fcaaf
// ./auth/controller/login.controller.js  b81947f3bfc589eb
// ./auth/controller/menu.controller.js  fc3fb023ca34a8b6
// ./auth/controller/misc.controller.js  68ca38474ae9febf
// ./auth/controller/profile.controller.js  85bc699f2c129943
// ./auth/controller/register.controller.js  9d0d3de85c75cc8b
// ./auth/controller/tenant-switch.controller.js  e9b7ff88230da710
// ./business/dashboard/controller.js  29564addd5e69d91
// ./business/todo-group/controller.js  29a55c202161f225
// ./business/todo/controller.js  169af839773c430b
// ./business/workbench/controller.js  f812483d444cb2e3
// ./export/controller.js  120aaeae4f7aeea3
// ./field-mask/controller/field-mask.controller.js  00ade8cb92c55873
// ./generator/controller.js  2925f36db20e09a7
// ./generator/template/controller/template.controller.js  51f646c610c6c09d
// ./infrastructure/file/controller.js  31270dcd7027d884
// ./infrastructure/job/controller.js  947dded98fa5d795
// ./infrastructure/job/job-log.controller.js  2975de5cf97b4373
// ./infrastructure/upload/controller.js  29169d6b28499002
// ./login-security/controller/login-security.controller.js  16b1217d3d29802d
// ./message/controller/my-message.controller.js  e54cc9eab1a4bf6b
// ./monitor/audit-daily/controller.js  da7de6a3a4ef465f
// ./monitor/audit-log/controller.js  402e13a9c493db46
// ./monitor/cache/controller.js  5a329b24b0deb16e
// ./monitor/cache/controller/cache.controller.js  6a3a810e778d4a62
// ./monitor/database/controller.js  8d1c054494a2e517
// ./monitor/login-log/controller.js  785aaea1d371352b
// ./monitor/logs/controller.js  311e8f0df8f1dd21
// ./monitor/online/controller.js  8b2c0527ae506c4f
// ./monitor/qps/controller.js  fc50c63c5368b1d3
// ./monitor/server/controller.js  cff7345a897c919f
// ./monitor/slow-query/controller/slow-query.controller.js  a67f65f757141a74
// ./notice-preference/controller/preference.controller.js  0d1882dc057718cd
// ./notice/channel.controller.js  9705b273e17d68f8
// ./notice/controller.js  d50106469158e0d9
// ./notice/my-notice.controller.js  020d546056076ddd
// ./org-history/controllers/controller.js  9c4c762c2789a8c9
// ./org-history/controllers/snapshot.controller.js  a9be75b02cd409f6
// ./queue/controller.js  53b80646e3d6c5a2
// ./rbac/controller/permission.controller.js  aa127bf27f793543
// ./rbac/controller/role.controller.js  df6c9f0a0bf64d2e
// ./report/controller/dataset.controller.js  d34b8ad17e3f89da
// ./report/controller/export-task.controller.js  e75e475b662f4aea
// ./report/controller/report.controller.js  f9092171cde2a38e
// ./storage-backend/controller/storage-backend.controller.js  f71ae4c35f364adf
// ./system/backup/controller.js  ed74933b44343fac
// ./system/dept/controller.js  7961fe2055bf1b9e
// ./system/dict-data/controller.js  69bb7b18e71841f7
// ./system/dict-type/controller.js  58849baaef1f8d8b
// ./system/feature-flag/controller.js  71c34a202a18b11d
// ./system/ip-rule/controller.js  7321076ee33dbad5
// ./system/menu/controller.js  bb117cc8bae99c6e
// ./system/mfa/controller.js  c5bc6f4d96bb7c77
// ./system/permission/controller.js  7d83a9c9e7d9745e
// ./system/role/controller.js  e6eba5e057aebff1
// ./system/setting/controller.js  e52ad811c02dd8e4
// ./system/tenant-isolation/controller.js  7d67162d76e95faa
// ./system/tenant/controller.js  8093a49d74d72480
// ./system/user/controller.js  b911ab34a5fd981e
// ./template/controller.js  b9fb301c2d815fd0
// ./user-group/controller/user-group.controller.js  464a7e52a08489be
// ./workflow-center/controller/center.controller.js  78c245a91d8ae5bf
// ./workflow/controller/cc.controller.js  d537d51890071e23
// ./workflow/controller/definition.controller.js  0bc63fdc11ed517d
// ./workflow/controller/delegate.controller.js  b8e60d40d90d6df6
// ./workflow/controller/instance.controller.js  273aaa9adebb6887
// ./workflow/controller/my-cc.controller.js  3b0b7a87bbe0278d
// ./workflow/controller/task-transfer.controller.js  3f9d44f668ffe5d8
// ./workflow/controller/task.controller.js  3cf5323a060b5182
