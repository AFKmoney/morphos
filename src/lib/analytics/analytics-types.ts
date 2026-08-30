/**
 * Advanced Analytics System - Types
 * 
 * Système complet d'analyse et de suivi pour MorphOS
 */

// ============ CORE TYPES ============

/** Identifiant unique d'un événement */
export type EventId = string;

/** Type d'événement */
export type EventType = 
  | 'page_view'          // Vue de page
  | 'module_open'        // Ouverture de module
  | 'module_close'       // Fermeture de module
  | 'window_create'      // Création de fenêtre
  | 'window_close'       // Fermeture de fenêtre
  | 'window_focus'       // Focus sur une fenêtre
  | 'window_blur'        // Perte de focus
  | 'window_resize'      // Redimensionnement
  | 'command_execute'    // Exécution de commande
  | 'command_error'      // Erreur de commande
  | 'ai_request'         // Requête IA
  | 'ai_response'        // Réponse IA
  | 'ai_error'           // Erreur IA
  | 'file_open'          // Ouverture de fichier
  | 'file_save'          // Sauvegarde de fichier
  | 'file_create'        // Création de fichier
  | 'file_delete'        // Suppression de fichier
  | 'workspace_create'   // Création de workspace
  | 'workspace_load'     // Chargement de workspace
  | 'workspace_save'     // Sauvegarde de workspace
  | 'workspace_delete'   // Suppression de workspace
  | 'plugin_install'     // Installation de plugin
  | 'plugin_uninstall'   // Désinstallation de plugin
  | 'plugin_enable'      // Activation de plugin
  | 'plugin_disable'     // Désactivation de plugin
  | 'user_login'         // Connexion utilisateur
  | 'user_logout'        // Déconnexion utilisateur
  | 'user_action'        // Action utilisateur
  | 'collaboration_join' // Rejoindre collaboration
  | 'collaboration_leave'// Quitter collaboration
  | 'voice_command'      // Commande vocale
  | 'voice_recognition'  // Reconnaissance vocale
  | 'voice_synthesis'    // Synthèse vocale
  | 'integration_connect'// Connexion intégration
  | 'integration_disconnect' // Déconnexion intégration
  | 'script_execute'     // Exécution de script
  | 'script_error'       // Erreur de script
  | 'custom';            // Événement personnalisé

/** Catégorie d'événement */
export type EventCategory = 
  | 'navigation'      // Navigation
  | 'modules'         // Modules
  | 'windows'         // Fenêtres
  | 'commands'        // Commandes
  | 'ai'              // IA
  | 'files'           // Fichiers
  | 'workspaces'      // Workspaces
  | 'plugins'         // Plugins
  | 'users'           // Utilisateurs
  | 'collaboration'   // Collaboration
  | 'voice'           // Voix
  | 'integrations'    // Intégrations
  | 'scripts'         // Scripts
  | 'system'          // Système
  | 'performance'     // Performance
  | 'custom';         // Personnalisé

/** Niveau de priorité */
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

/** Statut d'un événement */
export type EventStatus = 'pending' | 'processed' | 'error' | 'ignored';

// ============ EVENT TYPES ============

/** Événement de base */
export interface BaseEvent {
  /** ID unique */
  id: EventId;
  
  /** Type */
  type: EventType;
  
  /** Catégorie */
  category: EventCategory;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Timestamp */
  timestamp: number;
  
  /** Priorité */
  priority: PriorityLevel;
  
  /** Statut */
  status: EventStatus;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
  
  /** Tags */
  tags?: string[];
}

/** Événement avec données */
export interface AnalyticsEvent extends BaseEvent {
  /** Données de l'événement */
  data: EventData;
  
  /** Session ID */
  sessionId?: string;
  
  /** User ID */
  userId?: string;
  
  /** Workspace ID */
  workspaceId?: string;
  
  /** Durée (en ms) */
  duration?: number;
  
  /** Erreur */
  error?: string;
  
  /** Contexte */
  context?: EventContext;
}

/** Données d'un événement */
export interface EventData {
  [key: string]: unknown;
  
  /** Pour les événements de module */
  moduleId?: string;
  moduleType?: string;
  
  /** Pour les événements de fenêtre */
  windowId?: string;
  windowType?: string;
  
  /** Pour les événements de commande */
  commandId?: string;
  commandName?: string;
  
  /** Pour les événements IA */
  provider?: string;
  model?: string;
  prompt?: string;
  response?: string;
  tokens?: number;
  
  /** Pour les événements de fichier */
  filePath?: string;
  fileSize?: number;
  
  /** Pour les événements de workspace */
  workspaceName?: string;
  
  /** Pour les événements de plugin */
  pluginId?: string;
  pluginName?: string;
  pluginVersion?: string;
  
  /** Pour les événements utilisateur */
  action?: string;
  
  /** Pour les événements de collaboration */
  collaborationId?: string;
  userCount?: number;
  
  /** Pour les événements vocaux */
  transcription?: string;
  confidence?: number;
  
  /** Pour les événements d'intégration */
  integrationId?: string;
  integrationType?: string;
  
  /** Pour les événements de script */
  scriptId?: string;
  scriptName?: string;
}

/** Contexte d'un événement */
export interface EventContext {
  /** URL */
  url?: string;
  
  /** User Agent */
  userAgent?: string;
  
  /** Résolution d'écran */
  screenResolution?: { width: number; height: number };
  
  /** Langue */
  language?: string;
  
  /** Pays */
  country?: string;
  
  /** Appareil */
  device?: 'desktop' | 'mobile' | 'tablet';
  
  /** Système d'exploitation */
  os?: string;
  
  /** Navigateur */
  browser?: string;
  
  /** Version du navigateur */
  browserVersion?: string;
  
  /** IP (anonymisée) */
  ip?: string;
  
  /** Referrer */
  referrer?: string;
}

// ============ METRICS TYPES ============

/** Type de métrique */
export type MetricType = 
  | 'counter'      // Compteur
  | 'gauge'        // Jauge
  | 'histogram'    // Histogramme
  | 'timer'        // Minuterie
  | 'set'          // Ensemble
  | 'custom';     // Personnalisé

/** Métrique */
export interface Metric {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type */
  type: MetricType;
  
  /** Valeur */
  value: number | string | unknown[];
  
  /** Unité */
  unit?: string;
  
  /** Timestamp */
  timestamp: number;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Compteur */
export interface CounterMetric extends Metric {
  type: 'counter';
  value: number;
}

/** Jauge */
export interface GaugeMetric extends Metric {
  type: 'gauge';
  value: number;
  min?: number;
  max?: number;
}

/** Histogramme */
export interface HistogramMetric extends Metric {
  type: 'histogram';
  value: {
    count: number;
    sum: number;
    min: number;
    max: number;
    mean: number;
    buckets: Record<string, number>;
  };
}

/** Minuterie */
export interface TimerMetric extends Metric {
  type: 'timer';
  value: {
    count: number;
    total: number;
    min: number;
    max: number;
    mean: number;
  };
}

/** Ensemble */
export interface SetMetric extends Metric {
  type: 'set';
  value: unknown[];
  cardinality: number;
}

// ============ SESSION TYPES ============

/** Session */
export interface AnalyticsSession {
  /** ID unique */
  id: string;
  
  /** User ID */
  userId?: string;
  
  /** Workspace ID */
  workspaceId?: string;
  
  /** Début */
  startTime: number;
  
  /** Fin */
  endTime?: number;
  
  /** Durée (en ms) */
  duration: number;
  
  /** Nombre d'événements */
  eventCount: number;
  
  /** Dernier événement */
  lastEventTime: number;
  
  /** Contexte */
  context: EventContext;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Statut de session */
export type SessionStatus = 'active' | 'idle' | 'ended';

// ============ USER TYPES ============

/** Profil utilisateur analytique */
export interface UserProfile {
  /** User ID */
  userId: string;
  
  /** Nombre de sessions */
  sessionCount: number;
  
  /** Temps total */
  totalTime: number;
  
  /** Dernière session */
  lastSessionTime: number;
  
  /** Modules préférés */
  favoriteModules: string[];
  
  /** Commandes fréquentes */
  frequentCommands: string[];
  
  /** Fournisseurs IA */
  aiProviders: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Segment utilisateur */
export interface UserSegment {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Critères */
  criteria: SegmentCriteria;
  
  /** Nombre d'utilisateurs */
  userCount: number;
  
  /** Date de création */
  createdAt: number;
}

/** Critères de segment */
export interface SegmentCriteria {
  /** Sessions minimales */
  minSessions?: number;
  
  /** Temps total minimal */
  minTotalTime?: number;
  
  /** Modules utilisés */
  usedModules?: string[];
  
  /** Commandes utilisées */
  usedCommands?: string[];
  
  /** Fournisseurs IA */
  aiProviders?: string[];
  
  /** Plugins installés */
  installedPlugins?: string[];
  
  /** Expression personnalisée */
  expression?: string;
}

// ============ DASHBOARD TYPES ============

/** Widget de dashboard */
export interface DashboardWidget {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Type */
  type: 'chart' | 'metric' | 'list' | 'table' | 'custom';
  
  /** Configuration */
  config: WidgetConfig;
  
  /** Position */
  position: { x: number; y: number; width: number; height: number };
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
}

/** Configuration d'un widget */
export interface WidgetConfig {
  /** Type de chart */
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  
  /** Métrique */
  metricId?: string;
  
  /** Requête */
  query?: string;
  
  /** Période */
  period?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'custom';
  
  /** Filtres */
  filters?: Record<string, unknown>;
  
  /** Options */
  options?: Record<string, unknown>;
}

/** Tableau de bord */
export interface Dashboard {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Widgets */
  widgets: DashboardWidget[];
  
  /** Propriétaire */
  ownerId?: string;
  
  /** Partagé */
  shared: boolean;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
}

// ============ ALERT TYPES ============

/** Alerte */
export interface AnalyticsAlert {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type */
  type: 'threshold' | 'anomaly' | 'custom';
  
  /** Métrique */
  metricId?: string;
  
  /** Condition */
  condition: AlertCondition;
  
  /** Actions */
  actions: AlertAction[];
  
  /** Actif */
  enabled: boolean;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Dernier déclenchement */
  lastTriggeredAt?: number;
  
  /** Nombre de déclenchements */
  triggerCount: number;
}

/** Condition d'alerte */
export interface AlertCondition {
  /** Opérateur */
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'not_contains';
  
  /** Valeur */
  value: number | string;
  
  /** Période */
  period?: 'hour' | 'day' | 'week' | 'month' | 'year';
  
  /** Seuil */
  threshold?: number;
  
  /** Expression */
  expression?: string;
}

/** Action d'alerte */
export interface AlertAction {
  /** Type */
  type: 'notification' | 'email' | 'webhook' | 'script' | 'custom';
  
  /** Configuration */
  config: Record<string, unknown>;
  
  /** Délai (en ms) */
  delay?: number;
}

// ============ EXPORT ============

export default {
  EventId,
  EventType,
  EventCategory,
  PriorityLevel,
  EventStatus,
  BaseEvent,
  AnalyticsEvent,
  EventData,
  EventContext,
  MetricType,
  Metric,
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  TimerMetric,
  SetMetric,
  AnalyticsSession,
  SessionStatus,
  UserProfile,
  UserSegment,
  SegmentCriteria,
  DashboardWidget,
  WidgetConfig,
  Dashboard,
  AnalyticsAlert,
  AlertCondition,
  AlertAction,
};
