import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

/* ============================================================
 * 密码策略
 * ============================================================ */
export const PasswordPolicySchema = z
  .object({
    minLength: z.number().int().min(6).max(32).default(8),
    requireUppercase: z.boolean().default(true),
    requireLowercase: z.boolean().default(true),
    requireNumber: z.boolean().default(true),
    requireSpecial: z.boolean().default(false),
    historyCount: z.number().int().min(0).max(20).default(5),
    expireDays: z.number().int().min(0).max(365).default(90),
  })
  .openapi("PasswordPolicy");

/* ============================================================
 * 网站信息
 * ============================================================ */
export const SiteInfoSchema = z
  .object({
    name: z.string().min(1).max(128),
    logo: z.string().max(512).optional().default(""),
    favicon: z.string().max(512).optional().default(""),
    icp: z.string().max(128).optional().default(""),
    copyright: z.string().max(256).optional().default(""),
    description: z.string().max(512).optional().default(""),
    keywords: z.string().max(512).optional().default(""),
  })
  .openapi("SiteInfo");

/* ============================================================
 * 上传配置
 * ============================================================ */
export const UploadConfigSchema = z
  .object({
    storage: z.enum(["local", "minio", "oss", "cos", "s3"]).default("local"),

    /* ---------- 通用限制 ---------- */
    maxSize: z.number().int().min(1).max(1024).default(10),
    allowedTypes: z
      .string()
      .max(512)
      .default("jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,zip"),

    /* ---------- 本地存储 ---------- */
    localPath: z.string().max(256).default("/uploads/files"),
    localUrl: z.string().max(256).default("/uploads"),

    /* ---------- MinIO ---------- */
    minioEndpoint: z.string().max(256).optional().default(""),
    minioPort: z.number().int().min(1).max(65535).optional().default(9000),
    minioUseSSL: z.boolean().optional().default(false),
    minioRegion: z.string().max(64).optional().default("us-east-1"),
    minioBucket: z.string().max(128).optional().default(""),
    minioPublicUrl: z.string().max(256).optional().default(""),
    minioAccessKey: z.string().max(256).optional().default(""),
    minioSecretKey: z.string().max(256).optional().default(""),

    /* ---------- 阿里云 OSS ---------- */
    ossRegion: z.string().max(64).optional().default(""),
    ossBucket: z.string().max(128).optional().default(""),
    ossEndpoint: z.string().max(256).optional().default(""),
    ossCustomDomain: z.string().max(256).optional().default(""),
    ossAccessKeyId: z.string().max(256).optional().default(""),
    ossAccessKeySecret: z.string().max(256).optional().default(""),

    /* ---------- 腾讯云 COS ---------- */
    cosRegion: z.string().max(64).optional().default(""),
    cosBucket: z.string().max(128).optional().default(""),
    cosCustomDomain: z.string().max(256).optional().default(""),
    cosSecretId: z.string().max(256).optional().default(""),
    cosSecretKey: z.string().max(256).optional().default(""),

    /* ---------- AWS S3 ---------- */
    s3Region: z.string().max(64).optional().default(""),
    s3Bucket: z.string().max(128).optional().default(""),
    s3CustomDomain: z.string().max(256).optional().default(""),
    s3AccessKeyId: z.string().max(256).optional().default(""),
    s3AccessKeySecret: z.string().max(256).optional().default(""),
  })
  .superRefine((val, ctx) => {
    const need = (key: string, value: unknown, label: string) => {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label}不能为空`,
          path: [key],
        });
      }
    };

    if (val.storage === "minio") {
      need("minioEndpoint", val.minioEndpoint, "MinIO Endpoint");
      need("minioBucket", val.minioBucket, "MinIO Bucket");
      need("minioAccessKey", val.minioAccessKey, "MinIO AccessKey");
      need("minioSecretKey", val.minioSecretKey, "MinIO SecretKey");
    }

    if (val.storage === "oss") {
      need("ossRegion", val.ossRegion, "OSS Region");
      need("ossBucket", val.ossBucket, "OSS Bucket");
      need("ossAccessKeyId", val.ossAccessKeyId, "OSS AccessKeyId");
      need("ossAccessKeySecret", val.ossAccessKeySecret, "OSS AccessKeySecret");
    }

    if (val.storage === "cos") {
      need("cosRegion", val.cosRegion, "COS Region");
      need("cosBucket", val.cosBucket, "COS Bucket");
      need("cosSecretId", val.cosSecretId, "COS SecretId");
      need("cosSecretKey", val.cosSecretKey, "COS SecretKey");
    }

    if (val.storage === "s3") {
      need("s3Region", val.s3Region, "S3 Region");
      need("s3Bucket", val.s3Bucket, "S3 Bucket");
      need("s3AccessKeyId", val.s3AccessKeyId, "S3 AccessKeyId");
      need("s3AccessKeySecret", val.s3AccessKeySecret, "S3 AccessKeySecret");
    }
  })
  .openapi("UploadConfig");

export type PasswordPolicyDTO = z.infer<typeof PasswordPolicySchema>;
export type SiteInfoDTO = z.infer<typeof SiteInfoSchema>;
export type UploadConfigDTO = z.infer<typeof UploadConfigSchema>;
