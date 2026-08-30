/**
 * Advanced Collaboration System - Engine
 * 
 * Moteur de collaboration pour MorphOS
 */

import type {
  CollaborationId,
  UserId,
  CursorId,
  SelectionId,
  MessageId,
  CollaborationUser,
  UserPresence,
  CollaborationSession,
  SessionConfig,
  CollaborationCursor,
  CursorPosition,
  CollaborationSelection,
  CollaborationMessage,
  SystemMessage,
  ChangeType,
  CollaborationChange,
  ChangeOperation,
  SharedDocument,
  DocumentVersion,
  ConflictType,
  CollaborationConflict,
  ConflictResolution,
  SyncStatus,
  SyncState,
  SyncOperation,
  CollaborationEvent,
  CollaborationEventType,
  CollaborationRole,
  PresenceType,
  CollaborationStatus,
  CollaborationType,
} from './collaboration-types';

import {
  DEFAULT_COLLABORATION_SETTINGS,
  DEFAULT_SESSION_CONFIG,
} from './collaboration-types';

// ============ COLLABORATION MANAGER ============

/**
 * Gestionnaire de collaboration
 */
export class CollaborationManager {
  private sessions: Map<CollaborationId, CollaborationSession> = new Map();
  private users: Map<UserId, CollaborationUser> = new Map();
  private cursors: Map<CursorId, CollaborationCursor> = new Map();
  private selections: Map<SelectionId, CollaborationSelection> = new Map();
  private messages: Map<MessageId, CollaborationMessage> = new Map();
  private changes: Map<string, CollaborationChange> = new Map();
  private documents: Map<string, SharedDocument> = new Map();
  private conflicts: Map<string, CollaborationConflict> = new Map();
  private eventListeners: Map<CollaborationEventType, Set<(event: CollaborationEvent) => void>> = new Map();
  
  private settings = { ...DEFAULT_COLLABORATION_SETTINGS };
  private connection: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000;
  
  constructor() {
    // Initialiser
    this.initialize();
  }
  
  /**
   * Initialiser
   */
  private initialize(): void {
    // Écouter les événements de connexion
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.leaveAllSessions();
      });
    }
  }
  
  // ============ CONNECTION MANAGEMENT ============
  
  /**
   * Se connecter au serveur de collaboration
   */
  public connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connection) {
        this.connection.close();
      }
      
      this.connection = new WebSocket(url);
      
      this.connection.onopen = () => {
        this.reconnectAttempts = 0;
        this.emitEvent('connected', {});
        resolve();
      };
      
      this.connection.onclose = () => {
        this.emitEvent('disconnected', {});
        this.scheduleReconnect(url);
      };
      
      this.connection.onerror = (error) => {
        this.emitEvent('error', { error: error.message });
        reject(error);
      };
      
      this.connection.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    });
  }
  
  /**
   * Se déconnecter
   */
  public disconnect(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    this.reconnectAttempts = 0;
  }
  
  /**
   * Planifier la reconnexion
   */
  private scheduleReconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }
    
    this.reconnectAttempts++;
    
    setTimeout(() => {
      this.connect(url).catch(() => {
        this.scheduleReconnect(url);
      });
    }, this.reconnectInterval * this.reconnectAttempts);
  }
  
  /**
   * Envoyer un message
   */
  private sendMessage(type: string, data: Record<string, unknown>): void {
    if (!this.connection || this.connection.readyState !== WebSocket.OPEN) {
      return;
    }
    
    this.connection.send(JSON.stringify({ type, data, timestamp: Date.now() }));
  }
  
  /**
   * Traiter un message
   */
  private handleMessage(data: unknown): void {
    try {
      const message = JSON.parse(data as string) as { type: string; data: Record<string, unknown>; };
      
      switch (message.type) {
        case 'session:created':
          this.handleSessionCreated(message.data);
          break;
        case 'session:joined':
          this.handleSessionJoined(message.data);
          break;
        case 'session:left':
          this.handleSessionLeft(message.data);
          break;
        case 'session:closed':
          this.handleSessionClosed(message.data);
          break;
        case 'user:joined':
          this.handleUserJoined(message.data);
          break;
        case 'user:left':
          this.handleUserLeft(message.data);
          break;
        case 'user:status:changed':
          this.handleUserStatusChanged(message.data);
          break;
        case 'presence:changed':
          this.handlePresenceChanged(message.data);
          break;
        case 'cursor:moved':
          this.handleCursorMoved(message.data);
          break;
        case 'cursor:added':
          this.handleCursorAdded(message.data);
          break;
        case 'cursor:removed':
          this.handleCursorRemoved(message.data);
          break;
        case 'selection:changed':
          this.handleSelectionChanged(message.data);
          break;
        case 'selection:added':
          this.handleSelectionAdded(message.data);
          break;
        case 'selection:removed':
          this.handleSelectionRemoved(message.data);
          break;
        case 'message:sent':
          this.handleMessageSent(message.data);
          break;
        case 'message:received':
          this.handleMessageReceived(message.data);
          break;
        case 'change:applied':
          this.handleChangeApplied(message.data);
          break;
        case 'document:changed':
          this.handleDocumentChanged(message.data);
          break;
        case 'conflict:detected':
          this.handleConflictDetected(message.data);
          break;
        case 'conflict:resolved':
          this.handleConflictResolved(message.data);
          break;
        case 'sync:started':
          this.handleSyncStarted(message.data);
          break;
        case 'sync:completed':
          this.handleSyncCompleted(message.data);
          break;
        default:
          this.emitEvent('message', { type: message.type, data: message.data });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
  
  /**
   * Traiter la création d'une session
   */
  private handleSessionCreated(data: Record<string, unknown>): void {
    const session = data as CollaborationSession;
    this.sessions.set(session.id, session);
    this.emitEvent('session.created', { sessionId: session.id });
  }
  
  /**
   * Traiter la connexion à une session
   */
  private handleSessionJoined(data: Record<string, unknown>): void {
    const { sessionId, userId } = data as { sessionId: CollaborationId; userId: UserId };
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'active';
      session.connectedAt = Date.now();
      this.sessions.set(sessionId, session);
    }
    
    this.emitEvent('session.joined', { sessionId, userId });
  }
  
  /**
   * Traiter la déconnexion d'une session
   */
  private handleSessionLeft(data: Record<string, unknown>): void {
    const { sessionId, userId } = data as { sessionId: CollaborationId; userId: UserId };
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'disconnected';
      session.disconnectedAt = Date.now();
      this.sessions.set(sessionId, session);
    }
    
    this.emitEvent('session.left', { sessionId, userId });
  }
  
  /**
   * Traiter la fermeture d'une session
   */
  private handleSessionClosed(data: Record<string, unknown>): void {
    const { sessionId } = data as { sessionId: CollaborationId };
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'closed';
      session.closedAt = Date.now();
      session.duration = session.closedAt - (session.createdAt || Date.now());
      this.sessions.set(sessionId, session);
    }
    
    this.emitEvent('session.closed', { sessionId });
  }
  
  /**
   * Traiter la connexion d'un utilisateur
   */
  private handleUserJoined(data: Record<string, unknown>): void {
    const user = data as CollaborationUser;
    this.users.set(user.id, user);
    
    const session = this.sessions.get(user.id);
    if (session) {
      session.users.push(user);
      this.sessions.set(session.id, session);
    }
    
    this.emitEvent('user.joined', { userId: user.id, sessionId: user.id });
  }
  
  /**
   * Traiter la déconnexion d'un utilisateur
   */
  private handleUserLeft(data: Record<string, unknown>): void {
    const { userId, sessionId } = data as { userId: UserId; sessionId: CollaborationId };
    
    this.users.delete(userId);
    
    const session = this.sessions.get(sessionId);
    if (session) {
      session.users = session.users.filter(u => u.id !== userId);
      this.sessions.set(sessionId, session);
    }
    
    // Supprimer les curseurs et sélections de l'utilisateur
    this.cursors.forEach((cursor, id) => {
      if (cursor.userId === userId) {
        this.cursors.delete(id);
      }
    });
    
    this.selections.forEach((selection, id) => {
      if (selection.userId === userId) {
        this.selections.delete(id);
      }
    });
    
    this.emitEvent('user.left', { userId, sessionId });
  }
  
  /**
   * Traiter le changement de statut d'un utilisateur
   */
  private handleUserStatusChanged(data: Record<string, unknown>): void {
    const { userId, status } = data as { userId: UserId; status: CollaborationStatus };
    const user = this.users.get(userId);
    if (user) {
      user.status = status;
      this.users.set(userId, user);
    }
    
    this.emitEvent('user.status.changed', { userId, status });
  }
  
  /**
   * Traiter le changement de présence
   */
  private handlePresenceChanged(data: Record<string, unknown>): void {
    const { userId, presence } = data as { userId: UserId; presence: PresenceType };
    const user = this.users.get(userId);
    if (user) {
      user.presence = presence;
      user.lastActivityAt = Date.now();
      this.users.set(userId, user);
    }
    
    this.emitEvent('presence.changed', { userId, presence });
  }
  
  /**
   * Traiter le déplacement d'un curseur
   */
  private handleCursorMoved(data: Record<string, unknown>): void {
    const cursor = data as CollaborationCursor;
    const existingCursor = this.cursors.get(cursor.id);
    if (existingCursor) {
      existingCursor.x = cursor.x;
      existingCursor.y = cursor.y;
      existingCursor.element = cursor.element;
      existingCursor.timestamp = cursor.timestamp;
      this.cursors.set(cursor.id, existingCursor);
    }
    
    this.emitEvent('cursor.moved', { cursorId: cursor.id, userId: cursor.userId, position: { x: cursor.x, y: cursor.y } });
  }
  
  /**
   * Traiter l'ajout d'un curseur
   */
  private handleCursorAdded(data: Record<string, unknown>): void {
    const cursor = data as CollaborationCursor;
    this.cursors.set(cursor.id, cursor);
    this.emitEvent('cursor.added', { cursorId: cursor.id, userId: cursor.userId });
  }
  
  /**
   * Traiter la suppression d'un curseur
   */
  private handleCursorRemoved(data: Record<string, unknown>): void {
    const { cursorId } = data as { cursorId: CursorId };
    this.cursors.delete(cursorId);
    this.emitEvent('cursor.removed', { cursorId });
  }
  
  /**
   * Traiter le changement d'une sélection
   */
  private handleSelectionChanged(data: Record<string, unknown>): void {
    const selection = data as CollaborationSelection;
    const existingSelection = this.selections.get(selection.id);
    if (existingSelection) {
      existingSelection.content = selection.content;
      existingSelection.startPosition = selection.startPosition;
      existingSelection.endPosition = selection.endPosition;
      existingSelection.text = selection.text;
      existingSelection.timestamp = selection.timestamp;
      this.selections.set(selection.id, existingSelection);
    }
    
    this.emitEvent('selection.changed', { selectionId: selection.id, userId: selection.userId });
  }
  
  /**
   * Traiter l'ajout d'une sélection
   */
  private handleSelectionAdded(data: Record<string, unknown>): void {
    const selection = data as CollaborationSelection;
    this.selections.set(selection.id, selection);
    this.emitEvent('selection.added', { selectionId: selection.id, userId: selection.userId });
  }
  
  /**
   * Traiter la suppression d'une sélection
   */
  private handleSelectionRemoved(data: Record<string, unknown>): void {
    const { selectionId } = data as { selectionId: SelectionId };
    this.selections.delete(selectionId);
    this.emitEvent('selection.removed', { selectionId });
  }
  
  /**
   * Traiter l'envoi d'un message
   */
  private handleMessageSent(data: Record<string, unknown>): void {
    const message = data as CollaborationMessage;
    this.messages.set(message.id, message);
    this.emitEvent('message.sent', { messageId: message.id, userId: message.userId });
  }
  
  /**
   * Traiter la réception d'un message
   */
  private handleMessageReceived(data: Record<string, unknown>): void {
    const message = data as CollaborationMessage;
    this.messages.set(message.id, message);
    this.emitEvent('message.received', { messageId: message.id, userId: message.userId });
  }
  
  /**
   * Traiter l'application d'un changement
   */
  private handleChangeApplied(data: Record<string, unknown>): void {
    const change = data as CollaborationChange;
    this.changes.set(change.id, change);
    this.emitEvent('change.applied', { changeId: change.id, userId: change.userId });
  }
  
  /**
   * Traiter le changement d'un document
   */
  private handleDocumentChanged(data: Record<string, unknown>): void {
    const { documentId, content, version, userId } = data as { documentId: string; content: string; version: number; userId: UserId };
    const document = this.documents.get(documentId);
    if (document) {
      document.content = content;
      document.version = version;
      document.lastModifiedAt = Date.now();
      document.lastModifiedBy = userId;
      this.documents.set(documentId, document);
    }
    
    this.emitEvent('document.changed', { documentId, userId });
  }
  
  /**
   * Traiter la détection d'un conflit
   */
  private handleConflictDetected(data: Record<string, unknown>): void {
    const conflict = data as CollaborationConflict;
    this.conflicts.set(conflict.id, conflict);
    this.emitEvent('conflict.detected', { conflictId: conflict.id, userId: conflict.userId });
  }
  
  /**
   * Traiter la résolution d'un conflit
   */
  private handleConflictResolved(data: Record<string, unknown>): void {
    const { conflictId, resolution } = data as { conflictId: string; resolution: ConflictResolution };
    const conflict = this.conflicts.get(conflictId);
    if (conflict) {
      conflict.resolved = true;
      conflict.resolution = resolution.content;
      conflict.resolvedBy = resolution.userId;
      conflict.resolvedAt = Date.now();
      this.conflicts.set(conflictId, conflict);
    }
    
    this.emitEvent('conflict.resolved', { conflictId, resolution });
  }
  
  /**
   * Traiter le démarrage de la synchronisation
   */
  private handleSyncStarted(data: Record<string, unknown>): void {
    this.emitEvent('sync.started', data);
  }
  
  /**
   * Traiter la fin de la synchronisation
   */
  private handleSyncCompleted(data: Record<string, unknown>): void {
    this.emitEvent('sync.completed', data);
  }
  
  // ============ SESSION MANAGEMENT ============
  
  /**
   * Créer une session
   */
  public createSession(name: string, config?: Partial<SessionConfig>): CollaborationId {
    const id = `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CollaborationSession = {
      id,
      name,
      type: config?.type || this.settings.defaultType,
      hostId: this.getCurrentUserId() || '',
      users: [],
      status: 'waiting',
      createdAt: Date.now(),
      metadata: config?.settings,
    };
    
    this.sessions.set(id, session);
    this.sendMessage('session:create', { session });
    this.emitEvent('session.created', { sessionId: id });
    
    return id;
  }
  
  /**
   * Rejoindre une session
   */
  public joinSession(sessionId: CollaborationId, user?: CollaborationUser): CollaborationId {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    const userId = user?.id || this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const newUser: CollaborationUser = user || {
      id: userId,
      name: `User ${userId.slice(0, 8)}`,
      role: this.settings.defaultRole,
      presence: this.settings.defaultPresence,
      lastActivityAt: Date.now(),
      connectedAt: Date.now(),
      status: 'connected',
    };
    
    this.users.set(userId, newUser);
    session.users.push(newUser);
    session.status = 'connected';
    session.connectedAt = Date.now();
    
    this.sessions.set(sessionId, session);
    this.sendMessage('session:join', { sessionId, user: newUser });
    this.emitEvent('session.joined', { sessionId, userId });
    
    return sessionId;
  }
  
  /**
   * Quitter une session
   */
  public leaveSession(sessionId: CollaborationId, userId?: UserId): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    const id = userId || this.getCurrentUserId();
    if (!id) {
      return false;
    }
    
    session.users = session.users.filter(u => u.id !== id);
    session.status = session.users.length === 0 ? 'waiting' : 'active';
    session.disconnectedAt = Date.now();
    
    this.sessions.set(sessionId, session);
    this.users.delete(id);
    this.sendMessage('session:leave', { sessionId, userId: id });
    this.emitEvent('session.left', { sessionId, userId: id });
    
    return true;
  }
  
  /**
   * Quitter toutes les sessions
   */
  public leaveAllSessions(): void {
    for (const sessionId of this.sessions.keys()) {
      this.leaveSession(sessionId);
    }
  }
  
  /**
   * Fermer une session
   */
  public closeSession(sessionId: CollaborationId): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    session.status = 'closed';
    session.closedAt = Date.now();
    session.duration = session.closedAt - (session.createdAt || Date.now());
    
    this.sessions.set(sessionId, session);
    this.sendMessage('session:close', { sessionId });
    this.emitEvent('session.closed', { sessionId });
    
    return true;
  }
  
  /**
   * Obtenir une session par ID
   */
  public getSession(id: CollaborationId): CollaborationSession | null {
    return this.sessions.get(id) || null;
  }
  
  /**
   * Obtenir toutes les sessions
   */
  public getAllSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values());
  }
  
  /**
   * Obtenir les sessions actives
   */
  public getActiveSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active' || s.status === 'connected');
  }
  
  // ============ USER MANAGEMENT ============
  
  /**
   * Ajouter un utilisateur
   */
  public addUser(user: CollaborationUser): UserId {
    const id = user.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.users.has(id)) {
      throw new Error(`User with ID ${id} already exists`);
    }
    
    const newUser: CollaborationUser = {
      ...user,
      id,
      status: 'connected',
      lastActivityAt: Date.now(),
      connectedAt: Date.now(),
    };
    
    this.users.set(id, newUser);
    this.emitEvent('user.joined', { userId: id });
    
    return id;
  }
  
  /**
   * Obtenir un utilisateur par ID
   */
  public getUser(id: UserId): CollaborationUser | null {
    return this.users.get(id) || null;
  }
  
  /**
   * Obtenir tous les utilisateurs
   */
  public getAllUsers(): CollaborationUser[] {
    return Array.from(this.users.values());
  }
  
  /**
   * Obtenir les utilisateurs d'une session
   */
  public getUsersInSession(sessionId: CollaborationId): CollaborationUser[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }
    return session.users;
  }
  
  /**
   * Supprimer un utilisateur
   */
  public removeUser(id: UserId): boolean {
    if (!this.users.has(id)) {
      return false;
    }
    
    this.users.delete(id);
    this.emitEvent('user.left', { userId: id });
    
    return true;
  }
  
  /**
   * Mettre à jour un utilisateur
   */
  public updateUser(id: UserId, updates: Partial<CollaborationUser>): boolean {
    const user = this.users.get(id);
    if (!user) {
      return false;
    }
    
    const updatedUser: CollaborationUser = {
      ...user,
      ...updates,
    };
    
    this.users.set(id, updatedUser);
    this.emitEvent('user.updated', { userId: id });
    
    return true;
  }
  
  /**
   * Changer le rôle d'un utilisateur
   */
  public changeUserRole(userId: UserId, role: CollaborationRole): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }
    
    user.role = role;
    this.users.set(userId, user);
    this.sendMessage('user:role:change', { userId, role });
    this.emitEvent('user.role.changed', { userId, role });
    
    return true;
  }
  
  /**
   * Changer la présence d'un utilisateur
   */
  public changePresence(userId: UserId, presence: PresenceType, message?: string): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }
    
    user.presence = presence;
    user.lastActivityAt = Date.now();
    this.users.set(userId, user);
    this.sendMessage('presence:change', { userId, presence, message });
    this.emitEvent('presence.changed', { userId, presence, message });
    
    return true;
  }
  
  /**
   * Obtenir l'ID de l'utilisateur actuel
   */
  private getCurrentUserId(): UserId | null {
    // Placeholder - à implémenter avec le système d'authentification
    return null;
  }
  
  // ============ CURSOR MANAGEMENT ============
  
  /**
   * Ajouter un curseur
   */
  public addCursor(cursor: CollaborationCursor): CursorId {
    const id = cursor.id || `cursor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newCursor: CollaborationCursor = {
      ...cursor,
      id,
      timestamp: Date.now(),
      visible: true,
    };
    
    this.cursors.set(id, newCursor);
    this.sendMessage('cursor:add', { cursor: newCursor });
    this.emitEvent('cursor.added', { cursorId: id, userId: newCursor.userId });
    
    return id;
  }
  
  /**
   * Obtenir un curseur par ID
   */
  public getCursor(id: CursorId): CollaborationCursor | null {
    return this.cursors.get(id) || null;
  }
  
  /**
   * Obtenir tous les curseurs
   */
  public getAllCursors(): CollaborationCursor[] {
    return Array.from(this.cursors.values());
  }
  
  /**
   * Obtenir les curseurs d'une session
   */
  public getCursorsInSession(sessionId: CollaborationId): CollaborationCursor[] {
    return Array.from(this.cursors.values()).filter(c => {
      const user = this.users.get(c.userId);
      return user && this.getUsersInSession(sessionId).some(u => u.id === user.id);
    });
  }
  
  /**
   * Supprimer un curseur
   */
  public removeCursor(id: CursorId): boolean {
    if (!this.cursors.has(id)) {
      return false;
    }
    
    const cursor = this.cursors.get(id)!;
    this.cursors.delete(id);
    this.sendMessage('cursor:remove', { cursorId: id });
    this.emitEvent('cursor.removed', { cursorId: id, userId: cursor.userId });
    
    return true;
  }
  
  /**
   * Mettre à jour un curseur
   */
  public updateCursor(id: CursorId, position: CursorPosition): boolean {
    const cursor = this.cursors.get(id);
    if (!cursor) {
      return false;
    }
    
    cursor.x = position.x;
    cursor.y = position.y;
    cursor.element = position.element;
    cursor.timestamp = position.timestamp;
    
    this.cursors.set(id, cursor);
    this.sendMessage('cursor:move', { cursor });
    this.emitEvent('cursor.moved', { cursorId: id, userId: cursor.userId, position });
    
    return true;
  }
  
  // ============ SELECTION MANAGEMENT ============
  
  /**
   * Ajouter une sélection
   */
  public addSelection(selection: CollaborationSelection): SelectionId {
    const id = selection.id || `selection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newSelection: CollaborationSelection = {
      ...selection,
      id,
      timestamp: Date.now(),
      visible: true,
    };
    
    this.selections.set(id, newSelection);
    this.sendMessage('selection:add', { selection: newSelection });
    this.emitEvent('selection.added', { selectionId: id, userId: newSelection.userId });
    
    return id;
  }
  
  /**
   * Obtenir une sélection par ID
   */
  public getSelection(id: SelectionId): CollaborationSelection | null {
    return this.selections.get(id) || null;
  }
  
  /**
   * Obtenir toutes les sélections
   */
  public getAllSelections(): CollaborationSelection[] {
    return Array.from(this.selections.values());
  }
  
  /**
   * Obtenir les sélections d'une session
   */
  public getSelectionsInSession(sessionId: CollaborationId): CollaborationSelection[] {
    return Array.from(this.selections.values()).filter(s => {
      const user = this.users.get(s.userId);
      return user && this.getUsersInSession(sessionId).some(u => u.id === user.id);
    });
  }
  
  /**
   * Supprimer une sélection
   */
  public removeSelection(id: SelectionId): boolean {
    if (!this.selections.has(id)) {
      return false;
    }
    
    const selection = this.selections.get(id)!;
    this.selections.delete(id);
    this.sendMessage('selection:remove', { selectionId: id });
    this.emitEvent('selection.removed', { selectionId: id, userId: selection.userId });
    
    return true;
  }
  
  /**
   * Mettre à jour une sélection
   */
  public updateSelection(id: SelectionId, updates: Partial<CollaborationSelection>): boolean {
    const selection = this.selections.get(id);
    if (!selection) {
      return false;
    }
    
    const updatedSelection: CollaborationSelection = {
      ...selection,
      ...updates,
      timestamp: Date.now(),
    };
    
    this.selections.set(id, updatedSelection);
    this.sendMessage('selection:change', { selection: updatedSelection });
    this.emitEvent('selection.changed', { selectionId: id, userId: selection.userId });
    
    return true;
  }
  
  // ============ MESSAGE MANAGEMENT ============
  
  /**
   * Envoyer un message
   */
  public sendMessageToSession(sessionId: CollaborationId, content: string, type: CollaborationMessage['type'] = 'text'): MessageId {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const message: CollaborationMessage = {
      id,
      userId,
      content,
      type,
      status: 'sent',
      timestamp: Date.now(),
      replies: [],
      reactions: {},
    };
    
    this.messages.set(id, message);
    this.sendMessage('message:send', { sessionId, message });
    this.emitEvent('message.sent', { messageId: id, userId, sessionId });
    
    return id;
  }
  
  /**
   * Obtenir un message par ID
   */
  public getMessage(id: MessageId): CollaborationMessage | null {
    return this.messages.get(id) || null;
  }
  
  /**
   * Obtenir tous les messages
   */
  public getAllMessages(): CollaborationMessage[] {
    return Array.from(this.messages.values());
  }
  
  /**
   * Obtenir les messages d'une session
   */
  public getMessagesInSession(sessionId: CollaborationId): CollaborationMessage[] {
    return Array.from(this.messages.values()).filter(m => {
      const user = this.users.get(m.userId);
      return user && this.getUsersInSession(sessionId).some(u => u.id === user.id);
    });
  }
  
  /**
   * Supprimer un message
   */
  public removeMessage(id: MessageId): boolean {
    if (!this.messages.has(id)) {
      return false;
    }
    
    this.messages.delete(id);
    this.emitEvent('message.removed', { messageId: id });
    
    return true;
  }
  
  /**
   * Répondre à un message
   */
  public replyToMessage(messageId: MessageId, content: string): MessageId {
    const message = this.messages.get(messageId);
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }
    
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const reply: CollaborationMessage = {
      id,
      userId,
      content,
      type: 'text',
      status: 'sent',
      timestamp: Date.now(),
      replies: [],
      reactions: {},
    };
    
    message.replies.push(reply);
    this.messages.set(messageId, message);
    this.sendMessage('message:reply', { messageId, reply });
    this.emitEvent('message.replied', { messageId, replyId: id, userId });
    
    return id;
  }
  
  /**
   * Ajouter une réaction à un message
   */
  public addReactionToMessage(messageId: MessageId, emoji: string): boolean {
    const message = this.messages.get(messageId);
    if (!message) {
      return false;
    }
    
    const userId = this.getCurrentUserId();
    if (!userId) {
      return false;
    }
    
    if (!message.reactions[emoji]) {
      message.reactions[emoji] = [];
    }
    
    if (!message.reactions[emoji].includes(userId)) {
      message.reactions[emoji].push(userId);
      this.messages.set(messageId, message);
      this.sendMessage('message:react', { messageId, emoji, userId });
      this.emitEvent('message.reacted', { messageId, emoji, userId });
    }
    
    return true;
  }
  
  // ============ CHANGE MANAGEMENT ============
  
  /**
   * Appliquer un changement
   */
  public applyChange(change: CollaborationChange): string {
    const id = change.id || `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newChange: CollaborationChange = {
      ...change,
      id,
      userId: change.userId || this.getCurrentUserId() || '',
      timestamp: Date.now(),
      version: this.getNextVersion(),
    };
    
    this.changes.set(id, newChange);
    this.sendMessage('change:apply', { change: newChange });
    this.emitEvent('change.applied', { changeId: id, userId: newChange.userId });
    
    return id;
  }
  
  /**
   * Obtenir un changement par ID
   */
  public getChange(id: string): CollaborationChange | null {
    return this.changes.get(id) || null;
  }
  
  /**
   * Obtenir tous les changements
   */
  public getAllChanges(): CollaborationChange[] {
    return Array.from(this.changes.values());
  }
  
  /**
   * Obtenir les changements d'une session
   */
  public getChangesInSession(sessionId: CollaborationId): CollaborationChange[] {
    return Array.from(this.changes.values()).filter(c => {
      const user = this.users.get(c.userId);
      return user && this.getUsersInSession(sessionId).some(u => u.id === user.id);
    });
  }
  
  /**
   * Supprimer un changement
   */
  public removeChange(id: string): boolean {
    if (!this.changes.has(id)) {
      return false;
    }
    
    this.changes.delete(id);
    this.emitEvent('change.removed', { changeId: id });
    
    return true;
  }
  
  /**
   * Obtenir la prochaine version
   */
  private getNextVersion(): number {
    return Date.now();
  }
  
  // ============ DOCUMENT MANAGEMENT ============
  
  /**
   * Créer un document partagé
   */
  public createSharedDocument(name: string, content: string = '', type: SharedDocument['type'] = 'text'): string {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const document: SharedDocument = {
      id,
      name,
      content,
      type,
      version: 1,
      lastModifiedAt: Date.now(),
      lastModifiedBy: this.getCurrentUserId() || '',
      history: [],
      locked: false,
      status: 'active',
    };
    
    this.documents.set(id, document);
    this.emitEvent('document.created', { documentId: id });
    
    return id;
  }
  
  /**
   * Obtenir un document par ID
   */
  public getDocument(id: string): SharedDocument | null {
    return this.documents.get(id) || null;
  }
  
  /**
   * Obtenir tous les documents
   */
  public getAllDocuments(): SharedDocument[] {
    return Array.from(this.documents.values());
  }
  
  /**
   * Mettre à jour un document
   */
  public updateDocument(id: string, updates: Partial<SharedDocument>): boolean {
    const document = this.documents.get(id);
    if (!document) {
      return false;
    }
    
    const updatedDocument: SharedDocument = {
      ...document,
      ...updates,
      lastModifiedAt: Date.now(),
      lastModifiedBy: this.getCurrentUserId() || '',
    };
    
    // Ajouter à l'historique
    if (updates.content !== undefined) {
      updatedDocument.history.push({
        id: `history-${Date.now()}`,
        version: updatedDocument.version,
        content: document.content,
        timestamp: Date.now(),
        userId: document.lastModifiedBy,
      });
      updatedDocument.version++;
    }
    
    this.documents.set(id, updatedDocument);
    this.sendMessage('document:change', { documentId: id, document: updatedDocument });
    this.emitEvent('document.changed', { documentId: id, userId: updatedDocument.lastModifiedBy });
    
    return true;
  }
  
  /**
   * Supprimer un document
   */
  public removeDocument(id: string): boolean {
    if (!this.documents.has(id)) {
      return false;
    }
    
    this.documents.delete(id);
    this.emitEvent('document.removed', { documentId: id });
    
    return true;
  }
  
  /**
   * Verrouiller un document
   */
  public lockDocument(id: string, userId?: UserId): boolean {
    const document = this.documents.get(id);
    if (!document) {
      return false;
    }
    
    const uid = userId || this.getCurrentUserId();
    if (!uid) {
      return false;
    }
    
    document.locked = true;
    document.lockedBy = uid;
    
    this.documents.set(id, document);
    this.sendMessage('document:lock', { documentId: id, userId: uid });
    this.emitEvent('document.locked', { documentId: id, userId: uid });
    
    return true;
  }
  
  /**
   * Déverrouiller un document
   */
  public unlockDocument(id: string): boolean {
    const document = this.documents.get(id);
    if (!document) {
      return false;
    }
    
    document.locked = false;
    document.lockedBy = undefined;
    
    this.documents.set(id, document);
    this.sendMessage('document:unlock', { documentId: id });
    this.emitEvent('document.unlocked', { documentId: id });
    
    return true;
  }
  
  // ============ CONFLICT MANAGEMENT ============
  
  /**
   * Détecter un conflit
   */
  public detectConflict(
    localChange: CollaborationChange,
    remoteChange: CollaborationChange
  ): CollaborationConflict {
    const id = `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const conflict: CollaborationConflict = {
      id,
      userId: localChange.userId,
      type: 'merge',
      localContent: localChange.content || '',
      remoteContent: remoteChange.content || '',
      position: localChange.position,
      length: localChange.length,
      resolved: false,
      timestamp: Date.now(),
    };
    
    this.conflicts.set(id, conflict);
    this.sendMessage('conflict:detect', { conflict });
    this.emitEvent('conflict.detected', { conflictId: id, userId: conflict.userId });
    
    return conflict;
  }
  
  /**
   * Obtenir un conflit par ID
   */
  public getConflict(id: string): CollaborationConflict | null {
    return this.conflicts.get(id) || null;
  }
  
  /**
   * Obtenir tous les conflits
   */
  public getAllConflicts(): CollaborationConflict[] {
    return Array.from(this.conflicts.values());
  }
  
  /**
   * Obtenir les conflits d'une session
   */
  public getConflictsInSession(sessionId: CollaborationId): CollaborationConflict[] {
    return Array.from(this.conflicts.values()).filter(c => {
      const user = this.users.get(c.userId);
      return user && this.getUsersInSession(sessionId).some(u => u.id === user.id);
    });
  }
  
  /**
   * Résoudre un conflit
   */
  public resolveConflict(conflictId: string, resolution: ConflictResolution): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      return false;
    }
    
    conflict.resolved = true;
    conflict.resolution = resolution.content;
    conflict.resolvedBy = resolution.userId;
    conflict.resolvedAt = Date.now();
    
    this.conflicts.set(conflictId, conflict);
    this.sendMessage('conflict:resolve', { conflictId, resolution });
    this.emitEvent('conflict.resolved', { conflictId, resolution });
    
    return true;
  }
  
  // ============ SETTINGS ============
  
  /**
   * Obtenir les paramètres
   */
  public getSettings(): typeof this.settings {
    return { ...this.settings };
  }
  
  /**
   * Mettre à jour les paramètres
   */
  public updateSettings(updates: Partial<typeof this.settings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
    };
  }
  
  // ============ EVENT LISTENERS ============
  
  /**
   * Écouter un événement
   */
  public onEvent(type: CollaborationEventType, callback: (event: CollaborationEvent) => void): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);
    return () => this.eventListeners.get(type)?.delete(callback);
  }
  
  /**
   * Émettre un événement
   */
  private emitEvent(type: CollaborationEventType, data?: Record<string, unknown>): void {
    const event: CollaborationEvent = {
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
          console.error('Error in collaboration event callback:', error);
        }
      });
    }
    
    // Émettre à tous les listeners
    const allListeners = this.eventListeners.get('*' as CollaborationEventType);
    if (allListeners) {
      allListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in collaboration event callback:', error);
        }
      });
    }
  }
  
  // ============ CLEANUP ============
  
  /**
   * Nettoyer
   */
  public cleanup(): void {
    this.sessions.clear();
    this.users.clear();
    this.cursors.clear();
    this.selections.clear();
    this.messages.clear();
    this.changes.clear();
    this.documents.clear();
    this.conflicts.clear();
    this.eventListeners.clear();
    
    this.disconnect();
    this.reconnectAttempts = 0;
    this.settings = { ...DEFAULT_COLLABORATION_SETTINGS };
  }
}

// ============ INSTANCE ============

/**
 * Instance singleton du gestionnaire de collaboration
 */
export const collaborationManager = new CollaborationManager();

// ============ EXPORT ============

export {
  CollaborationManager,
  collaborationManager,
};
