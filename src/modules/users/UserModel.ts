/**
 * @example
 * {
 *   "id": "usr_123456",
 *   "email": "user@example.com",
 *   "name": "张三",
 *   "role": "member",
 *   "createdAt": "2026-08-22T12:00:00Z"
 * }
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tenantId: string;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  tenantId: string;
  role?: "owner" | "admin" | "member" | "viewer";
}
