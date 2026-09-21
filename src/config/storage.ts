import { env } from "@config/env.js";
import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { logger } from "@/platform/logger/index.js";

function buildEndpoint(): string {
  const proto = env.MINIO_USE_SSL ? "https" : "http";
  const defaultPort = env.MINIO_USE_SSL ? 443 : 80;
  const port =
    env.MINIO_PORT && env.MINIO_PORT !== defaultPort
      ? `:${env.MINIO_PORT}`
      : "";
  return `${proto}://${env.MINIO_ENDPOINT}${port}`;
}

export const s3 = new S3Client({
  region: env.MINIO_REGION,
  endpoint: buildEndpoint(),
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 3_000,
    requestTimeout: 10 * 60_000,
  }),
  maxAttempts: 3,
});

export const FILE_BUCKET = env.MINIO_BUCKET;
export const ARCHIVE_BUCKET = env.MINIO_ARCHIVE_BUCKET ?? env.MINIO_BUCKET;

export async function checkStorage(): Promise<void> {
  if (!env.MINIO_ENABLED) {
    logger.info("[storage] MINIO_ENABLED=false, skip check");
    return;
  }
  const buckets = new Set([FILE_BUCKET, ARCHIVE_BUCKET]);

  try {
    await s3.send(new ListBucketsCommand({}));
  } catch (err: any) {
    logger.error(
      {
        err,
        endpoint: buildEndpoint(),
        name: err?.name,
        status: err?.$metadata?.httpStatusCode,
      },
      "storage unreachable (endpoint/credentials)",
    );
    throw err;
  }

  for (const bucket of buckets) {
    await ensureBucket(bucket);
    logger.info({ bucket }, "storage bucket ready");
  }
}

export async function ensureBucket(bucket: string): Promise<void> {
  try {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    logger.info({ bucket }, "bucket created");
  } catch (err: any) {
    const name: string | undefined = err?.name;
    const status: number | undefined = err?.$metadata?.httpStatusCode;

    if (name === "BucketAlreadyOwnedByYou") {
      logger.debug({ bucket }, "bucket already owned by you");
      return;
    }
    if (status === 409) {
      logger.debug({ bucket, name }, "bucket already exists (409)");
      return;
    }
    if (name === "BucketAlreadyExists") {
      logger.error({ bucket }, "bucket exists but owned by another account");
      throw err;
    }
    logger.error({ err, bucket, name, status }, "ensureBucket failed");
    throw err;
  }
}

export { buildEndpoint };
