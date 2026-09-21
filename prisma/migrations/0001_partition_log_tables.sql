-- ============================================================================
-- 0001_partition_log_tables.sql
-- 目的：将三张无限增长的日志大表改造为 PostgreSQL 原生按月 Range 分区
--   - sys_audit_log        （审计日志，写入最频繁）
--   - sys_login_log        （登录日志）
--   - sys_notice_send_log  （通知发送日志）
--
-- ⚠️ 重要说明：
--   1. Prisma Migrate 无法管理分区表，本文件需通过 `prisma migrate dev
--      --create-only` 生成空迁移后手动放入，或使用 `prisma db execute`。
--   2. 分区表的主键/唯一索引必须包含分区键（PG 强制要求），因此
--      主键从 (log_id) 调整为 (log_id, created_at)，应用代码无感知
--      （created_at 由 @default(now()) 填充）。
--   3. 迁移前务必备份；大表迁移使用 CREATE TABLE ... LIKE + 分批
--      INSERT + 重命名交换（见文件末尾注释），避免长锁。
-- ============================================================================

BEGIN;

-- ============================================================================
-- 一、sys_audit_log
-- ============================================================================

-- 1. 主键调整为包含分区键（分区表强制要求）
ALTER TABLE sys_audit_log DROP CONSTRAINT IF EXISTS sys_audit_log_pkey;
ALTER TABLE sys_audit_log ADD PRIMARY KEY (log_id, created_at);

-- 2. 声明为按月 Range 分区表
ALTER TABLE sys_audit_log PARTITION BY RANGE (created_at);

-- 3. 默认分区（兜底所有落在预建分区之外的数据，防止插入失败）
CREATE TABLE IF NOT EXISTS sys_audit_log_default PARTITION OF sys_audit_log DEFAULT;

-- 4. 预建当月与下月分区（命名约定：sys_audit_log_YYYYMM）
--    生产建议一次性预建未来 3 个月，由 log-cleanup Job 每月滚动预建。
CREATE TABLE IF NOT EXISTS sys_audit_log_202609 PARTITION OF sys_audit_log
  FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS sys_audit_log_202610 PARTITION OF sys_audit_log
  FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

-- 5. 索引需建在分区表上（自动应用到所有现有及未来分区）
--    原有高频查询：租户+时间倒序、按用户、按操作类型
CREATE INDEX IF NOT EXISTS idx_audit_tenant_created  ON sys_audit_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_user     ON sys_audit_log (tenant_id, user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_operation       ON sys_audit_log (tenant_id, operation);

-- 注意：分区后 DELETE/UPDATE 必须带 created_at 条件才能高效剪枝，
-- 纯按 log_id 的操作会扫描全部分区（本系统对日志表只有 INSERT/SELECT，可接受）。

-- ============================================================================
-- 二、sys_login_log
-- ============================================================================

ALTER TABLE sys_login_log DROP CONSTRAINT IF EXISTS sys_login_log_pkey;
ALTER TABLE sys_login_log ADD PRIMARY KEY (log_id, created_at);

ALTER TABLE sys_login_log PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS sys_login_log_default PARTITION OF sys_login_log DEFAULT;
CREATE TABLE IF NOT EXISTS sys_login_log_202609 PARTITION OF sys_login_log
  FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS sys_login_log_202610 PARTITION OF sys_login_log
  FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE INDEX IF NOT EXISTS idx_login_tenant_created ON sys_login_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_user           ON sys_login_log (user_id, created_at);

-- ============================================================================
-- 三、sys_notice_send_log
-- ============================================================================

ALTER TABLE sys_notice_send_log DROP CONSTRAINT IF EXISTS sys_notice_send_log_pkey;
ALTER TABLE sys_notice_send_log ADD PRIMARY KEY (log_id, created_at);

ALTER TABLE sys_notice_send_log PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS sys_notice_send_log_default PARTITION OF sys_notice_send_log DEFAULT;
CREATE TABLE IF NOT EXISTS sys_notice_send_log_202609 PARTITION OF sys_notice_send_log
  FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');
CREATE TABLE IF NOT EXISTS sys_notice_send_log_202610 PARTITION OF sys_notice_send_log
  FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE INDEX IF NOT EXISTS idx_nsend_tenant_created ON sys_notice_send_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nsend_notice         ON sys_notice_send_log (notice_id);

COMMIT;

-- ============================================================================
-- 附录：大表（>1000 万行）在线迁移步骤（不停机）
-- ----------------------------------------------------------------------------
--   1. CREATE TABLE sys_audit_log_new (LIKE sys_audit_log INCLUDING ALL);
--   2. 对 _new 执行上面的分区化改造；
--   3. 分批 INSERT INTO sys_audit_log_new SELECT * FROM sys_audit_log
--      WHERE created_at >= $1 AND created_at < $2（每批 5~10 万行，带暂停）；
--   4. 双写窗口期内用触发器或应用层双写补齐增量；
--   5. BEGIN; LOCK TABLE sys_audit_log IN ACCESS EXCLUSIVE MODE;
--      补齐增量 → ALTER TABLE sys_audit_log RENAME TO sys_audit_log_old;
--      ALTER TABLE sys_audit_log_new RENAME TO sys_audit_log; COMMIT;
--   6. 验证后 DROP TABLE sys_audit_log_old（或改名保留观察一周）。
-- ============================================================================
