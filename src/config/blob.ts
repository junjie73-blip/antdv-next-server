import { mkdir, writeFile, unlink } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || join(process.cwd(), "uploads", "files");

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

/**
 * 保存文件到本地磁盘
 * @param filename 原始文件名（用于提取扩展名）
 * @param data Buffer 或字符串
 * @returns 文件 URL（相对路径，如 /uploads/files/xxx.png）
 */
export async function uploadFile(
  filename: string,
  data: Buffer | string,
): Promise<string> {
  await ensureDir(UPLOAD_DIR);
  const ext = filename.split(".").pop() || "";
  const uniqueName = `${uuidv4()}${ext ? `.${ext}` : ""}`;
  const filePath = join(UPLOAD_DIR, uniqueName);
  await writeFile(filePath, data);
  return `/uploads/files/${uniqueName}`;
}

export async function deleteFile(url: string) {
  // 仅删除本地文件，注意防止路径穿越
  if (!url.startsWith("/uploads/")) return;
  const fileName = url.replace("/uploads/files/", "");
  const filePath = join(UPLOAD_DIR, fileName);
  try {
    await unlink(filePath);
  } catch (e) {
    // 文件不存在或删除失败，可忽略或记录日志
    console.warn("Failed to delete file:", url, e);
  }
}
