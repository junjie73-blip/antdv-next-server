import { QpsMonitorService } from "./service.js";

export const qpsMonitor = new QpsMonitorService();

// 每秒采样一次
const timer = setInterval(() => qpsMonitor.sample(), 1000);
timer.unref();
