/**
 * Advanced Collaboration System - Store
 * 
 * Stores Svelte pour la gestion de la collaboration
 */

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type {
  CollaborationId,
  UserId,
  CursorId,
  SelectionId,
  MessageId,
  CollaborationUser,
  UserPresence,
  CollaborationSession,
  CollaborationCursor,
  CollaborationSelection,
  CollaborationMessage,
  CollaborationChange,
  SharedDocument,
  CollaborationConflict,
  CollaborationEvent,
  CollaborationEventType,
  CollaborationStatus,
  CollaborationType,
  CollaborationRole,
  PresenceType,
  SyncStatus,
  SyncState,
} from './collaboration-types';

import { collaborationManager } from './collaboration-engine';
import { DEFAULT_COLLABORATION_SETTINGS } from './collaboration-types';

// ============ DEFAULT VALUES ============

/** Statut par défaut */
export const DEFAULT_COLLABORATION_STATUS = {
  enabled: true,
  connected: false,
  connecting: false,
  currentSessionId: null as CollaborationId | null,
  currentUserId: null as UserId | null,
  userCount: 0,
  sessionCount: 0,
  messageCount: 0,
  changeCount: 0,
  conflictCount: 0,
  cursorCount: 0,
  selectionCount: 0,
};

// ============ STORES ============

/** Store des sessions */
export const sessionsStore: Writable<CollaborationSession[]> = writable([]);

/** Store des utilisateurs */
export const usersStore: Writable<CollaborationUser[]> = writable([]);

/** Store des curseurs */
export const cursorsStore: Writable<CollaborationCursor[]> = writable([]);

/** Store des sélections */
export const selectionsStore: Writable<CollaborationSelection[]> = writable([]);

/** Store des messages */
export const messagesStore: Writable<CollaborationMessage[]> = writable([]);

/** Store des changements */
export const changesStore: Writable<CollaborationChange[]> = writable([]);

/** Store des documents */
export const documentsStore: Writable<SharedDocument[]> = writable([]);

/** Store des conflits */
export const conflictsStore: Writable<CollaborationConflict[]> = writable([]);

/** Store des événements */
export const collaborationEventsStore: Writable<CollaborationEvent[]> = writable([]);

/** Store du statut */
export const collaborationStatusStore: Writable<typeof DEFAULT_COLLABORATION_STATUS> = writable(DEFAULT_COLLABORATION_STATUS);

/** Store de la session actuelle */
export const currentSessionStore: Writable<CollaborationSession | null> = writable(null);

/** Store de l'utilisateur actuel */
export const currentUserStore: Writable<CollaborationUser | null> = writable(null);

/** Store des paramètres */
export const collaborationSettingsStore: Writable<typeof DEFAULT_COLLABORATION_SETTINGS> = writable(DEFAULT_COLLABORATION_SETTINGS);

/** Store de l'état de synchronisation */
export const syncStateStore: Writable<SyncState> = writable({
  status: 'offline',
  changeCount: 0,
  conflictCount: 0,
  timestamp: Date.now(),
});

// ============ DERIVED STORES ============

/** Nombre de sessions */
export const sessionCountStore: Readable<number> = derived(
  sessionsStore,
  ($sessions) => $sessions.length
);

/** Nombre d'utilisateurs */
export const userCountStore: Readable<number> = derived(
  usersStore,
  ($users) => $users.length
);

/** Nombre de curseurs */
export const cursorCountStore: Readable<number> = derived(
  cursorsStore,
  ($cursors) => $cursors.length
);

/** Nombre de sélections */
export const selectionCountStore: Readable<number> = derived(
  selectionsStore,
  ($selections) => $selections.length
);

/** Nombre de messages */
export const messageCountStore: Readable<number> = derived(
  messagesStore,
  ($messages) => $messages.length
);

/** Nombre de changements */
export const changeCountStore: Readable<number> = derived(
  changesStore,
  ($changes) => $changes.length
);

/** Nombre de conflits */
export const conflictCountStore: Readable<number> = derived(
  conflictsStore,
  ($conflicts) => $conflicts.length
);

/** Sessions actives */
export const activeSessionsStore: Readable<CollaborationSession[]> = derived(
  sessionsStore,
  ($sessions) => $sessions.filter(s => s.status === 'active' || s.status === 'connected')
);

/** Utilisateurs en ligne */
export const onlineUsersStore: Readable<CollaborationUser[]> = derived(
  usersStore,
  ($users) => $users.filter(u => u.presence === 'online' && u.status === 'connected')
);

/** Curseurs visibles */
export const visibleCursorsStore: Readable<CollaborationCursor[]> = derived(
  cursorsStore,
  ($cursors) => $cursors.filter(c => c.visible)
);

/** Sélections visibles */
export const visibleSelectionsStore: Readable<CollaborationSelection[]> = derived(
  selectionsStore,
  ($selections) => $selections.filter(s => s.visible)
);

/** Messages non lus */
export const unreadMessagesStore: Readable<CollaborationMessage[]> = derived(
  messagesStore,
  ($messages) => $messages.filter(m => m.status !== 'read')
);

/** Conflits non résolus */
export const unresolvedConflictsStore: Readable<CollaborationConflict[]> = derived(
  conflictsStore,
  ($conflicts) => $conflicts.filter(c => !c.resolved)
);

/** Sessions par type */
export const sessionsByTypeStore: Readable<Record<CollaborationType, CollaborationSession[]>> = derived(
  sessionsStore,
  ($sessions) => {
    const byType: Record<CollaborationType, CollaborationSession[]> = {
      real_time: [],
      async: [],
      review: [],
      custom: [],
    };
    
    for (const session of $sessions) {
      byType[session.type].push(session);
    }
    
    return byType;
  }
);

// ============ INITIALIZATION ============

/**
 * Initialiser les stores de collaboration
 */
export function initializeCollaborationStores(): void {
  // Charger les données depuis le localStorage
  const savedSessions = localStorage.getItem('morphos-collaboration-sessions');
  const savedUsers = localStorage.getItem('morphos-collaboration-users');
  const savedMessages = localStorage.getItem('morphos-collaboration-messages');
  const savedChanges = localStorage.getItem('morphos-collaboration-changes');
  const savedDocuments = localStorage.getItem('morphos-collaboration-documents');
  const savedSettings = localStorage.getItem('morphos-collaboration-settings');
  const savedCurrentSessionId = localStorage.getItem('morphos-collaboration-current-session-id');
  const savedCurrentUserId = localStorage.getItem('morphos-collaboration-current-user-id');
  
  if (savedSessions) {
    try {
      sessionsStore.set(JSON.parse(savedSessions));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedUsers) {
    try {
      usersStore.set(JSON.parse(savedUsers));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedMessages) {
    try {
      messagesStore.set(JSON.parse(savedMessages));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedChanges) {
    try {
      changesStore.set(JSON.parse(savedChanges));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedDocuments) {
    try {
      documentsStore.set(JSON.parse(savedDocuments));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedSettings) {
    try {
      collaborationSettingsStore.set(JSON.parse(savedSettings));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedCurrentSessionId) {
    try {
      const session = sessionsStore.get().find(s => s.id === savedCurrentSessionId);
      if (session) {
        currentSessionStore.set(session);
      }
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedCurrentUserId) {
    try {
      const user = usersStore.get().find(u => u.id === savedCurrentUserId);
      if (user) {
        currentUserStore.set(user);
      }
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  // Sauvegarder les données lors des changements
  sessionsStore.subscribe((sessions) => {
    localStorage.setItem('morphos-collaboration-sessions', JSON.stringify(sessions));
    collaborationStatusStore.update(status => ({ ...status, sessionCount: sessions.length }));
  });
  
  usersStore.subscribe((users) => {
    localStorage.setItem('morphos-collaboration-users', JSON.stringify(users));
    collaborationStatusStore.update(status => ({ ...status, userCount: users.length }));
  });
  
  messagesStore.subscribe((messages) => {
    localStorage.setItem('morphos-collaboration-messages', JSON.stringify(messages));
    collaborationStatusStore.update(status => ({ ...status, messageCount: messages.length }));
  });
  
  changesStore.subscribe((changes) => {
    localStorage.setItem('morphos-collaboration-changes', JSON.stringify(changes));
    collaborationStatusStore.update(status => ({ ...status, changeCount: changes.length }));
  });
  
  documentsStore.subscribe((documents) => {
    localStorage.setItem('morphos-collaboration-documents', JSON.stringify(documents));
  });
  
  collaborationSettingsStore.subscribe((settings) => {
    localStorage.setItem('morphos-collaboration-settings', JSON.stringify(settings));
  });
  
  currentSessionStore.subscribe((session) => {
    if (session) {
      localStorage.setItem('morphos-collaboration-current-session-id', session.id);
      collaborationStatusStore.update(status => ({ ...status, currentSessionId: session.id }));
    } else {
      localStorage.removeItem('morphos-collaboration-current-session-id');
      collaborationStatusStore.update(status => ({ ...status, currentSessionId: null }));
    }
  });
  
  currentUserStore.subscribe((user) => {
    if (user) {
      localStorage.setItem('morphos-collaboration-current-user-id', user.id);
      collaborationStatusStore.update(status => ({ ...status, currentUserId: user.id }));
    } else {
      localStorage.removeItem('morphos-collaboration-current-user-id');
      collaborationStatusStore.update(status => ({ ...status, currentUserId: null }));
    }
  });
  
  // S'abonner aux changements du manager
  collaborationManager.onEvent('*', (event) => {
    collaborationEventsStore.update(events => [event, ...events].slice(0, 100));
  });
  
  // Charger les données du manager
  const managerSessions = collaborationManager.getAllSessions();
  sessionsStore.set(managerSessions);
  
  const managerUsers = collaborationManager.getAllUsers();
  usersStore.set(managerUsers);
  
  const managerCursors = collaborationManager.getAllCursors();
  cursorsStore.set(managerCursors);
  
  const managerSelections = collaborationManager.getAllSelections();
  selectionsStore.set(managerSelections);
  
  const managerMessages = collaborationManager.getAllMessages();
  messagesStore.set(managerMessages);
  
  const managerChanges = collaborationManager.getAllChanges();
  changesStore.set(managerChanges);
  
  const managerDocuments = collaborationManager.getAllDocuments();
  documentsStore.set(managerDocuments);
  
  const managerConflicts = collaborationManager.getAllConflicts();
  conflictsStore.set(managerConflicts);
  
  const managerSettings = collaborationManager.getSettings();
  collaborationSettingsStore.set(managerSettings);
  
  const activeSession = collaborationManager.getActiveSessions()[0] || null;
  currentSessionStore.set(activeSession);
  
  const currentUser = collaborationManager.getAllUsers().find(u => u.id === managerSettings.defaultUserId) || null;
  currentUserStore.set(currentUser);
  
  collaborationStatusStore.update(status => ({
    ...status,
    enabled: managerSettings.enabled,
    connected: activeSession !== null,
  }));
}

// ============ ACTIONS ============

/**
 * Créer une session
 */
export function createSession(name: string, config?: Partial<CollaborationSession>): CollaborationId {
  const id = collaborationManager.createSession(name, config);
  const session = collaborationManager.getSession(id);
  if (session) {
    sessionsStore.update(sessions => [...sessions, session]);
    currentSessionStore.set(session);
    localStorage.setItem('morphos-collaboration-current-session-id', id);
    collaborationStatusStore.update(status => ({ ...status, currentSessionId: id, sessionCount: sessionsStore.get().length + 1 }));
  }
  return id;
}

/**
 * Rejoindre une session
 */
export function joinSession(sessionId: CollaborationId, user?: CollaborationUser): CollaborationId {
  const id = collaborationManager.joinSession(sessionId, user);
  const session = collaborationManager.getSession(id);
  if (session) {
    sessionsStore.update(sessions => {
      const existingIndex = sessions.findIndex(s => s.id === sessionId);
      if (existingIndex >= 0) {
        return sessions.map(s => s.id === sessionId ? session : s);
      }
      return [...sessions, session];
    });
    currentSessionStore.set(session);
    localStorage.setItem('morphos-collaboration-current-session-id', id);
  }
  return id;
}

/**
 * Quitter une session
 */
export function leaveSession(sessionId?: CollaborationId): boolean {
  const id = sessionId || currentSessionStore.get()?.id;
  if (!id) return false;
  
  const success = collaborationManager.leaveSession(id);
  if (success) {
    sessionsStore.update(sessions => sessions.map(s => s.id === id ? { ...s, status: 'disconnected' } : s));
    currentSessionStore.set(null);
    localStorage.removeItem('morphos-collaboration-current-session-id');
    collaborationStatusStore.update(status => ({ ...status, currentSessionId: null }));
  }
  return success;
}

/**
 * Fermer une session
 */
export function closeSession(sessionId: CollaborationId): boolean {
  const success = collaborationManager.closeSession(sessionId);
  if (success) {
    sessionsStore.update(sessions => sessions.map(s => s.id === sessionId ? { ...s, status: 'closed' } : s));
    if (currentSessionStore.get()?.id === sessionId) {
      currentSessionStore.set(null);
      localStorage.removeItem('morphos-collaboration-current-session-id');
    }
  }
  return success;
}

/**
 * Obtenir une session par ID
 */
export function getSession(id: CollaborationId): CollaborationSession | null {
  return collaborationManager.getSession(id);
}

/**
 * Obtenir toutes les sessions
 */
export function getAllSessions(): CollaborationSession[] {
  return collaborationManager.getAllSessions();
}

/**
 * Obtenir les sessions actives
 */
export function getActiveSessions(): CollaborationSession[] {
  return collaborationManager.getActiveSessions();
}

/**
 * Ajouter un utilisateur
 */
export function addUser(user: CollaborationUser): UserId {
  const id = collaborationManager.addUser(user);
  usersStore.update(users => [...users, user]);
  return id;
}

/**
 * Obtenir un utilisateur par ID
 */
export function getUser(id: UserId): CollaborationUser | null {
  return collaborationManager.getUser(id);
}

/**
 * Obtenir tous les utilisateurs
 */
export function getAllUsers(): CollaborationUser[] {
  return collaborationManager.getAllUsers();
}

/**
 * Obtenir les utilisateurs d'une session
 */
export function getUsersInSession(sessionId: CollaborationId): CollaborationUser[] {
  return collaborationManager.getUsersInSession(sessionId);
}

/**
 * Supprimer un utilisateur
 */
export function removeUser(id: UserId): boolean {
  const success = collaborationManager.removeUser(id);
  if (success) {
    usersStore.update(users => users.filter(u => u.id !== id));
  }
  return success;
}

/**
 * Mettre à jour un utilisateur
 */
export function updateUser(id: UserId, updates: Partial<CollaborationUser>): boolean {
  const success = collaborationManager.updateUser(id, updates);
  if (success) {
    usersStore.update(users => users.map(u => u.id === id ? { ...u, ...updates } : u));
  }
  return success;
}

/**
 * Changer le rôle d'un utilisateur
 */
export function changeUserRole(userId: UserId, role: CollaborationRole): boolean {
  return collaborationManager.changeUserRole(userId, role);
}

/**
 * Changer la présence d'un utilisateur
 */
export function changePresence(userId: UserId, presence: PresenceType, message?: string): boolean {
  return collaborationManager.changePresence(userId, presence, message);
}

/**
 * Ajouter un curseur
 */
export function addCursor(cursor: CollaborationCursor): CursorId {
  const id = collaborationManager.addCursor(cursor);
  cursorsStore.update(cursors => [...cursors, cursor]);
  return id;
}

/**
 * Obtenir un curseur par ID
 */
export function getCursor(id: CursorId): CollaborationCursor | null {
  return collaborationManager.getCursor(id);
}

/**
 * Obtenir tous les curseurs
 */
export function getAllCursors(): CollaborationCursor[] {
  return collaborationManager.getAllCursors();
}

/**
 * Obtenir les curseurs d'une session
 */
export function getCursorsInSession(sessionId: CollaborationId): CollaborationCursor[] {
  return collaborationManager.getCursorsInSession(sessionId);
}

/**
 * Supprimer un curseur
 */
export function removeCursor(id: CursorId): boolean {
  const success = collaborationManager.removeCursor(id);
  if (success) {
    cursorsStore.update(cursors => cursors.filter(c => c.id !== id));
  }
  return success;
}

/**
 * Mettre à jour un curseur
 */
export function updateCursor(id: CursorId, position: { x: number; y: number; element?: string }): boolean {
  return collaborationManager.updateCursor(id, { ...position, timestamp: Date.now() });
}

/**
 * Ajouter une sélection
 */
export function addSelection(selection: CollaborationSelection): SelectionId {
  const id = collaborationManager.addSelection(selection);
  selectionsStore.update(selections => [...selections, selection]);
  return id;
}

/**
 * Obtenir une sélection par ID
 */
export function getSelection(id: SelectionId): CollaborationSelection | null {
  return collaborationManager.getSelection(id);
}

/**
 * Obtenir toutes les sélections
 */
export function getAllSelections(): CollaborationSelection[] {
  return collaborationManager.getAllSelections();
}

/**
 * Obtenir les sélections d'une session
 */
export function getSelectionsInSession(sessionId: CollaborationId): CollaborationSelection[] {
  return collaborationManager.getSelectionsInSession(sessionId);
}

/**
 * Supprimer une sélection
 */
export function removeSelection(id: SelectionId): boolean {
  const success = collaborationManager.removeSelection(id);
  if (success) {
    selectionsStore.update(selections => selections.filter(s => s.id !== id));
  }
  return success;
}

/**
 * Mettre à jour une sélection
 */
export function updateSelection(id: SelectionId, updates: Partial<CollaborationSelection>): boolean {
  return collaborationManager.updateSelection(id, updates);
}

/**
 * Envoyer un message
 */
export function sendMessage(sessionId: CollaborationId, content: string, type: CollaborationMessage['type'] = 'text'): MessageId {
  const id = collaborationManager.sendMessageToSession(sessionId, content, type);
  const message = collaborationManager.getMessage(id);
  if (message) {
    messagesStore.update(messages => [...messages, message]);
  }
  return id;
}

/**
 * Obtenir un message par ID
 */
export function getMessage(id: MessageId): CollaborationMessage | null {
  return collaborationManager.getMessage(id);
}

/**
 * Obtenir tous les messages
 */
export function getAllMessages(): CollaborationMessage[] {
  return collaborationManager.getAllMessages();
}

/**
 * Obtenir les messages d'une session
 */
export function getMessagesInSession(sessionId: CollaborationId): CollaborationMessage[] {
  return collaborationManager.getMessagesInSession(sessionId);
}

/**
 * Supprimer un message
 */
export function removeMessage(id: MessageId): boolean {
  const success = collaborationManager.removeMessage(id);
  if (success) {
    messagesStore.update(messages => messages.filter(m => m.id !== id));
  }
  return success;
}

/**
 * Répondre à un message
 */
export function replyToMessage(messageId: MessageId, content: string): MessageId {
  return collaborationManager.replyToMessage(messageId, content);
}

/**
 * Ajouter une réaction à un message
 */
export function addReactionToMessage(messageId: MessageId, emoji: string): boolean {
  return collaborationManager.addReactionToMessage(messageId, emoji);
}

/**
 * Appliquer un changement
 */
export function applyChange(change: CollaborationChange): string {
  const id = collaborationManager.applyChange(change);
  const newChange = collaborationManager.getChange(id);
  if (newChange) {
    changesStore.update(changes => [...changes, newChange]);
  }
  return id;
}

/**
 * Obtenir un changement par ID
 */
export function getChange(id: string): CollaborationChange | null {
  return collaborationManager.getChange(id);
}

/**
 * Obtenir tous les changements
 */
export function getAllChanges(): CollaborationChange[] {
  return collaborationManager.getAllChanges();
}

/**
 * Obtenir les changements d'une session
 */
export function getChangesInSession(sessionId: CollaborationId): CollaborationChange[] {
  return collaborationManager.getChangesInSession(sessionId);
}

/**
 * Supprimer un changement
 */
export function removeChange(id: string): boolean {
  const success = collaborationManager.removeChange(id);
  if (success) {
    changesStore.update(changes => changes.filter(c => c.id !== id));
  }
  return success;
}

/**
 * Créer un document partagé
 */
export function createSharedDocument(name: string, content: string = '', type: SharedDocument['type'] = 'text'): string {
  const id = collaborationManager.createSharedDocument(name, content, type);
  const document = collaborationManager.getDocument(id);
  if (document) {
    documentsStore.update(documents => [...documents, document]);
  }
  return id;
}

/**
 * Obtenir un document par ID
 */
export function getDocument(id: string): SharedDocument | null {
  return collaborationManager.getDocument(id);
}

/**
 * Obtenir tous les documents
 */
export function getAllDocuments(): SharedDocument[] {
  return collaborationManager.getAllDocuments();
}

/**
 * Mettre à jour un document
 */
export function updateDocument(id: string, updates: Partial<SharedDocument>): boolean {
  return collaborationManager.updateDocument(id, updates);
}

/**
 * Supprimer un document
 */
export function removeDocument(id: string): boolean {
  const success = collaborationManager.removeDocument(id);
  if (success) {
    documentsStore.update(documents => documents.filter(d => d.id !== id));
  }
  return success;
}

/**
 * Verrouiller un document
 */
export function lockDocument(id: string, userId?: UserId): boolean {
  return collaborationManager.lockDocument(id, userId);
}

/**
 * Déverrouiller un document
 */
export function unlockDocument(id: string): boolean {
  return collaborationManager.unlockDocument(id);
}

/**
 * Détecter un conflit
 */
export function detectConflict(localChange: CollaborationChange, remoteChange: CollaborationChange): CollaborationConflict {
  return collaborationManager.detectConflict(localChange, remoteChange);
}

/**
 * Obtenir un conflit par ID
 */
export function getConflict(id: string): CollaborationConflict | null {
  return collaborationManager.getConflict(id);
}

/**
 * Obtenir tous les conflits
 */
export function getAllConflicts(): CollaborationConflict[] {
  return collaborationManager.getAllConflicts();
}

/**
 * Obtenir les conflits d'une session
 */
export function getConflictsInSession(sessionId: CollaborationId): CollaborationConflict[] {
  return collaborationManager.getConflictsInSession(sessionId);
}

/**
 * Résoudre un conflit
 */
export function resolveConflict(conflictId: string, content: string, userId?: UserId): boolean {
  return collaborationManager.resolveConflict(conflictId, {
    type: 'merge',
    content,
    userId: userId || '',
    timestamp: Date.now(),
  });
}

/**
 * Obtenir les paramètres
 */
export function getCollaborationSettings(): typeof DEFAULT_COLLABORATION_SETTINGS {
  return collaborationManager.getSettings();
}

/**
 * Mettre à jour les paramètres
 */
export function updateCollaborationSettings(updates: Partial<typeof DEFAULT_COLLABORATION_SETTINGS>): void {
  collaborationManager.updateSettings(updates);
  collaborationSettingsStore.update(settings => ({ ...settings, ...updates }));
}

/**
 * Activer/Désactiver la collaboration
 */
export function setCollaborationEnabled(enabled: boolean): void {
  updateCollaborationSettings({ enabled });
}

/**
 * Se connecter au serveur
 */
export async function connectToServer(url: string): Promise<void> {
  return collaborationManager.connect(url);
}

/**
 * Se déconnecter du serveur
 */
export function disconnectFromServer(): void {
  collaborationManager.disconnect();
  collaborationStatusStore.update(status => ({ ...status, connected: false, connecting: false }));
}

/**
 * Nettoyer les données
 */
export function clearCollaborationData(): void {
  sessionsStore.set([]);
  usersStore.set([]);
  cursorsStore.set([]);
  selectionsStore.set([]);
  messagesStore.set([]);
  changesStore.set([]);
  documentsStore.set([]);
  conflictsStore.set([]);
  collaborationEventsStore.set([]);
  currentSessionStore.set(null);
  currentUserStore.set(null);
  syncStateStore.set({ status: 'offline', changeCount: 0, conflictCount: 0, timestamp: Date.now() });
  collaborationStatusStore.set(DEFAULT_COLLABORATION_STATUS);
  
  collaborationManager.cleanup();
}

/**
 * Réinitialiser la collaboration
 */
export function resetCollaboration(): void {
  clearCollaborationData();
  localStorage.removeItem('morphos-collaboration-sessions');
  localStorage.removeItem('morphos-collaboration-users');
  localStorage.removeItem('morphos-collaboration-messages');
  localStorage.removeItem('morphos-collaboration-changes');
  localStorage.removeItem('morphos-collaboration-documents');
  localStorage.removeItem('morphos-collaboration-settings');
  localStorage.removeItem('morphos-collaboration-current-session-id');
  localStorage.removeItem('morphos-collaboration-current-user-id');
}

/**
 * S'abonner à un événement
 */
export function onCollaborationEvent(type: CollaborationEventType, callback: (event: CollaborationEvent) => void): () => void {
  return collaborationManager.onEvent(type, callback);
}

// ============ INITIALIZATION ============

// Initialiser automatiquement
if (typeof window !== 'undefined') {
  initializeCollaborationStores();
}

// ============ EXPORT ============

export {
  // Stores
  sessionsStore,
  usersStore,
  cursorsStore,
  selectionsStore,
  messagesStore,
  changesStore,
  documentsStore,
  conflictsStore,
  collaborationEventsStore,
  collaborationStatusStore,
  currentSessionStore,
  currentUserStore,
  collaborationSettingsStore,
  syncStateStore,
  
  // Derived stores
  sessionCountStore,
  userCountStore,
  cursorCountStore,
  selectionCountStore,
  messageCountStore,
  changeCountStore,
  conflictCountStore,
  activeSessionsStore,
  onlineUsersStore,
  visibleCursorsStore,
  visibleSelectionsStore,
  unreadMessagesStore,
  unresolvedConflictsStore,
  sessionsByTypeStore,
  
  // Actions
  initializeCollaborationStores,
  createSession,
  joinSession,
  leaveSession,
  closeSession,
  getSession,
  getAllSessions,
  getActiveSessions,
  addUser,
  getUser,
  getAllUsers,
  getUsersInSession,
  removeUser,
  updateUser,
  changeUserRole,
  changePresence,
  addCursor,
  getCursor,
  getAllCursors,
  getCursorsInSession,
  removeCursor,
  updateCursor,
  addSelection,
  getSelection,
  getAllSelections,
  getSelectionsInSession,
  removeSelection,
  updateSelection,
  sendMessage,
  getMessage,
  getAllMessages,
  getMessagesInSession,
  removeMessage,
  replyToMessage,
  addReactionToMessage,
  applyChange,
  getChange,
  getAllChanges,
  getChangesInSession,
  removeChange,
  createSharedDocument,
  getDocument,
  getAllDocuments,
  updateDocument,
  removeDocument,
  lockDocument,
  unlockDocument,
  detectConflict,
  getConflict,
  getAllConflicts,
  getConflictsInSession,
  resolveConflict,
  getCollaborationSettings,
  updateCollaborationSettings,
  setCollaborationEnabled,
  connectToServer,
  disconnectFromServer,
  clearCollaborationData,
  resetCollaboration,
  onCollaborationEvent,
};
