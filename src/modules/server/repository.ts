import os from "os";
import { redis } from "@/config/redis.js";
import { prisma } from "@/config/database.js";

function formatBytes(b: number): string {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / k ** i).toFixed(2)} ${u[i]}`;
}

export class ServerRepository {
  async info() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const load = os.loadavg();

    let redisStatus = "disconnected";
    let redisKeys = 0;
    try {
      await redis.ping();
      redisStatus = "connected";
      const info = await redis.info();
      const m = String(info).match(/db0:keys=(\d+)/);
      if (m) redisKeys = Number(m[1]);
    } catch {}

    let dbStatus = "disconnected";
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";
    } catch {}

    return {
      cpu: {
        model: cpus[0]?.model || "Unknown",
        cores: cpus.length,
        loadAvg: load.map((v) => Number(v.toFixed(2))),
        usage: Number(((load[0] / cpus.length) * 100).toFixed(2)),
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        totalHuman: formatBytes(totalMem),
        usedHuman: formatBytes(usedMem),
        freeHuman: formatBytes(freeMem),
        usage: Number(((usedMem / totalMem) * 100).toFixed(2)),
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        nodeVersion: process.version,
        pid: process.pid,
      },
      process: {
        uptime: process.uptime(),
        memoryUsage: {
          rss: formatBytes(process.memoryUsage().rss),
          heapTotal: formatBytes(process.memoryUsage().heapTotal),
          heapUsed: formatBytes(process.memoryUsage().heapUsed),
        },
      },
      redis: { status: redisStatus, keys: redisKeys },
      database: { status: dbStatus },
    };
  }
}
