/**
 * Advanced Analytics System - Engine
 * 
 * Moteur d'analyse et de suivi pour MorphOS
 */

import type {
  AnalyticsEvent,
  EventId,
  EventType,
  EventCategory,
  PriorityLevel,
  EventStatus,
  EventData,
  EventContext,
  Metric,
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  TimerMetric,
  SetMetric,
  MetricType,
  AnalyticsSession,
  SessionStatus,
  UserProfile,
  AnalyticsAlert,
  AlertCondition,
  AlertAction,
  Dashboard,
  DashboardWidget,
} from './analytics-types';

// ============ ANALYTICS ENGINE ============

/**
 * Moteur d'analyse principal
 */
export class AnalyticsEngine {
  private events: AnalyticsEvent[] = [];
  private metrics: Map<string, Metric> = new Map();
  private sessions: Map<string, AnalyticsSession> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private alerts: Map<string, AnalyticsAlert> = new Map();
  private dashboards: Map<string, Dashboard> = new Map();
  private eventListeners: Map<string, Set<(event: AnalyticsEvent) => void>> = new Map();
  private alertListeners: Map<string, Set<(alert: AnalyticsAlert) => void>> = new Map();
  
  private currentSessionId: string | null = null;
  private enabled: boolean = true;
  private buffer: AnalyticsEvent[] = [];
  private bufferSize: number = 1000;
  private flushInterval: number = 5000;
  
  constructor() {
    // Démarrer le flush automatique
    this.startAutoFlush();
  }
  
  /**
   * Démarrer le flush automatique
   */
  private startAutoFlush(): void {
    setInterval(() => {
      if (this.buffer.length > 0) {
        this.flushBuffer();
      }
    }, this.flushInterval);
  }
  
  /**
   * Flush le buffer
   */
  private flushBuffer(): void {
    if (this.buffer.length === 0) return;
    
    // Traitement du buffer
    for (const event of this.buffer) {
      this.processEvent(event);
    }
    
    this.buffer = [];
  }
  
  /**
   * Activer/Désactiver l'analyse
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Vérifier si l'analyse est activée
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Envoyer un événement
   */
  public track(event: Partial<AnalyticsEvent>): EventId | null {
    if (!this.enabled) return null;
    
    const fullEvent: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: event.type || 'custom',
      category: event.category || 'custom',
      name: event.name || event.type || 'unnamed',
      description: event.description,
      timestamp: Date.now(),
      priority: event.priority || 'medium',
      status: 'pending',
      metadata: event.metadata,
      tags: event.tags || [],
      data: event.data || {},
      sessionId: this.currentSessionId || undefined,
      userId: event.userId,
      workspaceId: event.workspaceId,
      duration: event.duration,
      error: event.error,
      context: event.context || this.getDefaultContext(),
    };
    
    // Ajouter au buffer
    this.buffer.push(fullEvent);
    
    // Flush si le buffer est plein
    if (this.buffer.length >= this.bufferSize) {
      this.flushBuffer();
    }
    
    // Émettre l'événement
    this.emitEvent(fullEvent);
    
    return fullEvent.id;
  }
  
  /**
   * Obtenir le contexte par défaut
   */
  private getDefaultContext(): EventContext {
    if (typeof window !== 'undefined') {
      return {
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenResolution: {
          width: window.screen.width,
          height: window.screen.height,
        },
        language: navigator.language,
        device: this.getDeviceType(),
        browser: this.getBrowser(),
        os: this.getOS(),
      };
    }
    return {};
  }
  
  /**
   * Obtenir le type d'appareil
   */
  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width <= 768) return 'mobile';
      if (width <= 1024) return 'tablet';
      return 'desktop';
    }
    return 'desktop';
  }
  
  /**
   * Obtenir le navigateur
   */
  private getBrowser(): string {
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Safari')) return 'Safari';
      if (userAgent.includes('Edge')) return 'Edge';
      if (userAgent.includes('Opera')) return 'Opera';
    }
    return 'Unknown';
  }
  
  /**
   * Obtenir le système d'exploitation
   */
  private getOS(): string {
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Win')) return 'Windows';
      if (userAgent.includes('Mac')) return 'macOS';
      if (userAgent.includes('Linux')) return 'Linux';
      if (userAgent.includes('Android')) return 'Android';
      if (userAgent.includes('iOS')) return 'iOS';
    }
    return 'Unknown';
  }
  
  /**
   * Traiter un événement
   */
  private processEvent(event: AnalyticsEvent): void {
    // Mettre à jour le statut
    event.status = 'processed';
    
    // Mettre à jour la session
    if (event.sessionId && this.sessions.has(event.sessionId)) {
      const session = this.sessions.get(event.sessionId)!;
      session.eventCount++;
      session.lastEventTime = event.timestamp;
      this.sessions.set(event.sessionId, session);
    }
    
    // Mettre à jour les métriques
    this.updateMetrics(event);
    
    // Vérifier les alertes
    this.checkAlerts(event);
    
    // Mettre à jour le profil utilisateur
    if (event.userId) {
      this.updateUserProfile(event);
    }
    
    // Stockage
    this.events.push(event);
    
    // Limiter la taille
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }
  }
  
  /**
   * Mettre à jour les métriques
   */
  private updateMetrics(event: AnalyticsEvent): void {
    // Compteurs par type
    const typeCounterId = `counter:events:${event.type}`;
    this.updateCounter(typeCounterId, 1);
    
    // Compteurs par catégorie
    const categoryCounterId = `counter:events:${event.category}`;
    this.updateCounter(categoryCounterId, 1);
    
    // Compteurs par priorité
    const priorityCounterId = `counter:events:priority:${event.priority}`;
    this.updateCounter(priorityCounterId, 1);
    
    // Métriques spécifiques
    switch (event.type) {
      case 'ai_request':
        this.updateCounter('counter:ai:requests', 1);
        if (event.data?.provider) {
          this.updateCounter(`counter:ai:provider:${event.data.provider}`, 1);
        }
        if (event.data?.tokens) {
          this.updateCounter('counter:ai:tokens', event.data.tokens as number);
        }
        break;
      
      case 'module_open':
        this.updateCounter('counter:modules:opened', 1);
        if (event.data?.moduleType) {
          this.updateCounter(`counter:modules:type:${event.data.moduleType}`, 1);
        }
        break;
      
      case 'command_execute':
        this.updateCounter('counter:commands:executed', 1);
        if (event.data?.commandName) {
          this.updateCounter(`counter:commands:name:${event.data.commandName}`, 1);
        }
        break;
    }
  }
  
  /**
   * Mettre à jour un compteur
   */
  private updateCounter(id: string, increment: number = 1): void {
    let counter = this.metrics.get(id);
    if (!counter) {
      counter = {
        id,
        name: id,
        type: 'counter',
        value: 0,
        timestamp: Date.now(),
        tags: [id.split(':')[1]],
      };
    }
    
    counter.value = (counter.value as number) + increment;
    counter.timestamp = Date.now();
    
    this.metrics.set(id, counter);
  }
  
  /**
   * Mettre à jour un profil utilisateur
   */
  private updateUserProfile(event: AnalyticsEvent): void {
    const userId = event.userId;
    if (!userId) return;
    
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = {
        userId,
        sessionCount: 0,
        totalTime: 0,
        lastSessionTime: 0,
        favoriteModules: [],
        frequentCommands: [],
        aiProviders: [],
      };
    }
    
    profile.sessionCount = this.sessions.filter(s => s.userId === userId).length;
    profile.lastSessionTime = Date.now();
    
    // Mettre à jour les modules préférés
    if (event.type === 'module_open' && event.data?.moduleType) {
      const moduleType = event.data.moduleType as string;
      if (!profile.favoriteModules.includes(moduleType)) {
        profile.favoriteModules.push(moduleType);
      }
    }
    
    // Mettre à jour les commandes fréquentes
    if (event.type === 'command_execute' && event.data?.commandName) {
      const commandName = event.data.commandName as string;
      if (!profile.frequentCommands.includes(commandName)) {
        profile.frequentCommands.push(commandName);
      }
    }
    
    // Mettre à jour les fournisseurs IA
    if (event.type === 'ai_request' && event.data?.provider) {
      const provider = event.data.provider as string;
      if (!profile.aiProviders.includes(provider)) {
        profile.aiProviders.push(provider);
      }
    }
    
    this.userProfiles.set(userId, profile);
  }
  
  /**
   * Vérifier les alertes
   */
  private checkAlerts(event: AnalyticsEvent): void {
    for (const alert of this.alerts.values()) {
      if (!alert.enabled) continue;
      
      // Vérifier si l'événement correspond à la condition
      if (this.checkAlertCondition(alert, event)) {
        this.triggerAlert(alert);
      }
    }
  }
  
  /**
   * Vérifier une condition d'alerte
   */
  private checkAlertCondition(alert: AnalyticsAlert, event: AnalyticsEvent): boolean {
    if (!alert.condition) return false;
    
    const metric = this.metrics.get(alert.metricId || '');
    if (!metric) return false;
    
    const value = metric.value;
    const condition = alert.condition;
    
    switch (condition.operator) {
      case '>':
        return (value as number) > (condition.value as number);
      case '<':
        return (value as number) < (condition.value as number);
      case '>=':
        return (value as number) >= (condition.value as number);
      case '<=':
        return (value as number) <= (condition.value as number);
      case '==':
        return value === condition.value;
      case '!=':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'not_contains':
        return !String(value).includes(String(condition.value));
      default:
        return false;
    }
  }
  
  /**
   * Déclencher une alerte
   */
  private triggerAlert(alert: AnalyticsAlert): void {
    alert.lastTriggeredAt = Date.now();
    alert.triggerCount++;
    this.alerts.set(alert.id, alert);
    
    // Exécuter les actions
    for (const action of alert.actions) {
      this.executeAlertAction(alert, action);
    }
    
    // Émettre l'alerte
    this.emitAlert(alert);
  }
  
  /**
   * Exécuter une action d'alerte
   */
  private executeAlertAction(alert: AnalyticsAlert, action: AlertAction): void {
    switch (action.type) {
      case 'notification':
        // Afficher une notification
        if (typeof window !== 'undefined') {
          console.log(`[ALERT] ${alert.name}: ${alert.description}`);
        }
        break;
      case 'email':
        // Envoyer un email (à implémenter)
        break;
      case 'webhook':
        // Envoyer un webhook (à implémenter)
        break;
      case 'script':
        // Exécuter un script (à implémenter)
        break;
    }
  }
  
  // ============ SESSION MANAGEMENT ============
  
  /**
   * Démarrer une session
   */
  public startSession(options?: { userId?: string; workspaceId?: string; metadata?: Record<string, unknown> }): string {
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: AnalyticsSession = {
      id: sessionId,
      userId: options?.userId,
      workspaceId: options?.workspaceId,
      startTime: Date.now(),
      duration: 0,
      eventCount: 0,
      lastEventTime: Date.now(),
      context: this.getDefaultContext(),
      metadata: options?.metadata,
    };
    
    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    
    // Traiter l'événement de début de session
    this.track({
      type: 'session_start',
      category: 'system',
      name: 'Session Started',
      sessionId,
      userId: options?.userId,
      workspaceId: options?.workspaceId,
    });
    
    return sessionId;
  }
  
  /**
   * Terminer une session
   */
  public endSession(sessionId?: string): void {
    const id = sessionId || this.currentSessionId;
    if (!id || !this.sessions.has(id)) return;
    
    const session = this.sessions.get(id)!;
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    
    this.sessions.set(id, session);
    
    if (id === this.currentSessionId) {
      this.currentSessionId = null;
    }
    
    // Traiter l'événement de fin de session
    this.track({
      type: 'session_end',
      category: 'system',
      name: 'Session Ended',
      sessionId: id,
      userId: session.userId,
      workspaceId: session.workspaceId,
      duration: session.duration,
      data: { eventCount: session.eventCount },
    });
  }
  
  /**
   * Obtenir la session actuelle
   */
  public getCurrentSession(): AnalyticsSession | null {
    if (!this.currentSessionId) return null;
    return this.sessions.get(this.currentSessionId) || null;
  }
  
  /**
   * Obtenir une session par ID
   */
  public getSession(id: string): AnalyticsSession | null {
    return this.sessions.get(id) || null;
  }
  
  /**
   * Obtenir toutes les sessions
   */
  public getAllSessions(): AnalyticsSession[] {
    return Array.from(this.sessions.values());
  }
  
  // ============ METRIC MANAGEMENT ============
  
  /**
   * Obtenir une métrique par ID
   */
  public getMetric(id: string): Metric | null {
    return this.metrics.get(id) || null;
  }
  
  /**
   * Obtenir toutes les métriques
   */
  public getAllMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }
  
  /**
   * Mettre à jour une métrique
   */
  public updateMetric(id: string, updates: Partial<Metric>): boolean {
    const metric = this.metrics.get(id);
    if (metric) {
      this.metrics.set(id, { ...metric, ...updates, timestamp: Date.now() });
      return true;
    }
    return false;
  }
  
  /**
   * Supprimer une métrique
   */
  public removeMetric(id: string): boolean {
    if (this.metrics.has(id)) {
      this.metrics.delete(id);
      return true;
    }
    return false;
  }
  
  /**
   * Créer une métrique
   */
  public createMetric(metric: Metric): string {
    const id = metric.id || `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.set(id, { ...metric, id, timestamp: Date.now() });
    return id;
  }
  
  /**
   * Incrémenter un compteur
   */
  public incrementCounter(id: string, increment: number = 1): void {
    this.updateCounter(id, increment);
  }
  
  /**
   * Mettre à jour une jauge
   */
  public updateGauge(id: string, value: number): void {
    let gauge = this.metrics.get(id);
    if (!gauge) {
      gauge = {
        id,
        name: id,
        type: 'gauge',
        value: 0,
        timestamp: Date.now(),
        tags: [id.split(':')[1]],
      };
    }
    
    gauge.value = value;
    gauge.timestamp = Date.now();
    
    this.metrics.set(id, gauge);
  }
  
  /**
   * Ajouter à un histogramme
   */
  public addToHistogram(id: string, value: number): void {
    let histogram = this.metrics.get(id) as HistogramMetric | undefined;
    if (!histogram) {
      histogram = {
        id,
        name: id,
        type: 'histogram',
        value: {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          mean: 0,
          buckets: {},
        },
        timestamp: Date.now(),
        tags: [id.split(':')[1]],
      };
    }
    
    const data = histogram.value as HistogramMetric['value'];
    data.count++;
    data.sum += value;
    data.min = Math.min(data.min, value);
    data.max = Math.max(data.max, value);
    data.mean = data.sum / data.count;
    
    // Mettre à jour les buckets
    const bucketSize = 10;
    const bucketIndex = Math.floor(value / bucketSize);
    const bucketKey = `${bucketIndex * bucketSize}-${(bucketIndex + 1) * bucketSize}`;
    data.buckets[bucketKey] = (data.buckets[bucketKey] || 0) + 1;
    
    histogram.timestamp = Date.now();
    this.metrics.set(id, histogram);
  }
  
  /**
   * Enregistrer un temps
   */
  public recordTime(id: string, duration: number): void {
    let timer = this.metrics.get(id) as TimerMetric | undefined;
    if (!timer) {
      timer = {
        id,
        name: id,
        type: 'timer',
        value: {
          count: 0,
          total: 0,
          min: Infinity,
          max: -Infinity,
          mean: 0,
        },
        timestamp: Date.now(),
        tags: [id.split(':')[1]],
      };
    }
    
    const data = timer.value as TimerMetric['value'];
    data.count++;
    data.total += duration;
    data.min = Math.min(data.min, duration);
    data.max = Math.max(data.max, duration);
    data.mean = data.total / data.count;
    
    timer.timestamp = Date.now();
    this.metrics.set(id, timer);
  }
  
  // ============ ALERT MANAGEMENT ============
  
  /**
   * Ajouter une alerte
   */
  public addAlert(alert: AnalyticsAlert): string {
    const id = alert.id || `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.alerts.set(id, { ...alert, id, triggerCount: 0, createdAt: Date.now(), updatedAt: Date.now() });
    return id;
  }
  
  /**
   * Supprimer une alerte
   */
  public removeAlert(id: string): boolean {
    if (this.alerts.has(id)) {
      this.alerts.delete(id);
      return true;
    }
    return false;
  }
  
  /**
   * Obtenir une alerte par ID
   */
  public getAlert(id: string): AnalyticsAlert | null {
    return this.alerts.get(id) || null;
  }
  
  /**
   * Obtenir toutes les alertes
   */
  public getAllAlerts(): AnalyticsAlert[] {
    return Array.from(this.alerts.values());
  }
  
  /**
   * Activer/Désactiver une alerte
   */
  public toggleAlert(id: string, enabled?: boolean): boolean {
    const alert = this.alerts.get(id);
    if (alert) {
      this.alerts.set(id, { ...alert, enabled: enabled !== undefined ? enabled : !alert.enabled });
      return true;
    }
    return false;
  }
  
  // ============ DASHBOARD MANAGEMENT ============
  
  /**
   * Ajouter un tableau de bord
   */
  public addDashboard(dashboard: Dashboard): string {
    const id = dashboard.id || `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.dashboards.set(id, { ...dashboard, id, createdAt: Date.now(), updatedAt: Date.now() });
    return id;
  }
  
  /**
   * Supprimer un tableau de bord
   */
  public removeDashboard(id: string): boolean {
    if (this.dashboards.has(id)) {
      this.dashboards.delete(id);
      return true;
    }
    return false;
  }
  
  /**
   * Obtenir un tableau de bord par ID
   */
  public getDashboard(id: string): Dashboard | null {
    return this.dashboards.get(id) || null;
  }
  
  /**
   * Obtenir tous les tableaux de bord
   */
  public getAllDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }
  
  /**
   * Ajouter un widget à un tableau de bord
   */
  public addWidgetToDashboard(dashboardId: string, widget: DashboardWidget): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (dashboard) {
      const id = widget.id || `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      dashboard.widgets.push({ ...widget, id, createdAt: Date.now(), updatedAt: Date.now() });
      dashboard.updatedAt = Date.now();
      this.dashboards.set(dashboardId, dashboard);
      return true;
    }
    return false;
  }
  
  /**
   * Supprimer un widget d'un tableau de bord
   */
  public removeWidgetFromDashboard(dashboardId: string, widgetId: string): boolean {
    const dashboard = this.dashboards.get(dashboardId);
    if (dashboard) {
      dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
      dashboard.updatedAt = Date.now();
      this.dashboards.set(dashboardId, dashboard);
      return true;
    }
    return false;
  }
  
  // ============ EVENT LISTENERS ============
  
  /**
   * Écouter les événements
   */
  public onEvent(type: EventType | '*', callback: (event: AnalyticsEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);
  }
  
  /**
   * Arrêter d'écouter les événements
   */
  public offEvent(type: EventType | '*', callback: (event: AnalyticsEvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  /**
   * Émettre un événement
   */
  private emitEvent(event: AnalyticsEvent): void {
    // Émettre à tous les listeners
    for (const [type, listeners] of this.eventListeners) {
      if (type === '*' || type === event.type) {
        listeners.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error('Error in analytics event callback:', error);
          }
        });
      }
    }
  }
  
  /**
   * Écouter les alertes
   */
  public onAlert(callback: (alert: AnalyticsAlert) => void): void {
    if (!this.alertListeners.has('*')) {
      this.alertListeners.set('*', new Set());
    }
    this.alertListeners.get('*')!.add(callback);
  }
  
  /**
   * Arrêter d'écouter les alertes
   */
  public offAlert(callback: (alert: AnalyticsAlert) => void): void {
    const listeners = this.alertListeners.get('*');
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  /**
   * Émettre une alerte
   */
  private emitAlert(alert: AnalyticsAlert): void {
    for (const [, listeners] of this.alertListeners) {
      listeners.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          console.error('Error in analytics alert callback:', error);
        }
      });
    }
  }
  
  // ============ QUERY FUNCTIONS ============
  
  /**
   * Obtenir les événements par type
   */
  public getEventsByType(type: EventType): AnalyticsEvent[] {
    return this.events.filter(e => e.type === type);
  }
  
  /**
   * Obtenir les événements par catégorie
   */
  public getEventsByCategory(category: EventCategory): AnalyticsEvent[] {
    return this.events.filter(e => e.category === category);
  }
  
  /**
   * Obtenir les événements par période
   */
  public getEventsByPeriod(start: number, end: number): AnalyticsEvent[] {
    return this.events.filter(e => e.timestamp >= start && e.timestamp <= end);
  }
  
  /**
   * Obtenir les événements par utilisateur
   */
  public getEventsByUser(userId: string): AnalyticsEvent[] {
    return this.events.filter(e => e.userId === userId);
  }
  
  /**
   * Obtenir les événements par workspace
   */
  public getEventsByWorkspace(workspaceId: string): AnalyticsEvent[] {
    return this.events.filter(e => e.workspaceId === workspaceId);
  }
  
  /**
   * Obtenir les métriques par tag
   */
  public getMetricsByTag(tag: string): Metric[] {
    return Array.from(this.metrics.values()).filter(m => m.tags?.includes(tag));
  }
  
  // ============ AGGREGATION FUNCTIONS ============
  
  /**
   * Agrégation des événements
   */
  public aggregateEvents(
    events: AnalyticsEvent[],
    groupBy: 'type' | 'category' | 'priority' | 'hour' | 'day' | 'week' | 'month'
  ): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const event of events) {
      let key: string;
      
      switch (groupBy) {
        case 'type':
          key = event.type;
          break;
        case 'category':
          key = event.category;
          break;
        case 'priority':
          key = event.priority;
          break;
        case 'hour':
          key = new Date(event.timestamp).toISOString().slice(0, 13);
          break;
        case 'day':
          key = new Date(event.timestamp).toISOString().slice(0, 10);
          break;
        case 'week':
          key = this.getWeekKey(event.timestamp);
          break;
        case 'month':
          key = new Date(event.timestamp).toISOString().slice(0, 7);
          break;
        default:
          key = 'unknown';
      }
      
      result[key] = (result[key] || 0) + 1;
    }
    
    return result;
  }
  
  /**
   * Obtenir la clé de la semaine
   */
  private getWeekKey(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }
  
  /**
   * Obtenir le numéro de la semaine
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
  
  // ============ CLEANUP ============
  
  /**
   * Nettoyer
   */
  public cleanup(): void {
    this.events = [];
    this.metrics.clear();
    this.sessions.clear();
    this.userProfiles.clear();
    this.alerts.clear();
    this.dashboards.clear();
    this.eventListeners.clear();
    this.alertListeners.clear();
    this.buffer = [];
    this.currentSessionId = null;
  }
}

// ============ INSTANCE ============

/**
 * Instance singleton du moteur d'analyse
 */
export const analyticsEngine = new AnalyticsEngine();

// ============ UTILITY FUNCTIONS ============

/**
 * Créer un événement
 */
export function createEvent(
  type: EventType,
  options?: Partial<AnalyticsEvent>
): AnalyticsEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    category: options?.category || 'custom',
    name: options?.name || type,
    description: options?.description,
    timestamp: Date.now(),
    priority: options?.priority || 'medium',
    status: 'pending',
    metadata: options?.metadata,
    tags: options?.tags || [],
    data: options?.data || {},
    sessionId: options?.sessionId,
    userId: options?.userId,
    workspaceId: options?.workspaceId,
    duration: options?.duration,
    error: options?.error,
    context: options?.context,
  };
}

/**
 * Créer une métrique
 */
export function createMetric(
  type: MetricType,
  name: string,
  value: number | string | unknown[],
  options?: Partial<Metric>
): Metric {
  return {
    id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    name,
    value,
    timestamp: Date.now(),
    tags: options?.tags || [],
    metadata: options?.metadata,
    unit: options?.unit,
  };
}

/**
 * Créer une alerte
 */
export function createAlert(
  name: string,
  condition: AlertCondition,
  actions: AlertAction[] = [],
  options?: Partial<AnalyticsAlert>
): AnalyticsAlert {
  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: options?.description,
    type: options?.type || 'threshold',
    metricId: options?.metricId,
    condition,
    actions,
    enabled: options?.enabled !== false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    triggerCount: 0,
  };
}

/**
 * Créer un tableau de bord
 */
export function createDashboard(
  name: string,
  widgets: DashboardWidget[] = [],
  options?: Partial<Dashboard>
): Dashboard {
  return {
    id: `dashboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: options?.description,
    widgets,
    ownerId: options?.ownerId,
    shared: options?.shared || false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Créer un widget
 */
export function createWidget(
  type: DashboardWidget['type'],
  config: WidgetConfig,
  position: { x: number; y: number; width: number; height: number },
  options?: Partial<DashboardWidget>
): DashboardWidget {
  return {
    id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: options?.name || type,
    type,
    config,
    position,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Générer un ID unique
 */
export function generateAnalyticsId(): string {
  return `analytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============ EXPORT ============

export {
  AnalyticsEngine,
  analyticsEngine,
  createEvent,
  createMetric,
  createAlert,
  createDashboard,
  createWidget,
  generateAnalyticsId,
};
