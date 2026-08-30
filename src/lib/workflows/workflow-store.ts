"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Workflow, WorkflowDefinition } from "./workflow-types";
import { workflowEngine, getWorkflowEngine } from "./workflow-engine";

/**
 * Workflow Store
 * 
 * Store Zustand pour la persistance des workflows.
 * Les workflows sont sauvegardés dans localStorage.
 */

interface WorkflowStoreState {
  // Workflows sauvegardés
  workflows: Map<string, Workflow>;
  
  // Workflow actif (en cours d'édition)
  activeWorkflowId: string | null;
  
  // Actions
  setActiveWorkflow: (id: string | null) => void;
  createWorkflow: (definition: Partial<WorkflowDefinition>) => string;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => boolean;
  deleteWorkflow: (id: string) => boolean;
  duplicateWorkflow: (id: string) => string | null;
  
  // Import/Export
  importWorkflow: (definition: WorkflowDefinition) => string;
  exportWorkflow: (id: string) => WorkflowDefinition | null;
  
  // Exécution
  runWorkflow: (id: string, initialData?: Record<string, unknown>) => Promise<void>;
  stopWorkflow: () => void;
  
  // Getters
  getWorkflow: (id: string) => Workflow | undefined;
  getAllWorkflows: () => Workflow[];
}

const STORAGE_KEY = "morphos-workflows";

// Données par défaut
const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: "wf-default-welcome",
    name: "Welcome Workflow",
    description: "A simple workflow to demonstrate MorphOS capabilities",
    nodes: [
      {
        id: "start",
        type: "start",
        label: "Start",
        x: 200,
        y: 100,
        trigger: "manual",
      },
      {
        id: "chat",
        type: "module",
        label: "Welcome Chat",
        x: 200,
        y: 250,
        moduleType: "chat",
        config: {},
      },
      {
        id: "end",
        type: "end",
        label: "End",
        x: 200,
        y: 400,
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "chat" },
      { id: "e2", source: "chat", target: "end" },
    ],
    startNodeId: "start",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: "saved",
    executions: [],
    tags: ["example", "welcome"],
  },
  {
    id: "wf-data-pipeline",
    name: "Data Pipeline",
    description: "Fetch data → Transform → Save to file",
    nodes: [
      {
        id: "start",
        type: "start",
        label: "Start",
        x: 100,
        y: 100,
      },
      {
        id: "fetch",
        type: "module",
        label: "Fetch Stock Data",
        x: 100,
        y: 250,
        moduleType: "stock",
        config: {},
      },
      {
        id: "transform",
        type: "transform",
        label: "Format Data",
        x: 300,
        y: 250,
        code: "return { ...input, formatted: true, timestamp: Date.now() };",
      },
      {
        id: "save",
        type: "module",
        label: "Save to Files",
        x: 500,
        y: 250,
        moduleType: "files",
        config: {},
      },
      {
        id: "end",
        type: "end",
        label: "End",
        x: 300,
        y: 400,
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "fetch" },
      { id: "e2", source: "fetch", target: "transform" },
      { id: "e3", source: "transform", target: "save" },
      { id: "e4", source: "save", target: "end" },
    ],
    startNodeId: "start",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: "saved",
    executions: [],
    tags: ["example", "data", "pipeline"],
  },
];

// Convertir les workflows par défaut en Map
const convertToMap = (workflows: Workflow[]): Map<string, Workflow> => {
  const map = new Map<string, Workflow>();
  for (const workflow of workflows) {
    map.set(workflow.id, workflow);
  }
  return map;
};

export const useWorkflowStore = create<WorkflowStoreState>()(
  persist(
    (set, get) => ({
      workflows: new Map(),
      activeWorkflowId: null,
      
      setActiveWorkflow: (id: string | null) => {
        set({ activeWorkflowId: id });
      },
      
      createWorkflow: (definition: Partial<WorkflowDefinition>) => {
        const id = workflowEngine.createWorkflow(definition);
        const workflow = workflowEngine.getWorkflow(id);
        
        if (workflow) {
          const workflows = new Map(get().workflows);
          workflows.set(id, workflow);
          set({ workflows, activeWorkflowId: id });
        }
        
        return id;
      },
      
      updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => {
        const success = workflowEngine.updateWorkflow(id, updates);
        
        if (success) {
          const workflow = workflowEngine.getWorkflow(id);
          if (workflow) {
            const workflows = new Map(get().workflows);
            workflows.set(id, workflow);
            set({ workflows });
          }
        }
        
        return success;
      },
      
      deleteWorkflow: (id: string) => {
        const success = workflowEngine.deleteWorkflow(id);
        
        if (success) {
          const workflows = new Map(get().workflows);
          workflows.delete(id);
          set({ workflows });
          
          if (get().activeWorkflowId === id) {
            set({ activeWorkflowId: null });
          }
        }
        
        return success;
      },
      
      duplicateWorkflow: (id: string) => {
        const workflow = get().getWorkflow(id);
        if (!workflow) return null;
        
        const newWorkflow: Workflow = {
          ...workflow,
          id: `wf-${Date.now()}-copy`,
          name: `${workflow.name} (Copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: 'draft',
        };
        
        const workflows = new Map(get().workflows);
        workflows.set(newWorkflow.id, newWorkflow);
        set({ workflows, activeWorkflowId: newWorkflow.id });
        
        return newWorkflow.id;
      },
      
      importWorkflow: (definition: WorkflowDefinition) => {
        const id = workflowEngine.importWorkflow(definition);
        const workflow = workflowEngine.getWorkflow(id);
        
        if (workflow) {
          const workflows = new Map(get().workflows);
          workflows.set(id, workflow);
          set({ workflows, activeWorkflowId: id });
        }
        
        return id;
      },
      
      exportWorkflow: (id: string) => {
        return workflowEngine.exportWorkflow(id);
      },
      
      runWorkflow: async (id: string, initialData?: Record<string, unknown>) => {
        await workflowEngine.startWorkflow(id, initialData);
      },
      
      stopWorkflow: () => {
        workflowEngine.stopWorkflow(workflowEngine.getState().currentWorkflowId || '');
      },
      
      getWorkflow: (id: string) => {
        return get().workflows.get(id) || workflowEngine.getWorkflow(id);
      },
      
      getAllWorkflows: () => {
        return Array.from(get().workflows.values());
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workflows: Array.from(state.workflows.values()),
        activeWorkflowId: state.activeWorkflowId,
      }),
      merge: (persistedState, currentState) => {
        // Charger les workflows par défaut si aucun n'existe
        const hasWorkflows = persistedState?.workflows?.length > 0;
        
        if (!hasWorkflows) {
          return {
            ...currentState,
            workflows: convertToMap(DEFAULT_WORKFLOWS),
          };
        }
        
        return {
          ...currentState,
          workflows: convertToMap(persistedState.workflows || []),
          activeWorkflowId: persistedState.activeWorkflowId || null,
        };
      },
    }
  )
);

// ============ UTILITY FUNCTIONS ============

/**
 * Créer un workflow vide
 */
export function createEmptyWorkflow(): string {
  return useWorkflowStore.getState().createWorkflow({
    name: 'New Workflow',
    description: '',
    nodes: [],
    edges: [],
    startNodeId: '',
  });
}

/**
 * Supprimer tous les workflows
 */
export function clearAllWorkflows(): void {
  const workflows = useWorkflowStore.getState().workflows;
  for (const id of workflows.keys()) {
    useWorkflowStore.getState().deleteWorkflow(id);
  }
}

/**
 * Exporter tous les workflows
 */
export function exportAllWorkflows(): WorkflowDefinition[] {
  const workflows = useWorkflowStore.getState().getAllWorkflows();
  return workflows.map(w => {
    const { status, lastExecution, executions, ...definition } = w;
    return definition;
  });
}

/**
 * Importer plusieurs workflows
 */
export function importAllWorkflows(definitions: WorkflowDefinition[]): void {
  for (const definition of definitions) {
    useWorkflowStore.getState().importWorkflow(definition);
  }
}

// ============ EXPORTS ============

export { workflowEngine, getWorkflowEngine } from "./workflow-engine";
export type * from "./workflow-types";
