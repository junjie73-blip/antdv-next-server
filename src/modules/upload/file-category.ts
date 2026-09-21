export const FILE_CATEGORIES = [
  "image",
  "video",
  "audio",
  "word",
  "text",
  "archive",
  "other",
  "application",
] as const;

export type FileCategory = (typeof FILE_CATEGORIES)[number];

/** 兜底：任何异常都返回 other，绝不让上传失败 */
export function getFileCategory(
  mimeType: string | null | undefined,
  filename: string | null | undefined,
): FileCategory {
  try {
    const mime = String(mimeType || "")
      .toLowerCase()
      .trim();
    const name = String(filename || "").toLowerCase();
    const dot = name.lastIndexOf(".");
    const ext = dot >= 0 ? name.slice(dot) : "";

    // ===== 顺序很重要，特殊优先于通用 =====

    // 1. Markdown —— 必须在 text/ 之前！
    if (
      mime === "text/markdown" ||
      mime === "text/x-markdown" ||
      ext === ".md" ||
      ext === ".markdown" ||
      ext === ".mdown" ||
      ext === ".mkd"
    ) {
      return "word";
    }

    // 2. 图片 / 视频 / 音频
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";

    // 4. Office
    if (
      mime === "application/pdf" ||
      ext === ".pdf" ||
      mime.includes("word") ||
      mime.includes("excel") ||
      mime.includes("spreadsheet") ||
      mime.includes("presentation") ||
      mime.includes("powerpoint") ||
      mime === "application/msword" ||
      [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"].includes(ext)
    ) {
      return "word";
    }

    // 5. 纯文本（此时 markdown 已被前面拦截）
    if (mime.startsWith("text/")) return "word";

    // 6. 压缩包
    if (
      mime.includes("zip") ||
      mime.includes("rar") ||
      mime.includes("7z") ||
      mime.includes("tar") ||
      mime.includes("gzip") ||
      [".zip", ".rar", ".7z", ".tar", ".gz", ".tgz"].includes(ext)
    ) {
      return "archive";
    }
    // 7. 其他应用文件
    if (mime.startsWith("application/x-msdownload") && ext === ".exe")
      return "application";
    return "other";
  } catch {
    // ⚠️ 任何异常（比如 mimeType 是奇怪类型）都不让上传失败
    return "other";
  }
}

/** 防御：外部传进来的 category 必须校验，非法值一律回退 other */
export function normalizeCategory(input: unknown): FileCategory {
  if (
    typeof input === "string" &&
    (FILE_CATEGORIES as readonly string[]).includes(input)
  ) {
    return input as FileCategory;
  }
  return "other";
}
