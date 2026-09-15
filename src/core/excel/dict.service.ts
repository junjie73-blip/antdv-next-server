import { AppError } from "@/core/errors.js";
import { parseExcel, generateExcel } from "@/core/excel/excel.service.js";
import { DictDataRepository } from "@/modules/dict-data/repository.js";
import { DictTypeRepository } from "@/modules/dict-type/repository.js";
import * as XLSX from "xlsx";
import { BaseService } from "../base/service.js";

export class DictService extends BaseService<DictTypeRepository> {
  private readonly dataRepo: DictDataRepository;

  constructor(typeRepo: DictTypeRepository, dataRepo: DictDataRepository) {
    super(typeRepo);
    this.dataRepo = dataRepo;
  }

  // ============================================================
  // 唯一性校验
  // ============================================================

  async checkTypeBeforeCreate(dto: any, tenantId: string) {
    await this.assertUnique(
      () => this.repository.findByDictCode(dto.dictCode, tenantId),
      "字典编码",
      dto.dictCode,
    );
  }

  async checkTypeBeforeUpdate(id: string, dto: any, tenantId: string) {
    if (!dto.dictCode) return;
    const existing = await this.repository.findByDictCode(
      dto.dictCode,
      tenantId,
      id,
    );
    if (existing) {
      throw new AppError(`字典编码 '${dto.dictCode}' 已存在`, 409001, 409);
    }
  }

  async checkDataBeforeCreate(dto: any, tenantId: string) {
    await this.assertUnique(
      () => this.dataRepo.findByLabel(dto.dictTypeId, dto.dictLabel, tenantId),
      "字典标签",
      dto.dictLabel,
    );
  }

  async checkDataBeforeUpdate(id: string, dto: any, tenantId: string) {
    if (!dto.dictTypeId || !dto.dictLabel) return;
    const existing = await this.dataRepo.findByLabel(
      dto.dictTypeId,
      dto.dictLabel,
      tenantId,
      id,
    );
    if (existing) {
      throw new AppError(`字典标签 '${dto.dictLabel}' 已存在`, 409001, 409);
    }
  }

  // ============================================================
  // 业务查询
  // ============================================================

  async getDataByCode(dictCode: string, tenantId: string, dictTypeId?: string) {
    return this.dataRepo.findByDictCodeAndType(dictCode, tenantId, dictTypeId);
  }

  async getTree(
    tenantId: string,
    filter?: { dictTypeId?: string; dictCode?: string },
  ) {
    const types = await this.repository.findAllEnabled(tenantId, filter);
    if (types.length === 0) return [];

    const typeIds = types.map((t: any) => t.dict_type_id);
    const dataList = await this.dataRepo.findAllEnabledByTypeIds(
      typeIds,
      tenantId,
    );

    return types.map((type: any) => ({
      dictTypeId: type.dict_type_id,
      dictCode: type.dict_code,
      dictName: type.dict_name,
      children: dataList
        .filter((d: any) => d.dict_type_id === type.dict_type_id)
        .map((d: any) => ({
          dictDataId: d.dict_data_id,
          dictLabel: d.dict_label,
          dictValue: d.dict_value,
          sortOrder: d.sort_order,
        })),
    }));
  }

  // ============================================================
  // 导入导出（双 Sheet）
  // ============================================================

  async exportToExcel(tenantId: string): Promise<Buffer> {
    const [types, datas] = await Promise.all([
      this.repository.findAllForExport(tenantId),
      this.dataRepo.findAllForExport(tenantId),
    ]);

    const typeRows = types.map((t: any) => ({
      字典编码: t.dict_code,
      字典名称: t.dict_name,
      描述: t.description || "",
      状态: t.status === "1" ? "启用" : "禁用",
    }));

    const dataRows = datas.map((d: any) => ({
      字典编码: d.dict_code,
      字典标签: d.dict_label,
      字典值: d.dict_value,
      排序: d.sort_order,
      状态: d.status === "1" ? "启用" : "禁用",
      备注: d.remark || "",
    }));

    const wb = XLSX.utils.book_new();
    const typeWs = XLSX.utils.json_to_sheet(typeRows);
    typeWs["!cols"] = [{ wch: 20 }, { wch: 24 }, { wch: 30 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, typeWs, "字典类型");

    const dataWs = XLSX.utils.json_to_sheet(dataRows);
    dataWs["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 8 },
      { wch: 8 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, dataWs, "字典数据");

    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  }

  async importFromExcel(buffer: Buffer, tenantId: string, userId?: string) {
    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(buffer, { type: "buffer" });
    } catch {
      throw new AppError("Excel 格式错误", 400001, 400);
    }

    const errors: string[] = [];
    let typeSuccess = 0;
    let dataSuccess = 0;

    // 1) 字典类型
    const typeSheet = wb.Sheets["字典类型"] || wb.Sheets[wb.SheetNames[0]];
    if (typeSheet) {
      const typeRows = XLSX.utils.sheet_to_json(typeSheet, {
        defval: "",
      }) as any[];
      const existing = await this.repository.getExistingCodes(tenantId);

      for (let i = 0; i < typeRows.length; i++) {
        const row = typeRows[i];
        const rowNum = i + 2;
        const code = String(row["字典编码"] || "").trim();
        const name = String(row["字典名称"] || "").trim();

        if (!code || !name) {
          errors.push(`[字典类型] 第 ${rowNum} 行：编码和名称必填`);
          continue;
        }
        if (existing.has(code)) {
          errors.push(`[字典类型] 第 ${rowNum} 行：编码「${code}」已存在`);
          continue;
        }

        try {
          await this.repository.insertType({
            tenantId,
            dictCode: code,
            dictName: name,
            description: String(row["描述"] || ""),
            status: row["状态"] === "禁用" ? "0" : "1",
            userId,
          });
          existing.add(code);
          typeSuccess++;
        } catch (e: any) {
          errors.push(`[字典类型] 第 ${rowNum} 行：${e.message}`);
        }
      }
    }

    // 2) 字典数据
    const dataSheet = wb.Sheets["字典数据"] || wb.Sheets[wb.SheetNames[1]];
    if (dataSheet) {
      const dataRows = XLSX.utils.sheet_to_json(dataSheet, {
        defval: "",
      }) as any[];
      const codeToId = await this.repository.getCodeToIdMap(tenantId);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2;
        const code = String(row["字典编码"] || "").trim();
        const label = String(row["字典标签"] || "").trim();
        const value = String(row["字典值"] || "").trim();

        if (!code || !label || !value) {
          errors.push(`[字典数据] 第 ${rowNum} 行：编码/标签/值必填`);
          continue;
        }

        const typeId = codeToId.get(code);
        if (!typeId) {
          errors.push(`[字典数据] 第 ${rowNum} 行：字典编码「${code}」不存在`);
          continue;
        }

        try {
          await this.dataRepo.insertData({
            tenantId,
            dictTypeId: typeId,
            dictLabel: label,
            dictValue: value,
            sortOrder: Number(row["排序"] || 0),
            status: row["状态"] === "禁用" ? "0" : "1",
            remark: String(row["备注"] || ""),
            userId,
          });
          dataSuccess++;
        } catch (e: any) {
          errors.push(`[字典数据] 第 ${rowNum} 行：${e.message}`);
        }
      }
    }

    return {
      successCount: typeSuccess + dataSuccess,
      failCount: errors.length,
      errors,
      summary: { types: typeSuccess, data: dataSuccess },
    };
  }
}
