// @ts-ignore
import { createStream, RotatingFileStream } from "rotating-file-stream";
import path from "path";
import { env as config } from "@config/env.js";

const LOG_DIR = path.join(process.cwd(), "logs");

export const createRotatingStream = (filename: string): RotatingFileStream => {
  return createStream(filename, {
    interval: "1d",
    size: "10M",
    compress: "gzip",
    maxFiles: 30,
    path: LOG_DIR,
  });
};

export const errorStream = createRotatingStream("error.log");
export const combinedStream = createRotatingStream("combined.log");
export const auditFileStream = createRotatingStream("audit.log");
export const consoleTransport =
  config.NODE_ENV === "development"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined;
