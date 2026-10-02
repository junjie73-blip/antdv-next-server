export const SCAN_BATCH = 500;
export const SCAN_MAX = 100_000;

export const OPERATION_TYPE = {
  CLEAR_GROUP: "clear_group",
  DELETE_KEY: "delete_key",
  VIEW_STATS: "view_stats",
} as const;
export type OperationType =
  (typeof OPERATION_TYPE)[keyof typeof OPERATION_TYPE];
