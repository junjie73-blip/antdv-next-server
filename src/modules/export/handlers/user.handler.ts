import { prisma } from "@/config/database.js";
import type { ExportContext, ExportHandler, ExportResult } from "./types.js";

const BATCH_SIZE = 1000;

export const userExportHandler: ExportHandler = {
  bizType: "user",
  label: "用户列表",
  columns: [
    { header: "用户ID", key: "user_id", width: 36 },
    { header: "用户名", key: "username", width: 20 },
    { header: "真实姓名", key: "real_name", width: 20 },
    { header: "邮箱", key: "email", width: 30 },
    { header: "手机号", key: "phone", width: 18 },
    {
      header: "状态",
      key: "status",
      width: 10,
      formatter: (v: string) => (v === "1" ? "启用" : "禁用"),
    },
    { header: "部门", key: "dept_name", width: 30 },
    { header: "角色", key: "role_names", width: 40 },
    { header: "创建时间", key: "created_at", width: 22 },
  ],

  async execute(ctx: ExportContext): Promise<ExportResult> {
    const { tenantId, queryParams } = ctx;
    const where: any = { tenant_id: tenantId, is_deleted: 0 };

    if (queryParams.keyword) {
      where.OR = [
        { username: { contains: queryParams.keyword } },
        { real_name: { contains: queryParams.keyword } },
      ];
    }
    if (queryParams.status !== undefined) where.status = queryParams.status;

    const totalCount = await prisma.sys_user.count({ where });

    async function* rows() {
      let cursor: string | undefined;
      while (true) {
        const batch = await prisma.sys_user.findMany({
          where,
          take: BATCH_SIZE,
          ...(cursor ? { skip: 1, cursor: { user_id: cursor } } : {}),
          orderBy: { user_id: "asc" },
          include: {
            sys_user_dept: { include: { dept: true } },
            sys_user_role: { include: { role: true } },
          },
        });
        if (batch.length === 0) break;
        for (const u of batch) {
          yield {
            user_id: u.user_id,
            username: u.username,
            real_name: u.real_name ?? "",
            email: u.email ?? "",
            phone: u.phone ?? "",
            status: u.status,
            dept_name: u.sys_user_dept?.[0]?.dept?.dept_name ?? "",
            role_names:
              u.sys_user_role
                ?.map((ur: any) => ur.role?.role_name)
                .filter(Boolean)
                .join(",") ?? "",
            created_at: u.created_at,
          };
        }
        cursor = batch[batch.length - 1].user_id;
        if (batch.length < BATCH_SIZE) break;
      }
    }

    return { rows: rows(), totalCount, fileBaseName: "users" };
  },
};
