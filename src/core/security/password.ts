import { env } from "@/config/env.js";

export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("hashPassword: password must be a non-empty string");
  }
  const bcrypt = await import("bcryptjs");
  const saltRounds = parseInt(env.BCRYPT_SALT_ROUNDS || "12", 10);
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  if (typeof password !== "string" || typeof hash !== "string") return false;
  if (!password || !hash) return false;
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}
