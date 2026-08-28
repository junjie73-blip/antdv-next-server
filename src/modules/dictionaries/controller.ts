import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Tag,
  Summary,
  Body,
  Query,
  Params,
  RequirePermission,
} from "@common/core/decorators.js";
import { BaseCrudController } from "@common/core/base-crud-controller.js";
import {
  DictionaryRepository,
  DictionaryItemRepository,
} from "./repository.js";
import {
  DictionarySchema,
  DictionaryItemSchema,
  CreateDictionaryBody,
  CreateDictionaryItemBody,
} from "./schema.js";
import { z } from "zod";

@Controller("/dictionaries")
export default class DictionaryController extends BaseCrudController {
  protected repository = new DictionaryRepository();
  protected schemas = {
    tag: "字典管理",
    summaryPrefix: "字典",
    listQuery: z.object({
      tenantId: z.string(),
      category: z.string().optional(),
    }),
    createBody: CreateDictionaryBody,
    responseSchema: DictionarySchema,
  };
  protected defaultPermissions = {
    list: ["dictionary:read"],
    create: ["dictionary:write"],
    update: ["dictionary:write"],
    delete: ["dictionary:delete"],
  };

  @Tag("字典管理")
  @Summary("根据编码查询字典（含字典项）")
  @Get("/code/:code")
  async byCode(req: any, res: any) {
    const { code } = req.params;
    const { tenantId } = req.query;
    const data = await (this.repository as DictionaryRepository).findByCode(
      tenantId,
      code,
    );
    if (!data) {
      return res.status(404).json({ success: false, message: "字典不存在" });
    }
    res.json({ success: true, data });
  }

  @Tag("字典管理")
  @Summary("获取字典项列表")
  @Get("/:dictId/items")
  async items(req: any, res: any) {
    const { dictId } = req.params;
    const { tenantId, page = 1, limit = 100 } = req.query;
    const result = await new DictionaryItemRepository().findByDictId(
      tenantId,
      dictId,
      Number(page),
      Number(limit),
    );
    res.json({ success: true, data: result.data, total: result.total });
  }

  @Tag("字典管理")
  @Summary("创建字典项")
  @RequirePermission("dictionary:write")
  @Post("/:dictId/items")
  async createItem(req: any, res: any) {
    const { dictId } = req.params;
    const { tenantId } = req.query;
    const body = { ...req.body, dictId, tenantId };
    const item = await new DictionaryItemRepository().create(body);
    res.status(201).json({ success: true, data: item });
  }

  @Tag("字典管理")
  @Summary("更新字典项")
  @RequirePermission("dictionary:write")
  @Put("/items/:id")
  async updateItem(req: any, res: any) {
    const { id } = req.params;
    const { tenantId } = req.query;
    const item = await new DictionaryItemRepository().update(
      id,
      tenantId,
      req.body,
    );
    res.json({ success: true, data: item });
  }

  @Tag("字典管理")
  @Summary("删除字典项")
  @RequirePermission("dictionary:delete")
  @Delete("/items/:id")
  async deleteItem(req: any, res: any) {
    const { id } = req.params;
    const { tenantId } = req.query;
    await new DictionaryItemRepository().delete(id, tenantId);
    res.json({ success: true });
  }
}
