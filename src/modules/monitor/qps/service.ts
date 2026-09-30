import { register } from "@/platform/metrics/registry.js";

export interface QpsPoint {
  timestamp: number;
  qps: number;
}

export interface EndpointStat {
  endpoint: string;
  method: string;
  count: number;
  avgTime: number;
}

export interface QpsSummary {
  currentQps: number;
  peakQps: number;
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  scope: "instance" | "tenant";
}

export class QpsMonitorService {
  /**
   * 从 prom-client 采集 QPS 数据
   * 通过 /metrics 文本解析
   */
  async getQpsData(windowSeconds = 300): Promise<{
    timeline: QpsPoint[];
    summary: QpsSummary;
    endpoints: EndpointStat[];
    statusDistribution: { status: string; count: number }[];
    methodDistribution: { method: string; count: number }[];
  }> {
    // 1. 拉取 metrics 文本
    const metrics = await register.metrics();
    const lines = metrics.split("\n");

    // 2. 解析 http_requests_total
    const endpointMap = new Map<
      string,
      { count: number; totalTime: number; method: string }
    >();
    const statusMap = new Map<string, number>();
    const methodMap = new Map<string, number>();
    let totalRequests = 0;
    let totalDuration = 0;
    let durationCount = 0;
    let errorCount = 0;

    for (const line of lines) {
      // http_requests_total{method="GET",path="/api/v1/user",status="200"} 123
      if (line.startsWith("http_requests_total{")) {
        const m = line.match(
          /method="([^"]+)",path="([^"]+)",status="([^"]+)"\}\s+([\d.]+)/,
        );
        if (m) {
          const [, method, path, status, count] = m;
          const n = Number(count);
          totalRequests += n;

          const key = `${method} ${path}`;
          const cur = endpointMap.get(key) ?? {
            count: 0,
            totalTime: 0,
            method,
          };
          cur.count += n;
          endpointMap.set(key, cur);

          statusMap.set(status, (statusMap.get(status) ?? 0) + n);
          methodMap.set(method, (methodMap.get(method) ?? 0) + n);

          if (status.startsWith("5") || status.startsWith("4")) {
            errorCount += n;
          }
        }
      }

      // http_request_duration_seconds_sum{...} 1.23
      if (line.startsWith("http_request_duration_seconds_sum{")) {
        const m = line.match(
          /method="([^"]+)",path="([^"]+)"[^}]*\}\s+([\d.]+)/,
        );
        if (m) {
          const [, method, path, sum] = m;
          const key = `${method} ${path}`;
          const cur = endpointMap.get(key);
          if (cur) {
            cur.totalTime += Number(sum);
          }
          totalDuration += Number(sum);
        }
      }

      // http_request_duration_seconds_count{...} 100
      if (line.startsWith("http_request_duration_seconds_count{")) {
        const m = line.match(
          /method="([^"]+)",path="([^"]+)"[^}]*\}\s+([\d.]+)/,
        );
        if (m) {
          durationCount += Number(m[3]);
        }
      }
    }

    // 3. 计算 endpoints 统计
    const endpoints: EndpointStat[] = Array.from(endpointMap.entries())
      .map(([key, v]) => {
        const [method, path] = key.split(" ");
        return {
          endpoint: path,
          method,
          count: v.count,
          avgTime: v.count > 0 ? Number((v.totalTime / v.count).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    // 4. summary
    const avgResponseTime =
      durationCount > 0
        ? Number(((totalDuration / durationCount) * 1000).toFixed(2))
        : 0;
    const errorRate =
      totalRequests > 0
        ? Number(((errorCount / totalRequests) * 100).toFixed(2))
        : 0;

    // 5. QPS 时间线（基于当前时间倒推，实际由前端轮询采样）
    //    这里返回最近 N 秒的一个"瞬时快照"
    const now = Date.now();
    const timeline: QpsPoint[] = Array.from({ length: windowSeconds }).map(
      (_, i) => ({
        timestamp: now - (windowSeconds - i - 1) * 1000,
        qps: 0,
      }),
    );

    return {
      timeline,
      summary: {
        currentQps: this.calcCurrentQps(),
        peakQps: 0,
        totalRequests,
        avgResponseTime,
        errorRate,
        scope: "instance",
      },
      endpoints,
      statusDistribution: Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count),
      methodDistribution: Array.from(methodMap.entries()).map(
        ([method, count]) => ({ method, count }),
      ),
    };
  }

  /**
   * 实时 QPS（基于最近 5 秒滑动窗口）
   * 用内存计数，避免依赖 Prometheus 时序库
   */
  private recentRequests: number[] = [];

  /** 由中间件在每次请求时调用 */
  recordRequest(): void {
    const now = Date.now();
    this.recentRequests.push(now);
    // 保留最近 5 秒
    const cutoff = now - 5000;
    this.recentRequests = this.recentRequests.filter((t) => t > cutoff);
  }

  private calcCurrentQps(): number {
    const now = Date.now();
    const cutoff = now - 5000;
    const recent = this.recentRequests.filter((t) => t > cutoff);
    return Number((recent.length / 5).toFixed(2));
  }

  /**
   * 采样：定时记录 QPS 到内存环形缓冲区（默认保留 1 小时）
   */
  private qpsHistory: QpsPoint[] = [];
  private readonly MAX_HISTORY = 3600; // 1 小时，每秒一个点

  sample(): void {
    const now = Date.now();
    this.qpsHistory.push({
      timestamp: now,
      qps: this.calcCurrentQps(),
    });
    if (this.qpsHistory.length > this.MAX_HISTORY) {
      this.qpsHistory = this.qpsHistory.slice(-this.MAX_HISTORY);
    }
  }

  getHistory(minutes = 5): QpsPoint[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.qpsHistory.filter((p) => p.timestamp >= cutoff);
  }
}
