import {
  Route,
  Get,
  Post,
  Delete,
  Body,
  Path,
  Query,
  Controller,
  Tags,
  Res,
  TsoaResponse,
} from "@tsoa/runtime";
import { UserRepository } from "./UserRepository.js";
import type { UserResponse, CreateUserRequest } from "./UserModel.js";

@Route("users")
@Tags("用户管理")
export class UserController extends Controller {
  private repo = new UserRepository();

  @Get()
  public async list(
    @Query() tenantId: string,
    @Query() page: number = 1,
    @Query() limit: number = 20,
  ): Promise<{ data: UserResponse[]; total: number }> {
    const result = await this.repo.findMany(tenantId, page, limit);
    return {
      data: result.data.map(this.toResponse),
      total: result.total,
    };
  }

  @Get("{userId}")
  public async getById(
    @Path() userId: string,
    @Query() tenantId: string,
    @Res() notFound: TsoaResponse<404, { message: string }>,
  ): Promise<UserResponse | void> {
    const user = await this.repo.findById(userId, tenantId);
    if (!user) return notFound(404, { message: "用户不存在" });
    return this.toResponse(user);
  }

  @Post()
  public async create(@Body() body: CreateUserRequest): Promise<UserResponse> {
    const user = await this.repo.create(body);
    this.setStatus(201);
    return this.toResponse(user);
  }

  @Delete("{userId}")
  public async remove(
    @Path() userId: string,
    @Query() tenantId: string,
  ): Promise<{ success: boolean }> {
    await this.repo.delete(userId, tenantId);
    return { success: true };
  }

  private toResponse(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
