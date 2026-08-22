import pino from "pino";
import { Logtail } from "@logtail/node";

const logtail = process.env.LOGTAIL_SOURCE_TOKEN
  ? new Logtail(process.env.LOGTAIL_SOURCE_TOKEN)
  : null;

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport: logtail
    ? {
        target: "@logtail/pino",
        options: { sourceToken: process.env.LOGTAIL_SOURCE_TOKEN },
      }
    : { target: "pino-pretty", options: { colorize: true } },
});
