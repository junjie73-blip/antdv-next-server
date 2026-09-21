import { mkdir, writeFile, unlink } from "fs/promises";
import path, { join } from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || join(process.cwd(), "uploads", "files");

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

export async function uploadFile(
  filename: string,
  data: Buffer | string,
): Promise<string> {
  await ensureDir(UPLOAD_DIR);
  const idx = filename.lastIndexOf(".");
  const ext = idx > 0 ? filename.slice(idx + 1) : "";
  const uniqueName = `${uuidv4()}${ext ? `.${ext}` : ""}`;
  const filePath = join(UPLOAD_DIR, uniqueName);
  await writeFile(filePath, data);
  return `/uploads/files/${uniqueName}`;
}

export async function deleteFile(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return;
  const fileName = path.basename(url.replace("/uploads/files/", ""));
  const filePath = join(UPLOAD_DIR, fileName);
  if (!path.resolve(filePath).startsWith(path.resolve(UPLOAD_DIR))) {
    console.warn("[blob] path traversal blocked:", url);
    return;
  }
  try {
    await unlink(filePath);
  } catch (e) {
    console.warn("Failed to delete file:", url, e);
  }
}
