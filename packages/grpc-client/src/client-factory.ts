import * as grpc from "@grpc/grpc-js";
import { loadProto } from "@saas/contracts/grpc";
import type { Resolver, ServiceEndpoint } from "./resolver/types.js";
import { traceInterceptor } from "./interceptors/trace.js";
import { retryInterceptor } from "./interceptors/retry.js";

export interface ClientFactoryOptions {
  serviceName: string;
  protoFile: string;
  protoPackage: string;
  serviceClass: string;
  resolver: Resolver;
  defaultTimeoutMs?: number;
  enableRetry?: boolean;
  channelOptions?: grpc.ChannelOptions;
}

export async function createClient<T>(opts: ClientFactoryOptions): Promise<T> {
  const proto = loadProto<any>(opts.protoFile);
  const ServiceConstructor = opts.protoPackage
    .split(".")
    .reduce((acc, k) => acc?.[k], proto)?.[opts.serviceClass];

  if (!ServiceConstructor) {
    throw new Error(
      `[grpc-client] proto 中找不到 ${opts.protoPackage}.${opts.serviceClass}`,
    );
  }

  const endpoints = await opts.resolver.resolve(opts.serviceName);
  if (endpoints.length === 0) {
    throw new Error(
      `[grpc-client] resolver 未返回任何端点：${opts.serviceName}`,
    );
  }

  const target = pickEndpoint(endpoints);

  const interceptors: grpc.Interceptor[] = [];
  if (opts.enableRetry) {
    interceptors.push(retryInterceptor());
  }
  interceptors.push(traceInterceptor);

  const clientOptions: grpc.ClientOptions = {
    interceptors,
    "grpc.keepalive_time_ms": 30_000,
    "grpc.keepalive_timeout_ms": 5_000,
    "grpc.keepalive_permit_without_calls": 1,
    "grpc.max_receive_message_length": 10 * 1024 * 1024,
    ...(opts.channelOptions ?? {}),
  };

  const credentials = grpc.credentials.createInsecure();
  const address = `${target.host}:${target.port}`;

  const client = new ServiceConstructor(address, credentials, clientOptions);
  return client as T;
}

function pickEndpoint(endpoints: ServiceEndpoint[]): ServiceEndpoint {
  if (endpoints.length === 1) return endpoints[0];
  const total = endpoints.reduce((sum, e) => sum + (e.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const e of endpoints) {
    r -= e.weight ?? 1;
    if (r <= 0) return e;
  }
  return endpoints[0];
}
