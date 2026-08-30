/**
 * Performance Optimization System - Engine
 * 
 * Moteur d'optimisation des performances pour MorphOS
 */

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
  CPUMetric,
  MemoryMetric,
  RenderMetric,
  NetworkMetric,
  StorageMetric,
  CacheStrategy,
  OptimizationConfig,
} from './performance-types';

import { DEFAULT_PERFORMANCE_SETTINGS } from './performance-types';

// ============ PERFORMANCE MANAGER ============

/**
 * Gestionnaire de performance
 */
export class PerformanceManager {
  private metrics: Map<MetricId, PerformanceMetric> = new Map();
  private tasks: Map<TaskId, PerformanceTask> = new Map();
  private caches: Map<CacheId, PerformanceCache> = new Map();
  private monitors: Map<MonitorId, PerformanceMonitor> = new Map();
  private optimizations: Map<string, PerformanceOptimization> = new Map();
  private profiles: Map<string, PerformanceProfile> = new Map();
  private reports: Map<string, PerformanceReport> = new Map();
  private eventListeners: Map<PerformanceEventType, Set<(event: PerformanceEvent) => void>> = new Map();
  
  private settings: PerformanceSettings = { ...DEFAULT_PERFORMANCE_SETTINGS };
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private taskQueue: PerformanceTask[] = [];
  private isProcessingQueue: boolean = false;
  
  constructor() {
    // Démarrer le monitoring
    this.startMonitoring();
  }
  
  // ============ MONITORING ============
  
  /**
   * Démarrer le monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (!this.settings.monitoringEnabled) return;
    
    this.monitoringInterval = setInterval(() => {
      this.updateAllMonitors();
    }, this.settings.monitoringInterval);
    
    // Mettre à jour immédiatement
    this.updateAllMonitors();
  }
  
  /**
   * Arrêter le monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
  
  /**
   * Mettre à jour tous les moniteurs
   */
  private updateAllMonitors(): void {
    if (!this.settings.monitoringEnabled) return;
    
    for (const monitor of this.monitors.values()) {
      if (monitor.active) {
        this.updateMonitor(monitor);
      }
    }
  }
  
  /**
   * Mettre à jour un moniteur
   */
  private updateMonitor(monitor: PerformanceMonitor): void {
    let metric: PerformanceMetric;
    
    switch (monitor.type) {
      case 'cpu':
        metric = this.getCPUMetric();
        break;
      case 'memory':
        metric = this.getMemoryMetric();
        break;
      case 'render':
        metric = this.getRenderMetric();
        break;
      case 'network':
        metric = this.getNetworkMetric();
        break;
      case 'storage':
        metric = this.getStorageMetric();
        break;
      default:
        metric = this.getCustomMetric(monitor);
    }
    
    metric.id = monitor.id;
    metric.name = monitor.name;
    metric.type = monitor.type;
    metric.timestamp = Date.now();
    
    this.metrics.set(monitor.id, metric);
    monitor.lastValue = metric.value;
    
    // Vérifier les seuils
    this.checkMonitorThresholds(monitor, metric);
    
    // Appeler le callback
    if (monitor.callback) {
      try {
        monitor.callback(metric);
      } catch (error) {
        console.error('Error in monitor callback:', error);
      }
    }
    
    this.emitEvent('monitor.updated', { monitorId: monitor.id, metric });
  }
  
  /**
   * Vérifier les seuils d'un moniteur
   */
  private checkMonitorThresholds(monitor: PerformanceMonitor, metric: PerformanceMetric): void {
    if (monitor.threshold && metric.value > monitor.threshold) {
      monitor.status = 'warning';
      monitor.alertCount++;
      monitor.lastAlertAt = Date.now();
      this.emitEvent('monitor.alert', { monitorId: monitor.id, type: 'threshold', value: metric.value });
    }
    
    if (monitor.criticalThreshold && metric.value > monitor.criticalThreshold) {
      monitor.status = 'error';
      monitor.alertCount++;
      monitor.lastAlertAt = Date.now();
      this.emitEvent('monitor.alert', { monitorId: monitor.id, type: 'critical', value: metric.value });
    }
    
    if (metric.value <= (monitor.threshold || 0)) {
      monitor.status = 'idle';
    }
    
    this.monitors.set(monitor.id, monitor);
  }
  
  /**
   * Obtenir la métrique CPU
   */
  private getCPUMetric(): CPUMetric {
    // Placeholder - à implémenter avec Performance API
    return {
      id: 'cpu',
      name: 'CPU Usage',
      type: 'cpu',
      value: Math.random() * 100,
      unit: '%',
      usage: Math.random() * 100,
      cores: navigator.hardwareConcurrency || 4,
      cpuTime: 0,
      timestamp: Date.now(),
      status: 'idle',
      priority: 'medium',
    };
  }
  
  /**
   * Obtenir la métrique mémoire
   */
  private getMemoryMetric(): MemoryMetric {
    // Placeholder - à implémenter avec Performance API
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        id: 'memory',
        name: 'Memory Usage',
        type: 'memory',
        value: performance.memory.usedJSHeapSize,
        unit: 'bytes',
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.jsHeapSizeLimit,
        available: performance.memory.jsHeapSizeLimit - performance.memory.usedJSHeapSize,
        usagePercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100,
        timestamp: Date.now(),
        status: 'idle',
        priority: 'medium',
      };
    }
    
    return {
      id: 'memory',
      name: 'Memory Usage',
      type: 'memory',
      value: Math.random() * 1024 * 1024 * 1024, // 1GB max
      unit: 'bytes',
      used: Math.random() * 1024 * 1024 * 1024,
      total: 1024 * 1024 * 1024,
      available: 1024 * 1024 * 1024 - Math.random() * 1024 * 1024 * 1024,
      usagePercent: Math.random() * 100,
      timestamp: Date.now(),
      status: 'idle',
      priority: 'medium',
    };
  }
  
  /**
   * Obtenir la métrique de rendu
   */
  private getRenderMetric(): RenderMetric {
    // Placeholder - à implémenter
    return {
      id: 'render',
      name: 'Render Performance',
      type: 'render',
      value: Math.random() * 60 + 30, // 30-90 FPS
      unit: 'fps',
      fps: Math.random() * 60 + 30,
      renderTime: Math.random() * 16, // 0-16ms
      elementCount: 0,
      timestamp: Date.now(),
      status: 'idle',
      priority: 'medium',
    };
  }
  
  /**
   * Obtenir la métrique réseau
   */
  private getNetworkMetric(): NetworkMetric {
    // Placeholder - à implémenter
    return {
      id: 'network',
      name: 'Network Performance',
      type: 'network',
      value: Math.random() * 100, // 0-100 Mbps
      unit: 'mbps',
      downloadSpeed: Math.random() * 100,
      uploadSpeed: Math.random() * 50,
      latency: Math.random() * 200, // 0-200ms
      requestCount: 0,
      timestamp: Date.now(),
      status: 'idle',
      priority: 'medium',
    };
  }
  
  /**
   * Obtenir la métrique de stockage
   */
  private getStorageMetric(): StorageMetric {
    // Placeholder - à implémenter
    return {
      id: 'storage',
      name: 'Storage Usage',
      type: 'storage',
      value: Math.random() * 1024 * 1024 * 1024, // 1GB max
      unit: 'bytes',
      used: Math.random() * 1024 * 1024 * 1024,
      total: 1024 * 1024 * 1024 * 10, // 10GB
      available: 1024 * 1024 * 1024 * 10 - Math.random() * 1024 * 1024 * 1024,
      usagePercent: Math.random() * 100,
      timestamp: Date.now(),
      status: 'idle',
      priority: 'medium',
    };
  }
  
  /**
   * Obtenir une métrique personnalisée
   */
  private getCustomMetric(monitor: PerformanceMonitor): PerformanceMetric {
    // Placeholder
    return {
      id: monitor.id,
      name: monitor.name,
      type: monitor.type as MetricType,
      value: Math.random() * 100,
      unit: 'unit',
      timestamp: Date.now(),
      status: 'idle',
      priority: 'medium',
    };
  }
  
  // ============ METRIC MANAGEMENT ============
  
  /**
   * Ajouter une métrique
   */
  public addMetric(metric: PerformanceMetric): MetricId {
    const id = metric.id || `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.metrics.has(id)) {
      throw new Error(`Metric with ID ${id} already exists`);
    }
    
    const newMetric: PerformanceMetric = {
      ...metric,
      id,
      timestamp: Date.now(),
      status: metric.status || 'idle',
      priority: metric.priority || 'medium',
    };
    
    this.metrics.set(id, newMetric);
    this.emitEvent('metric.added', { metricId: id });
    
    return id;
  }
  
  /**
   * Obtenir une métrique par ID
   */
  public getMetric(id: MetricId): PerformanceMetric | null {
    return this.metrics.get(id) || null;
  }
  
  /**
   * Obtenir toutes les métriques
   */
  public getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }
  
  /**
   * Obtenir les métriques par type
   */
  public getMetricsByType(type: MetricType): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.type === type);
  }
  
  /**
   * Supprimer une métrique
   */
  public removeMetric(id: MetricId): boolean {
    if (!this.metrics.has(id)) {
      return false;
    }
    
    this.metrics.delete(id);
    this.emitEvent('metric.removed', { metricId: id });
    
    return true;
  }
  
  /**
   * Mettre à jour une métrique
   */
  public updateMetric(id: MetricId, updates: Partial<PerformanceMetric>): boolean {
    const metric = this.metrics.get(id);
    if (!metric) {
      return false;
    }
    
    const updatedMetric: PerformanceMetric = {
      ...metric,
      ...updates,
      timestamp: Date.now(),
    };
    
    this.metrics.set(id, updatedMetric);
    this.emitEvent('metric.updated', { metricId: id });
    
    return true;
  }
  
  // ============ TASK MANAGEMENT ============
  
  /**
   * Ajouter une tâche
   */
  public addTask(task: PerformanceTask): TaskId {
    const id = task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newTask: PerformanceTask = {
      ...task,
      id,
      status: 'idle',
      timestamp: Date.now(),
    };
    
    this.tasks.set(id, newTask);
    this.emitEvent('task.added', { taskId: id });
    
    // Ajouter à la file d'attente
    this.taskQueue.push(newTask);
    this.processQueue();
    
    return id;
  }
  
  /**
   * Obtenir une tâche par ID
   */
  public getTask(id: TaskId): PerformanceTask | null {
    return this.tasks.get(id) || null;
  }
  
  /**
   * Obtenir toutes les tâches
   */
  public getAllTasks(): PerformanceTask[] {
    return Array.from(this.tasks.values());
  }
  
  /**
   * Obtenir les tâches par statut
   */
  public getTasksByStatus(status: PerformanceStatus): PerformanceTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }
  
  /**
   * Supprimer une tâche
   */
  public removeTask(id: TaskId): boolean {
    if (!this.tasks.has(id)) {
      return false;
    }
    
    this.tasks.delete(id);
    this.taskQueue = this.taskQueue.filter(t => t.id !== id);
    this.emitEvent('task.removed', { taskId: id });
    
    return true;
  }
  
  /**
   * Mettre à jour une tâche
   */
  public updateTask(id: TaskId, updates: Partial<PerformanceTask>): boolean {
    const task = this.tasks.get(id);
    if (!task) {
      return false;
    }
    
    const updatedTask: PerformanceTask = {
      ...task,
      ...updates,
    };
    
    this.tasks.set(id, updatedTask);
    this.emitEvent('task.updated', { taskId: id });
    
    return true;
  }
  
  /**
   * Exécuter une tâche
   */
  public async executeTask(id: TaskId): Promise<unknown> {
    const task = this.getTask(id);
    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }
    
    task.status = 'running';
    task.startTime = Date.now();
    this.tasks.set(id, task);
    this.emitEvent('task.started', { taskId: id });
    
    try {
      const result = await (task.fn as () => Promise<unknown>)(...(task.args || []));
      
      task.status = 'idle';
      task.endTime = Date.now();
      task.duration = task.endTime - (task.startTime || Date.now());
      task.result = result;
      task.error = undefined;
      
      this.tasks.set(id, task);
      this.emitEvent('task.completed', { taskId: id, result });
      
      return result;
    } catch (error) {
      task.status = 'error';
      task.endTime = Date.now();
      task.duration = task.endTime - (task.startTime || Date.now());
      task.error = String(error);
      
      this.tasks.set(id, task);
      this.emitEvent('task.error', { taskId: id, error: task.error });
      
      throw error;
    }
  }
  
  /**
   * Traiter la file d'attente
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.taskQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.taskQueue.length > 0 && this.tasks.size < this.settings.maxTasks) {
      const task = this.taskQueue.shift()!;
      
      if (task) {
        try {
          await this.executeTask(task.id);
        } catch {
          // L'erreur est déjà gérée dans executeTask
        }
      }
    }
    
    this.isProcessingQueue = false;
  }
  
  // ============ CACHE MANAGEMENT ============
  
  /**
   * Créer un cache
   */
  public createCache(name: string, type: CacheType, options?: { maxSize?: number; defaultTTL?: number }): CacheId {
    const id = `cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const cache: PerformanceCache = {
      id,
      name,
      type,
      size: 0,
      maxSize: options?.maxSize || this.settings.maxCacheSize,
      defaultTTL: options?.defaultTTL || this.settings.defaultCacheTTL,
      entries: new Map(),
      status: 'idle',
      timestamp: Date.now(),
    };
    
    this.caches.set(id, cache);
    this.emitEvent('cache.added', { cacheId: id });
    
    return id;
  }
  
  /**
   * Obtenir un cache par ID
   */
  public getCache(id: CacheId): PerformanceCache | null {
    return this.caches.get(id) || null;
  }
  
  /**
   * Obtenir tous les caches
   */
  public getAllCaches(): PerformanceCache[] {
    return Array.from(this.caches.values());
  }
  
  /**
   * Supprimer un cache
   */
  public removeCache(id: CacheId): boolean {
    if (!this.caches.has(id)) {
      return false;
    }
    
    this.caches.delete(id);
    this.emitEvent('cache.removed', { cacheId: id });
    
    return true;
  }
  
  /**
   * Mettre à jour un cache
   */
  public updateCache(id: CacheId, updates: Partial<PerformanceCache>): boolean {
    const cache = this.caches.get(id);
    if (!cache) {
      return false;
    }
    
    const updatedCache: PerformanceCache = {
      ...cache,
      ...updates,
    };
    
    this.caches.set(id, updatedCache);
    this.emitEvent('cache.updated', { cacheId: id });
    
    return true;
  }
  
  /**
   * Ajouter une entrée au cache
   */
  public setCacheEntry<T = unknown>(cacheId: CacheId, key: string, value: T, ttl?: number): boolean {
    const cache = this.getCache(cacheId);
    if (!cache) {
      return false;
    }
    
    // Vérifier la taille maximale
    if (cache.entries.size >= cache.maxSize) {
      this.evictCacheEntry(cache);
    }
    
    const entry: CacheEntry<T> = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      key,
      value,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
      ttl,
    };
    
    cache.entries.set(key, entry);
    cache.size = cache.entries.size;
    
    this.caches.set(cacheId, cache);
    this.emitEvent('cache.updated', { cacheId });
    
    return true;
  }
  
  /**
   * Obtenir une entrée du cache
   */
  public getCacheEntry<T = unknown>(cacheId: CacheId, key: string): T | null {
    const cache = this.getCache(cacheId);
    if (!cache) {
      return null;
    }
    
    const entry = cache.entries.get(key);
    if (!entry) {
      this.emitEvent('cache.miss', { cacheId, key });
      return null;
    }
    
    // Vérifier l'expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      cache.entries.delete(key);
      cache.size = cache.entries.size;
      this.caches.set(cacheId, cache);
      this.emitEvent('cache.evicted', { cacheId, key });
      return null;
    }
    
    this.emitEvent('cache.hit', { cacheId, key });
    
    return entry.value as T;
  }
  
  /**
   * Supprimer une entrée du cache
   */
  public removeCacheEntry(cacheId: CacheId, key: string): boolean {
    const cache = this.getCache(cacheId);
    if (!cache) {
      return false;
    }
    
    if (!cache.entries.has(key)) {
      return false;
    }
    
    cache.entries.delete(key);
    cache.size = cache.entries.size;
    
    this.caches.set(cacheId, cache);
    this.emitEvent('cache.updated', { cacheId });
    
    return true;
  }
  
  /**
   * Éjecter une entrée du cache
   */
  private evictCacheEntry(cache: PerformanceCache): void {
    // Stratégie LRU (Least Recently Used)
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, entry] of cache.entries) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      cache.entries.delete(oldestKey);
      cache.size = cache.entries.size;
      this.emitEvent('cache.evicted', { cacheId: cache.id, key: oldestKey });
    }
  }
  
  /**
   * Vider un cache
   */
  public clearCache(cacheId: CacheId): boolean {
    const cache = this.getCache(cacheId);
    if (!cache) {
      return false;
    }
    
    cache.entries.clear();
    cache.size = 0;
    
    this.caches.set(cacheId, cache);
    this.emitEvent('cache.updated', { cacheId });
    
    return true;
  }
  
  // ============ MONITOR MANAGEMENT ============
  
  /**
   * Ajouter un moniteur
   */
  public addMonitor(monitor: PerformanceMonitor): MonitorId {
    const id = monitor.id || `monitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.monitors.has(id)) {
      throw new Error(`Monitor with ID ${id} already exists`);
    }
    
    const newMonitor: PerformanceMonitor = {
      ...monitor,
      id,
      active: monitor.active !== false,
      status: 'idle',
      timestamp: Date.now(),
      alertCount: 0,
    };
    
    this.monitors.set(id, newMonitor);
    this.emitEvent('monitor.added', { monitorId: id });
    
    // Démarrer le monitoring si activé
    if (this.settings.monitoringEnabled && newMonitor.active) {
      this.updateMonitor(newMonitor);
    }
    
    return id;
  }
  
  /**
   * Obtenir un moniteur par ID
   */
  public getMonitor(id: MonitorId): PerformanceMonitor | null {
    return this.monitors.get(id) || null;
  }
  
  /**
   * Obtenir tous les moniteurs
   */
  public getAllMonitors(): PerformanceMonitor[] {
    return Array.from(this.monitors.values());
  }
  
  /**
   * Obtenir les moniteurs par type
   */
  public getMonitorsByType(type: MetricType): PerformanceMonitor[] {
    return Array.from(this.monitors.values()).filter(m => m.type === type);
  }
  
  /**
   * Supprimer un moniteur
   */
  public removeMonitor(id: MonitorId): boolean {
    if (!this.monitors.has(id)) {
      return false;
    }
    
    this.monitors.delete(id);
    this.emitEvent('monitor.removed', { monitorId: id });
    
    return true;
  }
  
  /**
   * Mettre à jour un moniteur
   */
  public updateMonitorConfig(id: MonitorId, updates: Partial<PerformanceMonitor>): boolean {
    const monitor = this.monitors.get(id);
    if (!monitor) {
      return false;
    }
    
    const updatedMonitor: PerformanceMonitor = {
      ...monitor,
      ...updates,
      updatedAt: Date.now(),
    };
    
    this.monitors.set(id, updatedMonitor);
    this.emitEvent('monitor.updated', { monitorId: id });
    
    return true;
  }
  
  /**
   * Activer/Désactiver un moniteur
   */
  public toggleMonitor(id: MonitorId, active?: boolean): boolean {
    const monitor = this.monitors.get(id);
    if (!monitor) {
      return false;
    }
    
    monitor.active = active !== undefined ? active : !monitor.active;
    monitor.updatedAt = Date.now();
    
    this.monitors.set(id, monitor);
    this.emitEvent('monitor.updated', { monitorId: id });
    
    return true;
  }
  
  // ============ OPTIMIZATION MANAGEMENT ============
  
  /**
   * Ajouter une optimisation
   */
  public addOptimization(optimization: PerformanceOptimization): string {
    const id = optimization.id || `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.optimizations.has(id)) {
      throw new Error(`Optimization with ID ${id} already exists`);
    }
    
    const newOptimization: PerformanceOptimization = {
      ...optimization,
      id,
      active: optimization.active !== false,
      status: 'idle',
      timestamp: Date.now(),
    };
    
    this.optimizations.set(id, newOptimization);
    this.emitEvent('optimization.added', { optimizationId: id });
    
    return id;
  }
  
  /**
   * Obtenir une optimisation par ID
   */
  public getOptimization(id: string): PerformanceOptimization | null {
    return this.optimizations.get(id) || null;
  }
  
  /**
   * Obtenir toutes les optimisations
   */
  public getAllOptimizations(): PerformanceOptimization[] {
    return Array.from(this.optimizations.values());
  }
  
  /**
   * Supprimer une optimisation
   */
  public removeOptimization(id: string): boolean {
    if (!this.optimizations.has(id)) {
      return false;
    }
    
    this.optimizations.delete(id);
    this.emitEvent('optimization.removed', { optimizationId: id });
    
    return true;
  }
  
  /**
   * Mettre à jour une optimisation
   */
  public updateOptimization(id: string, updates: Partial<PerformanceOptimization>): boolean {
    const optimization = this.optimizations.get(id);
    if (!optimization) {
      return false;
    }
    
    const updatedOptimization: PerformanceOptimization = {
      ...optimization,
      ...updates,
      updatedAt: Date.now(),
    };
    
    this.optimizations.set(id, updatedOptimization);
    this.emitEvent('optimization.updated', { optimizationId: id });
    
    return true;
  }
  
  // ============ PROFILER ============
  
  /**
   * Démarrer un profil
   */
  public startProfile(name: string, description?: string): string {
    const id = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const profile: PerformanceProfile = {
      id,
      name,
      description,
      metrics: [],
      tasks: [],
      startTime: Date.now(),
      status: 'running',
      timestamp: Date.now(),
    };
    
    this.profiles.set(id, profile);
    this.emitEvent('profile.started', { profileId: id });
    
    return id;
  }
  
  /**
   * Arrêter un profil
   */
  public stopProfile(id: string): PerformanceProfile | null {
    const profile = this.profiles.get(id);
    if (!profile) {
      return null;
    }
    
    profile.endTime = Date.now();
    profile.duration = profile.endTime - profile.startTime;
    profile.status = 'stopped';
    
    this.profiles.set(id, profile);
    this.emitEvent('profile.stopped', { profileId: id });
    
    return profile;
  }
  
  /**
   * Obtenir un profil par ID
   */
  public getProfile(id: string): PerformanceProfile | null {
    return this.profiles.get(id) || null;
  }
  
  /**
   * Obtenir tous les profils
   */
  public getAllProfiles(): PerformanceProfile[] {
    return Array.from(this.profiles.values());
  }
  
  /**
   * Ajouter une métrique à un profil
   */
  public addMetricToProfile(profileId: string, metric: PerformanceMetric): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return false;
    }
    
    profile.metrics.push(metric);
    this.profiles.set(profileId, profile);
    
    return true;
  }
  
  /**
   * Ajouter une tâche à un profil
   */
  public addTaskToProfile(profileId: string, task: PerformanceTask): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return false;
    }
    
    profile.tasks.push(task);
    this.profiles.set(profileId, profile);
    
    return true;
  }
  
  // ============ REPORTING ============
  
  /**
   * Générer un rapport
   */
  public generateReport(profileId: string, name?: string): PerformanceReport | null {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return null;
    }
    
    // Agrégation des métriques
    const aggregatedMetrics: Record<string, PerformanceMetric> = {};
    for (const metric of profile.metrics) {
      if (!aggregatedMetrics[metric.type]) {
        aggregatedMetrics[metric.type] = { ...metric };
      } else {
        aggregatedMetrics[metric.type].value += metric.value;
        aggregatedMetrics[metric.type].timestamp = Math.max(
          aggregatedMetrics[metric.type].timestamp,
          metric.timestamp
        );
      }
    }
    
    // Calculer le score
    const score = this.calculateScore(profile);
    const grade = this.getGrade(score);
    
    // Générer des recommandations
    const recommendations = this.generateRecommendations(profile, score);
    
    const report: PerformanceReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Performance Report - ${profile.name}`,
      description: `Performance report for profile: ${profile.name}`,
      profile,
      aggregatedMetrics,
      recommendations,
      score,
      grade,
      generatedAt: Date.now(),
    };
    
    this.reports.set(report.id, report);
    this.emitEvent('report.generated', { reportId: report.id });
    
    return report;
  }
  
  /**
   * Calculer le score
   */
  private calculateScore(profile: PerformanceProfile): number {
    // Simple calculation based on metrics
    let score = 100;
    
    for (const metric of profile.metrics) {
      // Réduire le score en fonction du statut
      switch (metric.status) {
        case 'error':
          score -= 30;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'degraded':
          score -= 5;
          break;
      }
      
      // Réduire le score en fonction de la valeur
      if (metric.max !== undefined && metric.value > metric.max * 0.9) {
        score -= 10;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Obtenir la note
   */
  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
  
  /**
   * Générer des recommandations
   */
  private generateRecommendations(profile: PerformanceProfile, score: number): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    
    if (score < 60) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        title: 'Performance Critique',
        description: 'Les performances sont critiques. Considérez l\'optimisation urgente.',
        type: 'error',
        priority: 'critical',
        action: 'Optimiser immédiatement',
        estimatedGain: 50,
      });
    } else if (score < 80) {
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        title: 'Performance Moyenne',
        description: 'Les performances peuvent être améliorées.',
        type: 'warning',
        priority: 'medium',
        action: 'Optimiser',
        estimatedGain: 20,
      });
    }
    
    // Recommandations basées sur les métriques
    for (const metric of profile.metrics) {
      if (metric.type === 'memory' && metric.value > (metric.max || 1024 * 1024 * 1024) * 0.8) {
        recommendations.push({
          id: `rec-${Date.now()}-memory`,
          title: 'Utilisation Mémoire Élevée',
          description: `L'utilisation mémoire est élevée (${Math.round(metric.value / 1024 / 1024)}MB).`,
          type: 'optimization',
          priority: 'high',
          metricId: metric.id,
          action: 'Libérer la mémoire',
          estimatedGain: 15,
        });
      }
      
      if (metric.type === 'cpu' && metric.value > 80) {
        recommendations.push({
          id: `rec-${Date.now()}-cpu`,
          title: 'Utilisation CPU Élevée',
          description: `L'utilisation CPU est élevée (${Math.round(metric.value)}%).`,
          type: 'optimization',
          priority: 'high',
          metricId: metric.id,
          action: 'Optimiser le CPU',
          estimatedGain: 20,
        });
      }
      
      if (metric.type === 'render' && metric.value < 30) {
        recommendations.push({
          id: `rec-${Date.now()}-render`,
          title: 'FPS Faible',
          description: `Le taux de rafraîchissement est faible (${Math.round(metric.value)} FPS).`,
          type: 'optimization',
          priority: 'high',
          metricId: metric.id,
          action: 'Optimiser le rendu',
          estimatedGain: 25,
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Obtenir un rapport par ID
   */
  public getReport(id: string): PerformanceReport | null {
    return this.reports.get(id) || null;
  }
  
  /**
   * Obtenir tous les rapports
   */
  public getAllReports(): PerformanceReport[] {
    return Array.from(this.reports.values());
  }
  
  // ============ UTILITY FUNCTIONS ============
  
  /**
   * Créer une métrique
   */
  public createMetric(
    name: string,
    type: MetricType,
    value: number,
    unit: string,
    options?: Partial<PerformanceMetric>
  ): MetricId {
    const metric: PerformanceMetric = {
      id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      value,
      unit,
      timestamp: Date.now(),
      status: 'idle',
      priority: 'medium',
      ...options,
    };
    
    return this.addMetric(metric);
  }
  
  /**
   * Créer une tâche
   */
  public createTask(
    name: string,
    type: TaskType,
    fn: () => Promise<unknown> | unknown,
    options?: Partial<PerformanceTask>
  ): TaskId {
    const task: PerformanceTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      fn,
      status: 'idle',
      timestamp: Date.now(),
      priority: 'medium',
      ...options,
    };
    
    return this.addTask(task);
  }
  
  /**
   * Créer un moniteur
   */
  public createMonitor(
    name: string,
    type: MetricType,
    options?: Partial<PerformanceMonitor>
  ): MonitorId {
    const monitor: PerformanceMonitor = {
      id: `monitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      active: true,
      interval: this.settings.monitoringInterval,
      status: 'idle',
      timestamp: Date.now(),
      alertCount: 0,
      ...options,
    };
    
    return this.addMonitor(monitor);
  }
  
  /**
   * Créer une optimisation
   */
  public createOptimization(
    name: string,
    type: PerformanceOptimization['type'],
    config: OptimizationConfig,
    options?: Partial<PerformanceOptimization>
  ): string {
    const optimization: PerformanceOptimization = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      config,
      active: true,
      status: 'idle',
      timestamp: Date.now(),
      priority: 'medium',
      ...options,
    };
    
    return this.addOptimization(optimization);
  }
  
  // ============ SETTINGS ============
  
  /**
   * Obtenir les paramètres
   */
  public getSettings(): PerformanceSettings {
    return { ...this.settings };
  }
  
  /**
   * Mettre à jour les paramètres
   */
  public updateSettings(updates: Partial<PerformanceSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
    };
    
    // Redémarrer le monitoring si nécessaire
    if (updates.monitoringEnabled !== undefined || updates.monitoringInterval !== undefined) {
      this.startMonitoring();
    }
  }
  
  // ============ EVENT LISTENERS ============
  
  /**
   * Écouter un événement
   */
  public onEvent(type: PerformanceEventType, callback: (event: PerformanceEvent) => void): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);
    return () => this.eventListeners.get(type)?.delete(callback);
  }
  
  /**
   * Émettre un événement
   */
  private emitEvent(type: PerformanceEventType, data?: Record<string, unknown>): void {
    const event: PerformanceEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in performance event callback:', error);
        }
      });
    }
    
    // Émettre à tous les listeners
    const allListeners = this.eventListeners.get('*' as PerformanceEventType);
    if (allListeners) {
      allListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in performance event callback:', error);
        }
      });
    }
  }
  
  // ============ CLEANUP ============
  
  /**
   * Nettoyer
   */
  public cleanup(): void {
    this.metrics.clear();
    this.tasks.clear();
    this.caches.clear();
    this.monitors.clear();
    this.optimizations.clear();
    this.profiles.clear();
    this.reports.clear();
    this.eventListeners.clear();
    this.taskQueue = [];
    this.isProcessingQueue = false;
    
    this.stopMonitoring();
    this.settings = { ...DEFAULT_PERFORMANCE_SETTINGS };
  }
}

// ============ INSTANCE ============

/**
 * Instance singleton du gestionnaire de performance
 */
export const performanceManager = new PerformanceManager();

// ============ EXPORT ============

export default {
  PerformanceManager,
  performanceManager,
};
