/**
 * MorphOS Scripting Language (MSL) - Store
 * 
 * Stores Svelte pour la gestion des scripts MSL
 */

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type {
  MSLScript,
  ScriptId,
  ScriptType,
  ScriptStatus,
  ExecutionResult,
  ExecutionEvent,
} from './msl-types';

import { mslScriptManager } from './msl-engine';

// ============ DEFAULT VALUES ============

/** Script par défaut */
export const DEFAULT_SCRIPT: MSLScript = {
  id: '',
  name: 'New Script',
  description: '',
  type: 'action',
  version: '1.0.0',
  category: 'custom',
  tags: [],
  source: '',
  executionMode: 'sync',
  globals: {},
  parameters: [],
  exports: [],
  status: 'idle',
  enabled: true,
  priority: 5,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// ============ STORES ============

/** Store des scripts */
export const scriptsStore: Writable<MSLScript[]> = writable([]);

/** Store du script actuel */
export const currentScriptStore: Writable<MSLScript | null> = writable(null);

/** Store du script en cours d'exécution */
export const runningScriptStore: Writable<MSLScript | null> = writable(null);

/** Store des résultats d'exécution */
export const executionResultsStore: Writable<ExecutionResult[]> = writable([]);

/** Store des événements d'exécution */
export const executionEventsStore: Writable<ExecutionEvent[]> = writable([]);

/** Store du statut global */
export const mslStatusStore: Writable<{ enabled: boolean; running: number; loaded: number }> = writable({
  enabled: true,
  running: 0,
  loaded: 0,
});

// ============ DERIVED STORES ============

/** Nombre de scripts */
export const scriptCountStore: Readable<number> = derived(
  scriptsStore,
  ($scripts) => $scripts.length
);

/** Scripts par type */
export const scriptsByTypeStore: Readable<Record<ScriptType, MSLScript[]>> = derived(
  scriptsStore,
  ($scripts) => {
    const byType: Partial<Record<ScriptType, MSLScript[]>> = {};
    
    for (const script of $scripts) {
      if (!byType[script.type]) {
        byType[script.type] = [];
      }
      byType[script.type].push(script);
    }
    
    return byType as Record<ScriptType, MSLScript[]>;
  }
);

/** Scripts activés */
export const enabledScriptsStore: Readable<MSLScript[]> = derived(
  scriptsStore,
  ($scripts) => $scripts.filter(s => s.enabled)
);

/** Scripts désactivés */
export const disabledScriptsStore: Readable<MSLScript[]> = derived(
  scriptsStore,
  ($scripts) => $scripts.filter(s => !s.enabled)
);

/** Scripts en cours d'exécution */
export const runningScriptsStore: Readable<MSLScript[]> = derived(
  scriptsStore,
  ($scripts) => $scripts.filter(s => s.status === 'running')
);

// ============ ACTIONS ============

/**
 * Initialiser les stores MSL
 */
export function initializeMSLStores(): void {
  // Charger les scripts depuis le localStorage
  const savedScripts = localStorage.getItem('morphos-msl-scripts');
  if (savedScripts) {
    try {
      const scripts = JSON.parse(savedScripts) as MSLScript[];
      scriptsStore.set(scripts);
      
      // Charger les scripts dans le manager
      for (const script of scripts) {
        mslScriptManager.addScript(script);
      }
      
      // Mettre à jour le statut
      mslStatusStore.update(status => ({
        ...status,
        loaded: scripts.length,
      }));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  // Sauvegarder les scripts lors des changements
  scriptsStore.subscribe((scripts) => {
    localStorage.setItem('morphos-msl-scripts', JSON.stringify(scripts));
    
    // Mettre à jour le statut
    mslStatusStore.update(status => ({
      ...status,
      loaded: scripts.length,
      running: scripts.filter(s => s.status === 'running').length,
    }));
  });
  
  // S'abonner aux événements du manager
  mslScriptManager.onExecutionEvent('*', (event) => {
    executionEventsStore.update(events => [...events, event]);
    
    if (event.type === 'start') {
      mslStatusStore.update(status => ({
        ...status,
        running: status.running + 1,
      }));
    }
    
    if (event.type === 'complete' || event.type === 'error' || event.type === 'cancel') {
      mslStatusStore.update(status => ({
        ...status,
        running: Math.max(0, status.running - 1),
      }));
    }
  });
}

/**
 * Ajouter un script
 */
export function addScript(script: MSLScript): void {
  scriptsStore.update(scripts => [...scripts, script]);
  mslScriptManager.addScript(script);
}

/**
 * Supprimer un script
 */
export function removeScript(id: ScriptId): void {
  scriptsStore.update(scripts => scripts.filter(s => s.id !== id));
  mslScriptManager.removeScript(id);
}

/**
 * Mettre à jour un script
 */
export function updateScript(id: ScriptId, updates: Partial<MSLScript>): void {
  scriptsStore.update(scripts =>
    scripts.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s)
  );
  
  const script = mslScriptManager.getScript(id);
  if (script) {
    mslScriptManager.addScript({ ...script, ...updates, updatedAt: Date.now() });
  }
}

/**
 * Définir les scripts
 */
export function setScripts(scripts: MSLScript[]): void {
  scriptsStore.set(scripts);
  
  // Recharger les scripts dans le manager
  mslScriptManager.cleanup();
  for (const script of scripts) {
    mslScriptManager.addScript(script);
  }
}

/**
 * Définir le script actuel
 */
export function setCurrentScript(script: MSLScript | null): void {
  currentScriptStore.set(script);
}

/**
 * Définir le script en cours d'exécution
 */
export function setRunningScript(script: MSLScript | null): void {
  runningScriptStore.set(script);
}

/**
 * Ajouter un résultat d'exécution
 */
export function addExecutionResult(result: ExecutionResult): void {
  executionResultsStore.update(results => [result, ...results].slice(0, 100));
}

/**
 * Ajouter un événement d'exécution
 */
export function addExecutionEvent(event: ExecutionEvent): void {
  executionEventsStore.update(events => [event, ...events].slice(0, 100));
}

/**
 * Nettoyer les résultats
 */
export function clearExecutionResults(): void {
  executionResultsStore.set([]);
}

/**
 * Nettoyer les événements
 */
export function clearExecutionEvents(): void {
  executionEventsStore.set([]);
}

/**
 * Exécuter un script
 */
export async function executeScript(id: ScriptId, params?: Record<string, unknown>): Promise<ExecutionResult> {
  const script = mslScriptManager.getScript(id);
  if (!script) {
    return {
      success: false,
      error: `Script not found: ${id}`,
      duration: 0,
      stepsExecuted: 0,
      stepsFailed: 0,
      finalGlobals: {},
      timestamp: Date.now(),
    };
  }
  
  const result = await mslScriptManager.executeScript(id, undefined, params);
  addExecutionResult(result);
  return result;
}

/**
 * Arrêter un script
 */
export function stopScript(id: ScriptId): boolean {
  return mslScriptManager.stopScript(id);
}

/**
 * Mettre en pause un script
 */
export function pauseScript(id: ScriptId): boolean {
  return mslScriptManager.pauseScript(id);
}

/**
 * Reprendre un script
 */
export function resumeScript(id: ScriptId): boolean {
  return mslScriptManager.resumeScript(id);
}

/**
 * Activer/Désactiver un script
 */
export function toggleScript(id: ScriptId, enabled?: boolean): void {
  updateScript(id, { enabled: enabled !== undefined ? enabled : !mslScriptManager.getScript(id)?.enabled });
}

/**
 * Activer/Désactiver tous les scripts
 */
export function toggleAllScripts(enabled: boolean): void {
  scriptsStore.update(scripts => scripts.map(s => ({ ...s, enabled })));
}

/**
 * Exécuter tous les scripts d'un type
 */
export async function executeScriptsByType(type: ScriptType, params?: Record<string, unknown>): Promise<ExecutionResult[]> {
  const scripts = mslScriptManager.getScriptsByType(type);
  const results: ExecutionResult[] = [];
  
  for (const script of scripts) {
    if (script.enabled) {
      const result = await mslScriptManager.executeScript(script.id, undefined, params);
      results.push(result);
      addExecutionResult(result);
    }
  }
  
  return results;
}

/**
 * Exécuter tous les scripts d'une catégorie
 */
export async function executeScriptsByCategory(category: string, params?: Record<string, unknown>): Promise<ExecutionResult[]> {
  const scripts = mslScriptManager.getScriptsByCategory(category);
  const results: ExecutionResult[] = [];
  
  for (const script of scripts) {
    if (script.enabled) {
      const result = await mslScriptManager.executeScript(script.id, undefined, params);
      results.push(result);
      addExecutionResult(result);
    }
  }
  
  return results;
}

/**
 * Exécuter tous les scripts avec un tag
 */
export async function executeScriptsByTag(tag: string, params?: Record<string, unknown>): Promise<ExecutionResult[]> {
  const scripts = mslScriptManager.getScriptsByTag(tag);
  const results: ExecutionResult[] = [];
  
  for (const script of scripts) {
    if (script.enabled) {
      const result = await mslScriptManager.executeScript(script.id, undefined, params);
      results.push(result);
      addExecutionResult(result);
    }
  }
  
  return results;
}

/**
 * Charger un script depuis un fichier
 */
export async function loadScriptFromFile(path: string): Promise<MSLScript | null> {
  return mslScriptManager.loadScriptFromFile(path);
}

/**
 * Sauvegarder un script
 */
export async function saveScript(script: MSLScript, path?: string): Promise<boolean> {
  return mslScriptManager.saveScript(script, path);
}

/**
 * Créer un nouveau script
 */
export function createNewScript(options?: Partial<MSLScript>): MSLScript {
  const script: MSLScript = {
    ...DEFAULT_SCRIPT,
    id: `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...options,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  return script;
}

/**
 * Cloner un script
 */
export function cloneScript(script: MSLScript): MSLScript {
  return {
    ...script,
    id: `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `${script.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Nettoyer tous les scripts
 */
export function clearAllScripts(): void {
  scriptsStore.set([]);
  currentScriptStore.set(null);
  runningScriptStore.set(null);
  executionResultsStore.set([]);
  executionEventsStore.set([]);
  
  mslScriptManager.cleanup();
}

/**
 * Activer/Désactiver MSL
 */
export function toggleMSL(enabled: boolean): void {
  mslStatusStore.update(status => ({ ...status, enabled }));
}

/**
 * Réinitialiser MSL
 */
export function resetMSL(): void {
  clearAllScripts();
  mslStatusStore.set({ enabled: true, running: 0, loaded: 0 });
}

// ============ INITIALIZATION ============

// Initialiser automatiquement
if (typeof window !== 'undefined') {
  initializeMSLStores();
}

// ============ EXPORT ============

export const mslStoreExports = {
  // Stores
  scriptsStore,
  currentScriptStore,
  runningScriptStore,
  executionResultsStore,
  executionEventsStore,
  mslStatusStore,
  
  // Derived stores
  scriptCountStore,
  scriptsByTypeStore,
  enabledScriptsStore,
  disabledScriptsStore,
  runningScriptsStore,
  
  // Actions
  initializeMSLStores,
  addScript,
  removeScript,
  updateScript,
  setScripts,
  setCurrentScript,
  setRunningScript,
  addExecutionResult,
  addExecutionEvent,
  clearExecutionResults,
  clearExecutionEvents,
  executeScript,
  stopScript,
  pauseScript,
  resumeScript,
  toggleScript,
  toggleAllScripts,
  executeScriptsByType,
  executeScriptsByCategory,
  executeScriptsByTag,
  loadScriptFromFile,
  saveScript,
  createNewScript,
  cloneScript,
  clearAllScripts,
  toggleMSL,
  resetMSL,
};
