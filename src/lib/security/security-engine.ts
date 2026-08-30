/**
 * Advanced Security System - Engine
 * 
 * Moteur de sécurité pour MorphOS
 */

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
  EncryptionAlgorithm,
  KeyType,
  EncryptedData,
  RateLimit,
  RateLimitStatus,
  SecurityEvent,
  SecurityEventType,
  SecuritySettings,
  PolicyCondition,
  PolicyConfig,
} from './security-types';

import {
  DEFAULT_SECURITY_SETTINGS,
  DEFAULT_SYSTEM_ROLES,
  DEFAULT_SYSTEM_PERMISSIONS,
} from './security-types';

// ============ SECURITY MANAGER ============

/**
 * Gestionnaire de sécurité
 */
export class SecurityManager {
  private permissions: Map<PermissionId, Permission> = new Map();
  private roles: Map<RoleId, Role> = new Map();
  private policies: Map<PolicyId, Policy> = new Map();
  private users: Map<UserId, SecurityUser> = new Map();
  private sessions: Map<SessionId, SecuritySession> = new Map();
  private auditLog: AuditEntry[] = [];
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private rateLimits: Map<string, RateLimit> = new Map();
  private rateLimitStatuses: Map<string, RateLimitStatus> = new Map();
  private eventListeners: Map<SecurityEventType, Set<(event: SecurityEvent) => void>> = new Map();
  
  private settings: SecuritySettings = { ...DEFAULT_SECURITY_SETTINGS };
  
  constructor() {
    // Initialiser avec les permissions et rôles système
    this.initializeSystemResources();
  }
  
  /**
   * Initialiser les ressources système
   */
  private initializeSystemResources(): void {
    // Ajouter les permissions système
    for (const permission of DEFAULT_SYSTEM_PERMISSIONS) {
      this.permissions.set(permission.id, { ...permission });
    }
    
    // Ajouter les rôles système
    for (const role of DEFAULT_SYSTEM_ROLES) {
      this.roles.set(role.id, { ...role });
    }
  }
  
  // ============ PERMISSION MANAGEMENT ============
  
  /**
   * Ajouter une permission
   */
  public addPermission(permission: Permission): PermissionId {
    const id = permission.id || `perm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.permissions.has(id)) {
      throw new Error(`Permission with ID ${id} already exists`);
    }
    
    const newPermission: Permission = {
      ...permission,
      id,
      active: permission.active !== false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.permissions.set(id, newPermission);
    this.emitEvent('permission.added', { permissionId: id });
    
    return id;
  }
  
  /**
   * Obtenir une permission par ID
   */
  public getPermission(id: PermissionId): Permission | null {
    return this.permissions.get(id) || null;
  }
  
  /**
   * Obtenir toutes les permissions
   */
  public getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }
  
  /**
   * Obtenir les permissions par type
   */
  public getPermissionsByResource(resource: ResourceType): Permission[] {
    return Array.from(this.permissions.values()).filter(p => p.resource === resource);
  }
  
  /**
   * Obtenir les permissions par action
   */
  public getPermissionsByAction(action: ActionType): Permission[] {
    return Array.from(this.permissions.values()).filter(p => p.action === action);
  }
  
  /**
   * Supprimer une permission
   */
  public removePermission(id: PermissionId): boolean {
    const permission = this.permissions.get(id);
    if (!permission) {
      return false;
    }
    
    // Ne pas supprimer les permissions système
    if (permission.system) {
      return false;
    }
    
    this.permissions.delete(id);
    this.emitEvent('permission.removed', { permissionId: id });
    
    return true;
  }
  
  /**
   * Mettre à jour une permission
   */
  public updatePermission(id: PermissionId, updates: Partial<Permission>): boolean {
    const permission = this.permissions.get(id);
    if (!permission) {
      return false;
    }
    
    // Ne pas modifier les permissions système
    if (permission.system && permission.readonly) {
      return false;
    }
    
    const updatedPermission: Permission = {
      ...permission,
      ...updates,
      updatedAt: Date.now(),
    };
    
    this.permissions.set(id, updatedPermission);
    this.emitEvent('permission.updated', { permissionId: id });
    
    return true;
  }
  
  // ============ ROLE MANAGEMENT ============
  
  /**
   * Ajouter un rôle
   */
  public addRole(role: Role): RoleId {
    const id = role.id || `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.roles.has(id)) {
      throw new Error(`Role with ID ${id} already exists`);
    }
    
    const newRole: Role = {
      ...role,
      id,
      active: role.active !== false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.roles.set(id, newRole);
    this.emitEvent('role.added', { roleId: id });
    
    return id;
  }
  
  /**
   * Obtenir un rôle par ID
   */
  public getRole(id: RoleId): Role | null {
    return this.roles.get(id) || null;
  }
  
  /**
   * Obtenir tous les rôles
   */
  public getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }
  
  /**
   * Obtenir les rôles par niveau
   */
  public getRolesByLevel(level: SecurityLevel): Role[] {
    return Array.from(this.roles.values()).filter(r => r.level === level);
  }
  
  /**
   * Supprimer un rôle
   */
  public removeRole(id: RoleId): boolean {
    const role = this.roles.get(id);
    if (!role) {
      return false;
    }
    
    // Ne pas supprimer les rôles système
    if (role.system) {
      return false;
    }
    
    this.roles.delete(id);
    this.emitEvent('role.removed', { roleId: id });
    
    return true;
  }
  
  /**
   * Mettre à jour un rôle
   */
  public updateRole(id: RoleId, updates: Partial<Role>): boolean {
    const role = this.roles.get(id);
    if (!role) {
      return false;
    }
    
    // Ne pas modifier les rôles système
    if (role.system && role.readonly) {
      return false;
    }
    
    const updatedRole: Role = {
      ...role,
      ...updates,
      updatedAt: Date.now(),
    };
    
    this.roles.set(id, updatedRole);
    this.emitEvent('role.updated', { roleId: id });
    
    return true;
  }
  
  /**
   * Obtenir les permissions d'un rôle
   */
  public getRolePermissions(roleId: RoleId): Permission[] {
    const role = this.getRole(roleId);
    if (!role) {
      return [];
    }
    
    const permissions: Permission[] = [];
    
    // Ajouter les permissions directes
    for (const permissionId of role.permissions) {
      const permission = this.getPermission(permissionId);
      if (permission) {
        permissions.push(permission);
      }
    }
    
    // Ajouter les permissions des rôles hérités
    for (const inheritId of role.inherits || []) {
      const inheritedPermissions = this.getRolePermissions(inheritId);
      permissions.push(...inheritedPermissions);
    }
    
    // Supprimer les doublons
    return permissions.filter((p, i, self) => self.findIndex(pp => pp.id === p.id) === i);
  }
  
  /**
   * Ajouter une permission à un rôle
   */
  public addPermissionToRole(roleId: RoleId, permissionId: PermissionId): boolean {
    const role = this.roles.get(roleId);
    if (!role) {
      return false;
    }
    
    const permission = this.permissions.get(permissionId);
    if (!permission) {
      return false;
    }
    
    if (!role.permissions.includes(permissionId)) {
      role.permissions.push(permissionId);
      role.updatedAt = Date.now();
      this.roles.set(roleId, role);
      this.emitEvent('role.updated', { roleId });
    }
    
    return true;
  }
  
  /**
   * Supprimer une permission d'un rôle
   */
  public removePermissionFromRole(roleId: RoleId, permissionId: PermissionId): boolean {
    const role = this.roles.get(roleId);
    if (!role) {
      return false;
    }
    
    role.permissions = role.permissions.filter(id => id !== permissionId);
    role.updatedAt = Date.now();
    this.roles.set(roleId, role);
    this.emitEvent('role.updated', { roleId });
    
    return true;
  }
  
  // ============ POLICY MANAGEMENT ============
  
  /**
   * Ajouter une politique
   */
  public addPolicy(policy: Policy): PolicyId {
    const id = policy.id || `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.policies.has(id)) {
      throw new Error(`Policy with ID ${id} already exists`);
    }
    
    const newPolicy: Policy = {
      ...policy,
      id,
      active: policy.active !== false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.policies.set(id, newPolicy);
    this.emitEvent('policy.added', { policyId: id });
    
    return id;
  }
  
  /**
   * Obtenir une politique par ID
   */
  public getPolicy(id: PolicyId): Policy | null {
    return this.policies.get(id) || null;
  }
  
  /**
   * Obtenir toutes les politiques
   */
  public getAllPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }
  
  /**
   * Obtenir les politiques par type
   */
  public getPoliciesByType(type: Policy['type']): Policy[] {
    return Array.from(this.policies.values()).filter(p => p.type === type);
  }
  
  /**
   * Supprimer une politique
   */
  public removePolicy(id: PolicyId): boolean {
    if (!this.policies.has(id)) {
      return false;
    }
    
    this.policies.delete(id);
    this.emitEvent('policy.removed', { policyId: id });
    
    return true;
  }
  
  /**
   * Mettre à jour une politique
   */
  public updatePolicy(id: PolicyId, updates: Partial<Policy>): boolean {
    const policy = this.policies.get(id);
    if (!policy) {
      return false;
    }
    
    const updatedPolicy: Policy = {
      ...policy,
      ...updates,
      updatedAt: Date.now(),
    };
    
    this.policies.set(id, updatedPolicy);
    this.emitEvent('policy.updated', { policyId: id });
    
    return true;
  }
  
  /**
   * Vérifier une politique
   */
  public checkPolicy(policyId: PolicyId, context: Record<string, unknown>): boolean {
    const policy = this.getPolicy(policyId);
    if (!policy || !policy.active) {
      return false;
    }
    
    // Vérifier les conditions
    for (const condition of policy.config.conditions || []) {
      if (!this.checkPolicyCondition(condition, context)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Vérifier une condition de politique
   */
  private checkPolicyCondition(condition: PolicyCondition, context: Record<string, unknown>): boolean {
    const value = context[condition.type];
    
    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'neq':
        return value !== condition.value;
      case 'gt':
        return (value as number) > (condition.value as number);
      case 'gte':
        return (value as number) >= (condition.value as number);
      case 'lt':
        return (value as number) < (condition.value as number);
      case 'lte':
        return (value as number) <= (condition.value as number);
      case 'in':
        return (condition.value as unknown[]).includes(value);
      case 'not_in':
        return !(condition.value as unknown[]).includes(value);
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'not_contains':
        return !String(value).includes(String(condition.value));
      default:
        return false;
    }
  }
  
  // ============ USER MANAGEMENT ============
  
  /**
   * Ajouter un utilisateur
   */
  public addUser(user: SecurityUser): UserId {
    const id = user.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.users.has(id)) {
      throw new Error(`User with ID ${id} already exists`);
    }
    
    const newUser: SecurityUser = {
      ...user,
      id,
      active: user.active !== false,
      locked: user.locked || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.users.set(id, newUser);
    this.emitEvent('user.added', { userId: id });
    
    return id;
  }
  
  /**
   * Obtenir un utilisateur par ID
   */
  public getUser(id: UserId): SecurityUser | null {
    return this.users.get(id) || null;
  }
  
  /**
   * Obtenir tous les utilisateurs
   */
  public getAllUsers(): SecurityUser[] {
    return Array.from(this.users.values());
  }
  
  /**
   * Obtenir les utilisateurs par rôle
   */
  public getUsersByRole(roleId: RoleId): SecurityUser[] {
    return Array.from(this.users.values()).filter(u => u.roles.includes(roleId));
  }
  
  /**
   * Supprimer un utilisateur
   */
  public removeUser(id: UserId): boolean {
    if (!this.users.has(id)) {
      return false;
    }
    
    this.users.delete(id);
    this.emitEvent('user.removed', { userId: id });
    
    return true;
  }
  
  /**
   * Mettre à jour un utilisateur
   */
  public updateUser(id: UserId, updates: Partial<SecurityUser>): boolean {
    const user = this.users.get(id);
    if (!user) {
      return false;
    }
    
    const updatedUser: SecurityUser = {
      ...user,
      ...updates,
      updatedAt: Date.now(),
    };
    
    this.users.set(id, updatedUser);
    this.emitEvent('user.updated', { userId: id });
    
    return true;
  }
  
  /**
   * Ajouter un rôle à un utilisateur
   */
  public addRoleToUser(userId: UserId, roleId: RoleId): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }
    
    const role = this.roles.get(roleId);
    if (!role) {
      return false;
    }
    
    if (!user.roles.includes(roleId)) {
      user.roles.push(roleId);
      user.updatedAt = Date.now();
      this.users.set(userId, user);
      this.emitEvent('user.updated', { userId });
    }
    
    return true;
  }
  
  /**
   * Supprimer un rôle d'un utilisateur
   */
  public removeRoleFromUser(userId: UserId, roleId: RoleId): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }
    
    user.roles = user.roles.filter(id => id !== roleId);
    user.updatedAt = Date.now();
    this.users.set(userId, user);
    this.emitEvent('user.updated', { userId });
    
    return true;
  }
  
  /**
   * Obtenir les permissions d'un utilisateur
   */
  public getUserPermissions(userId: UserId): Permission[] {
    const user = this.getUser(userId);
    if (!user) {
      return [];
    }
    
    const permissions: Permission[] = [];
    
    // Ajouter les permissions directes
    for (const permissionId of user.permissions) {
      const permission = this.getPermission(permissionId);
      if (permission) {
        permissions.push(permission);
      }
    }
    
    // Ajouter les permissions des rôles
    for (const roleId of user.roles) {
      const rolePermissions = this.getRolePermissions(roleId);
      permissions.push(...rolePermissions);
    }
    
    // Supprimer les doublons
    return permissions.filter((p, i, self) => self.findIndex(pp => pp.id === p.id) === i);
  }
  
  /**
   * Vérifier si un utilisateur a une permission
   */
  public hasPermission(userId: UserId, permissionId: PermissionId): boolean {
    const permissions = this.getUserPermissions(userId);
    return permissions.some(p => p.id === permissionId);
  }
  
  /**
   * Vérifier si un utilisateur peut effectuer une action sur une ressource
   */
  public can(userId: UserId, action: ActionType, resource: ResourceType, resourceId?: string): boolean {
    const permissions = this.getUserPermissions(userId);
    
    for (const permission of permissions) {
      if (permission.action === action && permission.resource === resource) {
        // Vérifier si la permission est spécifique à une ressource
        if (resourceId && permission.resourceId && permission.resourceId !== resourceId) {
          continue;
        }
        return true;
      }
    }
    
    return false;
  }
  
  // ============ SESSION MANAGEMENT ============
  
  /**
   * Créer une session
   */
  public createSession(userId: UserId, options?: { ip?: string; userAgent?: string }): SessionId {
    const user = this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} does not exist`);
    }
    
    // Vérifier le nombre maximum de sessions
    const userSessions = this.getUserSessions(userId);
    if (userSessions.length >= this.settings.maxSessions) {
      // Fermer la session la plus ancienne
      const oldestSession = userSessions[0];
      this.terminateSession(oldestSession.id);
    }
    
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = this.generateToken();
    
    const session: SecuritySession = {
      id: sessionId,
      userId,
      token,
      ip: options?.ip,
      userAgent: options?.userAgent,
      startTime: Date.now(),
      duration: 0,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.sessions.set(sessionId, session);
    this.emitEvent('session.created', { sessionId, userId });
    
    // Logger l'événement
    this.logAudit({
      action: 'login',
      resource: 'session',
      resourceId: sessionId,
      userId,
      sessionId,
      status: 'success',
      details: { ip: options?.ip, userAgent: options?.userAgent },
    });
    
    return sessionId;
  }
  
  /**
   * Obtenir une session par ID
   */
  public getSession(id: SessionId): SecuritySession | null {
    return this.sessions.get(id) || null;
  }
  
  /**
   * Obtenir toutes les sessions
   */
  public getAllSessions(): SecuritySession[] {
    return Array.from(this.sessions.values());
  }
  
  /**
   * Obtenir les sessions d'un utilisateur
   */
  public getUserSessions(userId: UserId): SecuritySession[] {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }
  
  /**
   * Terminer une session
   */
  public terminateSession(sessionId: SessionId): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    session.status = 'ended';
    session.updatedAt = Date.now();
    
    this.sessions.set(sessionId, session);
    this.emitEvent('session.terminated', { sessionId, userId: session.userId });
    
    // Logger l'événement
    this.logAudit({
      action: 'logout',
      resource: 'session',
      resourceId: sessionId,
      userId: session.userId,
      sessionId,
      status: 'success',
      details: { duration: session.duration },
    });
    
    return true;
  }
  
  /**
   * Valider un token de session
   */
  public validateSessionToken(token: string): SecuritySession | null {
    for (const session of this.sessions.values()) {
      if (session.token === token && session.status === 'active') {
        // Vérifier le timeout
        if (Date.now() - session.startTime > this.settings.sessionTimeout) {
          this.terminateSession(session.id);
          return null;
        }
        return session;
      }
    }
    return null;
  }
  
  /**
   * Rafraîchir une session
   */
  public refreshSession(sessionId: SessionId): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    session.startTime = Date.now();
    session.updatedAt = Date.now();
    
    this.sessions.set(sessionId, session);
    
    return true;
  }
  
  /**
   * Générer un token
   */
  private generateToken(): string {
    return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
  }
  
  // ============ AUDIT LOG ============
  
  /**
   * Logger un audit
   */
  public logAudit(entry: Partial<AuditEntry>): AuditEntry {
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: entry.userId,
      sessionId: entry.sessionId,
      action: entry.action || 'custom',
      resource: entry.resource || 'custom',
      resourceId: entry.resourceId,
      details: entry.details,
      status: entry.status || 'success',
      message: entry.message,
      ip: entry.ip,
      userAgent: entry.userAgent,
      timestamp: Date.now(),
      metadata: entry.metadata,
    };
    
    this.auditLog.push(auditEntry);
    
    // Limiter la taille
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }
    
    this.emitEvent('audit.logged', { auditEntry });
    
    return auditEntry;
  }
  
  /**
   * Obtenir le log d'audit
   */
  public getAuditLog(filters?: AuditFilter): AuditLog {
    let entries = [...this.auditLog];
    
    // Appliquer les filtres
    if (filters) {
      if (filters.users) {
        entries = entries.filter(e => filters.users?.includes(e.userId as UserId));
      }
      if (filters.actions) {
        entries = entries.filter(e => filters.actions?.includes(e.action as AuditAction));
      }
      if (filters.resources) {
        entries = entries.filter(e => filters.resources?.includes(e.resource as ResourceType));
      }
      if (filters.statuses) {
        entries = entries.filter(e => filters.statuses?.includes(e.status as 'success' | 'failure' | 'pending'));
      }
      if (filters.period) {
        entries = entries.filter(
          e => e.timestamp >= filters.period!.start && e.timestamp <= filters.period!.end
        );
      }
      if (filters.search) {
        entries = entries.filter(
          e => 
            String(e.userId).includes(filters.search!) ||
            String(e.action).includes(filters.search!) ||
            String(e.resource).includes(filters.search!) ||
            String(e.resourceId).includes(filters.search!) ||
            JSON.stringify(e.details).includes(filters.search!)
        );
      }
    }
    
    return {
      entries,
      filters,
      total: entries.length,
      page: 1,
      perPage: entries.length,
    };
  }
  
  /**
   * Effacer le log d'audit
   */
  public clearAuditLog(): void {
    this.auditLog = [];
  }
  
  // ============ ENCRYPTION ============
  
  /**
   * Ajouter une clé de chiffrement
   */
  public addEncryptionKey(key: EncryptionKey): string {
    const id = key.id || `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.encryptionKeys.has(id)) {
      throw new Error(`Encryption key with ID ${id} already exists`);
    }
    
    const newKey: EncryptionKey = {
      ...key,
      id,
      active: key.active !== false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.encryptionKeys.set(id, newKey);
    
    return id;
  }
  
  /**
   * Obtenir une clé de chiffrement
   */
  public getEncryptionKey(id: string): EncryptionKey | null {
    return this.encryptionKeys.get(id) || null;
  }
  
  /**
   * Obtenir toutes les clés de chiffrement
   */
  public getAllEncryptionKeys(): EncryptionKey[] {
    return Array.from(this.encryptionKeys.values());
  }
  
  /**
   * Supprimer une clé de chiffrement
   */
  public removeEncryptionKey(id: string): boolean {
    if (!this.encryptionKeys.has(id)) {
      return false;
    }
    
    this.encryptionKeys.delete(id);
    
    return true;
  }
  
  /**
   * Chiffrer des données (placeholder - à implémenter avec Web Crypto API)
   */
  public async encryptData(
    data: string,
    keyId: string,
    options?: { algorithm?: EncryptionAlgorithm }
  ): Promise<EncryptedData | null> {
    if (!this.settings.encryptionEnabled) {
      return null;
    }
    
    const key = this.getEncryptionKey(keyId);
    if (!key) {
      return null;
    }
    
    // Placeholder - à implémenter avec Web Crypto API
    const encryptedData: EncryptedData = {
      id: `enc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data: btoa(data), // Simple base64 encoding for demo
      iv: Math.random().toString(36).substr(2, 16),
      algorithm: options?.algorithm || 'aes-256-gcm',
      keyId,
      timestamp: Date.now(),
    };
    
    this.emitEvent('encryption.encrypted', { dataId: encryptedData.id });
    
    return encryptedData;
  }
  
  /**
   * Déchiffrer des données (placeholder - à implémenter avec Web Crypto API)
   */
  public async decryptData(
    encryptedData: EncryptedData
  ): Promise<string | null> {
    if (!this.settings.encryptionEnabled) {
      return null;
    }
    
    const key = this.getEncryptionKey(encryptedData.keyId);
    if (!key) {
      return null;
    }
    
    // Placeholder - à implémenter avec Web Crypto API
    try {
      return atob(encryptedData.data); // Simple base64 decoding for demo
    } catch {
      return null;
    }
  }
  
  // ============ RATE LIMIT ============
  
  /**
   * Ajouter une limite de taux
   */
  public addRateLimit(limit: RateLimit): string {
    const id = limit.id || `rate-limit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.rateLimits.has(id)) {
      throw new Error(`Rate limit with ID ${id} already exists`);
    }
    
    const newLimit: RateLimit = {
      ...limit,
      id,
      active: limit.active !== false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.rateLimits.set(id, newLimit);
    
    return id;
  }
  
  /**
   * Obtenir une limite de taux
   */
  public getRateLimit(id: string): RateLimit | null {
    return this.rateLimits.get(id) || null;
  }
  
  /**
   * Obtenir toutes les limites de taux
   */
  public getAllRateLimits(): RateLimit[] {
    return Array.from(this.rateLimits.values());
  }
  
  /**
   * Supprimer une limite de taux
   */
  public removeRateLimit(id: string): boolean {
    if (!this.rateLimits.has(id)) {
      return false;
    }
    
    this.rateLimits.delete(id);
    this.rateLimitStatuses.delete(id);
    
    return true;
  }
  
  /**
   * Vérifier une limite de taux
   */
  public checkRateLimit(
    limitId: string,
    identifier: string
  ): { allowed: boolean; status: RateLimitStatus | null } {
    if (!this.settings.rateLimitEnabled) {
      return { allowed: true, status: null };
    }
    
    const limit = this.rateLimits.get(limitId);
    if (!limit || !limit.active) {
      return { allowed: true, status: null };
    }
    
    const key = `${limitId}:${identifier}`;
    let status = this.rateLimitStatuses.get(key);
    
    if (!status) {
      status = {
        limitId,
        count: 0,
        resetAt: Date.now() + limit.period,
        blocked: false,
      };
      this.rateLimitStatuses.set(key, status);
    }
    
    // Vérifier si le temps est écoulé
    if (Date.now() > status.resetAt) {
      status.count = 0;
      status.resetAt = Date.now() + limit.period;
      status.blocked = false;
    }
    
    // Vérifier si bloqué
    if (status.blocked) {
      return { allowed: false, status };
    }
    
    // Incrémenter le compteur
    status.count++;
    
    // Vérifier si la limite est atteinte
    if (status.count >= limit.limit) {
      status.blocked = true;
      status.message = limit.config.settings?.message as string || 'Rate limit exceeded';
      this.emitEvent('rate_limit.hit', { limitId, identifier });
      this.emitEvent('rate_limit.blocked', { limitId, identifier });
    }
    
    this.rateLimitStatuses.set(key, status);
    
    return { allowed: !status.blocked, status };
  }
  
  /**
   * Réinitialiser une limite de taux
   */
  public resetRateLimit(limitId: string, identifier: string): void {
    const key = `${limitId}:${identifier}`;
    this.rateLimitStatuses.delete(key);
  }
  
  // ============ ACCESS CONTROL ============
  
  /**
   * Vérifier l'accès
   */
  public checkAccess(
    userId: UserId,
    action: ActionType,
    resource: ResourceType,
    resourceId?: string,
    context?: Record<string, unknown>
  ): { allowed: boolean; reason?: string } {
    // Vérifier si la sécurité est activée
    if (!this.settings.enabled) {
      return { allowed: true };
    }
    
    // Vérifier les politiques
    const policies = this.getAllPolicies();
    for (const policy of policies) {
      if (policy.active && this.checkPolicy(policy.id, context || {})) {
        // Vérifier si la politique autorise ou refuse l'accès
        if (policy.type === 'access') {
          const config = policy.config as PolicyConfig;
          
          // Vérifier si l'action et la ressource sont concernées
          if (
            (!config.actions || config.actions.includes(action)) &&
            (!config.resources || config.resources.includes(resource))
          ) {
            // Vérifier les rôles et utilisateurs
            if (
              (!config.roles || config.roles.includes('*')) ||
              (!config.users || config.users.includes(userId))
            ) {
              // La politique s'applique
              // Pour l'instant, on autorise
              return { allowed: true };
            }
          }
        }
      }
    }
    
    // Vérifier les permissions de l'utilisateur
    const allowed = this.can(userId, action, resource, resourceId);
    
    if (allowed) {
      this.logAudit({
        action,
        resource,
        resourceId,
        userId,
        status: 'success',
        details: { context },
      });
      this.emitEvent('access.granted', { userId, action, resource, resourceId });
      return { allowed: true };
    }
    
    this.logAudit({
      action,
      resource,
      resourceId,
      userId,
      status: 'failure',
      message: 'Access denied',
      details: { context },
    });
    this.emitEvent('access.denied', { userId, action, resource, resourceId });
    
    return { allowed: false, reason: 'Access denied' };
  }
  
  // ============ SETTINGS ============
  
  /**
   * Obtenir les paramètres
   */
  public getSettings(): SecuritySettings {
    return { ...this.settings };
  }
  
  /**
   * Mettre à jour les paramètres
   */
  public updateSettings(updates: Partial<SecuritySettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
    };
  }
  
  // ============ EVENT LISTENERS ============
  
  /**
   * Écouter un événement
   */
  public onEvent(type: SecurityEventType, callback: (event: SecurityEvent) => void): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);
    return () => this.eventListeners.get(type)?.delete(callback);
  }
  
  /**
   * Émettre un événement
   */
  private emitEvent(type: SecurityEventType, data?: Record<string, unknown>): void {
    const event: SecurityEvent = {
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
          console.error('Error in security event callback:', error);
        }
      });
    }
    
    // Émettre à tous les listeners
    const allListeners = this.eventListeners.get('*' as SecurityEventType);
    if (allListeners) {
      allListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in security event callback:', error);
        }
      });
    }
  }
  
  // ============ CLEANUP ============
  
  /**
   * Nettoyer
   */
  public cleanup(): void {
    this.permissions.clear();
    this.roles.clear();
    this.policies.clear();
    this.users.clear();
    this.sessions.clear();
    this.auditLog = [];
    this.encryptionKeys.clear();
    this.rateLimits.clear();
    this.rateLimitStatuses.clear();
    this.eventListeners.clear();
    this.settings = { ...DEFAULT_SECURITY_SETTINGS };
    
    // Réinitialiser les ressources système
    this.initializeSystemResources();
  }
}

// ============ INSTANCE ============

/**
 * Instance singleton du gestionnaire de sécurité
 */
export const securityManager = new SecurityManager();

// ============ EXPORT ============

export {
  SecurityManager,
  securityManager,
};
