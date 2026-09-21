import { s3, FILE_BUCKET, ARCHIVE_BUCKET } from "@/config/storage.js";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import type { Readable } from "node:stream";

export interface PutBufferOptions {
  bucket?: string;
  key: string;
  body: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}

export async function putBuffer(opts: PutBufferOptions): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: opts.bucket ?? FILE_BUCKET,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
      Metadata: opts.metadata,
    }),
  );
}

export interface PutStreamOptions {
  bucket?: string;
  key: string;
  body: Readable;
  contentLength: number;
  contentType?: string;
  metadata?: Record<string, string>;
}

export async function putStream(opts: PutStreamOptions): Promise<void> {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: opts.bucket ?? FILE_BUCKET,
      Key: opts.key,
      Body: opts.body,
      ContentLength: opts.contentLength,
      ContentType: opts.contentType,
      Metadata: opts.metadata,
    },
    queueSize: 4,
    partSize: 8 * 1024 * 1024,
    leavePartsOnError: false,
  });
  await upload.done();
}

export async function deleteObject(
  key: string,
  bucket: string = FILE_BUCKET,
): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getObject(
  key: string,
  bucket: string = FILE_BUCKET,
): Promise<Readable> {
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return res.Body as Readable;
}

export interface PresignedGetOptions {
  key: string;
  bucket?: string;
  expiresSec?: number;
  responseContentType?: string;
  responseContentDisposition?: string;
}

export async function presignedGetUrl(
  opts: PresignedGetOptions,
): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: opts.bucket ?? FILE_BUCKET,
      Key: opts.key,
      ResponseContentType: opts.responseContentType,
      ResponseContentDisposition: opts.responseContentDisposition,
    }),
    { expiresIn: opts.expiresSec ?? 15 * 60 },
  );
}

export async function uploadStream(opts: {
  key: string;
  body: Readable;
  contentType?: string;
  metadata?: Record<string, string>;
}): Promise<string> {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: ARCHIVE_BUCKET,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType ?? "application/gzip",
      Metadata: opts.metadata,
    },
    queueSize: 4,
    partSize: 8 * 1024 * 1024,
    leavePartsOnError: false,
  });
  await upload.done();
  return opts.key;
}
