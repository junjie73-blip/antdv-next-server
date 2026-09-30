import { redis } from "@/config/redis.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
// ⭐ 用你项目里现成的函数式导出
import { sendVerifyCode } from "@/platform/email/service.js";
import { UserRepository } from "@/modules/system/user/repository.js";

const CODE_TTL_SECONDS = 5 * 60; // 验证码有效期 5 分钟
const COOLDOWN_SECONDS = 60; // 同用户发送冷却 60 秒
const DAILY_LIMIT = 10; // 单用户每日最多发送 10 次
const VERIFY_FAIL_LIMIT = 5; // 连续验证失败 5 次锁定
const VERIFY_FAIL_WINDOW = 10 * 60; // 失败计数窗口 10 分钟

const SCENE_LABEL: Record<string, string> = {
  email_bind: "邮箱绑定",
  email_change: "邮箱换绑",
};

export class EmailVerifyService {
  private repo = new UserRepository();

  /**
   * 发送验证码
   */
  async sendCode(
    userId: string,
    tenantId: string,
    email: string,
    scene: "email_bind" | "email_change",
  ): Promise<{ expiresIn: number }> {
    // 1. 冷却检查
    const cooldownKey = `email:code:cooldown:${userId}`;
    if (await redis.get(cooldownKey)) {
      const ttl = await redis.ttl(cooldownKey);
      throw new AppError(`请 ${ttl} 秒后再试`, 429001, 429);
    }

    // 2. 每日限额
    const dailyKey = `email:code:daily:${userId}:${new Date().toISOString().slice(0, 10)}`;
    const dailyCount = Number((await redis.get(dailyKey)) ?? 0);
    if (dailyCount >= DAILY_LIMIT) {
      throw new AppError("今日发送次数已达上限，请明日再试", 429001, 429);
    }

    // 3. 邮箱占用检查
    const taken = await this.repo.isEmailTaken(email, tenantId, userId);
    if (taken) {
      throw new AppError("该邮箱已被其他账号绑定", 400001, 400);
    }

    // 4. 生成验证码
    const code = this.generateCode();

    // 5. 落库
    const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000);
    await this.repo.createVerifyCode({
      tenantId,
      userId,
      target: email,
      code,
      scene,
      expiresAt,
    });

    // 6. ⭐ 调用现成的 sendVerifyCode 函数（不是 emailService.xxx）
    const purpose = SCENE_LABEL[scene] ?? "邮箱";
    try {
      await sendVerifyCode(email, code, purpose);
    } catch (err) {
      logger.error({ err, email, scene }, "[email-verify] send failed");
      throw new AppError("邮件发送失败，请稍后重试", 500001, 500);
    }

    // 7. 冷却 + 日限额
    await Promise.all([
      redis.setex(cooldownKey, COOLDOWN_SECONDS, "1"),
      redis.multi().incr(dailyKey).expire(dailyKey, 86400).exec(),
    ]);

    logger.info({ userId, tenantId, email, scene }, "[email-verify] code sent");

    return { expiresIn: CODE_TTL_SECONDS };
  }

  /**
   * 验证并绑定邮箱
   */
  async verifyAndBind(
    userId: string,
    tenantId: string,
    email: string,
    code: string,
  ): Promise<void> {
    const failKey = `email:verify:fail:${userId}`;
    const failCount = Number((await redis.get(failKey)) ?? 0);
    if (failCount >= VERIFY_FAIL_LIMIT) {
      const ttl = await redis.ttl(failKey);
      throw new AppError(
        `验证失败次数过多，请 ${Math.ceil(ttl / 60)} 分钟后再试`,
        429001,
        429,
      );
    }

    // 查有效验证码
    const upperCode = code.toUpperCase();
    const record =
      (await this.repo.findValidCode(
        tenantId,
        userId,
        email,
        upperCode,
        "email_bind",
      )) ??
      (await this.repo.findValidCode(
        tenantId,
        userId,
        email,
        upperCode,
        "email_change",
      ));

    if (!record) {
      await redis
        .multi()
        .incr(failKey)
        .expire(failKey, VERIFY_FAIL_WINDOW)
        .exec();
      throw new AppError("验证码错误或已过期", 400001, 400);
    }

    // 事务：标记已用 + 更新用户
    await this.repo.markCodeUsed(record.id);
    await this.repo.updateUserEmail(userId, tenantId, email);

    // 清失败计数
    await redis.del(failKey);

    logger.info({ userId, tenantId, email }, "[email-verify] bound");
  }

  /**
   * 生成 6 位验证码（去掉 0/O/1/I/L）
   */
  private generateCode(): string {
    const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * 定时清理过期验证码
   */
  async cleanExpiredCodes(): Promise<number> {
    return this.repo.cleanExpiredCodes();
  }
}
