import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";

interface SnapshotData {
  depts: Array<{
    dept_id: string;
    parent_id: string | null;
    dept_name: string;
    leader_id: string | null;
    status: string;
  }>;
  users: Array<{
    user_id: string;
    username: string;
    real_name: string | null;
    status: string;
  }>;
  userDepts: Array<{ user_id: string; dept_id: string; is_primary: number }>;
  userRoles: Array<{ user_id: string; role_id: string }>;
}

export class SnapshotDiffService {
  async diff(snapshotIdA: string, snapshotIdB: string, tenantId: string) {
    let [a, b] = await Promise.all([
      prisma.sys_org_snapshot.findFirst({
        where: { snapshot_id: snapshotIdA, tenant_id: tenantId },
      }),
      prisma.sys_org_snapshot.findFirst({
        where: { snapshot_id: snapshotIdB, tenant_id: tenantId },
      }),
    ]);
    if (!a || !b) throw new AppError("快照不存在", 404001, 404);
    if (a.snapshot_date > b.snapshot_date) [a, b] = [b, a]; // 保证 A 早于 B

    const dataA = a.data as unknown as SnapshotData;
    const dataB = b.data as unknown as SnapshotData;

    /* ========== 部门 Diff ========== */
    const deptMapA = new Map(dataA.depts.map((d) => [d.dept_id, d]));
    const deptMapB = new Map(dataB.depts.map((d) => [d.dept_id, d]));

    const deptAdded = dataB.depts.filter((d) => !deptMapA.has(d.dept_id));
    const deptRemoved = dataA.depts.filter((d) => !deptMapB.has(d.dept_id));
    const deptUpdated: Array<{ before: any; after: any; changes: string[] }> =
      [];
    for (const d of dataB.depts) {
      const before = deptMapA.get(d.dept_id);
      if (!before) continue;
      const changes: string[] = [];
      if (before.dept_name !== d.dept_name) changes.push("名称");
      if (before.parent_id !== d.parent_id) changes.push("父级");
      if (before.leader_id !== d.leader_id) changes.push("负责人");
      if (before.status !== d.status) changes.push("状态");
      if (changes.length > 0) deptUpdated.push({ before, after: d, changes });
    }

    /* ========== 用户 Diff ========== */
    const userMapA = new Map(dataA.users.map((u) => [u.user_id, u]));
    const userMapB = new Map(dataB.users.map((u) => [u.user_id, u]));
    const userAdded = dataB.users.filter((u) => !userMapA.has(u.user_id));
    const userRemoved = dataA.users.filter((u) => !userMapB.has(u.user_id));

    /* ========== 用户-部门 Diff ========== */
    const buildUserDeptSet = (arr: SnapshotData["userDepts"]) =>
      new Set(arr.map((x) => `${x.user_id}:${x.dept_id}`));
    const udA = buildUserDeptSet(dataA.userDepts);
    const udB = buildUserDeptSet(dataB.userDepts);
    const userDeptAdded = dataB.userDepts.filter(
      (x) => !udA.has(`${x.user_id}:${x.dept_id}`),
    );
    const userDeptRemoved = dataA.userDepts.filter(
      (x) => !udB.has(`${x.user_id}:${x.dept_id}`),
    );

    /* ========== 用户-角色 Diff ========== */
    const buildUserRoleSet = (arr: SnapshotData["userRoles"]) =>
      new Set(arr.map((x) => `${x.user_id}:${x.role_id}`));
    const urA = buildUserRoleSet(dataA.userRoles);
    const urB = buildUserRoleSet(dataB.userRoles);
    const userRoleAdded = dataB.userRoles.filter(
      (x) => !urA.has(`${x.user_id}:${x.role_id}`),
    );
    const userRoleRemoved = dataA.userRoles.filter(
      (x) => !urB.has(`${x.user_id}:${x.role_id}`),
    );

    /* ========== 填充 name（便于展示） ========== */
    const deptNameMap = new Map(
      [...dataA.depts, ...dataB.depts].map((d) => [d.dept_id, d.dept_name]),
    );
    const userNameMap = new Map(
      [...dataA.users, ...dataB.users].map((u) => [
        u.user_id,
        u.real_name ?? u.username,
      ]),
    );

    const fill = <T extends { user_id?: string; dept_id?: string }>(arr: T[]) =>
      arr.map((x) => ({
        ...x,
        userName: x.user_id ? (userNameMap.get(x.user_id) ?? "—") : undefined,
        deptName: x.dept_id ? (deptNameMap.get(x.dept_id) ?? "—") : undefined,
      }));

    /* ========== 摘要 ========== */
    const summary = {
      dept: {
        added: deptAdded.length,
        removed: deptRemoved.length,
        updated: deptUpdated.length,
      },
      user: {
        added: userAdded.length,
        removed: userRemoved.length,
      },
      userDept: {
        added: userDeptAdded.length,
        removed: userDeptRemoved.length,
      },
      userRole: {
        added: userRoleAdded.length,
        removed: userRoleRemoved.length,
      },
    };

    return {
      snapshotA: {
        id: a.snapshot_id,
        date: a.snapshot_date,
        userCount: a.user_count,
        deptCount: a.dept_count,
      },
      snapshotB: {
        id: b.snapshot_id,
        date: b.snapshot_date,
        userCount: b.user_count,
        deptCount: b.dept_count,
      },
      summary,
      detail: {
        deptAdded: fill(deptAdded as any[]),
        deptRemoved: fill(deptRemoved as any[]),
        deptUpdated,
        userAdded: fill(userAdded as any[]),
        userRemoved: fill(userRemoved as any[]),
        userDeptAdded: fill(userDeptAdded as any[]),
        userDeptRemoved: fill(userDeptRemoved as any[]),
        userRoleAdded: fill(userRoleAdded as any[]),
        userRoleRemoved: fill(userRoleRemoved as any[]),
      },
    };
  }
}
