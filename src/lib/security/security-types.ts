/**
 * Advanced Security System - Types
 * 
 * Système complet de sécurité pour MorphOS
 */

// ============ CORE TYPES ============

/** Identifiant unique d'une permission */
export type PermissionId = string;

/** Identifiant unique d'un rôle */
export type RoleId = string;

/** Identifiant unique d'une politique */
export type PolicyId = string;

/** Identifiant unique d'un utilisateur */
export type UserId = string;

/** Identifiant unique d'une session */
export type SessionId = string;

/** Type d'action */
export type ActionType = 
  | 'read'          // Lecture
  | 'write'         // Écriture
  | 'delete'        // Suppression
  | 'execute'       // Exécution
  | 'admin'         // Administration
  | 'manage'        // Gestion
  | 'create'        // Création
  | 'update'        // Mise à jour
  | 'list'          // Liste
  | 'export'        // Export
  | 'import'        // Import
  | 'share'         // Partage
  | 'access'        // Accès
  | 'custom';       // Personnalisé

/** Type de ressource */
export type ResourceType = 
  | 'workspace'     // Workspace
  | 'module'        // Module
  | 'window'        // Fenêtre
  | 'file'          // Fichier
  | 'directory'     // Répertoire
  | 'plugin'        // Plugin
  | 'user'          // Utilisateur
  | 'role'          // Rôle
  | 'policy'        // Politique
  | 'session'       // Session
  | 'command'       // Commande
  | 'ai'            // IA
  | 'integration'   // Intégration
  | 'script'        // Script
  | 'theme'         // Thème
  | 'analytics'     // Analytics
  | 'settings'      // Paramètres
  | 'custom';       // Personnalisé

/** Statut de sécurité */
export type SecurityStatus = 
  | 'active'      // Actif
  | 'inactive'    // Inactif
  | 'pending'     // En attente
  | 'blocked'     // Bloqué
  | 'expired'     // Expiré
  | 'revoked'     // Révoqué
  | 'error';      // Erreur

/** Niveau de sécurité */
export type SecurityLevel = 
  | 'low'       // Faible
  | 'medium'    // Moyen
  | 'high'      // Élevé
  | 'critical'; // Critique

// ============ PERMISSION TYPES ============

/** Permission */
export interface Permission {
  /** ID unique */
  id: PermissionId;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type d'action */
  action: ActionType;
  
  /** Type de ressource */
  resource: ResourceType;
  
  /** Ressource spécifique */
  resourceId?: string;
  
  /** Niveau */
  level: SecurityLevel;
  
  /** Actif */
  active: boolean;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Permission système */
export interface SystemPermission extends Permission {
  /** Permission système */
  system: true;
  
  /** Ne peut pas être modifiée */
  readonly: boolean;
}

/** Permission personnalisée */
export interface CustomPermission extends Permission {
  /** Permission personnalisée */
  system: false;
}

// ============ ROLE TYPES ============

/** Rôle */
export interface Role {
  /** ID unique */
  id: RoleId;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Permissions */
  permissions: PermissionId[];
  
  /** Héritage */
  inherits?: RoleId[];
  
  /** Niveau */
  level: SecurityLevel;
  
  /** Actif */
  active: boolean;
  
  /** Système */
  system: boolean;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Rôle système */
export interface SystemRole extends Role {
  system: true;
  readonly: boolean;
}

/** Rôle personnalisé */
export interface CustomRole extends Role {
  system: false;
}

// ============ POLICY TYPES ============

/** Politique */
export interface Policy {
  /** ID unique */
  id: PolicyId;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type */
  type: 'access' | 'rate_limit' | 'encryption' | 'audit' | 'custom';
  
  /** Configuration */
  config: PolicyConfig;
  
  /** Actif */
  active: boolean;
  
  /** Priorité */
  priority: number;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Configuration de politique */
export interface PolicyConfig {
  /** Ressources */
  resources?: ResourceType[];
  
  /** Actions */
  actions?: ActionType[];
  
  /** Rôles */
  roles?: RoleId[];
  
  /** Utilisateurs */
  users?: UserId[];
  
  /** Conditions */
  conditions?: PolicyCondition[];
  
  /** Paramètres */
  settings?: Record<string, unknown>;
}

/** Condition de politique */
export interface PolicyCondition {
  /** Type */
  type: 'time' | 'ip' | 'user_agent' | 'location' | 'custom';
  
  /** Opérateur */
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'not_contains';
  
  /** Valeur */
  value: unknown;
  
  /** Message */
  message?: string;
}

// ============ USER TYPES ============

/** Utilisateur */
export interface SecurityUser {
  /** ID unique */
  id: UserId;
  
  /** Nom */
  name: string;
  
  /** Email */
  email?: string;
  
  /** Rôles */
  roles: RoleId[];
  
  /** Permissions directes */
  permissions: PermissionId[];
  
  /** Groupes */
  groups?: string[];
  
  /** Actif */
  active: boolean;
  
  /** Verrouillé */
  locked: boolean;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Dernière connexion */
  lastLoginAt?: number;
  
  /** Dernière activité */
  lastActivityAt?: number;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Session */
export interface SecuritySession {
  /** ID unique */
  id: SessionId;
  
  /** User ID */
  userId: UserId;
  
  /** Token */
  token: string;
  
  /** IP */
  ip?: string;
  
  /** User Agent */
  userAgent?: string;
  
  /** Début */
  startTime: number;
  
  /** Fin */
  endTime?: number;
  
  /** Durée (en ms) */
  duration: number;
  
  /** Statut */
  status: SecurityStatus;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

// ============ AUDIT TYPES ============

/** Action d'audit */
export type AuditAction = 
  | 'create'      // Création
  | 'read'        // Lecture
  | 'update'      // Mise à jour
  | 'delete'      // Suppression
  | 'login'       // Connexion
  | 'logout'      // Déconnexion
  | 'access'      // Accès
  | 'deny'        // Refus
  | 'error'       // Erreur
  | 'custom';     // Personnalisé

/** Entrée d'audit */
export interface AuditEntry {
  /** ID unique */
  id: string;
  
  /** User ID */
  userId?: UserId;
  
  /** Session ID */
  sessionId?: SessionId;
  
  /** Action */
  action: AuditAction;
  
  /** Ressource */
  resource: ResourceType;
  
  /** Ressource ID */
  resourceId?: string;
  
  /** Détails */
  details?: Record<string, unknown>;
  
  /** Statut */
  status: 'success' | 'failure' | 'pending';
  
  /** Message */
  message?: string;
  
  /** IP */
  ip?: string;
  
  /** User Agent */
  userAgent?: string;
  
  /** Timestamp */
  timestamp: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Log d'audit */
export interface AuditLog {
  /** Entrées */
  entries: AuditEntry[];
  
  /** Filtres */
  filters?: AuditFilter;
  
  /** Tri */
  sort?: { field: string; order: 'asc' | 'desc' };
  
  /** Total */
  total: number;
  
  /** Page */
  page: number;
  
  /** Par page */
  perPage: number;
}

/** Filtre d'audit */
export interface AuditFilter {
  /** Users */
  users?: UserId[];
  
  /** Actions */
  actions?: AuditAction[];
  
  /** Ressources */
  resources?: ResourceType[];
  
  /** Statuts */
  statuses?: ('success' | 'failure' | 'pending')[];
  
  /** Période */
  period?: { start: number; end: number };
  
  /** Recherche */
  search?: string;
}

// ============ ENCRYPTION TYPES ============

/** Algorithme de chiffrement */
export type EncryptionAlgorithm = 
  | 'aes-256-gcm'    // AES-256-GCM
  | 'aes-256-cbc'    // AES-256-CBC
  | 'rsa-2048'       // RSA-2048
  | 'rsa-4096'       // RSA-4096
  | 'custom';        // Personnalisé

/** Type de clé */
export type KeyType = 
  | 'symmetric'      // Symétrique
  | 'asymmetric'     // Asymétrique
  | 'password'       // Mot de passe
  | 'custom';        // Personnalisé

/** Clé de chiffrement */
export interface EncryptionKey {
  /** ID unique */
  id: string;
  
  /** Nom */
  nom: string;
  
  /** Type */
  type: KeyType;
  
  /** Algorithme */
  algorithm: EncryptionAlgorithm;
  
  /** Clé (chiffrée) */
  key: string;
  
  /** IV (chiffré) */
  iv?: string;
  
  /** Sel */
  salt?: string;
  
  /** Actif */
  active: boolean;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Données chiffrées */
export interface EncryptedData {
  /** ID unique */
  id: string;
  
  /** Données chiffrées */
  data: string;
  
  /** IV */
  iv: string;
  
  /** Sel */
  salt?: string;
  
  /** Algorithme */
  algorithm: EncryptionAlgorithm;
  
  /** Clé ID */
  keyId: string;
  
  /** Timestamp */
  timestamp: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

// ============ RATE LIMIT TYPES ============

/** Limite de taux */
export interface RateLimit {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Ressource */
  resource: ResourceType;
  
  /** Action */
  action: ActionType;
  
  /** Limite */
  limit: number;
  
  /** Période (en ms) */
  period: number;
  
  /** Type de période */
  periodType: 'second' | 'minute' | 'hour' | 'day' | 'custom';
  
  /** Actif */
  active: boolean;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** État de la limite de taux */
export interface RateLimitStatus {
  /** Limite ID */
  limitId: string;
  
  /** Compteur */
  count: number;
  
  /** Réinitialisation */
  resetAt: number;
  
  /** Bloqué */
  blocked: boolean;
  
  /** Message */
  message?: string;
}

// ============ SECURITY EVENTS ============

/** Type d'événement de sécurité */
export type SecurityEventType = 
  | 'permission.added'
  | 'permission.removed'
  | 'permission.updated'
  | 'role.added'
  | 'role.removed'
  | 'role.updated'
  | 'policy.added'
  | 'policy.removed'
  | 'policy.updated'
  | 'user.added'
  | 'user.removed'
  | 'user.updated'
  | 'session.created'
  | 'session.terminated'
  | 'access.granted'
  | 'access.denied'
  | 'audit.logged'
  | 'encryption.encrypted'
  | 'encryption.decrypted'
  | 'rate_limit.hit'
  | 'rate_limit.blocked'
  | 'error';

/** Événement de sécurité */
export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

// ============ SECURITY SETTINGS ============

/** Paramètres de sécurité */
export interface SecuritySettings {
  /** Actif */
  enabled: boolean;
  
  /** Niveau de sécurité par défaut */
  defaultLevel: SecurityLevel;
  
  /** Audit activé */
  auditEnabled: boolean;
  
  /** Chiffrement activé */
  encryptionEnabled: boolean;
  
  /** Limite de taux activée */
  rateLimitEnabled: boolean;
  
  /** Session timeout (en ms) */
  sessionTimeout: number;
  
  /** Maximum de sessions */
  maxSessions: number;
  
  /** Maximum de tentatives de connexion */
  maxLoginAttempts: number;
  
  /** Bloquer après tentatives */
  blockAfterAttempts: boolean;
  
  /** Durée de blocage (en ms) */
  blockDuration: number;
  
  /** Synchronisation */
  sync: boolean;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

// ============ DEFAULT VALUES ============

/** Paramètres par défaut */
export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  enabled: true,
  defaultLevel: 'medium',
  auditEnabled: true,
  encryptionEnabled: false,
  rateLimitEnabled: true,
  sessionTimeout: 3600000, // 1 heure
  maxSessions: 5,
  maxLoginAttempts: 5,
  blockAfterAttempts: true,
  blockDuration: 900000, // 15 minutes
  sync: false,
};

/** Rôles système par défaut */
export const DEFAULT_SYSTEM_ROLES: SystemRole[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administrateur avec tous les droits',
    permissions: [],
    inherits: [],
    level: 'critical',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'default'],
  },
  {
    id: 'user',
    name: 'User',
    description: 'Utilisateur standard',
    permissions: [],
    inherits: [],
    level: 'medium',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'default'],
  },
  {
    id: 'guest',
    name: 'Guest',
    description: 'Invité avec droits limités',
    permissions: [],
    inherits: [],
    level: 'low',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'default'],
  },
];

/** Permissions système par défaut */
export const DEFAULT_SYSTEM_PERMISSIONS: SystemPermission[] = [
  {
    id: 'workspace:read',
    name: 'Read Workspace',
    description: 'Lire un workspace',
    action: 'read',
    resource: 'workspace',
    level: 'low',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'workspace', 'read'],
  },
  {
    id: 'workspace:write',
    name: 'Write Workspace',
    description: 'Écrire dans un workspace',
    action: 'write',
    resource: 'workspace',
    level: 'medium',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'workspace', 'write'],
  },
  {
    id: 'workspace:delete',
    name: 'Delete Workspace',
    description: 'Supprimer un workspace',
    action: 'delete',
    resource: 'workspace',
    level: 'high',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'workspace', 'delete'],
  },
  {
    id: 'module:read',
    name: 'Read Module',
    description: 'Lire un module',
    action: 'read',
    resource: 'module',
    level: 'low',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'module', 'read'],
  },
  {
    id: 'module:execute',
    name: 'Execute Module',
    description: 'Exécuter un module',
    action: 'execute',
    resource: 'module',
    level: 'medium',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'module', 'execute'],
  },
  {
    id: 'file:read',
    name: 'Read File',
    description: 'Lire un fichier',
    action: 'read',
    resource: 'file',
    level: 'low',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'file', 'read'],
  },
  {
    id: 'file:write',
    name: 'Write File',
    description: 'Écrire dans un fichier',
    action: 'write',
    resource: 'file',
    level: 'medium',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'file', 'write'],
  },
  {
    id: 'file:delete',
    name: 'Delete File',
    description: 'Supprimer un fichier',
    action: 'delete',
    resource: 'file',
    level: 'high',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'file', 'delete'],
  },
  {
    id: 'plugin:install',
    name: 'Install Plugin',
    description: 'Installer un plugin',
    action: 'create',
    resource: 'plugin',
    level: 'high',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'plugin', 'install'],
  },
  {
    id: 'user:manage',
    name: 'Manage Users',
    description: 'Gérer les utilisateurs',
    action: 'manage',
    resource: 'user',
    level: 'critical',
    active: true,
    system: true,
    readonly: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['system', 'user', 'manage'],
  },
];

// ============ EXPORT ============

export default {
  // Core Types
  PermissionId,
  RoleId,
  PolicyId,
  UserId,
  SessionId,
  ActionType,
  ResourceType,
  SecurityStatus,
  SecurityLevel,
  
  // Permission Types
  Permission,
  SystemPermission,
  CustomPermission,
  
  // Role Types
  Role,
  SystemRole,
  CustomRole,
  
  // Policy Types
  Policy,
  PolicyConfig,
  PolicyCondition,
  
  // User Types
  SecurityUser,
  SecuritySession,
  
  // Audit Types
  AuditAction,
  AuditEntry,
  AuditLog,
  AuditFilter,
  
  // Encryption Types
  EncryptionAlgorithm,
  KeyType,
  EncryptionKey,
  EncryptedData,
  
  // Rate Limit Types
  RateLimit,
  RateLimitStatus,
  
  // Event Types
  SecurityEventType,
  SecurityEvent,
  
  // Settings Types
  SecuritySettings,
  
  // Default Values
  DEFAULT_SECURITY_SETTINGS,
  DEFAULT_SYSTEM_ROLES,
  DEFAULT_SYSTEM_PERMISSIONS,
};
