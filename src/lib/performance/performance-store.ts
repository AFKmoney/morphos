/**
 * Performance Optimization System - Store
 * 
 * Stores Svelte pour la gestion des performances
 */

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type {
  PerformanceMetric,
  MetricId,
  PerformanceTask,
  TaskId,
  PerformanceCache,
  CacheId,
  CacheEntry,
  PerformanceMonitor,
  MonitorId,
  PerformanceOptimization,
  PerformanceProfile,
  PerformanceReport,
  PerformanceRecommendation,
  PerformanceSettings,
  PerformanceStatus,
  PerformancePriority,
  MetricType,
  CacheType,
  TaskType,
  PerformanceEvent,
  PerformanceEventType,
} from './performance-types';

import { performanceManager } from './performance-engine';
import { DEFAULT_PERFORMANCE_SETTINGS } from './performance-types';

// ============ DEFAULT VALUES ============

/** Statut par défaut */
export const DEFAULT_PERFORMANCE_STATUS = {
  enabled: true,
  monitoring: false,
  optimization: false,
  cache: false,
  metricCount: 0,
  taskCount: 0,
  cacheCount: 0,
  monitorCount: 0,
  optimizationCount: 0,
  profileCount: 0,
  reportCount: 0,
};

// ============ STORES ============

/** Store des métriques */
export const metricsStore: Writable<PerformanceMetric[]> = writable([]);

/** Store des tâches */
export const tasksStore: Writable<PerformanceTask[]> = writable([]);

/** Store des caches */
export const cachesStore: Writable<PerformanceCache[]> = writable([]);

/** Store des moniteurs */
export const monitorsStore: Writable<PerformanceMonitor[]> = writable([]);

/** Store des optimisations */
export const optimizationsStore: Writable<PerformanceOptimization[]> = writable([]);

/** Store des profils */
export const profilesStore: Writable<PerformanceProfile[]> = writable([]);

/** Store des rapports */
export const reportsStore: Writable<PerformanceReport[]> = writable([]);

/** Store des paramètres */
export const performanceSettingsStore: Writable<PerformanceSettings> = writable(DEFAULT_PERFORMANCE_SETTINGS);

/** Store du statut */
export const performanceStatusStore: Writable<typeof DEFAULT_PERFORMANCE_STATUS> = writable(DEFAULT_PERFORMANCE_STATUS);

/** Store des événements */
export const performanceEventsStore: Writable<PerformanceEvent[]> = writable([]);

// ============ DERIVED STORES ============

/** Nombre de métriques */
export const metricCountStore: Readable<number> = derived(
  metricsStore,
  ($metrics) => $metrics.length
);

/** Nombre de tâches */
export const taskCountStore: Readable<number> = derived(
  tasksStore,
  ($tasks) => $tasks.length
);

/** Nombre de caches */
export const cacheCountStore: Readable<number> = derived(
  cachesStore,
  ($caches) => $caches.length
);

/** Nombre de moniteurs */
export const monitorCountStore: Readable<number> = derived(
  monitorsStore,
  ($monitors) => $monitors.length
);

/** Nombre d'optimisations */
export const optimizationCountStore: Readable<number> = derived(
  optimizationsStore,
  ($optimizations) => $optimizations.length
);

/** Nombre de profils */
export const profileCountStore: Readable<number> = derived(
  profilesStore,
  ($profiles) => $profiles.length
);

/** Nombre de rapports */
export const reportCountStore: Readable<number> = derived(
  reportsStore,
  ($reports) => $reports.length
);

/** Métriques par type */
export const metricsByTypeStore: Readable<Record<MetricType, PerformanceMetric[]>> = derived(
  metricsStore,
  ($metrics) => {
    const byType: Record<MetricType, PerformanceMetric[]> = {
      cpu: [],
      memory: [],
      render: [],
      network: [],
      storage: [],
      fps: [],
      latency: [],
      throughput: [],
      custom: [],
    };
    
    for (const metric of $metrics) {
      byType[metric.type].push(metric);
    }
    
    return byType;
  }
);

/** Tâches par statut */
export const tasksByStatusStore: Readable<Record<PerformanceStatus, PerformanceTask[]>> = derived(
  tasksStore,
  ($tasks) => {
    const byStatus: Record<PerformanceStatus, PerformanceTask[]> = {
      idle: [],
      running: [],
      paused: [],
      stopped: [],
      error: [],
      warning: [],
      optimized: [],
      degraded: [],
    };
    
    for (const task of $tasks) {
      byStatus[task.status].push(task);
    }
    
    return byStatus;
  }
);

/** Moniteurs actifs */
export const activeMonitorsStore: Readable<PerformanceMonitor[]> = derived(
  monitorsStore,
  ($monitors) => $monitors.filter(m => m.active)
);

/** Optimisations actives */
export const activeOptimizationsStore: Readable<PerformanceOptimization[]> = derived(
  optimizationsStore,
  ($optimizations) => $optimizations.filter(o => o.active)
);

/** Profils en cours */
export const runningProfilesStore: Readable<PerformanceProfile[]> = derived(
  profilesStore,
  ($profiles) => $profiles.filter(p => p.status === 'running')
);

// ============ INITIALIZATION ============

/**
 * Initialiser les stores de performance
 */
export function initializePerformanceStores(): void {
  // Charger les données depuis le localStorage
  const savedMetrics = localStorage.getItem('morphos-performance-metrics');
  const savedTasks = localStorage.getItem('morphos-performance-tasks');
  const savedCaches = localStorage.getItem('morphos-performance-caches');
  const savedMonitors = localStorage.getItem('morphos-performance-monitors');
  const savedOptimizations = localStorage.getItem('morphos-performance-optimizations');
  const savedSettings = localStorage.getItem('morphos-performance-settings');
  
  if (savedMetrics) {
    try {
      metricsStore.set(JSON.parse(savedMetrics));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedTasks) {
    try {
      tasksStore.set(JSON.parse(savedTasks));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedCaches) {
    try {
      cachesStore.set(JSON.parse(savedCaches));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedMonitors) {
    try {
      monitorsStore.set(JSON.parse(savedMonitors));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedOptimizations) {
    try {
      optimizationsStore.set(JSON.parse(savedOptimizations));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedSettings) {
    try {
      performanceSettingsStore.set(JSON.parse(savedSettings));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  // Sauvegarder les données lors des changements
  metricsStore.subscribe((metrics) => {
    localStorage.setItem('morphos-performance-metrics', JSON.stringify(metrics.slice(-100)));
    performanceStatusStore.update(status => ({ ...status, metricCount: metrics.length }));
  });
  
  tasksStore.subscribe((tasks) => {
    localStorage.setItem('morphos-performance-tasks', JSON.stringify(tasks.slice(-100)));
    performanceStatusStore.update(status => ({ ...status, taskCount: tasks.length }));
  });
  
  cachesStore.subscribe((caches) => {
    localStorage.setItem('morphos-performance-caches', JSON.stringify(caches));
    performanceStatusStore.update(status => ({ ...status, cacheCount: caches.length }));
  });
  
  monitorsStore.subscribe((monitors) => {
    localStorage.setItem('morphos-performance-monitors', JSON.stringify(monitors));
    performanceStatusStore.update(status => ({ ...status, monitorCount: monitors.length }));
  });
  
  optimizationsStore.subscribe((optimizations) => {
    localStorage.setItem('morphos-performance-optimizations', JSON.stringify(optimizations));
    performanceStatusStore.update(status => ({ ...status, optimizationCount: optimizations.length }));
  });
  
  performanceSettingsStore.subscribe((settings) => {
    localStorage.setItem('morphos-performance-settings', JSON.stringify(settings));
  });
  
  // S'abonner aux changements du manager
  performanceManager.onEvent('*', (event) => {
    performanceEventsStore.update(events => [event, ...events].slice(0, 100));
  });
  
  // Charger les données du manager
  const managerMetrics = performanceManager.getAllMetrics();
  metricsStore.set(managerMetrics);
  
  const managerTasks = performanceManager.getAllTasks();
  tasksStore.set(managerTasks);
  
  const managerCaches = performanceManager.getAllCaches();
  cachesStore.set(managerCaches);
  
  const managerMonitors = performanceManager.getAllMonitors();
  monitorsStore.set(managerMonitors);
  
  const managerOptimizations = performanceManager.getAllOptimizations();
  optimizationsStore.set(managerOptimizations);
  
  const managerProfiles = performanceManager.getAllProfiles();
  profilesStore.set(managerProfiles);
  
  const managerReports = performanceManager.getAllReports();
  reportsStore.set(managerReports);
  
  const managerSettings = performanceManager.getSettings();
  performanceSettingsStore.set(managerSettings);
  
  performanceStatusStore.update(status => ({
    ...status,
    enabled: managerSettings.enabled,
    monitoring: managerSettings.monitoringEnabled,
    optimization: managerSettings.optimizationEnabled,
    cache: managerSettings.cacheEnabled,
  }));
}

// ============ ACTIONS ============

/**
 * Ajouter une métrique
 */
export function addMetric(metric: PerformanceMetric): MetricId {
  const id = performanceManager.addMetric(metric);
  metricsStore.update(metrics => [...metrics, metric]);
  return id;
}

/**
 * Obtenir une métrique par ID
 */
export function getMetric(id: MetricId): PerformanceMetric | null {
  return performanceManager.getMetric(id);
}

/**
 * Obtenir toutes les métriques
 */
export function getAllMetrics(): PerformanceMetric[] {
  return performanceManager.getAllMetrics();
}

/**
 * Obtenir les métriques par type
 */
export function getMetricsByType(type: MetricType): PerformanceMetric[] {
  return performanceManager.getMetricsByType(type);
}

/**
 * Supprimer une métrique
 */
export function removeMetric(id: MetricId): boolean {
  const success = performanceManager.removeMetric(id);
  if (success) {
    metricsStore.update(metrics => metrics.filter(m => m.id !== id));
  }
  return success;
}

/**
 * Mettre à jour une métrique
 */
export function updateMetric(id: MetricId, updates: Partial<PerformanceMetric>): boolean {
  const success = performanceManager.updateMetric(id, updates);
  if (success) {
    metricsStore.update(metrics => metrics.map(m => m.id === id ? { ...m, ...updates } : m));
  }
  return success;
}

/**
 * Créer une métrique
 */
export function createMetric(
  name: string,
  type: MetricType,
  value: number,
  unit: string,
  options?: Partial<PerformanceMetric>
): MetricId {
  const id = performanceManager.createMetric(name, type, value, unit, options);
  const metric = performanceManager.getMetric(id);
  if (metric) {
    metricsStore.update(metrics => [...metrics, metric]);
  }
  return id;
}

/**
 * Ajouter une tâche
 */
export function addTask(task: PerformanceTask): TaskId {
  const id = performanceManager.addTask(task);
  tasksStore.update(tasks => [...tasks, task]);
  return id;
}

/**
 * Obtenir une tâche par ID
 */
export function getTask(id: TaskId): PerformanceTask | null {
  return performanceManager.getTask(id);
}

/**
 * Obtenir toutes les tâches
 */
export function getAllTasks(): PerformanceTask[] {
  return performanceManager.getAllTasks();
}

/**
 * Obtenir les tâches par statut
 */
export function getTasksByStatus(status: PerformanceStatus): PerformanceTask[] {
  return performanceManager.getTasksByStatus(status);
}

/**
 * Supprimer une tâche
 */
export function removeTask(id: TaskId): boolean {
  const success = performanceManager.removeTask(id);
  if (success) {
    tasksStore.update(tasks => tasks.filter(t => t.id !== id));
  }
  return success;
}

/**
 * Mettre à jour une tâche
 */
export function updateTask(id: TaskId, updates: Partial<PerformanceTask>): boolean {
  const success = performanceManager.updateTask(id, updates);
  if (success) {
    tasksStore.update(tasks => tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  }
  return success;
}

/**
 * Créer une tâche
 */
export function createTask(
  name: string,
  type: TaskType,
  fn: () => Promise<unknown> | unknown,
  options?: Partial<PerformanceTask>
): TaskId {
  const id = performanceManager.createTask(name, type, fn, options);
  const task = performanceManager.getTask(id);
  if (task) {
    tasksStore.update(tasks => [...tasks, task]);
  }
  return id;
}

/**
 * Exécuter une tâche
 */
export async function executeTask(id: TaskId): Promise<unknown> {
  return performanceManager.executeTask(id);
}

/**
 * Créer un cache
 */
export function createCache(name: string, type: CacheType, options?: { maxSize?: number; defaultTTL?: number }): CacheId {
  const id = performanceManager.createCache(name, type, options);
  const cache = performanceManager.getCache(id);
  if (cache) {
    cachesStore.update(caches => [...caches, cache]);
  }
  return id;
}

/**
 * Obtenir un cache par ID
 */
export function getCache(id: CacheId): PerformanceCache | null {
  return performanceManager.getCache(id);
}

/**
 * Obtenir tous les caches
 */
export function getAllCaches(): PerformanceCache[] {
  return performanceManager.getAllCaches();
}

/**
 * Supprimer un cache
 */
export function removeCache(id: CacheId): boolean {
  const success = performanceManager.removeCache(id);
  if (success) {
    cachesStore.update(caches => caches.filter(c => c.id !== id));
  }
  return success;
}

/**
 * Mettre à jour un cache
 */
export function updateCache(id: CacheId, updates: Partial<PerformanceCache>): boolean {
  const success = performanceManager.updateCache(id, updates);
  if (success) {
    cachesStore.update(caches => caches.map(c => c.id === id ? { ...c, ...updates } : c));
  }
  return success;
}

/**
 * Ajouter une entrée au cache
 */
export function setCacheEntry<T = unknown>(cacheId: CacheId, key: string, value: T, ttl?: number): boolean {
  return performanceManager.setCacheEntry(cacheId, key, value, ttl);
}

/**
 * Obtenir une entrée du cache
 */
export function getCacheEntry<T = unknown>(cacheId: CacheId, key: string): T | null {
  return performanceManager.getCacheEntry(cacheId, key);
}

/**
 * Supprimer une entrée du cache
 */
export function removeCacheEntry(cacheId: CacheId, key: string): boolean {
  return performanceManager.removeCacheEntry(cacheId, key);
}

/**
 * Vider un cache
 */
export function clearCache(cacheId: CacheId): boolean {
  return performanceManager.clearCache(cacheId);
}

/**
 * Ajouter un moniteur
 */
export function addMonitor(monitor: PerformanceMonitor): MonitorId {
  const id = performanceManager.addMonitor(monitor);
  monitorsStore.update(monitors => [...monitors, monitor]);
  return id;
}

/**
 * Obtenir un moniteur par ID
 */
export function getMonitor(id: MonitorId): PerformanceMonitor | null {
  return performanceManager.getMonitor(id);
}

/**
 * Obtenir tous les moniteurs
 */
export function getAllMonitors(): PerformanceMonitor[] {
  return performanceManager.getAllMonitors();
}

/**
 * Obtenir les moniteurs par type
 */
export function getMonitorsByType(type: MetricType): PerformanceMonitor[] {
  return performanceManager.getMonitorsByType(type);
}

/**
 * Supprimer un moniteur
 */
export function removeMonitor(id: MonitorId): boolean {
  const success = performanceManager.removeMonitor(id);
  if (success) {
    monitorsStore.update(monitors => monitors.filter(m => m.id !== id));
  }
  return success;
}

/**
 * Mettre à jour un moniteur
 */
export function updateMonitorConfig(id: MonitorId, updates: Partial<PerformanceMonitor>): boolean {
  return performanceManager.updateMonitorConfig(id, updates);
}

/**
 * Activer/Désactiver un moniteur
 */
export function toggleMonitor(id: MonitorId, active?: boolean): boolean {
  return performanceManager.toggleMonitor(id, active);
}

/**
 * Créer un moniteur
 */
export function createMonitor(
  name: string,
  type: MetricType,
  options?: Partial<PerformanceMonitor>
): MonitorId {
  const id = performanceManager.createMonitor(name, type, options);
  const monitor = performanceManager.getMonitor(id);
  if (monitor) {
    monitorsStore.update(monitors => [...monitors, monitor]);
  }
  return id;
}

/**
 * Ajouter une optimisation
 */
export function addOptimization(optimization: PerformanceOptimization): string {
  const id = performanceManager.addOptimization(optimization);
  optimizationsStore.update(optimizations => [...optimizations, optimization]);
  return id;
}

/**
 * Obtenir une optimisation par ID
 */
export function getOptimization(id: string): PerformanceOptimization | null {
  return performanceManager.getOptimization(id);
}

/**
 * Obtenir toutes les optimisations
 */
export function getAllOptimizations(): PerformanceOptimization[] {
  return performanceManager.getAllOptimizations();
}

/**
 * Supprimer une optimisation
 */
export function removeOptimization(id: string): boolean {
  const success = performanceManager.removeOptimization(id);
  if (success) {
    optimizationsStore.update(optimizations => optimizations.filter(o => o.id !== id));
  }
  return success;
}

/**
 * Mettre à jour une optimisation
 */
export function updateOptimization(id: string, updates: Partial<PerformanceOptimization>): boolean {
  const success = performanceManager.updateOptimization(id, updates);
  if (success) {
    optimizationsStore.update(optimizations => optimizations.map(o => o.id === id ? { ...o, ...updates } : o));
  }
  return success;
}

/**
 * Créer une optimisation
 */
export function createOptimization(
  name: string,
  type: PerformanceOptimization['type'],
  config: PerformanceOptimization['config'],
  options?: Partial<PerformanceOptimization>
): string {
  const id = performanceManager.createOptimization(name, type, config, options);
  const optimization = performanceManager.getOptimization(id);
  if (optimization) {
    optimizationsStore.update(optimizations => [...optimizations, optimization]);
  }
  return id;
}

/**
 * Démarrer un profil
 */
export function startProfile(name: string, description?: string): string {
  const id = performanceManager.startProfile(name, description);
  const profile = performanceManager.getProfile(id);
  if (profile) {
    profilesStore.update(profiles => [...profiles, profile]);
  }
  return id;
}

/**
 * Arrêter un profil
 */
export function stopProfile(id: string): PerformanceProfile | null {
  const profile = performanceManager.stopProfile(id);
  if (profile) {
    profilesStore.update(profiles => profiles.map(p => p.id === id ? profile : p));
  }
  return profile;
}

/**
 * Obtenir un profil par ID
 */
export function getProfile(id: string): PerformanceProfile | null {
  return performanceManager.getProfile(id);
}

/**
 * Obtenir tous les profils
 */
export function getAllProfiles(): PerformanceProfile[] {
  return performanceManager.getAllProfiles();
}

/**
 * Ajouter une métrique à un profil
 */
export function addMetricToProfile(profileId: string, metric: PerformanceMetric): boolean {
  return performanceManager.addMetricToProfile(profileId, metric);
}

/**
 * Ajouter une tâche à un profil
 */
export function addTaskToProfile(profileId: string, task: PerformanceTask): boolean {
  return performanceManager.addTaskToProfile(profileId, task);
}

/**
 * Générer un rapport
 */
export function generateReport(profileId: string, name?: string): PerformanceReport | null {
  const report = performanceManager.generateReport(profileId, name);
  if (report) {
    reportsStore.update(reports => [...reports, report]);
  }
  return report;
}

/**
 * Obtenir un rapport par ID
 */
export function getReport(id: string): PerformanceReport | null {
  return performanceManager.getReport(id);
}

/**
 * Obtenir tous les rapports
 */
export function getAllReports(): PerformanceReport[] {
  return performanceManager.getAllReports();
}

/**
 * Obtenir les paramètres
 */
export function getPerformanceSettings(): PerformanceSettings {
  return performanceManager.getSettings();
}

/**
 * Mettre à jour les paramètres
 */
export function updatePerformanceSettings(updates: Partial<PerformanceSettings>): void {
  performanceManager.updateSettings(updates);
  performanceSettingsStore.update(settings => ({ ...settings, ...updates }));
}

/**
 * Activer/Désactiver la performance
 */
export function setPerformanceEnabled(enabled: boolean): void {
  updatePerformanceSettings({ enabled });
}

/**
 * Activer/Désactiver le monitoring
 */
export function setMonitoringEnabled(enabled: boolean): void {
  updatePerformanceSettings({ monitoringEnabled: enabled });
}

/**
 * Activer/Désactiver l'optimisation
 */
export function setOptimizationEnabled(enabled: boolean): void {
  updatePerformanceSettings({ optimizationEnabled: enabled });
}

/**
 * Activer/Désactiver le cache
 */
export function setCacheEnabled(enabled: boolean): void {
  updatePerformanceSettings({ cacheEnabled: enabled });
}

/**
 * Nettoyer les données
 */
export function clearPerformanceData(): void {
  metricsStore.set([]);
  tasksStore.set([]);
  cachesStore.set([]);
  monitorsStore.set([]);
  optimizationsStore.set([]);
  profilesStore.set([]);
  reportsStore.set([]);
  performanceSettingsStore.set(DEFAULT_PERFORMANCE_SETTINGS);
  performanceStatusStore.set(DEFAULT_PERFORMANCE_STATUS);
  performanceEventsStore.set([]);
  
  performanceManager.cleanup();
}

/**
 * Réinitialiser la performance
 */
export function resetPerformance(): void {
  clearPerformanceData();
  localStorage.removeItem('morphos-performance-metrics');
  localStorage.removeItem('morphos-performance-tasks');
  localStorage.removeItem('morphos-performance-caches');
  localStorage.removeItem('morphos-performance-monitors');
  localStorage.removeItem('morphos-performance-optimizations');
  localStorage.removeItem('morphos-performance-settings');
}

/**
 * S'abonner à un événement
 */
export function onPerformanceEvent(type: PerformanceEventType, callback: (event: PerformanceEvent) => void): () => void {
  return performanceManager.onEvent(type, callback);
}

// ============ INITIALIZATION ============

// Initialiser automatiquement
if (typeof window !== 'undefined') {
  initializePerformanceStores();
}

// ============ EXPORT ============

export default {
  // Stores
  metricsStore,
  tasksStore,
  cachesStore,
  monitorsStore,
  optimizationsStore,
  profilesStore,
  reportsStore,
  performanceSettingsStore,
  performanceStatusStore,
  performanceEventsStore,
  
  // Derived stores
  metricCountStore,
  taskCountStore,
  cacheCountStore,
  monitorCountStore,
  optimizationCountStore,
  profileCountStore,
  reportCountStore,
  metricsByTypeStore,
  tasksByStatusStore,
  activeMonitorsStore,
  activeOptimizationsStore,
  runningProfilesStore,
  
  // Actions
  initializePerformanceStores,
  addMetric,
  getMetric,
  getAllMetrics,
  getMetricsByType,
  removeMetric,
  updateMetric,
  createMetric,
  addTask,
  getTask,
  getAllTasks,
  getTasksByStatus,
  removeTask,
  updateTask,
  createTask,
  executeTask,
  createCache,
  getCache,
  getAllCaches,
  removeCache,
  updateCache,
  setCacheEntry,
  getCacheEntry,
  removeCacheEntry,
  clearCache,
  addMonitor,
  getMonitor,
  getAllMonitors,
  getMonitorsByType,
  removeMonitor,
  updateMonitorConfig,
  toggleMonitor,
  createMonitor,
  addOptimization,
  getOptimization,
  getAllOptimizations,
  removeOptimization,
  updateOptimization,
  createOptimization,
  startProfile,
  stopProfile,
  getProfile,
  getAllProfiles,
  addMetricToProfile,
  addTaskToProfile,
  generateReport,
  getReport,
  getAllReports,
  getPerformanceSettings,
  updatePerformanceSettings,
  setPerformanceEnabled,
  setMonitoringEnabled,
  setOptimizationEnabled,
  setCacheEnabled,
  clearPerformanceData,
  resetPerformance,
  onPerformanceEvent,
};
