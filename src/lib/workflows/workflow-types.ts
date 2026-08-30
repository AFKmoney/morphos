"use client";

import type { ModuleType } from "../window-store";

/**
 * Types pour le Workflow Generator
 * 
 * Un workflow est une séquence de modules connectés qui s'exécutent
 * dans un ordre précis, avec passage de données entre eux.
 */

// ============ NODE TYPES ============

/** Type d'un nœud dans un workflow */
export type WorkflowNodeType = 
  | 'start'           // Point de départ
  | 'module'          // Module MorphOS (natif ou plugin)
  | 'condition'       // Condition (if/else)
  | 'loop'            // Boucle
  | 'delay'           // Délai
  | 'transform'       // Transformation de données
  | 'merge'           // Fusion de données
  | 'split'           // Séparation de données
  | 'end';            // Point de fin

/** Base type pour tous les nœuds */
export interface WorkflowNodeBase {
  id: string;
  type: WorkflowNodeType;
  label: string;
  x: number;
  y: number;
}

/** Nœud de type "module" - Exécute un module MorphOS */
export interface WorkflowModuleNode extends WorkflowNodeBase {
  type: 'module';
  moduleType: ModuleType | string; // Peut être un plugin
  config?: Record<string, unknown>; // Configuration du module
  inputMapping?: Record<string, string>; // Mapping des entrées
  outputMapping?: Record<string, string>; // Mapping des sorties
  windowId?: string; // ID de la fenêtre si déjà ouverte
}

/** Nœud de type "start" - Point de départ du workflow */
export interface WorkflowStartNode extends WorkflowNodeBase {
  type: 'start';
  trigger?: 'manual' | 'interval' | 'event' | 'onLoad';
  triggerConfig?: {
    interval?: number; // en ms
    event?: string; // nom de l'événement
  };
}

/** Nœud de type "condition" - Condition if/else */
export interface WorkflowConditionNode extends WorkflowNodeBase {
  type: 'condition';
  condition: string; // Expression JavaScript à évaluer
  truePath: string; // ID du nœud si vrai
  falsePath: string; // ID du nœud si faux
}

/** Nœud de type "delay" - Délai */
export interface WorkflowDelayNode extends WorkflowNodeBase {
  type: 'delay';
  duration: number; // en ms
}

/** Nœud de type "transform" - Transformation de données */
export interface WorkflowTransformNode extends WorkflowNodeBase {
  type: 'transform';
  code: string; // Code JavaScript pour la transformation
  // input: data from previous node
  // output: transformed data
  // Example: return input * 2;
}

/** Nœud de type "merge" - Fusion de données */
export interface WorkflowMergeNode extends WorkflowNodeBase {
  type: 'merge';
  strategy: 'combine' | 'pick' | 'custom';
  code?: string; // Code pour la stratégie custom
}

/** Nœud de type "split" - Séparation de données */
export interface WorkflowSplitNode extends WorkflowNodeBase {
  type: 'split';
  paths: Array<{
    condition: string; // Expression pour déterminer le chemin
    path: string; // ID du nœud suivant
  }>;
}

/** Nœud de type "end" - Point de fin */
export interface WorkflowEndNode extends WorkflowNodeBase {
  type: 'end';
  action?: 'stop' | 'loop' | 'notify';
  actionConfig?: {
    message?: string;
    loopTo?: string; // ID du nœud pour la boucle
  };
}

/** Union type pour tous les nœuds */
export type WorkflowNode = 
  | WorkflowStartNode
  | WorkflowModuleNode
  | WorkflowConditionNode
  | WorkflowDelayNode
  | WorkflowTransformNode
  | WorkflowMergeNode
  | WorkflowSplitNode
  | WorkflowEndNode;

// ============ EDGE TYPES ============

/** Connexion entre deux nœuds */
export interface WorkflowEdge {
  id: string;
  source: string; // ID du nœud source
  target: string; // ID du nœud cible
  sourceHandle?: string; // Handle de sortie (optionnel)
  targetHandle?: string; // Handle d'entrée (optionnel)
}

// ============ WORKFLOW TYPES ============

/** Statut d'un workflow */
export type WorkflowStatus = 
  | 'draft'      // Brouillon (non sauvegardé)
  | 'saved'      // Sauvegardé
  | 'running'    // En cours d'exécution
  | 'paused'     // En pause
  | 'completed'  // Terminé
  | 'error'      // Erreur
  | 'stopped';   // Arrêté manuellement

/** Contexte d'exécution d'un workflow */
export interface WorkflowContext {
  id: string; // ID du workflow
  data: Record<string, unknown>; // Données disponibles
  currentNodeId: string; // ID du nœud actuel
  previousNodeId: string | null; // ID du nœud précédent
  executionId: string; // ID unique de l'exécution
  startedAt: number; // Timestamp de début
  
  // Fonctions utilitaires
  getData: (key: string) => unknown;
  setData: (key: string, value: unknown) => void;
  updateData: (updates: Record<string, unknown>) => void;
  
  // Logging
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
  
  // Gestion des fenêtres
  openWindow: (options: {
    type: ModuleType | string;
    title: string;
    config?: Record<string, unknown>;
  }) => Promise<string>;
  closeWindow: (windowId: string) => Promise<void>;
  
  // Accès aux APIs MorphOS
  morphos: {
    fs: {
      readFile: (path: string) => Promise<string | undefined>;
      writeFile: (path: string, content: string) => Promise<void>;
    };
    ai: {
      chat: (messages: { role: string; content: string }[]) => Promise<string>;
      generate: (prompt: string) => Promise<string>;
    };
    notify: (options: { title: string; message: string; type?: string }) => void;
  };
}

/** Résultat d'exécution d'un nœud */
export interface WorkflowNodeResult {
  nodeId: string;
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  duration: number; // en ms
}

/** Résultat d'exécution d'un workflow */
export interface WorkflowExecutionResult {
  workflowId: string;
  executionId: string;
  status: WorkflowStatus;
  startedAt: number;
  completedAt?: number;
  duration?: number; // en ms
  nodeResults: WorkflowNodeResult[];
  finalData: Record<string, unknown>;
  error?: string;
}

// ============ WORKFLOW DEFINITION ============

/** Définition complète d'un workflow */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  // Configuration
  startNodeId: string; // ID du nœud de départ
  
  // Métadonnées
  createdAt: number;
  updatedAt: number;
  author?: string;
  version?: string;
  tags?: string[];
  
  // Settings d'exécution
  settings?: {
    autoStart?: boolean;
    maxRetries?: number;
    timeout?: number; // en ms
  };
}

/** Workflow avec son statut */
export interface Workflow extends WorkflowDefinition {
  status: WorkflowStatus;
  lastExecution?: WorkflowExecutionResult;
  executions: WorkflowExecutionResult[];
}

// ============ WORKFLOW ACTIONS ============

/** Actions pour manipuler un workflow */
export type WorkflowAction = 
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' }
  | { type: 'restart' }
  | { type: 'save' }
  | { type: 'delete' }
  | { type: 'duplicate' }
  | { type: 'export' }
  | { type: 'import'; definition: WorkflowDefinition };

// ============ WORKFLOW EVENTS ============

/** Événements du workflow */
export type WorkflowEvent = 
  | { type: 'workflow.started'; workflowId: string; executionId: string }
  | { type: 'workflow.paused'; workflowId: string; executionId: string }
  | { type: 'workflow.resumed'; workflowId: string; executionId: string }
  | { type: 'workflow.completed'; workflowId: string; executionId: string; result: WorkflowExecutionResult }
  | { type: 'workflow.error'; workflowId: string; executionId: string; error: string }
  | { type: 'workflow.stopped'; workflowId: string; executionId: string }
  | { type: 'node.started'; workflowId: string; nodeId: string }
  | { type: 'node.completed'; workflowId: string; nodeId: string; result: WorkflowNodeResult }
  | { type: 'node.error'; workflowId: string; nodeId: string; error: string }
  | { type: 'workflow.saved'; workflowId: string }
  | { type: 'workflow.deleted'; workflowId: string };

// ============ WORKFLOW NODE DEFINITIONS ============

/** Définitions des nœuds pour le workflow builder */
export interface WorkflowNodeDefinition {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }> | string;
  color: string;
  
  // Configuration par défaut
  defaultConfig: Partial<WorkflowNode>;
  
  // Ports d'entrée
  inputPorts: Array<{
    id: string;
    label: string;
    type: string; // 'any' | 'string' | 'number' | 'boolean' | 'object' | 'array'
    required?: boolean;
  }>;
  
  // Ports de sortie
  outputPorts: Array<{
    id: string;
    label: string;
    type: string;
  }>;
}

/** Registry des définitions de nœuds */
export const WORKFLOW_NODE_DEFINITIONS: Record<WorkflowNodeType, WorkflowNodeDefinition> = {
  start: {
    type: 'start',
    label: 'Start',
    description: 'Starting point of the workflow',
    icon: '⚡',
    color: '#22d3ee',
    defaultConfig: { type: 'start', label: 'Start', x: 0, y: 0 },
    inputPorts: [],
    outputPorts: [{ id: 'output', label: 'Output', type: 'any' }],
  },
  module: {
    type: 'module',
    label: 'Module',
    description: 'Execute a MorphOS module',
    icon: '📦',
    color: '#34d399',
    defaultConfig: {
      type: 'module',
      label: 'Module',
      x: 0, y: 0,
      moduleType: 'chat',
    },
    inputPorts: [{ id: 'input', label: 'Input', type: 'any' }],
    outputPorts: [{ id: 'output', label: 'Output', type: 'any' }],
  },
  condition: {
    type: 'condition',
    label: 'Condition',
    description: 'If/Else branching',
    icon: '❓',
    color: '#f472b6',
    defaultConfig: {
      type: 'condition',
      label: 'Condition',
      x: 0, y: 0,
      condition: 'true',
      truePath: '',
      falsePath: '',
    },
    inputPorts: [{ id: 'input', label: 'Input', type: 'any' }],
    outputPorts: [
      { id: 'true', label: 'True', type: 'any' },
      { id: 'false', label: 'False', type: 'any' },
    ],
  },
  delay: {
    type: 'delay',
    label: 'Delay',
    description: 'Wait for a specified duration',
    icon: '⏳',
    color: '#fbbf24',
    defaultConfig: { type: 'delay', label: 'Delay', x: 0, y: 0, duration: 1000 },
    inputPorts: [{ id: 'input', label: 'Input', type: 'any' }],
    outputPorts: [{ id: 'output', label: 'Output', type: 'any' }],
  },
  transform: {
    type: 'transform',
    label: 'Transform',
    description: 'Transform data using JavaScript',
    icon: '🔧',
    color: '#c084fc',
    defaultConfig: {
      type: 'transform',
      label: 'Transform',
      x: 0, y: 0,
      code: 'return input;',
    },
    inputPorts: [{ id: 'input', label: 'Input', type: 'any' }],
    outputPorts: [{ id: 'output', label: 'Output', type: 'any' }],
  },
  merge: {
    type: 'merge',
    label: 'Merge',
    description: 'Merge multiple data streams',
    icon: '🔄',
    color: '#22d3ee',
    defaultConfig: {
      type: 'merge',
      label: 'Merge',
      x: 0, y: 0,
      strategy: 'combine',
    },
    inputPorts: [
      { id: 'input1', label: 'Input 1', type: 'any' },
      { id: 'input2', label: 'Input 2', type: 'any' },
    ],
    outputPorts: [{ id: 'output', label: 'Output', type: 'any' }],
  },
  split: {
    type: 'split',
    label: 'Split',
    description: 'Split data based on conditions',
    icon: '✂️',
    color: '#f472b6',
    defaultConfig: {
      type: 'split',
      label: 'Split',
      x: 0, y: 0,
      paths: [],
    },
    inputPorts: [{ id: 'input', label: 'Input', type: 'any' }],
    outputPorts: [],
  },
  end: {
    type: 'end',
    label: 'End',
    description: 'End point of the workflow',
    icon: '🛑',
    color: '#ef4444',
    defaultConfig: { type: 'end', label: 'End', x: 0, y: 0 },
    inputPorts: [{ id: 'input', label: 'Input', type: 'any' }],
    outputPorts: [],
  },
};
