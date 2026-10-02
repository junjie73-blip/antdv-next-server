import { AppError } from "@/core/errors.js";
import { ExpressionEvaluator } from "./expression-evaluator.js";
import type { WorkflowDefinitionJSON } from "../schema.js";

/**
 * BPMN 定义深度校验
 * 校验项：
 * 1. 结构完整性（start/end、id 唯一）
 * 2. 节点必填字段
 * 3. 边的引用合法性
 * 4. 条件表达式合法性
 * 5. 表单字段合法性
 * 6. 图连通性
 */
export class WorkflowValidator {
  validate(def: WorkflowDefinitionJSON): void {
    this.checkStructure(def);
    this.checkNodeUniqueness(def);
    this.checkStartEnd(def);
    this.checkNodeConfigs(def);
    this.checkEdges(def);
    this.checkConditions(def);
    this.checkConnectivity(def);
    this.checkFormSchemas(def);
  }

  /* ============================================================
   * 1. 结构完整性
   * ============================================================ */
  private checkStructure(def: WorkflowDefinitionJSON): void {
    if (!def || typeof def !== "object") {
      throw new AppError("流程定义无效", 400001, 400);
    }
    if (!Array.isArray(def.nodes) || def.nodes.length === 0) {
      throw new AppError("流程至少需要一个节点", 400001, 400);
    }
    if (!def.id || !def.name) {
      throw new AppError("流程缺少 id 或 name", 400001, 400);
    }
    if (def.nodes.length > 200) {
      throw new AppError("流程节点数不能超过 200", 400001, 400);
    }
  }

  /* ============================================================
   * 2. 节点 ID 唯一
   * ============================================================ */
  private checkNodeUniqueness(def: WorkflowDefinitionJSON): void {
    const ids = new Set<string>();
    for (const node of def.nodes) {
      if (!node.id) {
        throw new AppError("存在节点缺少 id", 400001, 400);
      }
      if (ids.has(node.id)) {
        throw new AppError(`节点 id 重复：${node.id}`, 400001, 400);
      }
      ids.add(node.id);
    }
  }

  /* ============================================================
   * 3. start / end 节点
   * ============================================================ */
  private checkStartEnd(def: WorkflowDefinitionJSON): void {
    const startNodes = def.nodes.filter((n) => n.type === "start");
    const endNodes = def.nodes.filter((n) => n.type === "end");

    if (startNodes.length === 0) {
      throw new AppError("流程必须包含 start 节点", 400001, 400);
    }
    if (startNodes.length > 1) {
      throw new AppError("流程只能有一个 start 节点", 400001, 400);
    }
    if (endNodes.length === 0) {
      throw new AppError("流程必须包含 end 节点", 400001, 400);
    }
  }

  /* ============================================================
   * 4. 节点配置合法性
   * ============================================================ */
  private checkNodeConfigs(def: WorkflowDefinitionJSON): void {
    for (const node of def.nodes) {
      switch (node.type) {
        case "userTask":
          if (!node.assignee) {
            throw new AppError(
              `节点「${node.name ?? node.id}」缺少审批人配置`,
              400001,
              400,
            );
          }
          this.checkAssignee(node.assignee, node);
          break;

        case "countersignTask":
        case "orSignTask":
          if (!node.countersign || node.countersign.assignees.length === 0) {
            throw new AppError(
              `节点「${node.name ?? node.id}」缺少会签配置`,
              400001,
              400,
            );
          }
          if (node.countersign.assignees.length > 50) {
            throw new AppError(
              `节点「${node.name ?? node.id}」会签人数超过 50`,
              400001,
              400,
            );
          }
          for (const a of node.countersign.assignees) {
            this.checkAssignee(a, node);
          }
          if (
            node.countersign.passPercent !== undefined &&
            (node.countersign.passPercent < 1 ||
              node.countersign.passPercent > 100)
          ) {
            throw new AppError(
              `节点「${node.name ?? node.id}」通过比例必须在 1-100`,
              400001,
              400,
            );
          }
          break;

        case "exclusiveGateway":
        case "parallelGateway":
        case "inclusiveGateway":
        case "serviceTask":
        case "scriptTask":
        case "start":
        case "end":
          break;
        case "ccTask": {
          if (!node.assignee) {
            throw new AppError(
              `抄送节点「${node.name ?? node.id}」缺少抄送人配置`,
              400001,
              400,
            );
          }
          this.checkAssignee(node.assignee, node);
          break;
        }
      }

      // 超时校验
      if (node.timeout?.action.includes("escalate")) {
        const esc = node.timeout.escalateTo;
        if (!esc || !esc.type) {
          throw new AppError(
            `节点「${node.name ?? node.id}」超时升级缺少 escalateTo`,
            400001,
            400,
          );
        }
        const validTypes = ["deptLeader", "initiatorLeader", "user", "role"];
        if (!validTypes.includes(esc.type)) {
          throw new AppError(
            `节点「${node.name ?? node.id}」超时升级类型无效：${esc.type}`,
            400001,
            400,
          );
        }
        if (["user", "role"].includes(esc.type) && !esc.value) {
          throw new AppError(
            `节点「${node.name ?? node.id}」超时升级缺少 value`,
            400001,
            400,
          );
        }
        if (node.timeout.maxEscalateLevel !== undefined) {
          if (
            node.timeout.maxEscalateLevel < 1 ||
            node.timeout.maxEscalateLevel > 10
          ) {
            throw new AppError(
              `节点「${node.name ?? node.id}」maxEscalateLevel 必须在 1-10`,
              400001,
              400,
            );
          }
        }
      }
    }
  }

  private checkAssignee(assignee: any, node: any): void {
    switch (assignee.type) {
      case "user":
      case "role":
      case "dept":
        if (!assignee.value) {
          throw new AppError(
            `节点「${node.name ?? node.id}」审批人类型 ${assignee.type} 缺少 value`,
            400001,
            400,
          );
        }
        break;
      case "deptLeader":
        if (assignee.level === undefined) assignee.level = 1;
        if (assignee.level < 1 || assignee.level > 10) {
          throw new AppError(
            `节点「${node.name ?? node.id}」部门层级必须在 1-10`,
            400001,
            400,
          );
        }
        break;
      case "initiator":
        break;
      case "expression":
        if (!assignee.expression) {
          throw new AppError(
            `节点「${node.name ?? node.id}」缺少表达式`,
            400001,
            400,
          );
        }
        const r = ExpressionEvaluator.validate(assignee.expression);
        if (!r.valid) {
          throw new AppError(
            `节点「${node.name ?? node.id}」表达式无效：${r.error}`,
            400001,
            400,
          );
        }
        break;
    }
  }

  /* ============================================================
   * 5. 边引用合法性
   * ============================================================ */
  private checkEdges(def: WorkflowDefinitionJSON): void {
    const nodeIds = new Set(def.nodes.map((n) => n.id));
    const edgeIds = new Set<string>();

    for (const edge of def.edges ?? []) {
      if (!edge.id) {
        throw new AppError("存在边缺少 id", 400001, 400);
      }
      if (edgeIds.has(edge.id)) {
        throw new AppError(`边 id 重复：${edge.id}`, 400001, 400);
      }
      edgeIds.add(edge.id);

      if (!nodeIds.has(edge.source)) {
        throw new AppError(
          `边「${edge.id}」的 source 不存在：${edge.source}`,
          400001,
          400,
        );
      }
      if (!nodeIds.has(edge.target)) {
        throw new AppError(
          `边「${edge.id}」的 target 不存在：${edge.target}`,
          400001,
          400,
        );
      }
      if (edge.source === edge.target) {
        throw new AppError(
          `边「${edge.id}」的 source 和 target 不能相同`,
          400001,
          400,
        );
      }
    }
    for (const node of def.nodes) {
      if (node.type === "ccTask") {
        const outgoing = (def.edges ?? []).filter((e) => e.source === node.id);
        if (outgoing.length === 0) {
          throw new AppError(
            `抄送节点「${node.name ?? node.id}」必须有出边`,
            400001,
            400,
          );
        }
        if (outgoing.length > 1) {
          throw new AppError(
            `抄送节点「${node.name ?? node.id}」只能有 1 条出边`,
            400001,
            400,
          );
        }
      }
    }
  }

  /* ============================================================
   * 6. 条件表达式校验
   * ============================================================ */
  private checkConditions(def: WorkflowDefinitionJSON): void {
    for (const edge of def.edges ?? []) {
      if (!edge.condition) continue;
      const r = ExpressionEvaluator.validate(edge.condition);
      if (!r.valid) {
        throw new AppError(`边「${edge.id}」条件无效：${r.error}`, 400001, 400);
      }
    }

    // 排他网关：至少一个出边带条件，或有默认分支
    for (const node of def.nodes) {
      if (node.type !== "exclusiveGateway") continue;
      const outgoing = (def.edges ?? []).filter((e) => e.source === node.id);
      if (outgoing.length === 0) {
        throw new AppError(
          `排他网关「${node.name ?? node.id}」无出边`,
          400001,
          400,
        );
      }
      const hasCond = outgoing.some((e) => e.condition);
      const hasDefault = outgoing.some((e) => e.isDefault);
      if (!hasCond && !hasDefault) {
        throw new AppError(
          `排他网关「${node.name ?? node.id}」必须至少有一个条件分支或默认分支`,
          400001,
          400,
        );
      }
    }
  }

  /* ============================================================
   * 7. 图连通性（从 start 出发能否到达 end）
   * ============================================================ */
  private checkConnectivity(def: WorkflowDefinitionJSON): void {
    const start = def.nodes.find((n) => n.type === "start")!;
    const end = def.nodes.find((n) => n.type === "end")!;

    const adj: Record<string, string[]> = {};
    for (const e of def.edges ?? []) {
      (adj[e.source] ??= []).push(e.target);
    }

    // BFS 从 start 出发
    const visited = new Set<string>();
    const queue: string[] = [start.id];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      for (const next of adj[id] ?? []) {
        queue.push(next);
      }
    }

    if (!visited.has(end.id)) {
      throw new AppError(
        "流程图中无法从「开始」到达「结束」，请检查连线",
        400001,
        400,
      );
    }
  }

  /* ============================================================
   * 8. 表单字段校验
   * ============================================================ */
  private checkFormSchemas(def: WorkflowDefinitionJSON): void {
    for (const node of def.nodes) {
      if (!node.formSchema) continue;
      const fields = new Set<string>();
      for (const f of node.formSchema) {
        if (fields.has(f.field)) {
          throw new AppError(
            `节点「${node.name ?? node.id}」表单字段重复：${f.field}`,
            400001,
            400,
          );
        }
        fields.add(f.field);

        if (f.type === "select" && (!f.options || f.options.length === 0)) {
          throw new AppError(
            `节点「${node.name ?? node.id}」字段「${f.label}」缺少选项`,
            400001,
            400,
          );
        }
      }
    }
  }
}
