import type {
  WorkflowDefinition,
  WorkflowExecutionContext,
  WorkflowNodeDef,
  ExecutionResult,
  NodeExecutionFn,
} from "@/types/workflow";
import { companyWorkflow } from "./company-workflow";

export class WorkflowEngine {
  private nodeExecutors: Map<string, NodeExecutionFn> = new Map();

  registerNodeExecutor(nodeId: string, executor: NodeExecutionFn): void {
    this.nodeExecutors.set(nodeId, executor);
  }

  getReadyNodes(context: WorkflowExecutionContext): WorkflowNodeDef[] {
    const { nodeResults, workflowId } = context;
    const allNodes = this.getNodeDefinitions(workflowId);

    return allNodes.filter((node) => {
      if (nodeResults.has(node.id)) return false;
      return node.dependencies.every((depId) => nodeResults.has(depId));
    });
  }

  async executeNode(
    node: WorkflowNodeDef,
    context: WorkflowExecutionContext,
  ): Promise<ExecutionResult> {
    const executor = this.nodeExecutors.get(node.id);
    if (!executor) {
      throw new Error(`No executor registered for node: ${node.id}`);
    }

    context.currentNodeId = node.id;
    const previousOutputs: Record<string, unknown> = {};
    node.dependencies.forEach((depId) => {
      previousOutputs[depId] = context.nodeResults.get(depId);
    });

    const input = {
      projectContext: context.projectContext,
      previousOutputs,
      nodeConfig: node,
    };

    return executor(input, context);
  }

  async executeWorkflow(
    workflow: WorkflowDefinition,
    context: WorkflowExecutionContext,
  ): Promise<Map<string, ExecutionResult>> {
    const results = new Map<string, ExecutionResult>();
    context.status = "running";
    context.startedAt = Date.now();

    const allNodes = [...workflow.nodes];
    const remaining = new Set(allNodes.map((n) => n.id));

    while (remaining.size > 0) {
      const ready = allNodes.filter((n) => remaining.has(n.id) && n.dependencies.every((d) => !remaining.has(d)));

      if (ready.length === 0) {
        context.status = "failed";
        context.error = "Deadlock detected in workflow";
        break;
      }

      for (const node of ready) {
        const result = await this.executeNode(node, context);
        results.set(node.id, result);
        context.nodeResults.set(node.id, result.output);
        remaining.delete(node.id);
      }
    }

    if (remaining.size === 0) {
      context.status = "completed";
    }
    context.completedAt = Date.now();

    return results;
  }

  private getNodeDefinitions(workflowId: string): WorkflowNodeDef[] {
    return companyWorkflow.nodes;
  }
}
