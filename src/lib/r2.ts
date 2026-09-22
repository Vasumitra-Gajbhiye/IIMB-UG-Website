import { randomUUID } from "node:crypto";

import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { extFromMime } from "@/lib/gallery";

const PRESIGN_EXPIRES_SECONDS = 30 * 60;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. See docs/r2-setup.md for Cloudflare R2 setup.`,
    );
  }
  return value;
}

function getConfig() {
  return {
    accountId: requiredEnv("R2_ACCOUNT_ID"),
    accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    bucket: requiredEnv("R2_BUCKET_NAME"),
    publicBaseUrl: requiredEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, ""),
  };
}

const globalForR2 = globalThis as unknown as { r2?: S3Client };

function getClient(): S3Client {
  if (globalForR2.r2) return globalForR2.r2;
  const { accountId, accessKeyId, secretAccessKey } = getConfig();
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  if (process.env.NODE_ENV !== "production") globalForR2.r2 = client;
  return client;
}

export function publicUrlForKey(key: string): string {
  const { publicBaseUrl } = getConfig();
  return `${publicBaseUrl}/${key}`;
}

export function galleryObjectKey(userId: string, contentType: string): string {
  const ext = extFromMime(contentType) ?? "bin";
  const year = new Date().getFullYear();
  return `gallery/${userId}/${year}/${randomUUID()}.${ext}`;
}

export async function presignGalleryPut(options: {
  userId: string;
  contentType: string;
  sizeBytes: number;
}): Promise<{ key: string; uploadUrl: string; publicUrl: string }> {
  const { bucket } = getConfig();
  const key = galleryObjectKey(options.userId, options.contentType);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: options.contentType,
    ContentLength: options.sizeBytes,
  });
  const uploadUrl = await getSignedUrl(getClient(), command, {
    expiresIn: PRESIGN_EXPIRES_SECONDS,
  });
  return { key, uploadUrl, publicUrl: publicUrlForKey(key) };
}

export async function presignProfileImagePut(options: {
  userId: string;
  kind: "avatar" | "banner";
  contentType: string;
  sizeBytes: number;
}): Promise<{ key: string; uploadUrl: string; publicUrl: string }> {
  const { bucket } = getConfig();
  const ext = extFromMime(options.contentType) ?? "bin";
  const key = `profiles/${options.userId}/${options.kind}-${randomUUID()}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: options.contentType,
    ContentLength: options.sizeBytes,
  });
  const uploadUrl = await getSignedUrl(getClient(), command, {
    expiresIn: PRESIGN_EXPIRES_SECONDS,
  });
  return { key, uploadUrl, publicUrl: publicUrlForKey(key) };
}

export async function presignBlogImagePut(options: {
  userId: string;
  contentType: string;
  sizeBytes: number;
}): Promise<{ key: string; uploadUrl: string; publicUrl: string }> {
  const { bucket } = getConfig();
  const ext = extFromMime(options.contentType) ?? "bin";
  const key = `blogs/${options.userId}/${randomUUID()}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: options.contentType,
    ContentLength: options.sizeBytes,
  });
  const uploadUrl = await getSignedUrl(getClient(), command, {
    expiresIn: PRESIGN_EXPIRES_SECONDS,
  });
  return { key, uploadUrl, publicUrl: publicUrlForKey(key) };
}

/** Object key for one of our own blog image URLs, else null. */
export function blogKeyFromUrl(url: string): string | null {
  const base = getConfig().publicBaseUrl;
  if (!url.startsWith(`${base}/blogs/`)) return null;
  return url.slice(base.length + 1);
}

/** Object key for one of our own profile image URLs, else null. */
export function profileKeyFromUrl(url: string, userId: string): string | null {
  const prefix = `${getConfig().publicBaseUrl}/profiles/${userId}/`;
  if (!url.startsWith(prefix)) return null;
  return url.slice(getConfig().publicBaseUrl.length + 1);
}

export async function deleteGalleryObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const { bucket } = getConfig();
  const unique = [...new Set(keys)].filter(Boolean);
  for (let i = 0; i < unique.length; i += 1000) {
    const chunk = unique.slice(i, i + 1000);
    await getClient().send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
  }
}
