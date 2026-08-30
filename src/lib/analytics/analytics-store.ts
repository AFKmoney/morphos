/**
 * Advanced Analytics System - Store
 * 
 * Stores Svelte pour la gestion des analytics
 */

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type {
  AnalyticsEvent,
  EventType,
  EventCategory,
  Metric,
  AnalyticsSession,
  UserProfile,
  AnalyticsAlert,
  Dashboard,
} from './analytics-types';

import { analyticsEngine } from './analytics-engine';

// ============ DEFAULT VALUES ============

/** Statut par défaut */
export const DEFAULT_ANALYTICS_STATUS = {
  enabled: true,
  tracking: false,
  eventCount: 0,
  metricCount: 0,
  sessionCount: 0,
  alertCount: 0,
  dashboardCount: 0,
};

// ============ STORES ============

/** Store des événements */
export const eventsStore: Writable<AnalyticsEvent[]> = writable([]);

/** Store des métriques */
export const metricsStore: Writable<Metric[]> = writable([]);

/** Store des sessions */
export const sessionsStore: Writable<AnalyticsSession[]> = writable([]);

/** Store des profils utilisateurs */
export const userProfilesStore: Writable<UserProfile[]> = writable([]);

/** Store des alertes */
export const alertsStore: Writable<AnalyticsAlert[]> = writable([]);

/** Store des tableaux de bord */
export const dashboardsStore: Writable<Dashboard[]> = writable([]);

/** Store du statut */
export const analyticsStatusStore: Writable<typeof DEFAULT_ANALYTICS_STATUS> = writable(DEFAULT_ANALYTICS_STATUS);

/** Store de la session actuelle */
export const currentSessionStore: Writable<AnalyticsSession | null> = writable(null);

// ============ DERIVED STORES ============

/** Nombre d'événements */
export const eventCountStore: Readable<number> = derived(
  eventsStore,
  ($events) => $events.length
);

/** Nombre de métriques */
export const metricCountStore: Readable<number> = derived(
  metricsStore,
  ($metrics) => $metrics.length
);

/** Nombre de sessions */
export const sessionCountStore: Readable<number> = derived(
  sessionsStore,
  ($sessions) => $sessions.length
);

/** Nombre d'alertes */
export const alertCountStore: Readable<number> = derived(
  alertsStore,
  ($alerts) => $alerts.length
);

/** Nombre de tableaux de bord */
export const dashboardCountStore: Readable<number> = derived(
  dashboardsStore,
  ($dashboards) => $dashboards.length
);

/** Événements par type */
export const eventsByTypeStore: Readable<Record<EventType, number>> = derived(
  eventsStore,
  ($events) => {
    const byType: Record<EventType, number> = {} as Record<EventType, number>;
    
    for (const event of $events) {
      byType[event.type] = (byType[event.type] || 0) + 1;
    }
    
    return byType;
  }
);

/** Événements par catégorie */
export const eventsByCategoryStore: Readable<Record<EventCategory, number>> = derived(
  eventsStore,
  ($events) => {
    const byCategory: Record<EventCategory, number> = {} as Record<EventCategory, number>;
    
    for (const event of $events) {
      byCategory[event.category] = (byCategory[event.category] || 0) + 1;
    }
    
    return byCategory;
  }
);

/** Alertes activées */
export const enabledAlertsStore: Readable<AnalyticsAlert[]> = derived(
  alertsStore,
  ($alerts) => $alerts.filter(a => a.enabled)
);

/** Tableaux de bord partagés */
export const sharedDashboardsStore: Readable<Dashboard[]> = derived(
  dashboardsStore,
  ($dashboards) => $dashboards.filter(d => d.shared)
);

// ============ ACTIONS ============

/**
 * Initialiser les stores analytics
 */
export function initializeAnalyticsStores(): void {
  // Charger les données depuis le localStorage
  const savedEvents = localStorage.getItem('morphos-analytics-events');
  const savedMetrics = localStorage.getItem('morphos-analytics-metrics');
  const savedSessions = localStorage.getItem('morphos-analytics-sessions');
  const savedAlerts = localStorage.getItem('morphos-analytics-alerts');
  const savedDashboards = localStorage.getItem('morphos-analytics-dashboards');
  
  if (savedEvents) {
    try {
      eventsStore.set(JSON.parse(savedEvents));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedMetrics) {
    try {
      metricsStore.set(JSON.parse(savedMetrics));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedSessions) {
    try {
      sessionsStore.set(JSON.parse(savedSessions));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedAlerts) {
    try {
      alertsStore.set(JSON.parse(savedAlerts));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedDashboards) {
    try {
      dashboardsStore.set(JSON.parse(savedDashboards));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  // Sauvegarder les données lors des changements
  eventsStore.subscribe((events) => {
    localStorage.setItem('morphos-analytics-events', JSON.stringify(events.slice(-1000)));
    analyticsStatusStore.update(status => ({ ...status, eventCount: events.length }));
  });
  
  metricsStore.subscribe((metrics) => {
    localStorage.setItem('morphos-analytics-metrics', JSON.stringify(metrics));
    analyticsStatusStore.update(status => ({ ...status, metricCount: metrics.length }));
  });
  
  sessionsStore.subscribe((sessions) => {
    localStorage.setItem('morphos-analytics-sessions', JSON.stringify(sessions));
    analyticsStatusStore.update(status => ({ ...status, sessionCount: sessions.length }));
  });
  
  alertsStore.subscribe((alerts) => {
    localStorage.setItem('morphos-analytics-alerts', JSON.stringify(alerts));
    analyticsStatusStore.update(status => ({ ...status, alertCount: alerts.length }));
  });
  
  dashboardsStore.subscribe((dashboards) => {
    localStorage.setItem('morphos-analytics-dashboards', JSON.stringify(dashboards));
    analyticsStatusStore.update(status => ({ ...status, dashboardCount: dashboards.length }));
  });
  
  // S'abonner aux changements du moteur
  analyticsEngine.onEvent('*', (event) => {
    eventsStore.update(events => [...events, event].slice(-1000));
  });
}

/**
 * Tracker un événement
 */
export function trackEvent(event: Partial<AnalyticsEvent>): string | null {
  return analyticsEngine.track(event);
}

/**
 * Démarrer une session
 */
export function startSession(options?: { userId?: string; workspaceId?: string }): string {
  const sessionId = analyticsEngine.startSession(options);
  
  // Mettre à jour le store
  const session = analyticsEngine.getSession(sessionId);
  if (session) {
    sessionsStore.update(sessions => [...sessions, session]);
    currentSessionStore.set(session);
  }
  
  analyticsStatusStore.update(status => ({ ...status, tracking: true }));
  
  return sessionId;
}

/**
 * Terminer une session
 */
export function endSession(sessionId?: string): void {
  analyticsEngine.endSession(sessionId);
  
  // Mettre à jour le store
  if (!sessionId) {
    currentSessionStore.set(null);
  }
  
  sessionsStore.update(sessions => {
    const updatedSessions = sessions.map(s => {
      if (s.id === sessionId || (!sessionId && s.id === analyticsEngine.getCurrentSession()?.id)) {
        return analyticsEngine.getSession(s.id) || s;
      }
      return s;
    });
    return updatedSessions.filter(s => !s.endTime || s.endTime > Date.now() - 86400000);
  });
  
  analyticsStatusStore.update(status => ({ ...status, tracking: false }));
}

/**
 * Ajouter une métrique
 */
export function addMetric(metric: Metric): void {
  analyticsEngine.createMetric(metric);
  metricsStore.update(metrics => [...metrics, metric]);
}

/**
 * Mettre à jour une métrique
 */
export function updateMetric(id: string, updates: Partial<Metric>): void {
  analyticsEngine.updateMetric(id, updates);
  metricsStore.update(metrics => metrics.map(m => m.id === id ? { ...m, ...updates } : m));
}

/**
 * Supprimer une métrique
 */
export function removeMetric(id: string): void {
  analyticsEngine.removeMetric(id);
  metricsStore.update(metrics => metrics.filter(m => m.id !== id));
}

/**
 * Incrémenter un compteur
 */
export function incrementCounter(id: string, increment: number = 1): void {
  analyticsEngine.incrementCounter(id, increment);
}

/**
 * Ajouter une alerte
 */
export function addAlert(alert: AnalyticsAlert): string {
  const id = analyticsEngine.addAlert(alert);
  alertsStore.update(alerts => [...alerts, { ...alert, id }]);
  return id;
}

/**
 * Supprimer une alerte
 */
export function removeAlert(id: string): void {
  analyticsEngine.removeAlert(id);
  alertsStore.update(alerts => alerts.filter(a => a.id !== id));
}

/**
 * Activer/Désactiver une alerte
 */
export function toggleAlert(id: string, enabled?: boolean): void {
  analyticsEngine.toggleAlert(id, enabled);
  alertsStore.update(alerts => alerts.map(a => a.id === id ? { ...a, enabled: enabled !== undefined ? enabled : !a.enabled } : a));
}

/**
 * Ajouter un tableau de bord
 */
export function addDashboard(dashboard: Dashboard): string {
  const id = analyticsEngine.addDashboard(dashboard);
  dashboardsStore.update(dashboards => [...dashboards, { ...dashboard, id }]);
  return id;
}

/**
 * Supprimer un tableau de bord
 */
export function removeDashboard(id: string): void {
  analyticsEngine.removeDashboard(id);
  dashboardsStore.update(dashboards => dashboards.filter(d => d.id !== id));
}

/**
 * Ajouter un widget à un tableau de bord
 */
export function addWidgetToDashboard(dashboardId: string, widget: Dashboard['widgets'][0]): boolean {
  const success = analyticsEngine.addWidgetToDashboard(dashboardId, widget);
  if (success) {
    dashboardsStore.update(dashboards =>
      dashboards.map(d => d.id === dashboardId ? { ...d, widgets: [...d.widgets, widget] } : d)
    );
  }
  return success;
}

/**
 * Supprimer un widget d'un tableau de bord
 */
export function removeWidgetFromDashboard(dashboardId: string, widgetId: string): boolean {
  const success = analyticsEngine.removeWidgetFromDashboard(dashboardId, widgetId);
  if (success) {
    dashboardsStore.update(dashboards =>
      dashboards.map(d => d.id === dashboardId ? { ...d, widgets: d.widgets.filter(w => w.id !== widgetId) } : d)
    );
  }
  return success;
}

/**
 * Activer/Désactiver l'analyse
 */
export function setAnalyticsEnabled(enabled: boolean): void {
  analyticsEngine.setEnabled(enabled);
  analyticsStatusStore.update(status => ({ ...status, enabled }));
}

/**
 * Activer/Désactiver le tracking
 */
export function setTrackingEnabled(tracking: boolean): void {
  analyticsStatusStore.update(status => ({ ...status, tracking }));
  
  if (tracking) {
    startSession();
  } else {
    endSession();
  }
}

/**
 * Obtenir les statistiques
 */
export function getAnalyticsStats(): {
  totalEvents: number;
  totalMetrics: number;
  totalSessions: number;
  activeAlerts: number;
  totalDashboards: number;
} {
  return {
    totalEvents: analyticsEngine.getAllEvents().length,
    totalMetrics: analyticsEngine.getAllMetrics().length,
    totalSessions: analyticsEngine.getAllSessions().length,
    activeAlerts: analyticsEngine.getAllAlerts().filter(a => a.enabled).length,
    totalDashboards: analyticsEngine.getAllDashboards().length,
  };
}

/**
 * Obtenir les événements par type
 */
export function getEventsByType(type: EventType): AnalyticsEvent[] {
  return analyticsEngine.getEventsByType(type);
}

/**
 * Obtenir les événements par catégorie
 */
export function getEventsByCategory(category: EventCategory): AnalyticsEvent[] {
  return analyticsEngine.getEventsByCategory(category);
}

/**
 * Obtenir les événements par période
 */
export function getEventsByPeriod(start: number, end: number): AnalyticsEvent[] {
  return analyticsEngine.getEventsByPeriod(start, end);
}

/**
 * Agrégation des événements
 */
export function aggregateEvents(
  events: AnalyticsEvent[],
  groupBy: 'type' | 'category' | 'priority' | 'hour' | 'day' | 'week' | 'month'
): Record<string, number> {
  return analyticsEngine.aggregateEvents(events, groupBy);
}

/**
 * Nettoyer les données
 */
export function clearAnalyticsData(): void {
  eventsStore.set([]);
  metricsStore.set([]);
  sessionsStore.set([]);
  userProfilesStore.set([]);
  alertsStore.set([]);
  dashboardsStore.set([]);
  currentSessionStore.set(null);
  analyticsStatusStore.set(DEFAULT_ANALYTICS_STATUS);
  
  analyticsEngine.cleanup();
}

/**
 * Réinitialiser les analytics
 */
export function resetAnalytics(): void {
  clearAnalyticsData();
  localStorage.removeItem('morphos-analytics-events');
  localStorage.removeItem('morphos-analytics-metrics');
  localStorage.removeItem('morphos-analytics-sessions');
  localStorage.removeItem('morphos-analytics-alerts');
  localStorage.removeItem('morphos-analytics-dashboards');
}

// ============ INITIALIZATION ============

// Initialiser automatiquement
if (typeof window !== 'undefined') {
  initializeAnalyticsStores();
}

// ============ EXPORT ============

export {
  // Stores
  eventsStore,
  metricsStore,
  sessionsStore,
  userProfilesStore,
  alertsStore,
  dashboardsStore,
  analyticsStatusStore,
  currentSessionStore,
  
  // Derived stores
  eventCountStore,
  metricCountStore,
  sessionCountStore,
  alertCountStore,
  dashboardCountStore,
  eventsByTypeStore,
  eventsByCategoryStore,
  enabledAlertsStore,
  sharedDashboardsStore,
  
  // Actions
  initializeAnalyticsStores,
  trackEvent,
  startSession,
  endSession,
  addMetric,
  updateMetric,
  removeMetric,
  incrementCounter,
  addAlert,
  removeAlert,
  toggleAlert,
  addDashboard,
  removeDashboard,
  addWidgetToDashboard,
  removeWidgetFromDashboard,
  setAnalyticsEnabled,
  setTrackingEnabled,
  getAnalyticsStats,
  getEventsByType,
  getEventsByCategory,
  getEventsByPeriod,
  aggregateEvents,
  clearAnalyticsData,
  resetAnalytics,
};
