import { Project, SyntaxKind, Node } from "ts-morph";
import path from "node:path";
import { TenantIsolationRepository } from "../repository.js";
import { SCAN_RULES } from "../rules.js";
import { logger } from "@/platform/logger/index.js";

const PRISMA_READ_METHODS = [
  "findMany",
  "findFirst",
  "count",
  "aggregate",
  "groupBy",
];
const PRISMA_WRITE_MANY = ["updateMany", "deleteMany"];

export class QueryScanner {
  constructor(private repo: TenantIsolationRepository) {}

  async run(srcDir = path.resolve(process.cwd(), "src")): Promise<{
    scannedFiles: number;
    newCount: number;
  }> {
    const project = new Project({
      tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
      skipAddingFilesFromTsConfig: true,
    });
    project.addSourceFilesAtPaths([
      `${srcDir}/**/*.ts`,
      `!${srcDir}/generated/**`,
      `!${srcDir}/**/*.d.ts`,
    ]);

    const files = project.getSourceFiles();
    let newCount = 0;

    for (const sf of files) {
      const filePath = sf.getFilePath();
      sf.forEachDescendant((node) => {
        if (!Node.isCallExpression(node)) return;

        const expr = node.getExpression().getText();

        // 1) $executeRawUnsafe / $queryRawUnsafe
        if (/\$executeRawUnsafe|\$queryRawUnsafe/.test(expr)) {
          void this.record(sf, node, SCAN_RULES.TENANT_RAW_SQL_UNSAFE, {
            message: `使用了 RawUnsafe：${node.getText().slice(0, 120)}`,
            suggestion: "改用 $executeRaw 模板字符串或 Prisma 参数化 API",
          }).then((isNew) => {
            if (isNew) newCount++;
          });
          return;
        }

        // 2) prisma.xxx.findMany / count ...
        for (const m of [...PRISMA_READ_METHODS, ...PRISMA_WRITE_MANY]) {
          if (!new RegExp(`\\.${m}\\s*\\(`).test(expr)) continue;
          if (!/^prisma\./.test(expr)) continue;
          if (/\$transaction/.test(expr)) continue;

          const argsText = node
            .getArguments()
            .map((a) => a.getText())
            .join(", ");
          if (!/tenant_id/.test(argsText) && !/tenantId/.test(argsText)) {
            const rule = PRISMA_WRITE_MANY.includes(m)
              ? SCAN_RULES.TENANT_UPDATE_NO_TENANT
              : SCAN_RULES.TENANT_MISSING_FILTER;
            void this.record(sf, node, rule, {
              message: `prisma.${m} 调用未包含 tenant_id`,
              suggestion: "调用 BaseRepository 或显式加 where.tenant_id",
            }).then((isNew) => {
              if (isNew) newCount++;
            });
          }
        }
      });
    }

    logger.info(
      { files: files.length, newCount },
      "[tenant-isolation:query] scan done",
    );
    return { scannedFiles: files.length, newCount };
  }

  private async record(
    sf: any,
    node: any,
    rule: (typeof SCAN_RULES)[keyof typeof SCAN_RULES],
    extra: { message: string; suggestion: string },
  ): Promise<boolean> {
    const line = node.getStartLineNumber();
    const relFile = path.relative(process.cwd(), sf.getFilePath());

    // ⚠️ table_name / column_name 用文件名+行号保证唯一
    const r = await this.repo.recordViolation({
      scanType: "query",
      rule,
      tableName: relFile,
      columnName: `L${line}`,
      message: extra.message,
      context: {
        file: relFile,
        line,
        snippet: node.getText().slice(0, 300),
      },
      suggestion: extra.suggestion,
    });
    return r.isNew;
  }
}
