import multer from "multer";
import { env } from "@/config/env.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(env.UPLOAD_MAX_FILE_SIZE) || 100 * 1024 * 1024,
  },
});
