import { put, del, list } from "@vercel/blob";

export async function uploadFile(
  filename: string,
  data: Buffer | Blob | string,
) {
  const blob = await put(filename, data, {
    access: "public", // 或 'private'
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url; // 返回可访问的 URL
}

export async function deleteFile(url: string) {
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}
