
-- 加签链根 ID
ALTER TABLE wf_task ADD COLUMN IF NOT EXISTS add_sign_chain_root_id UUID;
CREATE INDEX IF NOT EXISTS idx_wf_task_chain_root ON wf_task (add_sign_chain_root_id);

-- 回退来源任务
ALTER TABLE wf_task ADD COLUMN IF NOT EXISTS rollback_from_task_id UUID;
CREATE INDEX IF NOT EXISTS idx_wf_task_rollback_from ON wf_task (rollback_from_task_id);

-- 节点访问次数（回退时 +1）
ALTER TABLE wf_task ADD COLUMN IF NOT EXISTS node_visit_count INT NOT NULL DEFAULT 1;

COMMENT ON COLUMN wf_task.add_sign_chain_root_id IS '加签链根任务 ID（多层加签追溯）';
COMMENT ON COLUMN wf_task.rollback_from_task_id IS '回退来源任务 ID';
COMMENT ON COLUMN wf_task.node_visit_count IS '节点访问次数（首次=1，回退后递增）';