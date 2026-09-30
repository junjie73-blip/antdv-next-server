/**
 * 服务地址解析器接口
 * 每种后端（static / consul / k8s / etcd）都实现此接口
 */
export interface ServiceEndpoint {
  host: string;
  port: number;
  /** 加权负载均衡用（可选） */
  weight?: number;
}

export interface Resolver {
  /** 解析服务名 → 端点列表（可缓存） */
  resolve(serviceName: string): Promise<ServiceEndpoint[]>;

  /** 订阅变化（可选，Consul 场景用） */
  watch?(
    serviceName: string,
    onChange: (endpoints: ServiceEndpoint[]) => void,
  ): () => void;

  /** 关闭资源 */
  close?(): Promise<void>;
}
