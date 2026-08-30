/**
 * Advanced Security System - Store
 * 
 * Stores Svelte pour la gestion de la sécurité
 */

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type {
  Permission,
  PermissionId,
  Role,
  RoleId,
  Policy,
  PolicyId,
  SecurityUser,
  UserId,
  SecuritySession,
  SessionId,
  AuditEntry,
  AuditLog,
  AuditFilter,
  AuditAction,
  ResourceType,
  ActionType,
  SecurityLevel,
  SecurityStatus,
  EncryptionKey,
  EncryptedData,
  RateLimit,
  RateLimitStatus,
  SecurityEvent,
  SecurityEventType,
  SecuritySettings,
} from './security-types';

import { securityManager } from './security-engine';
import { DEFAULT_SECURITY_SETTINGS } from './security-types';

// ============ DEFAULT VALUES ============

/** Statut par défaut */
export const DEFAULT_SECURITY_STATUS = {
  enabled: true,
  authenticated: false,
  userId: null as UserId | null,
  sessionId: null as SessionId | null,
  sessionToken: null as string | null,
  permissions: [] as PermissionId[],
  roles: [] as RoleId[],
  canAccess: true,
};

// ============ STORES ============

/** Store des permissions */
export const permissionsStore: Writable<Permission[]> = writable([]);

/** Store des rôles */
export const rolesStore: Writable<Role[]> = writable([]);

/** Store des politiques */
export const policiesStore: Writable<Policy[]> = writable([]);

/** Store des utilisateurs */
export const usersStore: Writable<SecurityUser[]> = writable([]);

/** Store des sessions */
export const sessionsStore: Writable<SecuritySession[]> = writable([]);

/** Store du log d'audit */
export const auditLogStore: Writable<AuditLog> = writable({ entries: [], total: 0, page: 1, perPage: 100 });

/** Store des clés de chiffrement */
export const encryptionKeysStore: Writable<EncryptionKey[]> = writable([]);

/** Store des limites de taux */
export const rateLimitsStore: Writable<RateLimit[]> = writable([]);

/** Store des paramètres */
export const securitySettingsStore: Writable<SecuritySettings> = writable(DEFAULT_SECURITY_SETTINGS);

/** Store du statut */
export const securityStatusStore: Writable<typeof DEFAULT_SECURITY_STATUS> = writable(DEFAULT_SECURITY_STATUS);

/** Store de l'utilisateur actuel */
export const currentUserStore: Writable<SecurityUser | null> = writable(null);

/** Store de la session actuelle */
export const currentSessionStore: Writable<SecuritySession | null> = writable(null);

/** Store des événements */
export const securityEventsStore: Writable<SecurityEvent[]> = writable([]);

// ============ DERIVED STORES ============

/** Nombre de permissions */
export const permissionCountStore: Readable<number> = derived(
  permissionsStore,
  ($permissions) => $permissions.length
);

/** Nombre de rôles */
export const roleCountStore: Readable<number> = derived(
  rolesStore,
  ($roles) => $roles.length
);

/** Nombre de politiques */
export const policyCountStore: Readable<number> = derived(
  policiesStore,
  ($policies) => $policies.length
);

/** Nombre d'utilisateurs */
export const userCountStore: Readable<number> = derived(
  usersStore,
  ($users) => $users.length
);

/** Nombre de sessions */
export const sessionCountStore: Readable<number> = derived(
  sessionsStore,
  ($sessions) => $sessions.length
);

/** Nombre de clés de chiffrement */
export const encryptionKeyCountStore: Readable<number> = derived(
  encryptionKeysStore,
  ($keys) => $keys.length
);

/** Nombre de limites de taux */
export const rateLimitCountStore: Readable<number> = derived(
  rateLimitsStore,
  ($limits) => $limits.length
);

/** Permissions système */
export const systemPermissionsStore: Readable<Permission[]> = derived(
  permissionsStore,
  ($permissions) => $permissions.filter(p => p.system)
);

/** Rôles système */
export const systemRolesStore: Readable<Role[]> = derived(
  rolesStore,
  ($roles) => $roles.filter(r => r.system)
);

/** Utilisateurs actifs */
export const activeUsersStore: Readable<SecurityUser[]> = derived(
  usersStore,
  ($users) => $users.filter(u => u.active)
);

/** Sessions actives */
export const activeSessionsStore: Readable<SecuritySession[]> = derived(
  sessionsStore,
  ($sessions) => $sessions.filter(s => s.status === 'active')
);

/** Limites de taux actives */
export const activeRateLimitsStore: Readable<RateLimit[]> = derived(
  rateLimitsStore,
  ($limits) => $limits.filter(l => l.active)
);

// ============ INITIALIZATION ============

/**
 * Initialiser les stores de sécurité
 */
export function initializeSecurityStores(): void {
  // Charger les données depuis le localStorage
  const savedPermissions = localStorage.getItem('morphos-security-permissions');
  const savedRoles = localStorage.getItem('morphos-security-roles');
  const savedPolicies = localStorage.getItem('morphos-security-policies');
  const savedUsers = localStorage.getItem('morphos-security-users');
  const savedSettings = localStorage.getItem('morphos-security-settings');
  const savedSession = localStorage.getItem('morphos-security-session');
  
  if (savedPermissions) {
    try {
      permissionsStore.set(JSON.parse(savedPermissions));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedRoles) {
    try {
      rolesStore.set(JSON.parse(savedRoles));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedPolicies) {
    try {
      policiesStore.set(JSON.parse(savedPolicies));
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
  
  if (savedSettings) {
    try {
      securitySettingsStore.set(JSON.parse(savedSettings));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession);
      currentSessionStore.set(session);
      securityStatusStore.update(status => ({
        ...status,
        authenticated: true,
        sessionId: session.id,
        sessionToken: session.token,
      }));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  // Sauvegarder les données lors des changements
  permissionsStore.subscribe((permissions) => {
    localStorage.setItem('morphos-security-permissions', JSON.stringify(permissions));
  });
  
  rolesStore.subscribe((roles) => {
    localStorage.setItem('morphos-security-roles', JSON.stringify(roles));
  });
  
  policiesStore.subscribe((policies) => {
    localStorage.setItem('morphos-security-policies', JSON.stringify(policies));
  });
  
  usersStore.subscribe((users) => {
    localStorage.setItem('morphos-security-users', JSON.stringify(users));
  });
  
  securitySettingsStore.subscribe((settings) => {
    localStorage.setItem('morphos-security-settings', JSON.stringify(settings));
  });
  
  currentSessionStore.subscribe((session) => {
    if (session) {
      localStorage.setItem('morphos-security-session', JSON.stringify(session));
      securityStatusStore.update(status => ({
        ...status,
        authenticated: true,
        sessionId: session.id,
        sessionToken: session.token,
      }));
    } else {
      localStorage.removeItem('morphos-security-session');
      securityStatusStore.update(status => ({
        ...status,
        authenticated: false,
        sessionId: null,
        sessionToken: null,
      }));
    }
  });
  
  // S'abonner aux changements du manager
  securityManager.onEvent('*', (event) => {
    securityEventsStore.update(events => [event, ...events].slice(0, 100));
  });
  
  // Charger les données du manager
  const managerPermissions = securityManager.getAllPermissions();
  permissionsStore.set(managerPermissions);
  
  const managerRoles = securityManager.getAllRoles();
  rolesStore.set(managerRoles);
  
  const managerPolicies = securityManager.getAllPolicies();
  policiesStore.set(managerPolicies);
  
  const managerUsers = securityManager.getAllUsers();
  usersStore.set(managerUsers);
  
  const managerSettings = securityManager.getSettings();
  securitySettingsStore.set(managerSettings);
  
  const managerSessions = securityManager.getAllSessions();
  sessionsStore.set(managerSessions);
  
  const managerKeys = securityManager.getAllEncryptionKeys();
  encryptionKeysStore.set(managerKeys);
  
  const managerLimits = securityManager.getAllRateLimits();
  rateLimitsStore.set(managerLimits);
}

// ============ ACTIONS ============

/**
 * Ajouter une permission
 */
export function addPermission(permission: Permission): PermissionId {
  const id = securityManager.addPermission(permission);
  permissionsStore.update(permissions => [...permissions, { ...permission, id }]);
  return id;
}

/**
 * Obtenir une permission par ID
 */
export function getPermission(id: PermissionId): Permission | null {
  return securityManager.getPermission(id);
}

/**
 * Obtenir toutes les permissions
 */
export function getAllPermissions(): Permission[] {
  return securityManager.getAllPermissions();
}

/**
 * Supprimer une permission
 */
export function removePermission(id: PermissionId): boolean {
  const success = securityManager.removePermission(id);
  if (success) {
    permissionsStore.update(permissions => permissions.filter(p => p.id !== id));
  }
  return success;
}

/**
 * Mettre à jour une permission
 */
export function updatePermission(id: PermissionId, updates: Partial<Permission>): boolean {
  const success = securityManager.updatePermission(id, updates);
  if (success) {
    permissionsStore.update(permissions => permissions.map(p => p.id === id ? { ...p, ...updates } : p));
  }
  return success;
}

/**
 * Ajouter un rôle
 */
export function addRole(role: Role): RoleId {
  const id = securityManager.addRole(role);
  rolesStore.update(roles => [...roles, { ...role, id }]);
  return id;
}

/**
 * Obtenir un rôle par ID
 */
export function getRole(id: RoleId): Role | null {
  return securityManager.getRole(id);
}

/**
 * Obtenir tous les rôles
 */
export function getAllRoles(): Role[] {
  return securityManager.getAllRoles();
}

/**
 * Supprimer un rôle
 */
export function removeRole(id: RoleId): boolean {
  const success = securityManager.removeRole(id);
  if (success) {
    rolesStore.update(roles => roles.filter(r => r.id !== id));
  }
  return success;
}

/**
 * Mettre à jour un rôle
 */
export function updateRole(id: RoleId, updates: Partial<Role>): boolean {
  const success = securityManager.updateRole(id, updates);
  if (success) {
    rolesStore.update(roles => roles.map(r => r.id === id ? { ...r, ...updates } : r));
  }
  return success;
}

/**
 * Ajouter une permission à un rôle
 */
export function addPermissionToRole(roleId: RoleId, permissionId: PermissionId): boolean {
  return securityManager.addPermissionToRole(roleId, permissionId);
}

/**
 * Supprimer une permission d'un rôle
 */
export function removePermissionFromRole(roleId: RoleId, permissionId: PermissionId): boolean {
  return securityManager.removePermissionFromRole(roleId, permissionId);
}

/**
 * Obtenir les permissions d'un rôle
 */
export function getRolePermissions(roleId: RoleId): Permission[] {
  return securityManager.getRolePermissions(roleId);
}

/**
 * Ajouter une politique
 */
export function addPolicy(policy: Policy): PolicyId {
  const id = securityManager.addPolicy(policy);
  policiesStore.update(policies => [...policies, { ...policy, id }]);
  return id;
}

/**
 * Obtenir une politique par ID
 */
export function getPolicy(id: PolicyId): Policy | null {
  return securityManager.getPolicy(id);
}

/**
 * Obtenir toutes les politiques
 */
export function getAllPolicies(): Policy[] {
  return securityManager.getAllPolicies();
}

/**
 * Supprimer une politique
 */
export function removePolicy(id: PolicyId): boolean {
  const success = securityManager.removePolicy(id);
  if (success) {
    policiesStore.update(policies => policies.filter(p => p.id !== id));
  }
  return success;
}

/**
 * Mettre à jour une politique
 */
export function updatePolicy(id: PolicyId, updates: Partial<Policy>): boolean {
  const success = securityManager.updatePolicy(id, updates);
  if (success) {
    policiesStore.update(policies => policies.map(p => p.id === id ? { ...p, ...updates } : p));
  }
  return success;
}

/**
 * Ajouter un utilisateur
 */
export function addUser(user: SecurityUser): UserId {
  const id = securityManager.addUser(user);
  usersStore.update(users => [...users, { ...user, id }]);
  return id;
}

/**
 * Obtenir un utilisateur par ID
 */
export function getUser(id: UserId): SecurityUser | null {
  return securityManager.getUser(id);
}

/**
 * Obtenir tous les utilisateurs
 */
export function getAllUsers(): SecurityUser[] {
  return securityManager.getAllUsers();
}

/**
 * Supprimer un utilisateur
 */
export function removeUser(id: UserId): boolean {
  const success = securityManager.removeUser(id);
  if (success) {
    usersStore.update(users => users.filter(u => u.id !== id));
  }
  return success;
}

/**
 * Mettre à jour un utilisateur
 */
export function updateUser(id: UserId, updates: Partial<SecurityUser>): boolean {
  const success = securityManager.updateUser(id, updates);
  if (success) {
    usersStore.update(users => users.map(u => u.id === id ? { ...u, ...updates } : u));
  }
  return success;
}

/**
 * Ajouter un rôle à un utilisateur
 */
export function addRoleToUser(userId: UserId, roleId: RoleId): boolean {
  return securityManager.addRoleToUser(userId, roleId);
}

/**
 * Supprimer un rôle d'un utilisateur
 */
export function removeRoleFromUser(userId: UserId, roleId: RoleId): boolean {
  return securityManager.removeRoleFromUser(userId, roleId);
}

/**
 * Obtenir les permissions d'un utilisateur
 */
export function getUserPermissions(userId: UserId): Permission[] {
  return securityManager.getUserPermissions(userId);
}

/**
 * Vérifier si un utilisateur a une permission
 */
export function hasPermission(userId: UserId, permissionId: PermissionId): boolean {
  return securityManager.hasPermission(userId, permissionId);
}

/**
 * Vérifier si un utilisateur peut effectuer une action
 */
export function can(userId: UserId, action: ActionType, resource: ResourceType, resourceId?: string): boolean {
  return securityManager.can(userId, action, resource, resourceId);
}

/**
 * Créer une session
 */
export function createSession(userId: UserId, options?: { ip?: string; userAgent?: string }): SessionId {
  const sessionId = securityManager.createSession(userId, options);
  const session = securityManager.getSession(sessionId);
  if (session) {
    sessionsStore.update(sessions => [...sessions, session]);
    currentSessionStore.set(session);
    
    const user = securityManager.getUser(userId);
    if (user) {
      currentUserStore.set(user);
      securityStatusStore.update(status => ({
        ...status,
        authenticated: true,
        userId: user.id,
        sessionId: session.id,
        sessionToken: session.token,
        permissions: user.permissions,
        roles: user.roles,
      }));
    }
  }
  
  return sessionId;
}

/**
 * Obtenir une session par ID
 */
export function getSession(id: SessionId): SecuritySession | null {
  return securityManager.getSession(id);
}

/**
 * Obtenir toutes les sessions
 */
export function getAllSessions(): SecuritySession[] {
  return securityManager.getAllSessions();
}

/**
 * Terminer une session
 */
export function terminateSession(sessionId?: SessionId): boolean {
  const id = sessionId || securityStatusStore.get().sessionId;
  if (!id) return false;
  
  const success = securityManager.terminateSession(id);
  if (success) {
    sessionsStore.update(sessions => sessions.map(s => s.id === id ? { ...s, status: 'ended' } : s));
    currentSessionStore.set(null);
    currentUserStore.set(null);
    securityStatusStore.update(status => ({
      ...status,
      authenticated: false,
      userId: null,
      sessionId: null,
      sessionToken: null,
      permissions: [],
      roles: [],
    }));
    localStorage.removeItem('morphos-security-session');
  }
  
  return success;
}

/**
 * Valider un token de session
 */
export function validateSessionToken(token: string): SecuritySession | null {
  return securityManager.validateSessionToken(token);
}

/**
 * Rafraîchir une session
 */
export function refreshSession(sessionId?: SessionId): boolean {
  const id = sessionId || securityStatusStore.get().sessionId;
  if (!id) return false;
  return securityManager.refreshSession(id);
}

/**
 * Logger un audit
 */
export function logAudit(entry: Partial<AuditEntry>): AuditEntry {
  const auditEntry = securityManager.logAudit(entry);
  auditLogStore.update(log => ({
    ...log,
    entries: [auditEntry, ...log.entries].slice(0, log.perPage),
    total: log.total + 1,
  }));
  return auditEntry;
}

/**
 * Obtenir le log d'audit
 */
export function getAuditLog(filters?: AuditFilter): AuditLog {
  return securityManager.getAuditLog(filters);
}

/**
 * Effacer le log d'audit
 */
export function clearAuditLog(): void {
  securityManager.clearAuditLog();
  auditLogStore.set({ entries: [], total: 0, page: 1, perPage: 100 });
}

/**
 * Ajouter une clé de chiffrement
 */
export function addEncryptionKey(key: EncryptionKey): string {
  const id = securityManager.addEncryptionKey(key);
  encryptionKeysStore.update(keys => [...keys, { ...key, id }]);
  return id;
}

/**
 * Obtenir une clé de chiffrement
 */
export function getEncryptionKey(id: string): EncryptionKey | null {
  return securityManager.getEncryptionKey(id);
}

/**
 * Obtenir toutes les clés de chiffrement
 */
export function getAllEncryptionKeys(): EncryptionKey[] {
  return securityManager.getAllEncryptionKeys();
}

/**
 * Supprimer une clé de chiffrement
 */
export function removeEncryptionKey(id: string): boolean {
  const success = securityManager.removeEncryptionKey(id);
  if (success) {
    encryptionKeysStore.update(keys => keys.filter(k => k.id !== id));
  }
  return success;
}

/**
 * Chiffrer des données
 */
export async function encryptData(
  data: string,
  keyId: string,
  options?: { algorithm?: EncryptionAlgorithm }
): Promise<EncryptedData | null> {
  return securityManager.encryptData(data, keyId, options);
}

/**
 * Déchiffrer des données
 */
export async function decryptData(encryptedData: EncryptedData): Promise<string | null> {
  return securityManager.decryptData(encryptedData);
}

/**
 * Ajouter une limite de taux
 */
export function addRateLimit(limit: RateLimit): string {
  const id = securityManager.addRateLimit(limit);
  rateLimitsStore.update(limits => [...limits, { ...limit, id }]);
  return id;
}

/**
 * Obtenir une limite de taux
 */
export function getRateLimit(id: string): RateLimit | null {
  return securityManager.getRateLimit(id);
}

/**
 * Obtenir toutes les limites de taux
 */
export function getAllRateLimits(): RateLimit[] {
  return securityManager.getAllRateLimits();
}

/**
 * Supprimer une limite de taux
 */
export function removeRateLimit(id: string): boolean {
  const success = securityManager.removeRateLimit(id);
  if (success) {
    rateLimitsStore.update(limits => limits.filter(l => l.id !== id));
  }
  return success;
}

/**
 * Vérifier une limite de taux
 */
export function checkRateLimit(limitId: string, identifier: string): { allowed: boolean; status: RateLimitStatus | null } {
  return securityManager.checkRateLimit(limitId, identifier);
}

/**
 * Réinitialiser une limite de taux
 */
export function resetRateLimit(limitId: string, identifier: string): void {
  securityManager.resetRateLimit(limitId, identifier);
}

/**
 * Vérifier l'accès
 */
export function checkAccess(
  userId: UserId,
  action: ActionType,
  resource: ResourceType,
  resourceId?: string,
  context?: Record<string, unknown>
): { allowed: boolean; reason?: string } {
  return securityManager.checkAccess(userId, action, resource, resourceId, context);
}

/**
 * Obtenir les paramètres
 */
export function getSecuritySettings(): SecuritySettings {
  return securityManager.getSettings();
}

/**
 * Mettre à jour les paramètres
 */
export function updateSecuritySettings(updates: Partial<SecuritySettings>): void {
  securityManager.updateSettings(updates);
  securitySettingsStore.update(settings => ({ ...settings, ...updates }));
}

/**
 * Activer/Désactiver la sécurité
 */
export function setSecurityEnabled(enabled: boolean): void {
  updateSecuritySettings({ enabled });
}

/**
 * Activer/Désactiver l'audit
 */
export function setAuditEnabled(enabled: boolean): void {
  updateSecuritySettings({ auditEnabled: enabled });
}

/**
 * Activer/Désactiver le chiffrement
 */
export function setEncryptionEnabled(enabled: boolean): void {
  updateSecuritySettings({ encryptionEnabled: enabled });
}

/**
 * Activer/Désactiver les limites de taux
 */
export function setRateLimitEnabled(enabled: boolean): void {
  updateSecuritySettings({ rateLimitEnabled: enabled });
}

/**
 * Nettoyer les données
 */
export function clearSecurityData(): void {
  permissionsStore.set([]);
  rolesStore.set([]);
  policiesStore.set([]);
  usersStore.set([]);
  sessionsStore.set([]);
  auditLogStore.set({ entries: [], total: 0, page: 1, perPage: 100 });
  encryptionKeysStore.set([]);
  rateLimitsStore.set([]);
  securitySettingsStore.set(DEFAULT_SECURITY_SETTINGS);
  currentUserStore.set(null);
  currentSessionStore.set(null);
  securityStatusStore.set(DEFAULT_SECURITY_STATUS);
  securityEventsStore.set([]);
  
  securityManager.cleanup();
}

/**
 * Réinitialiser la sécurité
 */
export function resetSecurity(): void {
  clearSecurityData();
  localStorage.removeItem('morphos-security-permissions');
  localStorage.removeItem('morphos-security-roles');
  localStorage.removeItem('morphos-security-policies');
  localStorage.removeItem('morphos-security-users');
  localStorage.removeItem('morphos-security-settings');
  localStorage.removeItem('morphos-security-session');
}

/**
 * S'abonner à un événement
 */
export function onSecurityEvent(type: SecurityEventType, callback: (event: SecurityEvent) => void): () => void {
  return securityManager.onEvent(type, callback);
}

// ============ INITIALIZATION ============

// Initialiser automatiquement
if (typeof window !== 'undefined') {
  initializeSecurityStores();
}

// ============ EXPORT ============

export default {
  // Stores
  permissionsStore,
  rolesStore,
  policiesStore,
  usersStore,
  sessionsStore,
  auditLogStore,
  encryptionKeysStore,
  rateLimitsStore,
  securitySettingsStore,
  securityStatusStore,
  currentUserStore,
  currentSessionStore,
  securityEventsStore,
  
  // Derived stores
  permissionCountStore,
  roleCountStore,
  policyCountStore,
  userCountStore,
  sessionCountStore,
  encryptionKeyCountStore,
  rateLimitCountStore,
  systemPermissionsStore,
  systemRolesStore,
  activeUsersStore,
  activeSessionsStore,
  activeRateLimitsStore,
  
  // Actions
  initializeSecurityStores,
  addPermission,
  getPermission,
  getAllPermissions,
  removePermission,
  updatePermission,
  addRole,
  getRole,
  getAllRoles,
  removeRole,
  updateRole,
  addPermissionToRole,
  removePermissionFromRole,
  getRolePermissions,
  addPolicy,
  getPolicy,
  getAllPolicies,
  removePolicy,
  updatePolicy,
  addUser,
  getUser,
  getAllUsers,
  removeUser,
  updateUser,
  addRoleToUser,
  removeRoleFromUser,
  getUserPermissions,
  hasPermission,
  can,
  createSession,
  getSession,
  getAllSessions,
  terminateSession,
  validateSessionToken,
  refreshSession,
  logAudit,
  getAuditLog,
  clearAuditLog,
  addEncryptionKey,
  getEncryptionKey,
  getAllEncryptionKeys,
  removeEncryptionKey,
  encryptData,
  decryptData,
  addRateLimit,
  getRateLimit,
  getAllRateLimits,
  removeRateLimit,
  checkRateLimit,
  resetRateLimit,
  checkAccess,
  getSecuritySettings,
  updateSecuritySettings,
  setSecurityEnabled,
  setAuditEnabled,
  setEncryptionEnabled,
  setRateLimitEnabled,
  clearSecurityData,
  resetSecurity,
  onSecurityEvent,
};
