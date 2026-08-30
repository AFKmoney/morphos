"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  User,
  UserId,
  UserRole,
  UserSettings,
  UserPresence,
  UserSession,
  SharedWorkspace,
  SharedWorkspaceId,
  WorkspaceMember,
  WorkspacePermission,
  UserNotification,
  ConnectionStatus,
  AnyRealtimeMessage,
} from "./user-types";

/**
 * User Store
 * 
 * Store principal pour la gestion des utilisateurs et de la collaboration.
 */

interface UserStoreState {
  // Utilisateur actuel
  currentUser: User | null;
  currentSession: UserSession | null;
  
  // Tous les utilisateurs (pour la collaboration)
  users: Map<UserId, User>;
  
  // Présence des utilisateurs
  presences: Map<UserId, UserPresence>;
  
  // Workspaces partagés
  sharedWorkspaces: Map<SharedWorkspaceId, SharedWorkspace>;
  
  // Workspace actif
  activeSharedWorkspaceId: SharedWorkspaceId | null;
  
  // Notifications
  notifications: UserNotification[];
  unreadCount: number;
  
  // Connexion realtime
  connectionStatus: ConnectionStatus;
  connectionInfo: {
    lastConnectedAt?: number;
    lastDisconnectedAt?: number;
    reconnectAttempts: number;
    error?: string;
    ping?: number;
  };
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setCurrentSession: (session: UserSession | null) => void;
  updateUser: (userId: UserId, updates: Partial<User>) => void;
  updateUserSettings: (userId: UserId, settings: Partial<UserSettings>) => void;
  
  // Présence
  updatePresence: (userId: UserId, presence: Partial<UserPresence>) => void;
  setPresence: (userId: UserId, presence: UserPresence) => void;
  removePresence: (userId: UserId) => void;
  getOnlineUsers: () => User[];
  
  // Workspaces
  createSharedWorkspace: (workspace: Partial<SharedWorkspace>) => SharedWorkspaceId;
  updateSharedWorkspace: (id: SharedWorkspaceId, updates: Partial<SharedWorkspace>) => boolean;
  deleteSharedWorkspace: (id: SharedWorkspaceId) => boolean;
  joinSharedWorkspace: (workspaceId: SharedWorkspaceId, userId: UserId, role?: UserRole) => boolean;
  leaveSharedWorkspace: (workspaceId: SharedWorkspaceId, userId: UserId) => boolean;
  setActiveSharedWorkspace: (id: SharedWorkspaceId | null) => void;
  getSharedWorkspace: (id: SharedWorkspaceId) => SharedWorkspace | undefined;
  getAllSharedWorkspaces: () => SharedWorkspace[];
  getWorkspaceMembers: (workspaceId: SharedWorkspaceId) => WorkspaceMember[];
  getUserWorkspaces: (userId: UserId) => SharedWorkspace[];
  
  // Notifications
  addNotification: (notification: Omit<UserNotification, 'id' | 'createdAt' | 'read'>) => string;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (id: string) => void;
  getUnreadNotifications: () => UserNotification[];
  
  // Connexion
  setConnectionStatus: (status: ConnectionStatus) => void;
  updateConnectionInfo: (info: Partial<UserStoreState['connectionInfo']>) => void;
  
  // Realtime
  handleRealtimeMessage: (message: AnyRealtimeMessage) => void;
  broadcastMessage: (message: AnyRealtimeMessage) => void;
  
  // Auth
  login: (credentials: { email: string; password: string }) => Promise<User | null>;
  logout: () => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<User | null>;
  
  // Utilitaires
  reset: () => void;
}

const STORAGE_KEY = "morphos-users";

// Utilisateur par défaut (pour le mode single-user)
const DEFAULT_USER: User = {
  id: "user-local-default",
  name: "Local User",
  role: "admin",
  createdAt: Date.now(),
  lastActiveAt: Date.now(),
  color: "#22d3ee",
};

// Session par défaut
const DEFAULT_SESSION: UserSession = {
  userId: DEFAULT_USER.id,
  token: "local-token",
  expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 an
  createdAt: Date.now(),
};

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      // État initial
      currentUser: null,
      currentSession: null,
      users: new Map(),
      presences: new Map(),
      sharedWorkspaces: new Map(),
      activeSharedWorkspaceId: null,
      notifications: [],
      unreadCount: 0,
      connectionStatus: 'disconnected',
      connectionInfo: {
        reconnectAttempts: 0,
      },
      
      // ============ USER ACTIONS ============
      
      setCurrentUser: (user: User | null) => {
        set({ currentUser: user });
      },
      
      setCurrentSession: (session: UserSession | null) => {
        set({ currentSession: session });
      },
      
      updateUser: (userId: UserId, updates: Partial<User>) => {
        const users = new Map(get().users);
        const user = users.get(userId);
        
        if (user) {
          users.set(userId, { ...user, ...updates, updatedAt: Date.now() });
          set({ users });
        }
        
        // Si c'est l'utilisateur actuel, le mettre à jour aussi
        if (userId === get().currentUser?.id) {
          set({ currentUser: { ...user, ...updates, updatedAt: Date.now() } });
        }
      },
      
      updateUserSettings: (userId: UserId, settings: Partial<UserSettings>) => {
        get().updateUser(userId, { settings: { ...get().users.get(userId)?.settings, ...settings } });
      },
      
      // ============ PRESENCE ACTIONS ============
      
      updatePresence: (userId: UserId, presence: Partial<UserPresence>) => {
        const presences = new Map(get().presences);
        const currentPresence = presences.get(userId) || {
          userId,
          status: 'offline',
        };
        
        presences.set(userId, { ...currentPresence, ...presence, lastSeenAt: Date.now() });
        set({ presences });
      },
      
      setPresence: (userId: UserId, presence: UserPresence) => {
        const presences = new Map(get().presences);
        presences.set(userId, presence);
        set({ presences });
      },
      
      removePresence: (userId: UserId) => {
        const presences = new Map(get().presences);
        presences.delete(userId);
        set({ presences });
      },
      
      getOnlineUsers: () => {
        const users = get().users;
        const presences = get().presences;
        
        return Array.from(users.values()).filter(user => {
          const presence = presences.get(user.id);
          return presence && presence.status === 'online';
        });
      },
      
      // ============ WORKSPACE ACTIONS ============
      
      createSharedWorkspace: (workspace: Partial<SharedWorkspace>) => {
        const id: SharedWorkspaceId = `sw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        
        const currentUser = get().currentUser;
        if (!currentUser) {
          throw new Error('No current user');
        }
        
        const sharedWorkspace: SharedWorkspace = {
          id,
          name: workspace.name || `Workspace ${id.slice(0, 8)}`,
          description: workspace.description || '',
          ownerId: currentUser.id,
          shareType: workspace.shareType || 'private',
          members: [
            {
              userId: currentUser.id,
              role: 'admin',
              permissions: ['read', 'write', 'admin', 'delete'],
              joinedAt: now,
              lastActiveAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
          windows: workspace.windows || [],
          settings: workspace.settings || {},
        };
        
        const sharedWorkspaces = new Map(get().sharedWorkspaces);
        sharedWorkspaces.set(id, sharedWorkspace);
        set({ sharedWorkspaces, activeSharedWorkspaceId: id });
        
        return id;
      },
      
      updateSharedWorkspace: (id: SharedWorkspaceId, updates: Partial<SharedWorkspace>) => {
        const sharedWorkspaces = new Map(get().sharedWorkspaces);
        const workspace = sharedWorkspaces.get(id);
        
        if (!workspace) {
          return false;
        }
        
        sharedWorkspaces.set(id, { ...workspace, ...updates, updatedAt: Date.now() });
        set({ sharedWorkspaces });
        
        return true;
      },
      
      deleteSharedWorkspace: (id: SharedWorkspaceId) => {
        const sharedWorkspaces = new Map(get().sharedWorkspaces);
        
        if (!sharedWorkspaces.has(id)) {
          return false;
        }
        
        sharedWorkspaces.delete(id);
        set({ sharedWorkspaces });
        
        if (get().activeSharedWorkspaceId === id) {
          set({ activeSharedWorkspaceId: null });
        }
        
        return true;
      },
      
      joinSharedWorkspace: (workspaceId: SharedWorkspaceId, userId: UserId, role: UserRole = 'viewer') => {
        const sharedWorkspaces = new Map(get().sharedWorkspaces);
        const workspace = sharedWorkspaces.get(workspaceId);
        
        if (!workspace) {
          return false;
        }
        
        // Vérifier que l'utilisateur n'est pas déjà membre
        if (workspace.members.some(m => m.userId === userId)) {
          return true;
        }
        
        // Déterminer les permissions par défaut selon le rôle
        const defaultPermissions: WorkspacePermission[] = {
          admin: ['read', 'write', 'admin', 'delete'],
          editor: ['read', 'write'],
          viewer: ['read'],
          guest: [],
        }[role] || [];
        
        workspace.members.push({
          userId,
          role,
          permissions: defaultPermissions,
          joinedAt: Date.now(),
          lastActiveAt: Date.now(),
        });
        
        sharedWorkspaces.set(workspaceId, workspace);
        set({ sharedWorkspaces });
        
        return true;
      },
      
      leaveSharedWorkspace: (workspaceId: SharedWorkspaceId, userId: UserId) => {
        const sharedWorkspaces = new Map(get().sharedWorkspaces);
        const workspace = sharedWorkspaces.get(workspaceId);
        
        if (!workspace) {
          return false;
        }
        
        // Ne pas permettre au propriétaire de quitter
        if (workspace.ownerId === userId) {
          return false;
        }
        
        workspace.members = workspace.members.filter(m => m.userId !== userId);
        sharedWorkspaces.set(workspaceId, workspace);
        set({ sharedWorkspaces });
        
        return true;
      },
      
      setActiveSharedWorkspace: (id: SharedWorkspaceId | null) => {
        set({ activeSharedWorkspaceId: id });
      },
      
      getSharedWorkspace: (id: SharedWorkspaceId) => {
        return get().sharedWorkspaces.get(id);
      },
      
      getAllSharedWorkspaces: () => {
        return Array.from(get().sharedWorkspaces.values());
      },
      
      getWorkspaceMembers: (workspaceId: SharedWorkspaceId) => {
        const workspace = get().getSharedWorkspace(workspaceId);
        return workspace?.members || [];
      },
      
      getUserWorkspaces: (userId: UserId) => {
        return Array.from(get().sharedWorkspaces.values()).filter(ws =>
          ws.ownerId === userId || ws.members.some(m => m.userId === userId)
        );
      },
      
      // ============ NOTIFICATION ACTIONS ============
      
      addNotification: (notification: Omit<UserNotification, 'id' | 'createdAt' | 'read'>) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: UserNotification = {
          ...notification,
          id,
          createdAt: Date.now(),
          read: false,
        };
        
        const notifications = [...get().notifications];
        notifications.unshift(newNotification);
        
        // Limiter à 100 notifications
        if (notifications.length > 100) {
          notifications.pop();
        }
        
        set({
          notifications,
          unreadCount: get().unreadCount + 1,
        });
        
        return id;
      },
      
      markNotificationAsRead: (id: string) => {
        const notifications = get().notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        set({ notifications });
        
        // Recalculer le compteur
        const unreadCount = notifications.filter(n => !n.read).length;
        set({ unreadCount });
      },
      
      markAllNotificationsAsRead: () => {
        const notifications = get().notifications.map(n => ({ ...n, read: true }));
        set({ notifications, unreadCount: 0 });
      },
      
      removeNotification: (id: string) => {
        const notifications = get().notifications.filter(n => n.id !== id);
        set({ notifications });
        
        // Recalculer le compteur
        const unreadCount = notifications.filter(n => !n.read).length;
        set({ unreadCount });
      },
      
      getUnreadNotifications: () => {
        return get().notifications.filter(n => !n.read);
      },
      
      // ============ CONNECTION ACTIONS ============
      
      setConnectionStatus: (status: ConnectionStatus) => {
        set({ connectionStatus: status });
        
        if (status === 'connected') {
          get().updateConnectionInfo({ lastConnectedAt: Date.now(), reconnectAttempts: 0 });
        } else if (status === 'disconnected') {
          get().updateConnectionInfo({ lastDisconnectedAt: Date.now() });
        }
      },
      
      updateConnectionInfo: (info: Partial<UserStoreState['connectionInfo']>) => {
        const currentInfo = get().connectionInfo;
        set({ connectionInfo: { ...currentInfo, ...info } });
      },
      
      // ============ REALTIME ACTIONS ============
      
      handleRealtimeMessage: (message: AnyRealtimeMessage) => {
        console.log(`[UserStore] Received realtime message:`, message.type, message);
        
        switch (message.type) {
          case 'presence.update':
            get().setPresence(message.userId, (message as any).presence);
            break;
            
          case 'workspace.join':
            // Mettre à jour la présence
            get().updatePresence(message.userId, {
              status: 'online',
              currentWorkspace: (message as any).workspaceId,
            });
            break;
            
          case 'workspace.leave':
            get().updatePresence(message.userId, {
              currentWorkspace: undefined,
            });
            break;
            
          case 'chat.message':
            get().addNotification({
              type: 'mention',
              title: `New message from ${message.userId}`,
              message: (message as any).content,
              userId: message.userId,
              workspaceId: message.workspaceId,
            });
            break;
            
          case 'notify':
            get().addNotification({
              type: 'system',
              title: (message as any).title,
              message: (message as any).message,
              severity: (message as any).severity,
            });
            break;
            
          default:
            console.log(`[UserStore] Unhandled message type: ${message.type}`);
        }
      },
      
      broadcastMessage: (message: AnyRealtimeMessage) => {
        // À implémenter avec WebSocket ou Firebase
        console.log(`[UserStore] Broadcasting message:`, message.type, message);
        // Dans une vraie implémentation:
        // - Envoyer via WebSocket
        // - Ou utiliser Firebase Realtime Database
        // - Ou utiliser Ably, Pusher, etc.
      },
      
      // ============ AUTH ACTIONS ============
      
      login: async (credentials: { email: string; password: string }) => {
        // Pour l'instant, on utilise l'utilisateur local par défaut
        // Dans une vraie implémentation, on appellerait une API d'auth
        console.log(`[UserStore] Login attempt for: ${credentials.email}`);
        
        // Simuler un délai
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const user: User = {
          id: `user-${Date.now()}`,
          name: credentials.email.split('@')[0],
          email: credentials.email,
          role: 'editor',
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        };
        
        const session: UserSession = {
          userId: user.id,
          token: `token-${Date.now()}`,
          expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 jours
          createdAt: Date.now(),
        };
        
        set({
          currentUser: user,
          currentSession: session,
          connectionStatus: 'connected',
        });
        
        // Ajouter l'utilisateur à la liste
        const users = new Map(get().users);
        users.set(user.id, user);
        set({ users });
        
        // Mettre à jour la présence
        get().setPresence(user.id, {
          userId: user.id,
          status: 'online',
          lastSeenAt: Date.now(),
        });
        
        // Notifier
        get().addNotification({
          type: 'system',
          title: 'Connected',
          message: `Welcome back, ${user.name}!`,
          severity: 'success',
        });
        
        return user;
      },
      
      logout: async () => {
        const currentUser = get().currentUser;
        
        if (currentUser) {
          // Mettre à jour la présence
          get().setPresence(currentUser.id, {
            userId: currentUser.id,
            status: 'offline',
            lastSeenAt: Date.now(),
          });
        }
        
        // Réinitialiser
        set({
          currentUser: null,
          currentSession: null,
          activeSharedWorkspaceId: null,
          connectionStatus: 'disconnected',
        });
      },
      
      register: async (userData: { name: string; email: string; password: string }) => {
        // Pour l'instant, on crée un utilisateur local
        console.log(`[UserStore] Register attempt for: ${userData.email}`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const user: User = {
          id: `user-${Date.now()}`,
          name: userData.name,
          email: userData.email,
          role: 'editor',
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        };
        
        const session: UserSession = {
          userId: user.id,
          token: `token-${Date.now()}`,
          expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
          createdAt: Date.now(),
        };
        
        set({
          currentUser: user,
          currentSession: session,
          connectionStatus: 'connected',
        });
        
        const users = new Map(get().users);
        users.set(user.id, user);
        set({ users });
        
        return user;
      },
      
      // ============ UTILITIES ============
      
      reset: () => {
        set({
          currentUser: null,
          currentSession: null,
          users: new Map(),
          presences: new Map(),
          sharedWorkspaces: new Map(),
          activeSharedWorkspaceId: null,
          notifications: [],
          unreadCount: 0,
          connectionStatus: 'disconnected',
          connectionInfo: { reconnectAttempts: 0 },
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        currentSession: state.currentSession,
        users: Array.from(state.users.values()),
        presences: Array.from(state.presences.values()),
        sharedWorkspaces: Array.from(state.sharedWorkspaces.values()),
        activeSharedWorkspaceId: state.activeSharedWorkspaceId,
        notifications: state.notifications,
      }),
      merge: (persistedState, currentState) => {
        // Si aucun utilisateur n'est connecté, utiliser l'utilisateur local par défaut
        if (!persistedState.currentUser) {
          return {
            ...currentState,
            currentUser: DEFAULT_USER,
            currentSession: DEFAULT_SESSION,
            users: new Map([[DEFAULT_USER.id, DEFAULT_USER]]),
            presences: new Map([[DEFAULT_USER.id, {
              userId: DEFAULT_USER.id,
              status: 'online',
              lastSeenAt: Date.now(),
            }]]),
          };
        }
        
        return {
          ...currentState,
          currentUser: persistedState.currentUser || null,
          currentSession: persistedState.currentSession || null,
          users: new Map(persistedState.users?.map((u: User) => [u.id, u]) || []),
          presences: new Map(persistedState.presences?.map((p: UserPresence) => [p.userId, p]) || []),
          sharedWorkspaces: new Map(persistedState.sharedWorkspaces?.map((w: SharedWorkspace) => [w.id, w]) || []),
          activeSharedWorkspaceId: persistedState.activeSharedWorkspaceId || null,
          notifications: persistedState.notifications || [],
          unreadCount: persistedState.notifications?.filter((n: UserNotification) => !n.read).length || 0,
        };
      },
    }
  )
);

// ============ UTILITY FUNCTIONS ============

/**
 * Obtenir l'utilisateur actuel
 */
export function getCurrentUser(): User | null {
  return useUserStore.getState().currentUser;
}

/**
 * Obtenir la session actuelle
 */
export function getCurrentSession(): UserSession | null {
  return useUserStore.getState().currentSession;
}

/**
 * Vérifier si l'utilisateur est connecté
 */
export function isAuthenticated(): boolean {
  return useUserStore.getState().currentUser !== null;
}

/**
 * Vérifier si l'utilisateur a un rôle spécifique
 */
export function hasRole(role: UserRole): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}

/**
 * Vérifier si l'utilisateur a une permission sur un workspace
 */
export function hasWorkspacePermission(
  workspaceId: SharedWorkspaceId,
  permission: WorkspacePermission
): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  const workspace = useUserStore.getState().getSharedWorkspace(workspaceId);
  if (!workspace) return false;
  
  // Le propriétaire a toutes les permissions
  if (workspace.ownerId === user.id) return true;
  
  // Vérifier les permissions du membre
  const member = workspace.members.find(m => m.userId === user.id);
  return member?.permissions.includes(permission) || false;
}

/**
 * Obtenir les utilisateurs en ligne
 */
export function getOnlineUsers(): User[] {
  return useUserStore.getState().getOnlineUsers();
}

/**
 * Obtenir les membres d'un workspace
 */
export function getWorkspaceMembers(workspaceId: SharedWorkspaceId): WorkspaceMember[] {
  return useUserStore.getState().getWorkspaceMembers(workspaceId);
}

// ============ EXPORTS ============

export type * from "./user-types";
