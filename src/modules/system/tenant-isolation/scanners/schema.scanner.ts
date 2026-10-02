import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { TenantIsolationRepository } from "../repository.js";
import { SCAN_RULES, PLATFORM_TABLES } from "../rules.js";

interface TableRow {
  table_name: string;
}

export class SchemaScanner {
  constructor(private repo: TenantIsolationRepository) {}

  async run(): Promise<{ scannedTables: number; newCount: number }> {
    // 1. 列出所有 BASE TABLE
    const tables = await prisma.$queryRaw<TableRow[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `;

    let newCount = 0;

    for (const { table_name } of tables) {
      if (PLATFORM_TABLES.has(table_name)) continue;

      // 2. 检查 tenant_id 列
      const col = await prisma.$queryRaw<
        Array<{ column_name: string; is_nullable: string }>
      >`
        SELECT column_name, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${table_name}
          AND column_name = 'tenant_id'
      `;

      if (col.length === 0) {
        const r = await this.repo.recordViolation({
          scanType: "schema",
          rule: SCAN_RULES.TENANT_MISSING_COLUMN,
          tableName: table_name,
          message: `表 ${table_name} 缺少 tenant_id 列`,
          suggestion: `ALTER TABLE "${table_name}" ADD COLUMN tenant_id UUID;`,
        });
        if (r.isNew) newCount++;
        continue;
      }

      if (col[0].is_nullable === "YES") {
        const r = await this.repo.recordViolation({
          scanType: "schema",
          rule: SCAN_RULES.TENANT_NULLABLE,
          tableName: table_name,
          columnName: "tenant_id",
          message: `表 ${table_name}.tenant_id 允许 NULL`,
          suggestion: `UPDATE ... SET tenant_id = ... WHERE tenant_id IS NULL; ALTER TABLE ... ALTER COLUMN tenant_id SET NOT NULL;`,
        });
        if (r.isNew) newCount++;
      }

      // 3. 检查索引
      const idx = await prisma.$queryRaw<Array<{ indexdef: string }>>`
        SELECT indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = ${table_name}
          AND indexdef LIKE '%tenant_id%'
      `;

      if (idx.length === 0) {
        const r = await this.repo.recordViolation({
          scanType: "schema",
          rule: SCAN_RULES.TENANT_MISSING_INDEX,
          tableName: table_name,
          columnName: "tenant_id",
          message: `表 ${table_name} 的 tenant_id 没有索引`,
          suggestion: `CREATE INDEX ON "${table_name}" (tenant_id);`,
        });
        if (r.isNew) newCount++;
      } else {
        // 4. 检查组合索引 (tenant_id, is_deleted)
        const hasComposite = idx.some(
          (i) =>
            i.indexdef.includes("tenant_id") &&
            i.indexdef.includes("is_deleted"),
        );
        const hasIsDeleted = await this.hasColumn(table_name, "is_deleted");
        if (hasIsDeleted && !hasComposite) {
          const r = await this.repo.recordViolation({
            scanType: "schema",
            rule: SCAN_RULES.TENANT_MISSING_COMPOSITE_INDEX,
            tableName: table_name,
            columnName: "tenant_id",
            message: `表 ${table_name} 缺少 (tenant_id, is_deleted) 组合索引`,
            suggestion: `CREATE INDEX ON "${table_name}" (tenant_id, is_deleted);`,
          });
          if (r.isNew) newCount++;
        }
      }
    }

    logger.info(
      { tables: tables.length, newCount },
      "[tenant-isolation:schema] scan done",
    );
    return { scannedTables: tables.length, newCount };
  }

  private async hasColumn(table: string, column: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*)::bigint AS c
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    `;
    return Number(rows[0]?.c ?? 0) > 0;
  }
}
