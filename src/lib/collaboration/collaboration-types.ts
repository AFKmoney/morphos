/**
 * Advanced Collaboration System - Types
 * 
 * Système complet de collaboration pour MorphOS
 */

// ============ CORE TYPES ============

/** Identifiant unique d'une session de collaboration */
export type CollaborationId = string;

/** Identifiant unique d'un utilisateur */
export type UserId = string;

/** Identifiant unique d'un curseur */
export type CursorId = string;

/** Identifiant unique d'une sélection */
export type SelectionId = string;

/** Identifiant unique d'un message */
export type MessageId = string;

/** Statut de collaboration */
export type CollaborationStatus = 
  | 'waiting'     // En attente
  | 'connected'   // Connecté
  | 'disconnected' // Déconnecté
  | 'error'       // Erreur
  | 'closed'      // Fermé
  | 'active';     // Actif

/** Type de collaboration */
export type CollaborationType = 
  | 'real-time'   // Temps réel
  | 'async'       // Asynchrone
  | 'review'      // Révision
  | 'custom';     // Personnalisé

/** Rôle dans la collaboration */
export type CollaborationRole = 
  | 'host'        // Hôte
  | 'guest'       // Invité
  | 'editor'      // Éditeur
  | 'viewer'      // Spectateur
  | 'admin'       // Administrateur
  | 'custom';     // Personnalisé

/** Type de présence */
export type PresenceType = 
  | 'online'      // En ligne
  | 'offline'     // Hors ligne
  | 'busy'       // Occupé
  | 'away'       // Absent
  | 'idle'       // Inactif
  | 'focus'      // Concentré
  | 'custom';    // Personnalisé

// ============ USER TYPES ============

/** Utilisateur de collaboration */
export interface CollaborationUser {
  /** ID unique */
  id: UserId;
  
  /** Nom */
  name: string;
  
  /** Email */
  email?: string;
  
  /** Avatar */
  avatar?: string;
  
  /** Rôle */
  role: CollaborationRole;
  
  /** Présence */
  presence: PresenceType;
  
  /** Dernière activité */
  lastActivityAt: number;
  
  /** Date de connexion */
  connectedAt: number;
  
  /** Statut */
  status: CollaborationStatus;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Présence utilisateur */
export interface UserPresence {
  /** User ID */
  userId: UserId;
  
  /** Type */
  type: PresenceType;
  
  /** Message */
  message?: string;
  
  /** Dernière mise à jour */
  updatedAt: number;
  
  /** Statut */
  status: CollaborationStatus;
}

// ============ SESSION TYPES ============

/** Session de collaboration */
export interface CollaborationSession {
  /** ID unique */
  id: CollaborationId;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type */
  type: CollaborationType;
  
  /** Hôte */
  hostId: UserId;
  
  /** Utilisateurs */
  users: CollaborationUser[];
  
  /** Statut */
  status: CollaborationStatus;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de connexion */
  connectedAt?: number;
  
  /** Date de déconnexion */
  disconnectedAt?: number;
  
  /** Date de fermeture */
  closedAt?: number;
  
  /** Durée (en ms) */
  duration?: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Configuration de session */
export interface SessionConfig {
  /** Type */
  type: CollaborationType;
  
  /** Rôles autorisés */
  allowedRoles: CollaborationRole[];
  
  /** Nombre maximum d'utilisateurs */
  maxUsers: number;
  
  /** Durée maximale (en ms) */
  maxDuration: number;
  
  /** Autoriser l'anonymat */
  allowAnonymous: boolean;
  
  /** Autoriser l'édition */
  allowEditing: boolean;
  
  /** Autoriser les commentaires */
  allowComments: boolean;
  
  /** Synchronisation automatique */
  autoSync: boolean;
  
  /** Intervalle de synchronisation (en ms) */
  syncInterval: number;
  
  /** Paramètres */
  settings?: Record<string, unknown>;
}

// ============ CURSOR TYPES ============

/** Curseur */
export interface CollaborationCursor {
  /** ID unique */
  id: CursorId;
  
  /** User ID */
  userId: UserId;
  
  /** Position X */
  x: number;
  
  /** Position Y */
  y: number;
  
  /** Élément */
  element?: string;
  
  /** Couleur */
  color: string;
  
  /** Nom */
  name?: string;
  
  /** Visible */
  visible: boolean;
  
  /** Timestamp */
  timestamp: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Position du curseur */
export interface CursorPosition {
  /** X */
  x: number;
  
  /** Y */
  y: number;
  
  /** Élément */
  element?: string;
  
  /** Timestamp */
  timestamp: number;
}

// ============ SELECTION TYPES ============

/** Sélection */
export interface CollaborationSelection {
  /** ID unique */
  id: SelectionId;
  
  /** User ID */
  userId: UserId;
  
  /** Contenu sélectionné */
  content: string;
  
  /** Position de début */
  startPosition: { x: number; y: number };
  
  /** Position de fin */
  endPosition: { x: number; y: number };
  
  /** Texte sélectionné */
  text?: string;
  
  /** Couleur */
  color: string;
  
  /** Visible */
  visible: boolean;
  
  /** Timestamp */
  timestamp: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

// ============ MESSAGE TYPES ============

/** Message */
export interface CollaborationMessage {
  /** ID unique */
  id: MessageId;
  
  /** User ID */
  userId: UserId;
  
  /** Contenu */
  content: string;
  
  /** Type */
  type: 'text' | 'comment' | 'suggestion' | 'mention' | 'system' | 'custom';
  
  /** Statut */
  status: 'sent' | 'delivered' | 'read' | 'error';
  
  /** Référence */
  referenceId?: string;
  
  /** Réponses */
  replies: CollaborationMessage[];
  
  /** Réactions */
  reactions: Record<string, string[]>;
  
  /** Timestamp */
  timestamp: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Message système */
export interface SystemMessage extends CollaborationMessage {
  type: 'system';
  
  /** Niveau */
  level: 'info' | 'warning' | 'error' | 'success';
}

// ============ CHANGE TYPES ============

/** Type de changement */
export type ChangeType = 
  | 'insert'      // Insertion
  | 'delete'      // Suppression
  | 'update'      // Mise à jour
  | 'move'        // Déplacement
  | 'format'      // Formatage
  | 'comment'     // Commentaire
  | 'selection'   // Sélection
  | 'cursor'      // Curseur
  | 'presence'    // Présence
  | 'custom';     // Personnalisé

/** Changement */
export interface CollaborationChange {
  /** ID unique */
  id: string;
  
  /** User ID */
  userId: UserId;
  
  /** Type */
  type: ChangeType;
  
  /** Contenu */
  content?: string;
  
  /** Position */
  position?: { x: number; y: number };
  
  /** Ancienne position */
  oldPosition?: { x: number; y: number };
  
  /** Nouvelle position */
  newPosition?: { x: number; y: number };
  
  /** Longueur */
  length?: number;
  
  /** Timestamp */
  timestamp: number;
  
  /** Version */
  version: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Opération de changement */
export interface ChangeOperation {
  /** Type */
  type: ChangeType;
  
  /** Contenu */
  content?: string;
  
  /** Position */
  position?: { x: number; y: number };
  
  /** Ancienne valeur */
  oldValue?: string;
  
  /** Nouvelle valeur */
  newValue?: string;
  
  /** Longueur */
  length?: number;
  
  /** Offset */
  offset?: number;
}

// ============ DOCUMENT TYPES ============

/** Document partagé */
export interface SharedDocument {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Contenu */
  content: string;
  
  /** Type */
  type: 'text' | 'markdown' | 'code' | 'json' | 'custom';
  
  /** Version */
  version: number;
  
  /** Dernière modification */
  lastModifiedAt: number;
  
  /** Dernier modificateur */
  lastModifiedBy: UserId;
  
  /** Historique */
  history: CollaborationChange[];
  
  /** Verrouillé */
  locked: boolean;
  
  /** Verrouillé par */
  lockedBy?: UserId;
  
  /** Statut */
  status: CollaborationStatus;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Version de document */
export interface DocumentVersion {
  /** ID unique */
  id: string;
  
  /** Version */
  version: number;
  
  /** Contenu */
  content: string;
  
  /** Timestamp */
  timestamp: number;
  
  /** User ID */
  userId: UserId;
  
  /** Message */
  message?: string;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

// ============ CONFLICT TYPES ============

/** Type de conflit */
export type ConflictType = 
  | 'merge'       // Fusion
  | 'overwrite'   // Écrasement
  | 'keep_both'   // Garder les deux
  | 'custom';     // Personnalisé

/** Conflit */
export interface CollaborationConflict {
  /** ID unique */
  id: string;
  
  /** User ID */
  userId: UserId;
  
  /** Type */
  type: ConflictType;
  
  /** Contenu local */
  localContent: string;
  
  /** Contenu distant */
  remoteContent: string;
  
  /** Position */
  position?: { x: number; y: number };
  
  /** Longueur */
  length?: number;
  
  /** Résolu */
  resolved: boolean;
  
  /** Résolution */
  resolution?: string;
  
  /** Résolu par */
  resolvedBy?: UserId;
  
  /** Résolu à */
  resolvedAt?: number;
  
  /** Timestamp */
  timestamp: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Résolution de conflit */
export interface ConflictResolution {
  /** Type */
  type: ConflictType;
  
  /** Contenu */
  content: string;
  
  /** Message */
  message?: string;
  
  /** User ID */
  userId: UserId;
  
  /** Timestamp */
  timestamp: number;
}

// ============ SYNC TYPES ============

/** Statut de synchronisation */
export type SyncStatus = 
  | 'pending'     // En attente
  | 'syncing'     // Synchronisation
  | 'synced'      // Synchronisé
  | 'error'       // Erreur
  | 'conflict'    // Conflit
  | 'offline';    // Hors ligne

/** État de synchronisation */
export interface SyncState {
  /** Statut */
  status: SyncStatus;
  
  /** Dernière synchronisation */
  lastSyncedAt?: number;
  
  /** Nombre de changements */
  changeCount: number;
  
  /** Nombre de conflits */
  conflictCount: number;
  
  /** Message */
  message?: string;
  
  /** Timestamp */
  timestamp: number;
}

/** Opération de synchronisation */
export interface SyncOperation {
  /** Type */
  type: 'push' | 'pull' | 'sync';
  
  /** Changements */
  changes: CollaborationChange[];
  
  /** Statut */
  status: SyncStatus;
  
  /** Timestamp */
  timestamp: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

// ============ EVENT TYPES ============

/** Type d'événement de collaboration */
export type CollaborationEventType = 
  | 'session.created'
  | 'session.joined'
  | 'session.left'
  | 'session.closed'
  | 'user.joined'
  | 'user.left'
  | 'user.status.changed'
  | 'user.role.changed'
  | 'presence.changed'
  | 'cursor.moved'
  | 'cursor.added'
  | 'cursor.removed'
  | 'selection.changed'
  | 'selection.added'
  | 'selection.removed'
  | 'message.sent'
  | 'message.received'
  | 'message.read'
  | 'change.applied'
  | 'change.reverted'
  | 'document.locked'
  | 'document.unlocked'
  | 'document.changed'
  | 'conflict.detected'
  | 'conflict.resolved'
  | 'sync.started'
  | 'sync.completed'
  | 'sync.error'
  | 'error';

/** Événement de collaboration */
export interface CollaborationEvent {
  type: CollaborationEventType;
  timestamp: number;
  data?: Record<string, unknown>;
  sessionId?: CollaborationId;
  userId?: UserId;
}

// ============ SETTINGS TYPES ============

/** Paramètres de collaboration */
export interface CollaborationSettings {
  /** Actif */
  enabled: boolean;
  
  /** Type par défaut */
  defaultType: CollaborationType;
  
  /** Rôle par défaut */
  defaultRole: CollaborationRole;
  
  /** Présence par défaut */
  defaultPresence: PresenceType;
  
  /** Synchronisation automatique */
  autoSync: boolean;
  
  /** Intervalle de synchronisation (en ms) */
  syncInterval: number;
  
  /** Nombre maximum de sessions */
  maxSessions: number;
  
  /** Nombre maximum d'utilisateurs par session */
  maxUsersPerSession: number;
  
  /** Nombre maximum de messages */
  maxMessages: number;
  
  /** Nombre maximum de changements */
  maxChanges: number;
  
  /** Conservation des messages (en jours) */
  messageRetentionDays: number;
  
  /** Conservation des changements (en jours) */
  changeRetentionDays: number;
  
  /** Afficher les curseurs */
  showCursors: boolean;
  
  /** Afficher les sélections */
  showSelections: boolean;
  
  /** Afficher la présence */
  showPresence: boolean;
  
  /** Niveau de logging */
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'none';
  
  /** Synchronisation */
  sync: boolean;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

// ============ DEFAULT VALUES ============

/** Paramètres par défaut */
export const DEFAULT_COLLABORATION_SETTINGS: CollaborationSettings = {
  enabled: true,
  defaultType: 'real-time',
  defaultRole: 'guest',
  defaultPresence: 'online',
  autoSync: true,
  syncInterval: 1000,
  maxSessions: 10,
  maxUsersPerSession: 50,
  maxMessages: 1000,
  maxChanges: 10000,
  messageRetentionDays: 30,
  changeRetentionDays: 7,
  showCursors: true,
  showSelections: true,
  showPresence: true,
  logLevel: 'info',
  sync: false,
};

/** Configuration de session par défaut */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  type: 'real-time',
  allowedRoles: ['host', 'guest', 'editor', 'viewer'],
  maxUsers: 50,
  maxDuration: 86400000, // 24 heures
  allowAnonymous: false,
  allowEditing: true,
  allowComments: true,
  autoSync: true,
  syncInterval: 1000,
};

// ============ EXPORT ============

export {
  // Core Types
  CollaborationId,
  UserId,
  CursorId,
  SelectionId,
  MessageId,
  CollaborationStatus,
  CollaborationType,
  CollaborationRole,
  PresenceType,
  
  // User Types
  CollaborationUser,
  UserPresence,
  
  // Session Types
  CollaborationSession,
  SessionConfig,
  
  // Cursor Types
  CollaborationCursor,
  CursorPosition,
  
  // Selection Types
  CollaborationSelection,
  
  // Message Types
  CollaborationMessage,
  SystemMessage,
  
  // Change Types
  ChangeType,
  CollaborationChange,
  ChangeOperation,
  
  // Document Types
  SharedDocument,
  DocumentVersion,
  
  // Conflict Types
  ConflictType,
  CollaborationConflict,
  ConflictResolution,
  
  // Sync Types
  SyncStatus,
  SyncState,
  SyncOperation,
  
  // Event Types
  CollaborationEventType,
  CollaborationEvent,
  
  // Settings Types
  CollaborationSettings,
  
  // Default Values
  DEFAULT_COLLABORATION_SETTINGS,
  DEFAULT_SESSION_CONFIG,
};
