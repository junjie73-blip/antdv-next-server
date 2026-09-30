import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 解析 proto 目录（相对 contracts 包根） */
function resolveProtoDir(): string {
  // dist/grpc/loader.js → ../../proto
  return path.resolve(__dirname, "../../proto");
}

const cache = new Map<string, any>();

/**
 * 加载指定 proto 文件，返回 protoLoader 解析后的对象
 * @param protoFile 例如 "auth.proto"
 */
export function loadProto<T = any>(protoFile: string): T {
  if (cache.has(protoFile)) return cache.get(protoFile);

  const protoDir = resolveProtoDir();
  const protoPath = path.join(protoDir, protoFile);

  const packageDef = protoLoader.loadSync(protoPath, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [protoDir],
  });

  const loaded = grpc.loadPackageDefinition(packageDef);
  cache.set(protoFile, loaded);
  return loaded as T;
}

/** 清空缓存（测试用） */
export function clearProtoCache(): void {
  cache.clear();
}
