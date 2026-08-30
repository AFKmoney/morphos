/**
 * Performance Optimization System - Types
 * 
 * Système complet d'optimisation des performances pour MorphOS
 */

// ============ CORE TYPES ============

/** Identifiant unique d'une métrique de performance */
export type MetricId = string;

/** Identifiant unique d'une tâche */
export type TaskId = string;

/** Identifiant unique d'un cache */
export type CacheId = string;

/** Identifiant unique d'un moniteur */
export type MonitorId = string;

/** Statut */
export type PerformanceStatus = 
  | 'idle'       // Inactif
  | 'running'    // En cours
  | 'paused'     // En pause
  | 'stopped'    // Arrêté
  | 'error'      // Erreur
  | 'warning'    // Avertissement
  | 'optimized'  // Optimisé
  | 'degraded';  // Dégradé

/** Priorité */
export type PerformancePriority = 
  | 'low'       // Faible
  | 'medium'    // Moyen
  | 'high'      // Élevé
  | 'critical'; // Critique

/** Type de métrique */
export type MetricType = 
  | 'cpu'           // CPU
  | 'memory'        // Mémoire
  | 'render'        // Rendu
  | 'network'       // Réseau
  | 'storage'       // Stockage
  | 'fps'           // FPS
  | 'latency'       // Latence
  | 'throughput'    // Débit
  | 'custom';       // Personnalisé

/** Type de cache */
export type CacheType = 
  | 'memory'        // Mémoire
  | 'localStorage'  // LocalStorage
  | 'indexedDB'     // IndexedDB
  | 'sessionStorage' // SessionStorage
  | 'custom';       // Personnalisé

/** Type de tâche */
export type TaskType = 
  | 'render'        // Rendu
  | 'compute'       // Calcul
  | 'io'            // E/S
  | 'network'       // Réseau
  | 'custom';       // Personnalisé

// ============ METRIC TYPES ============

/** Métrique de performance */
export interface PerformanceMetric {
  /** ID unique */
  id: MetricId;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type */
  type: MetricType;
  
  /** Valeur */
  value: number;
  
  /** Unité */
  unit: string;
  
  /** Minimum */
  min?: number;
  
  /** Maximum */
  max?: number;
  
  /** Moyenne */
  average?: number;
  
  /** Timestamp */
  timestamp: number;
  
  /** Statut */
  status: PerformanceStatus;
  
  /** Priorité */
  priority: PerformancePriority;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Métrique CPU */
export interface CPUMetric extends PerformanceMetric {
  type: 'cpu';
  
  /** Utilisation CPU */
  usage: number;
  
  /** Nombre de cœurs */
  cores: number;
  
  /** Temps CPU */
  cpuTime: number;
}

/** Métrique mémoire */
export interface MemoryMetric extends PerformanceMetric {
  type: 'memory';
  
  /** Utilisation mémoire */
  used: number;
  
  /** Mémoire totale */
  total: number;
  
  /** Mémoire disponible */
  available: number;
  
  /** Pourcentage utilisé */
  usagePercent: number;
}

/** Métrique de rendu */
export interface RenderMetric extends PerformanceMetric {
  type: 'render';
  
  /** FPS */
  fps: number;
  
  /** Temps de rendu */
  renderTime: number;
  
  /** Nombre d'éléments */
  elementCount: number;
}

/** Métrique réseau */
export interface NetworkMetric extends PerformanceMetric {
  type: 'network';
  
  /** Vitesse de téléchargement */
  downloadSpeed: number;
  
  /** Vitesse de téléversement */
  uploadSpeed: number;
  
  /** Latence */
  latency: number;
  
  /** Nombre de requêtes */
  requestCount: number;
}

/** Métrique de stockage */
export interface StorageMetric extends PerformanceMetric {
  type: 'storage';
  
  /** Espace utilisé */
  used: number;
  
  /** Espace total */
  total: number;
  
  /** Espace disponible */
  available: number;
  
  /** Pourcentage utilisé */
  usagePercent: number;
}

// ============ TASK TYPES ============

/** Tâche */
export interface PerformanceTask {
  /** ID unique */
  id: TaskId;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type */
  type: TaskType;
  
  /** Statut */
  status: PerformanceStatus;
  
  /** Priorité */
  priority: PerformancePriority;
  
  /** Fonction */
  fn: () => Promise<unknown> | unknown;
  
  /** Arguments */
  args?: unknown[];
  
  /** Résultat */
  result?: unknown;
  
  /** Erreur */
  error?: string;
  
  /** Début */
  startTime?: number;
  
  /** Fin */
  endTime?: number;
  
  /** Durée (en ms) */
  duration?: number;
  
  /** Timestamp */
  timestamp: number;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Tâche de rendu */
export interface RenderTask extends PerformanceTask {
  type: 'render';
  
  /** Élément à rendre */
  element?: HTMLElement | null;
  
  /** Type de rendu */
  renderType?: 'full' | 'partial' | 'update';
}

/** Tâche de calcul */
export interface ComputeTask extends PerformanceTask {
  type: 'compute';
  
  /** Fonction de calcul */
  computeFn?: (...args: unknown[]) => Promise<unknown> | unknown;
  
  /** Complexité */
  complexity?: 'low' | 'medium' | 'high';
}

/** Tâche d'E/S */
export interface IOTask extends PerformanceTask {
  type: 'io';
  
  /** Type d'E/S */
  ioType?: 'read' | 'write' | 'delete';
  
  /** Chemin */
  path?: string;
  
  /** Taille */
  size?: number;
}

/** Tâche réseau */
export interface NetworkTask extends PerformanceTask {
  type: 'network';
  
  /** URL */
  url?: string;
  
  /** Méthode */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /** Taille de la requête */
  requestSize?: number;
  
  /** Taille de la réponse */
  responseSize?: number;
  
  /** Statut HTTP */
  statusCode?: number;
}

// ============ CACHE TYPES ============

/** Entrée de cache */
export interface CacheEntry<T = unknown> {
  /** ID unique */
  id: string;
  
  /** Clé */
  key: string;
  
  /** Valeur */
  value: T;
  
  /** Timestamp */
  timestamp: number;
  
  /** Date d'expiration */
  expiresAt?: number;
  
  /** TTL (en ms) */
  ttl?: number;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Cache */
export interface PerformanceCache {
  /** ID unique */
  id: CacheId;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type */
  type: CacheType;
  
  /** Taille */
  size: number;
  
  /** Taille maximale */
  maxSize: number;
  
  /** TTL par défaut (en ms) */
  defaultTTL: number;
  
  /** Entrées */
  entries: Map<string, CacheEntry>;
  
  /** Statut */
  status: PerformanceStatus;
  
  /** Timestamp */
  timestamp: number;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Stratégie de cache */
export interface CacheStrategy {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type */
  type: 'lru' | 'lfu' | 'fifo' | 'lifo' | 'custom';
  
  /** Configuration */
  config?: Record<string, unknown>;
  
  /** Actif */
  active: boolean;
  
  /** Priorité */
  priority: PerformancePriority;
}

// ============ MONITOR TYPES ============

/** Moniteur */
export interface PerformanceMonitor {
  /** ID unique */
  id: MonitorId;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type */
  type: MetricType;
  
  /** Actif */
  active: boolean;
  
  /** Intervalle (en ms) */
  interval: number;
  
  /** Seuil d'alerte */
  threshold?: number;
  
  /** Seuil critique */
  criticalThreshold?: number;
  
  /** Callback */
  callback?: (metric: PerformanceMetric) => void;
  
  /** Statut */
  status: PerformanceStatus;
  
  /** Dernière valeur */
  lastValue?: number;
  
  /** Dernière alerte */
  lastAlertAt?: number;
  
  /** Nombre d'alertes */
  alertCount: number;
  
  /** Timestamp */
  timestamp: number;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Moniteur CPU */
export interface CPUMonitor extends PerformanceMonitor {
  type: 'cpu';
  
  /** Utilisation maximale */
  maxUsage?: number;
}

/** Moniteur mémoire */
export interface MemoryMonitor extends PerformanceMonitor {
  type: 'memory';
  
  /** Utilisation mémoire maximale */
  maxUsage?: number;
}

/** Moniteur de rendu */
export interface RenderMonitor extends PerformanceMonitor {
  type: 'render';
  
  /** FPS minimum */
  minFps?: number;
}

/** Moniteur réseau */
export interface NetworkMonitor extends PerformanceMonitor {
  type: 'network';
  
  /** Latence maximale */
  maxLatency?: number;
}

// ============ OPTIMIZATION TYPES ============

/** Optimisation */
export interface PerformanceOptimization {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type */
  type: 'debounce' | 'throttle' | 'lazy_load' | 'virtualize' | 'memoize' | 'batch' | 'compress' | 'custom';
  
  /** Configuration */
  config: OptimizationConfig;
  
  /** Actif */
  active: boolean;
  
  /** Priorité */
  priority: PerformancePriority;
  
  /** Statut */
  status: PerformanceStatus;
  
  /** Gain de performance */
  performanceGain?: number;
  
  /** Timestamp */
  timestamp: number;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Configuration d'optimisation */
export interface OptimizationConfig {
  /** Délai (en ms) */
  delay?: number;
  
  /** Intervalle (en ms) */
  interval?: number;
  
  /** Taille du batch */
  batchSize?: number;
  
  /** Taille du cache */
  cacheSize?: number;
  
  /** Seuil */
  threshold?: number;
  
  /** Niveau de compression */
  compressionLevel?: number;
  
  /** Paramètres */
  params?: Record<string, unknown>;
}

// ============ PROFILER TYPES ============

/** Profil */
export interface PerformanceProfile {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Métriques */
  metrics: PerformanceMetric[];
  
  /** Tâches */
  tasks: PerformanceTask[];
  
  /** Début */
  startTime: number;
  
  /** Fin */
  endTime?: number;
  
  /** Durée (en ms) */
  duration?: number;
  
  /** Statut */
  status: PerformanceStatus;
  
  /** Timestamp */
  timestamp: number;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Rapport de performance */
export interface PerformanceReport {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Profil */
  profile: PerformanceProfile;
  
  /** Métriques agrégées */
  aggregatedMetrics: Record<string, PerformanceMetric>;
  
  /** Recommandations */
  recommendations: PerformanceRecommendation[];
  
  /** Score de performance */
  score: number;
  
  /** Note */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  
  /** Date de génération */
  generatedAt: number;
  
  /** Tags */
  tags?: string[];
}

/** Recommandation */
export interface PerformanceRecommendation {
  /** ID unique */
  id: string;
  
  /** Titre */
  title: string;
  
  /** Description */
  description: string;
  
  /** Type */
  type: 'optimization' | 'warning' | 'error' | 'info';
  
  /** Priorité */
  priority: PerformancePriority;
  
  /** Métrique concernée */
  metricId?: MetricId;
  
  /** Action recommandée */
  action?: string;
  
  /** Gain estimé */
  estimatedGain?: number;
}

// ============ EVENT TYPES ============

/** Type d'événement de performance */
export type PerformanceEventType = 
  | 'metric.added'
  | 'metric.updated'
  | 'metric.removed'
  | 'task.added'
  | 'task.updated'
  | 'task.removed'
  | 'task.started'
  | 'task.completed'
  | 'task.error'
  | 'cache.added'
  | 'cache.updated'
  | 'cache.removed'
  | 'cache.hit'
  | 'cache.miss'
  | 'cache.evicted'
  | 'monitor.added'
  | 'monitor.updated'
  | 'monitor.removed'
  | 'monitor.alert'
  | 'optimization.added'
  | 'optimization.updated'
  | 'optimization.removed'
  | 'profile.started'
  | 'profile.stopped'
  | 'profile.completed'
  | 'report.generated'
  | 'status.changed';

/** Événement de performance */
export interface PerformanceEvent {
  type: PerformanceEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

// ============ SETTINGS TYPES ============

/** Paramètres de performance */
export interface PerformanceSettings {
  /** Actif */
  enabled: boolean;
  
  /** Monitoring activé */
  monitoringEnabled: boolean;
  
  /** Optimisation activée */
  optimizationEnabled: boolean;
  
  /** Cache activé */
  cacheEnabled: boolean;
  
  /** Intervalle de monitoring (en ms) */
  monitoringInterval: number;
  
  /** Taille maximale du cache */
  maxCacheSize: number;
  
  /** TTL par défaut du cache (en ms) */
  defaultCacheTTL: number;
  
  /** Nombre maximum de tâches */
  maxTasks: number;
  
  /** Nombre maximum de moniteurs */
  maxMonitors: number;
  
  /** Niveau de logging */
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'none';
  
  /** Synchronisation */
  sync: boolean;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

// ============ DEFAULT VALUES ============

/** Paramètres par défaut */
export const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
  enabled: true,
  monitoringEnabled: true,
  optimizationEnabled: true,
  cacheEnabled: true,
  monitoringInterval: 1000,
  maxCacheSize: 1000,
  defaultCacheTTL: 300000, // 5 minutes
  maxTasks: 100,
  maxMonitors: 50,
  logLevel: 'info',
  sync: false,
};

// ============ EXPORT ============

export {
  // Core Types
  MetricId,
  TaskId,
  CacheId,
  MonitorId,
  PerformanceStatus,
  PerformancePriority,
  MetricType,
  CacheType,
  TaskType,
  
  // Metric Types
  PerformanceMetric,
  CPUMetric,
  MemoryMetric,
  RenderMetric,
  NetworkMetric,
  StorageMetric,
  
  // Task Types
  PerformanceTask,
  RenderTask,
  ComputeTask,
  IOTask,
  NetworkTask,
  
  // Cache Types
  CacheEntry,
  PerformanceCache,
  CacheStrategy,
  
  // Monitor Types
  PerformanceMonitor,
  CPUMonitor,
  MemoryMonitor,
  RenderMonitor,
  NetworkMonitor,
  
  // Optimization Types
  PerformanceOptimization,
  OptimizationConfig,
  
  // Profiler Types
  PerformanceProfile,
  PerformanceReport,
  PerformanceRecommendation,
  
  // Event Types
  PerformanceEventType,
  PerformanceEvent,
  
  // Settings Types
  PerformanceSettings,
  
  // Default Values
  DEFAULT_PERFORMANCE_SETTINGS,
};
