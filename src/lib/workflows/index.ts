// Workflow System exports
// Ce fichier exporte tout ce qui est nécessaire pour travailler avec les workflows MorphOS

export type {
  Workflow,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowNodeType,
  WorkflowModuleNode,
  WorkflowStartNode,
  WorkflowConditionNode,
  WorkflowDelayNode,
  WorkflowTransformNode,
  WorkflowMergeNode,
  WorkflowSplitNode,
  WorkflowEndNode,
  WorkflowEdge,
  WorkflowContext,
  WorkflowNodeResult,
  WorkflowExecutionResult,
  WorkflowStatus,
  WorkflowAction,
  WorkflowEvent,
  WorkflowNodeDefinition,
} from "./workflow-types";

export {
  WORKFLOW_NODE_DEFINITIONS,
} from "./workflow-types";

export {
  workflowEngine,
  getWorkflowEngine,
  useWorkflowEngine,
  createWorkflow,
  startWorkflow,
  stopCurrentWorkflow,
} from "./workflow-engine";

export {
  useWorkflowStore,
  createEmptyWorkflow,
  clearAllWorkflows,
  exportAllWorkflows,
  importAllWorkflows,
} from "./workflow-store";
