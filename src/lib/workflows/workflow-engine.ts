"use client";

import { create } from "zustand";
import type {
  Workflow,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowContext,
  WorkflowNodeResult,
  WorkflowExecutionResult,
  WorkflowStatus,
  WorkflowAction,
  WorkflowEvent,
} from "./workflow-types";
import { useWindowStore } from "../window-store";

/**
 * Workflow Engine
 * 
 * Moteur d'exécution des workflows MorphOS.
 * Gère l'exécution séquentielle ou parallèle des nœuds.
 */

// ============ WORKFLOW STORE ============

interface WorkflowStore {
  // Workflows
  workflows: Map<string, Workflow>;
  
  // Exécutions en cours
  runningExecutions: Map<string, {
    workflowId: string;
    context: WorkflowContext;
    startedAt: number;
    nodeResults: WorkflowNodeResult[];
  }>;
  
  // Historique des exécutions
  executionHistory: WorkflowExecutionResult[];
  
  // Statut global
  isRunning: boolean;
  currentWorkflowId: string | null;
  
  // Actions
  createWorkflow: (definition: Partial<WorkflowDefinition>) => string;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => boolean;
  deleteWorkflow: (id: string) => boolean;
  
  startWorkflow: (id: string, initialData?: Record<string, unknown>) => Promise<WorkflowExecutionResult | null>;
  pauseWorkflow: (executionId: string) => boolean;
  resumeWorkflow: (executionId: string) => boolean;
  stopWorkflow: (executionId: string) => boolean;
  
  executeAction: (workflowId: string, action: WorkflowAction) => Promise<boolean>;
  
  // Exécution d'un nœud spécifique
  executeNode: (node: WorkflowNode, context: WorkflowContext) => Promise<WorkflowNodeResult>;
  
  // Gestion des événements
  on: (eventType: WorkflowEvent['type'], callback: (event: WorkflowEvent) => void) => () => void;
  emit: (event: WorkflowEvent) => void;
  
  // Utilitaires
  getWorkflow: (id: string) => Workflow | undefined;
  getAllWorkflows: () => Workflow[];
  getExecution: (executionId: string) => WorkflowExecutionResult | undefined;
  getExecutionHistory: (workflowId?: string) => WorkflowExecutionResult[];
  
  // Import/Export
  importWorkflow: (definition: WorkflowDefinition) => string;
  exportWorkflow: (id: string) => WorkflowDefinition | null;
  
  // Debug
  debug: () => void;
}

// ============ WORKFLOW ENGINE IMPLEMENTATION ============

function createWorkflowEngine(): WorkflowStore {
  const eventListeners = new Map<WorkflowEvent['type'], Set<(event: WorkflowEvent) => void>>();
  
  // Helper pour générer des IDs
  const generateId = () => `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const generateExecutionId = () => `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return create<WorkflowStore>((set, get) => ({
    workflows: new Map(),
    runningExecutions: new Map(),
    executionHistory: [],
    isRunning: false,
    currentWorkflowId: null,
    
    // ============ WORKFLOW MANAGEMENT ============
    
    createWorkflow: (definition: Partial<WorkflowDefinition>) => {
      const id = generateId();
      const now = Date.now();
      
      const workflow: Workflow = {
        id,
        name: definition.name || `Workflow ${id.slice(0, 8)}`,
        description: definition.description || '',
        nodes: definition.nodes || [],
        edges: definition.edges || [],
        startNodeId: definition.startNodeId || '',
        createdAt: now,
        updatedAt: now,
        status: 'draft',
        settings: definition.settings,
        tags: definition.tags || [],
      };
      
      const workflows = new Map(get().workflows);
      workflows.set(id, workflow);
      set({ workflows });
      
      return id;
    },
    
    updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => {
      const workflows = new Map(get().workflows);
      const workflow = workflows.get(id);
      
      if (!workflow) {
        console.warn(`[WorkflowEngine] Workflow ${id} not found`);
        return false;
      }
      
      workflows.set(id, {
        ...workflow,
        ...updates,
        updatedAt: Date.now(),
      });
      
      set({ workflows });
      get().emit({ type: 'workflow.saved', workflowId: id });
      
      return true;
    },
    
    deleteWorkflow: (id: string) => {
      const workflows = new Map(get().workflows);
      
      if (!workflows.has(id)) {
        console.warn(`[WorkflowEngine] Workflow ${id} not found`);
        return false;
      }
      
      workflows.delete(id);
      set({ workflows });
      get().emit({ type: 'workflow.deleted', workflowId: id });
      
      return true;
    },
    
    // ============ WORKFLOW EXECUTION ============
    
    startWorkflow: async (id: string, initialData: Record<string, unknown> = {}) => {
      const workflow = get().getWorkflow(id);
      
      if (!workflow) {
        console.error(`[WorkflowEngine] Workflow ${id} not found`);
        return null;
      }
      
      if (get().isRunning) {
        console.error(`[WorkflowEngine] Already running a workflow`);
        return null;
      }
      
      const executionId = generateExecutionId();
      const startedAt = Date.now();
      const nodeResults: WorkflowNodeResult[] = [];
      
      // Créer le contexte d'exécution
      const context: WorkflowContext = {
        id: workflow.id,
        data: { ...initialData },
        currentNodeId: workflow.startNodeId,
        previousNodeId: null,
        executionId,
        startedAt,
        
        getData: (key: string) => context.data[key],
        setData: (key: string, value: unknown) => {
          context.data[key] = value;
        },
        updateData: (updates: Record<string, unknown>) => {
          Object.assign(context.data, updates);
        },
        
        log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
          console.log(`[Workflow ${workflow.id}] ${level.toUpperCase()}: ${message}`);
        },
        
        openWindow: async (options) => {
          return useWindowStore.getState().spawnWindow(options);
        },
        
        closeWindow: async (windowId: string) => {
          useWindowStore.getState().closeWindow(windowId);
        },
        
        morphos: {
          fs: {
            readFile: async (path: string) => {
              // À intégrer avec VFS
              return '';
            },
            writeFile: async (path: string, content: string) => {
              // À intégrer avec VFS
            },
          },
          ai: {
            chat: async (messages: { role: string; content: string }[]) => {
              // À intégrer avec les APIs IA
              return '';
            },
            generate: async (prompt: string) => {
              // À intégrer avec les APIs IA
              return '';
            },
          },
          notify: (options) => {
            // À intégrer avec le système de notifications
            console.log(`[Workflow Notify] ${options.title}: ${options.message}`);
          },
        },
      };
      
      // Stocker l'exécution en cours
      const runningExecutions = new Map(get().runningExecutions);
      runningExecutions.set(executionId, {
        workflowId: workflow.id,
        context,
        startedAt,
        nodeResults,
      });
      
      set({
        runningExecutions,
        isRunning: true,
        currentWorkflowId: workflow.id,
      });
      
      get().emit({ type: 'workflow.started', workflowId: workflow.id, executionId });
      
      try {
        // Exécuter le workflow
        const result = await get().executeWorkflowInternal(
          workflow,
          context,
          executionId,
          nodeResults
        );
        
        // Mettre à jour l'historique
        const executionHistory = [...get().executionHistory];
        executionHistory.unshift(result);
        
        // Limiter l'historique à 100 exécutions
        if (executionHistory.length > 100) {
          executionHistory.pop();
        }
        
        // Mettre à jour le workflow avec le dernier résultat
        const workflows = new Map(get().workflows);
        const updatedWorkflow = workflows.get(workflow.id);
        if (updatedWorkflow) {
          workflows.set(workflow.id, {
            ...updatedWorkflow,
            lastExecution: result,
            executions: [result, ...(updatedWorkflow.executions || []).slice(0, 9)],
          });
          set({ workflows, executionHistory, runningExecutions: new Map(), isRunning: false, currentWorkflowId: null });
        }
        
        get().emit({ type: 'workflow.completed', workflowId: workflow.id, executionId, result });
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Créer un résultat d'erreur
        const result: WorkflowExecutionResult = {
          workflowId: workflow.id,
          executionId,
          status: 'error',
          startedAt,
          completedAt: Date.now(),
          duration: Date.now() - startedAt,
          nodeResults,
          finalData: context.data,
          error: errorMessage,
        };
        
        // Mettre à jour l'historique
        const executionHistory = [...get().executionHistory];
        executionHistory.unshift(result);
        
        set({
          executionHistory,
          runningExecutions: new Map(),
          isRunning: false,
          currentWorkflowId: null,
        });
        
        get().emit({ type: 'workflow.error', workflowId: workflow.id, executionId, error: errorMessage });
        
        return result;
      }
    },
    
    // Exécution interne du workflow (récursive)
    executeWorkflowInternal: async (
      workflow: Workflow,
      context: WorkflowContext,
      executionId: string,
      nodeResults: WorkflowNodeResult[]
    ): Promise<WorkflowExecutionResult> => {
      const startTime = Date.now();
      const nodeId = context.currentNodeId;
      
      if (!nodeId) {
        throw new Error('No current node ID');
      }
      
      const node = workflow.nodes.find(n => n.id === nodeId);
      
      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }
      
      // Émettre un événement de début de nœud
      get().emit({ type: 'node.started', workflowId: workflow.id, nodeId });
      
      // Exécuter le nœud
      const nodeStartTime = Date.now();
      const result = await get().executeNode(node, context);
      const nodeDuration = Date.now() - nodeStartTime;
      
      // Stocker le résultat
      nodeResults.push({
        ...result,
        duration: nodeDuration,
      });
      
      // Émettre un événement de fin de nœud
      get().emit({ type: 'node.completed', workflowId: workflow.id, nodeId, result });
      
      // Si erreur, arrêter l'exécution
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }
      
      // Déterminer le nœud suivant
      const nextNodeId = get().getNextNodeId(workflow, node, result.output);
      
      if (!nextNodeId) {
        // Fin du workflow
        const duration = Date.now() - startTime;
        return {
          workflowId: workflow.id,
          executionId,
          status: 'completed',
          startedAt: context.startedAt,
          completedAt: Date.now(),
          duration,
          nodeResults,
          finalData: context.data,
        };
      }
      
      // Mettre à jour le contexte
      context.previousNodeId = context.currentNodeId;
      context.currentNodeId = nextNodeId;
      
      // Exécuter le nœud suivant
      return get().executeWorkflowInternal(workflow, context, executionId, nodeResults);
    },
    
    // Détermine le nœud suivant
    getNextNodeId: (workflow: Workflow, currentNode: WorkflowNode, output?: Record<string, unknown>) => {
      // Trouver les edges sortants
      const outgoingEdges = workflow.edges.filter(e => e.source === currentNode.id);
      
      if (outgoingEdges.length === 0) {
        return null; // Fin du workflow
      }
      
      if (outgoingEdges.length === 1) {
        return outgoingEdges[0].target;
      }
      
      // Si plusieurs edges, utiliser la logique du nœud
      switch (currentNode.type) {
        case 'condition': {
          const conditionNode = currentNode as any;
          try {
            // Évaluer la condition
            const conditionMet = new Function('data', 'output', `return ${conditionNode.condition}`)
              .call(null, {}, output || {});
            
            // Trouver l'edge correspondant
            const trueEdge = outgoingEdges.find(e => e.sourceHandle === 'true');
            const falseEdge = outgoingEdges.find(e => e.sourceHandle === 'false');
            
            return conditionMet && trueEdge ? trueEdge.target : falseEdge?.target || null;
          } catch {
            return outgoingEdges[0].target; // Default to first edge
          }
        }
        
        case 'split': {
          const splitNode = currentNode as any;
          if (splitNode.paths) {
            for (const path of splitNode.paths) {
              try {
                const conditionMet = new Function('data', 'output', `return ${path.condition}`)
                  .call(null, {}, output || {});
                if (conditionMet) {
                  return path.path;
                }
              } catch {
                // Ignorer
              }
            }
          }
          return outgoingEdges[0].target;
        }
        
        default:
          return outgoingEdges[0].target;
      }
    },
    
    // Exécution d'un nœud
    executeNode: async (node: WorkflowNode, context: WorkflowContext) => {
      const nodeStartTime = Date.now();
      
      try {
        switch (node.type) {
          case 'start':
            // Le nœud start ne fait rien, passe juste les données
            return {
              nodeId: node.id,
              success: true,
              output: context.data,
              duration: Date.now() - nodeStartTime,
            };
            
          case 'module': {
            const moduleNode = node as any;
            
            // Ouvrir ou trouver la fenêtre du module
            const windowId = moduleNode.windowId || useWindowStore.getState().spawnWindow({
              type: moduleNode.moduleType as any,
              title: moduleNode.label || moduleNode.moduleType,
              config: moduleNode.config,
            });
            
            // Pour l'instant, on retourne juste les données
            // Dans une version future, on pourra interagir avec le module
            return {
              nodeId: node.id,
              success: true,
              output: {
                windowId,
                moduleType: moduleNode.moduleType,
                data: context.data,
              },
              duration: Date.now() - nodeStartTime,
            };
          }
            
          case 'condition': {
            const conditionNode = node as any;
            try {
              const result = new Function('data', `return ${conditionNode.condition}`)
                .call(null, context.data);
              
              return {
                nodeId: node.id,
                success: true,
                output: { result },
                duration: Date.now() - nodeStartTime,
              };
            } catch (error) {
              return {
                nodeId: node.id,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - nodeStartTime,
              };
            }
          }
            
          case 'delay': {
            const delayNode = node as any;
            await new Promise(resolve => setTimeout(resolve, delayNode.duration));
            
            return {
              nodeId: node.id,
              success: true,
              output: context.data,
              duration: Date.now() - nodeStartTime,
            };
          }
            
          case 'transform': {
            const transformNode = node as any;
            try {
              const result = new Function('data', 'input', transformNode.code)
                .call(null, context.data, context.data);
              
              return {
                nodeId: node.id,
                success: true,
                output: { result },
                duration: Date.now() - nodeStartTime,
              };
            } catch (error) {
              return {
                nodeId: node.id,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - nodeStartTime,
              };
            }
          }
            
          case 'merge': {
            const mergeNode = node as any;
            // Fusion simple: combiner toutes les données
            return {
              nodeId: node.id,
              success: true,
              output: context.data,
              duration: Date.now() - nodeStartTime,
            };
          }
            
          case 'split': {
            // Le split est géré par getNextNodeId
            return {
              nodeId: node.id,
              success: true,
              output: context.data,
              duration: Date.now() - nodeStartTime,
            };
          }
            
          case 'end':
            return {
              nodeId: node.id,
              success: true,
              output: context.data,
              duration: Date.now() - nodeStartTime,
            };
            
          default:
            return {
              nodeId: node.id,
              success: false,
              error: `Unknown node type: ${node.type}`,
              duration: Date.now() - nodeStartTime,
            };
        }
      } catch (error) {
        return {
          nodeId: node.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - nodeStartTime,
        };
      }
    },
    
    pauseWorkflow: (executionId: string) => {
      const runningExecutions = new Map(get().runningExecutions);
      const execution = runningExecutions.get(executionId);
      
      if (!execution) {
        return false;
      }
      
      // Mettre en pause (à implémenter avec un système de pause réel)
      // Pour l'instant, on arrête simplement
      runningExecutions.delete(executionId);
      set({ runningExecutions, isRunning: runningExecutions.size > 0 });
      get().emit({ type: 'workflow.paused', workflowId: execution.workflowId, executionId });
      
      return true;
    },
    
    resumeWorkflow: (executionId: string) => {
      // À implémenter
      return false;
    },
    
    stopWorkflow: (executionId: string) => {
      const runningExecutions = new Map(get().runningExecutions);
      const execution = runningExecutions.get(executionId);
      
      if (!execution) {
        return false;
      }
      
      runningExecutions.delete(executionId);
      set({ runningExecutions, isRunning: runningExecutions.size > 0 });
      get().emit({ type: 'workflow.stopped', workflowId: execution.workflowId, executionId });
      
      return true;
    },
    
    executeAction: async (workflowId: string, action: WorkflowAction) => {
      const workflow = get().getWorkflow(workflowId);
      if (!workflow) return false;
      
      switch (action.type) {
        case 'start':
          await get().startWorkflow(workflowId);
          return true;
          
        case 'pause':
          return get().pauseWorkflow(get().currentWorkflowId || '');
          
        case 'resume':
          return get().resumeWorkflow(get().currentWorkflowId || '');
          
        case 'stop':
          return get().stopWorkflow(get().currentWorkflowId || '');
          
        case 'restart':
          await get().stopWorkflow(get().currentWorkflowId || '');
          await get().startWorkflow(workflowId);
          return true;
          
        case 'save':
          return get().updateWorkflow(workflowId, workflow);
          
        case 'delete':
          return get().deleteWorkflow(workflowId);
          
        case 'duplicate': {
          const newWorkflow = { ...workflow, id: generateId(), name: `${workflow.name} (Copy)` };
          return get().createWorkflow(newWorkflow) !== '';
        }
          
        case 'export':
          return true; // L'export est géré par la fonction dédiée
          
        case 'import':
          return get().importWorkflow(action.definition) !== '';
          
        default:
          return false;
      }
    },
    
    // ============ GETTERS ============
    
    getWorkflow: (id: string) => {
      return get().workflows.get(id);
    },
    
    getAllWorkflows: () => {
      return Array.from(get().workflows.values());
    },
    
    getExecution: (executionId: string) => {
      return get().executionHistory.find(e => e.executionId === executionId);
    },
    
    getExecutionHistory: (workflowId?: string) => {
      if (workflowId) {
        return get().executionHistory.filter(e => e.workflowId === workflowId);
      }
      return get().executionHistory;
    },
    
    // ============ IMPORT/EXPORT ============
    
    importWorkflow: (definition: WorkflowDefinition) => {
      const id = generateId();
      const workflow: Workflow = {
        ...definition,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'draft',
        executions: [],
      };
      
      const workflows = new Map(get().workflows);
      workflows.set(id, workflow);
      set({ workflows });
      
      return id;
    },
    
    exportWorkflow: (id: string) => {
      const workflow = get().getWorkflow(id);
      if (!workflow) return null;
      
      const { status, lastExecution, executions, ...definition } = workflow;
      return definition;
    },
    
    // ============ EVENTS ============
    
    on: (eventType: WorkflowEvent['type'], callback: (event: WorkflowEvent) => void) => {
      if (!eventListeners.has(eventType)) {
        eventListeners.set(eventType, new Set());
      }
      eventListeners.get(eventType)!.add(callback);
      
      return () => {
        eventListeners.get(eventType)?.delete(callback);
      };
    },
    
    emit: (event: WorkflowEvent) => {
      const listeners = eventListeners.get(event.type);
      if (listeners) {
        for (const listener of listeners) {
          try {
            listener(event);
          } catch (error) {
            console.error(`[WorkflowEngine] Error in event listener:`, error);
          }
        }
      }
    },
    
    // ============ DEBUG ============
    
    debug: () => {
      const state = get();
      console.group('[WorkflowEngine] Debug');
      console.log('Workflows:', Array.from(state.workflows.keys()));
      console.log('Running executions:', Array.from(state.runningExecutions.keys()));
      console.log('Execution history:', state.executionHistory.length);
      console.log('Is running:', state.isRunning);
      console.log('Current workflow:', state.currentWorkflowId);
      console.groupEnd();
    },
  }));
}

// ============ SINGLETON ============

let workflowEngineInstance: WorkflowStore | null = null;

/**
 * Crée ou retourne l'instance unique du Workflow Engine
 */
export function getWorkflowEngine(): WorkflowStore {
  if (workflowEngineInstance) {
    return workflowEngineInstance;
  }
  
  workflowEngineInstance = createWorkflowEngine();
  return workflowEngineInstance;
}

// ============ EXPORTS ============

// Instance principale
export const workflowEngine = getWorkflowEngine();

// Hook pour utiliser dans les composants
export function useWorkflowEngine() {
  return getWorkflowEngine();
}

// Fonctions utilitaires
export function createWorkflow(definition: Partial<WorkflowDefinition>): string {
  return workflowEngine.createWorkflow(definition);
}

export function startWorkflow(id: string, initialData?: Record<string, unknown>): Promise<WorkflowExecutionResult | null> {
  return workflowEngine.startWorkflow(id, initialData);
}

export function stopCurrentWorkflow(): boolean {
  return workflowEngine.stopWorkflow(workflowEngine.getState().currentWorkflowId || '');
}

// Exporter les types
export type { 
  Workflow,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowContext,
  WorkflowNodeResult,
  WorkflowExecutionResult,
  WorkflowStatus,
  WorkflowAction,
  WorkflowEvent,
};
