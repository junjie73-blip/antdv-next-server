import { Request, Response } from "express";
import { z } from "zod";
import { BaseController, RouteDef } from "./base-controller.js";
import { BaseRepository, type PaginatedResult } from "./base-repository.js";
export interface CrudSchemaConfig {
  tag: string;
  summaryPrefix: string;
  listQuery?: z.ZodTypeAny;
  createBody?: z.ZodTypeAny;
  updateBody?: z.ZodTypeAny;
  paramSchema?: z.ZodTypeAny;
  responseSchema?: z.ZodTypeAny;
}

export abstract class BaseCrudController<T = any> extends BaseController {
  protected abstract repository: BaseRepository<T>;
  protected abstract schemas: CrudSchemaConfig;

  protected defaultPermissions?: {
    list?: string[];
    get?: string[];
    create?: string[];
    update?: string[];
    delete?: string[];
  };
  protected defaultRoles?: {
    list?: string[];
    get?: string[];
    create?: string[];
    update?: string[];
    delete?: string[];
  };
  protected toResponse(item: T): any {
    return item;
  }
  protected addRoute(route) {
    // 如果路由配置了权限/角色，自动前置认证中间件
    if (route.permissions?.length || route.roles?.length) {
      const authCheck = (req: any, res: any, next: any) => {
        if (!req.user) {
          return res.status(401).json({ success: false, message: "未认证" });
        }
        next();
      };
      route.middlewares = route.middlewares || [];
      route.middlewares.unshift(authCheck);
    }
    super.addRoute(route);
  }
  init() {
    this.registerList();
    this.registerGetById();
    this.registerCreate();
    this.registerUpdate();
    this.registerDelete();
  }

  private registerList() {
    const { tag, summaryPrefix, listQuery, responseSchema } = this.schemas;
    this.addRoute({
      method: "get",
      path: "/",
      validate: listQuery ? { query: listQuery } : undefined,
      permissions: this.defaultPermissions?.list,
      roles: this.defaultRoles?.list,
      docs: {
        tags: [tag],
        summary: `获取${summaryPrefix}列表`,
        description: `分页查询${summaryPrefix}`,
        // @ts-ignore
        request: listQuery ? { query: listQuery } : undefined,
        responses: {
          200: {
            description: "查询成功",
            content: {
              "application/json": {
                schema: z.object({
                  success: z.boolean(),
                  data: z.array(responseSchema || z.any()),
                  total: z.number(),
                }),
              },
            },
          },
        },
      },
      handler: async (req: Request, res: Response) => {
        const { tenantId, page = 1, limit = 20 } = req.query as any;
        const result = await this.repository.findMany(
          tenantId,
          Number(page),
          Number(limit),
        );
        res.json({
          success: true,
          data: result.data.map((item) => this.toResponse(item)),
          total: result.total,
        });
      },
    });
  }

  private registerGetById() {
    const { tag, summaryPrefix, paramSchema, responseSchema } = this.schemas;
    const params = paramSchema || z.object({ id: z.string() });

    this.addRoute({
      method: "get",
      path: "/:id",
      validate: { params },
      permissions: this.defaultPermissions?.get,
      roles: this.defaultRoles?.get,
      docs: {
        tags: [tag],
        summary: `获取单个${summaryPrefix}`,
        // @ts-ignore
        request: { params },
        responses: {
          200: {
            description: "查询成功",
            content: {
              "application/json": {
                schema: z.object({
                  success: z.boolean(),
                  data: responseSchema || z.any(),
                }),
              },
            },
          },
          404: { description: `${summaryPrefix}不存在` },
        },
      },
      handler: async (req: Request, res: Response) => {
        const user = await this.repository.findById(
          req.params.id,
          req.query.tenantId as string,
        );
        if (!user) {
          res
            .status(404)
            .json({ success: false, message: `${summaryPrefix}不存在` });
          return;
        }
        res.json({ success: true, data: this.toResponse(user) });
      },
    });
  }

  private registerCreate() {
    const { tag, summaryPrefix, createBody, responseSchema } = this.schemas;
    if (!createBody) return;

    this.addRoute({
      method: "post",
      path: "/",
      validate: { body: createBody },
      permissions: this.defaultPermissions?.create,
      roles: this.defaultRoles?.create,
      docs: {
        tags: [tag],
        summary: `创建${summaryPrefix}`,
        request: {
          body: {
            content: { "application/json": { schema: createBody } },
            description: "请求体",
          },
        },
        responses: {
          201: {
            description: "创建成功",
            content: {
              "application/json": {
                schema: z.object({
                  success: z.boolean(),
                  data: responseSchema || z.any(),
                }),
              },
            },
          },
        },
      },
      handler: async (req: Request, res: Response) => {
        const item = await this.repository.create(req.body);
        res.status(201).json({ success: true, data: this.toResponse(item) });
      },
    });
  }

  private registerUpdate() {
    const { tag, summaryPrefix, updateBody, paramSchema, responseSchema } =
      this.schemas;
    if (!updateBody) return;
    const params = paramSchema || z.object({ id: z.string() });

    this.addRoute({
      method: "put",
      path: "/:id",
      validate: { params, body: updateBody },
      permissions: this.defaultPermissions?.update,
      roles: this.defaultRoles?.update,
      docs: {
        tags: [tag],
        summary: `更新${summaryPrefix}`,
        request: {
          // @ts-ignore
          params,
          body: {
            content: { "application/json": { schema: updateBody } },
            description: "请求体",
          },
        },
        responses: {
          200: {
            description: "更新成功",
            content: {
              "application/json": {
                schema: z.object({
                  success: z.boolean(),
                  data: responseSchema || z.any(),
                }),
              },
            },
          },
        },
      },
      handler: async (req: Request, res: Response) => {
        const item = await this.repository.update(
          req.params.id,
          req.query.tenantId as string,
          req.body,
        );
        res.json({ success: true, data: this.toResponse(item) });
      },
    });
  }

  private registerDelete() {
    const { tag, summaryPrefix, paramSchema } = this.schemas;
    const params = paramSchema || z.object({ id: z.string() });

    this.addRoute({
      method: "delete",
      path: "/:id",
      validate: { params, query: z.object({ tenantId: z.string() }) },
      permissions: this.defaultPermissions?.delete,
      roles: this.defaultRoles?.delete,
      docs: {
        tags: [tag],
        summary: `删除${summaryPrefix}`,
        // @ts-ignore
        request: { query: z.object({ tenantId: z.string() }), params },
        responses: {
          200: {
            description: "删除成功",
            content: {
              "application/json": {
                schema: z.object({ success: z.boolean() }),
              },
            },
          },
        },
      },
      handler: async (req: Request, res: Response) => {
        await this.repository.delete(
          req.params.id,
          req.query.tenantId as string,
        );
        res.json({ success: true });
      },
    });
  }
}
