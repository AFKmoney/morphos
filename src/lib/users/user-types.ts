"use client";

/**
 * Types pour le système Multi-User Realtime
 */

// ============ USER TYPES ============

/** Identifiant unique d'un utilisateur */
export type UserId = string;

/** Rôle d'un utilisateur */
export type UserRole = 'admin' | 'editor' | 'viewer' | 'guest';

/** Statut de présence d'un utilisateur */
export type UserPresenceStatus = 'online' | 'offline' | 'away' | 'busy';

/** Informations de base d'un utilisateur */
export interface User {
  id: UserId;
  name: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  color?: string; // Couleur d'affichage
  createdAt: number;
  lastActiveAt: number;
  settings?: UserSettings;
}

/** Paramètres utilisateur */
export interface UserSettings {
  // Affichage
  displayName?: string;
  avatarUrl?: string;
  theme?: 'light' | 'dark' | 'system';
  accentColor?: string;
  
  // Notifications
  notificationsEnabled?: boolean;
  notificationSound?: boolean;
  
  // Préférences
  defaultWorkspace?: string;
  language?: string;
  
  // Sécurité
  preferredAuthMethod?: 'password' | 'oauth' | 'magic-link';
}

/** Statut de présence avec détails */
export interface UserPresence {
  userId: UserId;
  status: UserPresenceStatus;
  lastSeenAt?: number;
  currentWorkspace?: string;
  currentWindow?: string;
  cursorPosition?: { x: number; y: number };
}

/** Session utilisateur */
export interface UserSession {
  userId: UserId;
  token: string;
  expiresAt: number;
  createdAt: number;
  ipAddress?: string;
  userAgent?: string;
}

// ============ WORKSPACE TYPES ============

/** Identifiant d'un workspace partagé */
export type SharedWorkspaceId = string;

/** Type de partage d'un workspace */
export type WorkspaceShareType = 'private' | 'public' | 'team' | 'invite-only';

/** Permissions sur un workspace */
export type WorkspacePermission = 'read' | 'write' | 'admin' | 'delete';

/** Membre d'un workspace partagé */
export interface WorkspaceMember {
  userId: UserId;
  role: UserRole;
  permissions: WorkspacePermission[];
  joinedAt: number;
  lastActiveAt?: number;
}

/** Workspace partagé */
export interface SharedWorkspace {
  id: SharedWorkspaceId;
  name: string;
  description?: string;
  ownerId: UserId;
  shareType: WorkspaceShareType;
  members: WorkspaceMember[];
  createdAt: number;
  updatedAt: number;
  
  // Données du workspace
  windows: unknown[]; // À typer avec MorphWindow
  settings?: Record<string, unknown>;
}

// ============ COLLABORATION TYPES ============

/** Type de changement collaboratif */
export type CollaborationChangeType = 
  | 'window.create'
  | 'window.update'
  | 'window.delete'
  | 'window.move'
  | 'window.resize'
  | 'window.minimize'
  | 'window.maximize'
  | 'window.close'
  | 'chat.message'
  | 'file.create'
  | 'file.update'
  | 'file.delete'
  | 'settings.update';

/** Changement collaboratif */
export interface CollaborationChange {
  id: string;
  type: CollaborationChangeType;
  userId: UserId;
  timestamp: number;
  data: Record<string, unknown>;
  undoable?: boolean;
  redoable?: boolean;
}

/** Historique des changements */
export interface CollaborationHistory {
  workspaceId: SharedWorkspaceId;
  changes: CollaborationChange[];
  currentIndex: number; // Index pour undo/redo
}

// ============ REALTIME TYPES ============

/** Type de message realtime */
export type RealtimeMessageType = 
  | 'presence.update'
  | 'workspace.join'
  | 'workspace.leave'
  | 'change.apply'
  | 'change.undo'
  | 'change.redo'
  | 'chat.message'
  | 'cursor.move'
  | 'selection.change'
  | 'notify';

/** Message realtime de base */
export interface RealtimeMessage {
  type: RealtimeMessageType;
  userId: UserId;
  timestamp: number;
  workspaceId?: SharedWorkspaceId;
}

/** Message de mise à jour de présence */
export interface PresenceUpdateMessage extends RealtimeMessage {
  type: 'presence.update';
  presence: UserPresence;
}

/** Message de join/leave workspace */
export interface WorkspaceJoinLeaveMessage extends RealtimeMessage {
  type: 'workspace.join' | 'workspace.leave';
  workspaceId: SharedWorkspaceId;
}

/** Message de changement */
export interface ChangeApplyMessage extends RealtimeMessage {
  type: 'change.apply';
  change: CollaborationChange;
}

/** Message d'undo/redo */
export interface ChangeUndoRedoMessage extends RealtimeMessage {
  type: 'change.undo' | 'change.redo';
  changeId: string;
}

/** Message de chat */
export interface ChatMessage extends RealtimeMessage {
  type: 'chat.message';
  content: string;
  mentions?: UserId[];
  replyTo?: string;
}

/** Message de mouvement de curseur */
export interface CursorMoveMessage extends RealtimeMessage {
  type: 'cursor.move';
  position: { x: number; y: number };
  windowId?: string;
}

/** Message de changement de sélection */
export interface SelectionChangeMessage extends RealtimeMessage {
  type: 'selection.change';
  selection: unknown; // À typer selon le contexte
  windowId?: string;
}

/** Message de notification */
export interface NotifyMessage extends RealtimeMessage {
  type: 'notify';
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}

/** Union type pour tous les messages */
export type AnyRealtimeMessage = 
  | PresenceUpdateMessage
  | WorkspaceJoinLeaveMessage
  | ChangeApplyMessage
  | ChangeUndoRedoMessage
  | ChatMessage
  | CursorMoveMessage
  | SelectionChangeMessage
  | NotifyMessage;

// ============ CONNECTION TYPES ============

/** Statut de la connexion */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/** Informations de connexion */
export interface ConnectionInfo {
  status: ConnectionStatus;
  lastConnectedAt?: number;
  lastDisconnectedAt?: number;
  reconnectAttempts: number;
  error?: string;
  ping?: number; // Latence en ms
}

// ============ INVITATION TYPES ============

/** Invitation à un workspace */
export interface WorkspaceInvitation {
  id: string;
  workspaceId: SharedWorkspaceId;
  workspaceName: string;
  fromUserId: UserId;
  fromUserName: string;
  toEmail: string;
  role: UserRole;
  permissions: WorkspacePermission[];
  token: string;
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

// ============ NOTIFICATION TYPES ============

/** Type de notification */
export type NotificationType = 
  | 'invitation'
  | 'mention'
  | 'workspace.update'
  | 'change.conflict'
  | 'presence.change'
  | 'system';

/** Notification */
export interface UserNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId?: UserId;
  workspaceId?: SharedWorkspaceId;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: number;
}
