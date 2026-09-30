import { AppError } from "@/core/errors.js";
import { SettingsRepository } from "./repository.js";
import { getCached, setCached, invalidateAndBroadcast } from "./cache.js";
import type {
  PasswordPolicyDTO,
  SiteInfoDTO,
  UploadConfigDTO,
} from "./schema.js";
import { logger } from "@/platform/logger/index.js";
import { encrypt, decrypt } from "@/core/index.js";
import { invalidateStorage } from "@/platform/storage/factory.js";

const ENCRYPTED_PREFIX = "encrypted.";

export class SettingsService {
  private repo = new SettingsRepository();

  /* ============================================================
   * 通用读取
   * ============================================================ */
  async getRaw(tenantId: string, key: string): Promise<string | null> {
    const cacheKey = key;
    const cached = await getCached(tenantId, cacheKey);
    if (cached !== undefined) return cached;

    const row = await this.repo.findByKey(tenantId, key);
    if (!row) {
      await setCached(tenantId, cacheKey, null);
      return null;
    }

    let value = row.config_value;
    if (key.startsWith(ENCRYPTED_PREFIX) && value) {
      try {
        value = decrypt(value);
      } catch (err) {
        logger.error({ err, key }, "[settings] decrypt failed");
        value = null;
      }
    }

    await setCached(tenantId, cacheKey, value);
    return value;
  }

  /* ============================================================
   * 通用写入
   * ============================================================ */
  async setRaw(
    tenantId: string,
    key: string,
    value: string | null,
    description: string | null,
    userId?: string,
  ): Promise<void> {
    let stored = value;
    if (key.startsWith(ENCRYPTED_PREFIX) && value) {
      stored = encrypt(value);
    }

    await this.repo.upsert(tenantId, key, stored, description, userId);
    await invalidateAndBroadcast(tenantId, [key]);
  }

  /* ============================================================
   * ⭐ 密码策略
   * ============================================================ */
  async getPasswordPolicy(tenantId: string): Promise<PasswordPolicyDTO> {
    const rows = await this.repo.findByPrefix(tenantId, ["password."]);
    const map = Object.fromEntries(
      rows.map((r) => [
        r.config_key.replace("password.", ""),
        r.config_value ?? "",
      ]),
    );

    return {
      minLength: Number(map.minLength) || 8,
      requireUppercase: map.requireUppercase === "true",
      requireLowercase: map.requireLowercase === "true",
      requireNumber: map.requireNumber === "true",
      requireSpecial: map.requireSpecial === "true",
      historyCount: Number(map.historyCount) || 5,
      expireDays: Number(map.expireDays) || 0,
    };
  }

  async updatePasswordPolicy(
    tenantId: string,
    dto: PasswordPolicyDTO,
    userId?: string,
  ): Promise<void> {
    const entries = [
      { key: "password.minLength", value: String(dto.minLength) },
      { key: "password.requireUppercase", value: String(dto.requireUppercase) },
      { key: "password.requireLowercase", value: String(dto.requireLowercase) },
      { key: "password.requireNumber", value: String(dto.requireNumber) },
      { key: "password.requireSpecial", value: String(dto.requireSpecial) },
      { key: "password.historyCount", value: String(dto.historyCount) },
      { key: "password.expireDays", value: String(dto.expireDays) },
    ];

    await this.repo.upsertMany(tenantId, entries, userId);
    await invalidateAndBroadcast(
      tenantId,
      entries.map((e) => e.key),
    );
  }

  /* ============================================================
   * ⭐ 网站信息（公开接口）
   * ============================================================ */
  async getSiteInfo(tenantId: string): Promise<SiteInfoDTO> {
    const rows = await this.repo.findByPrefix(tenantId, ["site."]);
    const map = Object.fromEntries(
      rows.map((r) => [
        r.config_key.replace("site.", ""),
        r.config_value ?? "",
      ]),
    );

    return {
      name: map.name ?? "SaaS Admin",
      logo: map.logo ?? "",
      favicon: map.favicon ?? "",
      icp: map.icp ?? "",
      copyright: map.copyright ?? "",
      description: map.description ?? "",
      keywords: map.keywords ?? "",
    };
  }

  async updateSiteInfo(
    tenantId: string,
    dto: SiteInfoDTO,
    userId?: string,
  ): Promise<void> {
    const entries = [
      { key: "site.name", value: dto.name },
      { key: "site.logo", value: dto.logo ?? "" },
      { key: "site.favicon", value: dto.favicon ?? "" },
      { key: "site.icp", value: dto.icp ?? "" },
      { key: "site.copyright", value: dto.copyright ?? "" },
      { key: "site.description", value: dto.description ?? "" },
      { key: "site.keywords", value: dto.keywords ?? "" },
    ];

    await this.repo.upsertMany(tenantId, entries, userId);
    await invalidateAndBroadcast(
      tenantId,
      entries.map((e) => e.key),
    );
  }

  async updateUploadConfig(
    tenantId: string,
    dto: UploadConfigDTO,
    userId?: string,
  ): Promise<void> {
    const entries: Array<{ key: string; value: string; encrypted?: boolean }> =
      [];

    // 通用
    entries.push(
      { key: "upload.storage", value: dto.storage },
      { key: "upload.maxSize", value: String(dto.maxSize) },
      { key: "upload.allowedTypes", value: dto.allowedTypes },
    );

    // local
    entries.push(
      { key: "upload.local.path", value: dto.localPath },
      { key: "upload.local.url", value: dto.localUrl },
    );

    // minio
    entries.push(
      { key: "upload.minio.endpoint", value: dto.minioEndpoint ?? "" },
      { key: "upload.minio.port", value: String(dto.minioPort ?? 9000) },
      { key: "upload.minio.useSSL", value: String(!!dto.minioUseSSL) },
      { key: "upload.minio.region", value: dto.minioRegion ?? "" },
      { key: "upload.minio.bucket", value: dto.minioBucket ?? "" },
      { key: "upload.minio.publicUrl", value: dto.minioPublicUrl ?? "" },
    );

    // oss
    entries.push(
      { key: "upload.oss.region", value: dto.ossRegion ?? "" },
      { key: "upload.oss.bucket", value: dto.ossBucket ?? "" },
      { key: "upload.oss.endpoint", value: dto.ossEndpoint ?? "" },
      { key: "upload.oss.customDomain", value: dto.ossCustomDomain ?? "" },
    );

    // cos
    entries.push(
      { key: "upload.cos.region", value: dto.cosRegion ?? "" },
      { key: "upload.cos.bucket", value: dto.cosBucket ?? "" },
      { key: "upload.cos.customDomain", value: dto.cosCustomDomain ?? "" },
    );

    // s3
    entries.push(
      { key: "upload.s3.region", value: dto.s3Region ?? "" },
      { key: "upload.s3.bucket", value: dto.s3Bucket ?? "" },
      { key: "upload.s3.customDomain", value: dto.s3CustomDomain ?? "" },
    );

    /* ⭐ 敏感字段：脱敏值 "******" 表示不修改 */
    const encryptedEntries: Array<{ key: string; value: string }> = [];
    const collectEncrypted = (key: string, value: string | undefined) => {
      if (!value || value === "******") return;
      encryptedEntries.push({ key, value });
    };

    collectEncrypted("upload.minio.accessKey", dto.minioAccessKey);
    collectEncrypted("upload.minio.secretKey", dto.minioSecretKey);
    collectEncrypted("upload.oss.accessKeyId", dto.ossAccessKeyId);
    collectEncrypted("upload.oss.accessKeySecret", dto.ossAccessKeySecret);
    collectEncrypted("upload.cos.secretId", dto.cosSecretId);
    collectEncrypted("upload.cos.secretKey", dto.cosSecretKey);
    collectEncrypted("upload.s3.accessKeyId", dto.s3AccessKeyId);
    collectEncrypted("upload.s3.accessKeySecret", dto.s3AccessKeySecret);

    /* 合并：普通字段明文 + 敏感字段加密 */
    const allEntries = [
      ...entries,
      ...encryptedEntries.map((e) => ({
        key: `${ENCRYPTED_PREFIX}${e.key}`,
        value: encrypt(e.value),
      })),
    ];

    await this.repo.upsertMany(
      tenantId,
      allEntries.map((e) => ({ key: e.key, value: e.value })),
      userId,
    );

    // 清缓存 + 广播
    await invalidateAndBroadcast(
      tenantId,
      allEntries.map((e) => e.key),
    );

    // ⭐ 清 storage 实例缓存
    invalidateStorage(tenantId);

    logger.info(
      { tenantId, storage: dto.storage, count: allEntries.length },
      "[settings] upload config updated",
    );
  }
  async getUploadConfigRaw(tenantId: string): Promise<UploadConfigDTO> {
    const rows = await this.repo.findByPrefix(tenantId, [
      "upload.",
      "encrypted.upload.",
    ]);

    const map: Record<string, string> = {};
    for (const r of rows) {
      if (r.config_key.startsWith(ENCRYPTED_PREFIX)) {
        const realKey = r.config_key.slice(ENCRYPTED_PREFIX.length);
        const val = r.config_value ?? "";
        if (val) {
          try {
            map[realKey] = decrypt(val);
          } catch (err) {
            logger.error(
              { err, key: r.config_key, tenantId },
              "[settings] decrypt failed, using empty",
            );
            // ✅ 显式记录，不静默
            map[realKey] = "";
          }
        } else {
          map[realKey] = "";
        }
      } else {
        map[r.config_key] = r.config_value ?? "";
      }
    }

    // ⭐ 所有字段都是真实值，不脱敏
    return {
      storage: (map["upload.storage"] as any) ?? "local",
      maxSize: Number(map["upload.maxSize"]) || 10,
      allowedTypes: map["upload.allowedTypes"] ?? "",
      localPath: map["upload.local.path"] ?? "/uploads/files",
      localUrl: map["upload.local.url"] ?? "/uploads",

      minioEndpoint: map["upload.minio.endpoint"] ?? "",
      minioPort: Number(map["upload.minio.port"]) || 9000,
      minioUseSSL: map["upload.minio.useSSL"] === "true",
      minioRegion: map["upload.minio.region"] || "us-east-1",
      minioBucket: map["upload.minio.bucket"] ?? "",
      minioPublicUrl: map["upload.minio.publicUrl"] ?? "",
      minioAccessKey: map["upload.minio.accessKey"] ?? "",
      minioSecretKey: map["upload.minio.secretKey"] ?? "", // ⭐ 真实值

      ossRegion: map["upload.oss.region"] ?? "",
      ossBucket: map["upload.oss.bucket"] ?? "",
      ossEndpoint: map["upload.oss.endpoint"] ?? "",
      ossCustomDomain: map["upload.oss.customDomain"] ?? "",
      ossAccessKeyId: map["upload.oss.accessKeyId"] ?? "",
      ossAccessKeySecret: map["upload.oss.accessKeySecret"] ?? "", // ⭐

      cosRegion: map["upload.cos.region"] ?? "",
      cosBucket: map["upload.cos.bucket"] ?? "",
      cosCustomDomain: map["upload.cos.customDomain"] ?? "",
      cosSecretId: map["upload.cos.secretId"] ?? "", // ⭐
      cosSecretKey: map["upload.cos.secretKey"] ?? "", // ⭐

      s3Region: map["upload.s3.region"] ?? "",
      s3Bucket: map["upload.s3.bucket"] ?? "",
      s3CustomDomain: map["upload.s3.customDomain"] ?? "",
      s3AccessKeyId: map["upload.s3.accessKeyId"] ?? "", // ⭐
      s3AccessKeySecret: map["upload.s3.accessKeySecret"] ?? "", // ⭐
    };
  }
  /**
   * 前端展示：敏感字段脱敏
   */
  async getUploadConfig(tenantId: string): Promise<UploadConfigDTO> {
    const raw = await this.getUploadConfigRaw(tenantId);

    return {
      ...raw,
      // ⭐ 敏感字段：有值就返回 ******，否则返回空字符串
      minioSecretKey: raw.minioSecretKey ? "******" : "",
      ossAccessKeySecret: raw.ossAccessKeySecret ? "******" : "",
      cosSecretKey: raw.cosSecretKey ? "******" : "",
      s3AccessKeySecret: raw.s3AccessKeySecret ? "******" : "",
    };
  }
}
