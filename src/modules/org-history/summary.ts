/**
 * 生成人类可读的变更摘要。
 * 用于应用层显式调用，触发器已内联生成。
 */

const USER_FIELD_LABEL: Record<string, string> = {
  real_name: "姓名",
  phone: "手机号",
  email: "邮箱",
  avatar: "头像",
  gender: "性别",
  status: "状态",
  id_card: "身份证号",
};

export function summarizeUserUpdate(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string | null {
  const changedFields: string[] = [];
  for (const key of Object.keys(USER_FIELD_LABEL)) {
    if (key in before || key in after) {
      if (String(before[key] ?? "") !== String(after[key] ?? "")) {
        changedFields.push(USER_FIELD_LABEL[key]);
      }
    }
  }
  if (changedFields.length === 0) return null;
  return `修改用户信息：${changedFields.join("、")}`;
}

export function summarizeRoleChange(
  action: "assign" | "revoke",
  userName: string,
  roleName: string,
): string {
  return action === "assign"
    ? `用户「${userName}」分配角色「${roleName}」`
    : `用户「${userName}」移除角色「${roleName}」`;
}

export function summarizeDeptTransfer(
  userName: string,
  fromDeptName: string | null,
  toDeptName: string,
): string {
  if (fromDeptName) {
    return `用户「${userName}」从「${fromDeptName}」调到「${toDeptName}」`;
  }
  return `用户「${userName}」加入部门「${toDeptName}」`;
}

export function summarizeDeptUpdate(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string | null {
  const fields: string[] = [];
  if (before.dept_name !== after.dept_name) fields.push("部门名称");
  if (before.leader_id !== after.leader_id) fields.push("负责人");
  if (before.status !== after.status) fields.push("状态");
  if (before.phone !== after.phone) fields.push("联系电话");
  if (before.email !== after.email) fields.push("邮箱");
  if (fields.length === 0) return null;
  return `更新部门信息：${fields.join("、")}`;
}
