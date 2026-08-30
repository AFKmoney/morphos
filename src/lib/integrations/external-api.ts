/**
 * External API Integrations
 * 
 * Module pour les intégrations avec les APIs externes
 * Support des webhooks, OAuth, et connections directes
 */

import type { ModuleType } from '$lib/types';

// ============ TYPES ============

/** Type d'intégration externe */
export type ExternalIntegrationType = 
  | 'webhook'
  | 'oauth'
  | 'api-key'
  | 'basic-auth'
  | 'websocket'
  | 'server-sent-events'
  | 'custom';

/** Statut d'une intégration */
export type ExternalIntegrationStatus = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'authenticated'
  | 'unauthenticated';

/** Configuration d'une intégration */
export interface ExternalIntegrationConfig {
  /** Nom de l'intégration */
  name: string;
  
  /** Type d'intégration */
  type: ExternalIntegrationType;
  
  /** Description */
  description: string;
  
  /** URL de base */
  baseUrl?: string;
  
  /** Endpoints */
  endpoints?: Record<string, string>;
  
  /** Clé API (pour api-key) */
  apiKey?: string;
  
  /** Secret API (pour api-key) */
  apiSecret?: string;
  
  /** Client ID (pour OAuth) */
  clientId?: string;
  
  /** Client Secret (pour OAuth) */
  clientSecret?: string;
  
  /** Redirect URI (pour OAuth) */
  redirectUri?: string;
  
  /** Scopes (pour OAuth) */
  scopes?: string[];
  
  /** Username (pour basic-auth) */
  username?: string;
  
  /** Password (pour basic-auth) */
  password?: string;
  
  /** Headers personnalisés */
  headers?: Record<string, string>;
  
  /** Paramètres par défaut */
  defaultParams?: Record<string, string | number | boolean>;
  
  /** Timeout (en ms) */
  timeout?: number;
  
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    delay: number;
    backoff: number;
  };
  
  /** SSL verification */
  sslVerify?: boolean;
  
  /** Modules associés */
  associatedModules?: ModuleType[];
  
  /** Actions disponibles */
  actions?: ExternalIntegrationAction[];
  
  /** Événements supportés */
  events?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Action d'une intégration */
export interface ExternalIntegrationAction {
  /** Nom de l'action */
  name: string;
  
  /** Description */
  description: string;
  
  /** Méthode HTTP */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  
  /** Endpoint */
  endpoint: string;
  
  /** Paramètres requis */
  requiredParams: string[];
  
  /** Paramètres optionnels */
  optionalParams?: string[];
  
  /** Corps de la requête (pour POST/PUT/PATCH) */
  requestBody?: Record<string, unknown> | ((params: Record<string, unknown>) => Record<string, unknown>);
  
  /** Transformation de la réponse */
  responseTransform?: (response: unknown) => unknown;
  
  /** Gestion des erreurs */
  errorHandler?: (error: Error, context?: Record<string, unknown>) => void;
}

/** Statut d'une intégration avec détails */
export interface ExternalIntegrationWithStatus extends ExternalIntegrationConfig {
  /** ID unique */
  id: string;
  
  /** Statut */
  status: ExternalIntegrationStatus;
  
  /** Dernière connexion */
  lastConnectedAt?: number;
  
  /** Dernière erreur */
  lastError?: string;
  
  /** Token d'accès (pour OAuth) */
  accessToken?: string;
  
  /** Token de rafraîchissement (pour OAuth) */
  refreshToken?: string;
  
  /** Date d'expiration du token */
  tokenExpiresAt?: number;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
}

/** Résultat d'une action */
export interface ExternalIntegrationActionResult {
  /** Succès */
  success: boolean;
  
  /** Données */
  data?: unknown;
  
  /** Erreur */
  error?: string;
  
  /** Statut HTTP */
  statusCode?: number;
  
  /** Headers de la réponse */
  headers?: Record<string, string>;
  
  /** Durée (en ms) */
  duration: number;
  
  /** Timestamp */
  timestamp: number;
}

/** Événement d'une intégration */
export interface ExternalIntegrationEvent {
  /** Type d'événement */
  type: 'connect' | 'disconnect' | 'error' | 'data' | 'message' | 'authenticate' | 'unauthenticate';
  
  /** ID de l'intégration */
  integrationId: string;
  
  /** Données */
  data?: unknown;
  
  /** Erreur */
  error?: string;
  
  /** Timestamp */
  timestamp: number;
}

/** Type de données pour les webhooks */
export interface WebhookData {
  /** Type d'événement */
  event: string;
  
  /** Données */
  payload: unknown;
  
  /** Headers */
  headers: Record<string, string>;
  
  /** Timestamp */
  timestamp: number;
  
  /** Signature (pour la vérification) */
  signature?: string;
}

/** Configuration d'un webhook */
export interface WebhookConfig {
  /** URL du webhook */
  url: string;
  
  /** Méthode */
  method: 'POST' | 'PUT' | 'PATCH';
  
  /** Événements à écouter */
  events: string[];
  
  /** Secret (pour la vérification) */
  secret?: string;
  
  /** Headers personnalisés */
  headers?: Record<string, string>;
  
  /** Transformation des données */
  transform?: (data: unknown) => unknown;
  
  /** Filtre des événements */
  filter?: (data: WebhookData) => boolean;
}

/** Configuration OAuth */
export interface OAuthConfig {
  /** Client ID */
  clientId: string;
  
  /** Client Secret */
  clientSecret: string;
  
  /** Authorize URL */
  authorizeUrl: string;
  
  /** Token URL */
  tokenUrl: string;
  
  /** Redirect URI */
  redirectUri: string;
  
  /** Scopes */
  scopes: string[];
  
  /** Type de grant */
  grantType: 'authorization_code' | 'client_credentials' | 'password';
  
  /** PKCE support */
  pkce?: boolean;
}

// ============ INTEGRATION PROVIDERS ============

/** Fournisseur d'intégration */
export type IntegrationProvider = 
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'slack'
  | 'discord'
  | 'teams'
  | 'google'
  | 'microsoft'
  | 'aws'
  | 'azure'
  | 'stripe'
  | 'paypal'
  | 'shopify'
  | 'salesforce'
  | 'zapier'
  | 'make'
  | 'n8n'
  | 'webhook'
  | 'custom';

/** Configuration par fournisseur */
export const PROVIDER_CONFIGS: Record<IntegrationProvider, Partial<ExternalIntegrationConfig>> = {
  github: {
    type: 'oauth',
    name: 'GitHub',
    description: 'Integration with GitHub repositories and API',
    baseUrl: 'https://api.github.com',
    endpoints: {
      repos: '/user/repos',
      user: '/user',
      issues: '/repos/{owner}/{repo}/issues',
      pullRequests: '/repos/{owner}/{repo}/pulls',
      commits: '/repos/{owner}/{repo}/commits',
    },
    scopes: ['repo', 'user', 'read:org'],
  },
  gitlab: {
    type: 'oauth',
    name: 'GitLab',
    description: 'Integration with GitLab repositories and API',
    baseUrl: 'https://gitlab.com/api/v4',
    endpoints: {
      projects: '/projects',
      user: '/user',
      issues: '/projects/{id}/issues',
      mergeRequests: '/projects/{id}/merge_requests',
      commits: '/projects/{id}/repository/commits',
    },
    scopes: ['api', 'read_user', 'read_repository'],
  },
  slack: {
    type: 'oauth',
    name: 'Slack',
    description: 'Integration with Slack workspace',
    baseUrl: 'https://slack.com/api',
    endpoints: {
      channels: '/conversations.list',
      messages: '/conversations.history',
      sendMessage: '/chat.postMessage',
      users: '/users.list',
    },
    scopes: ['channels:read', 'chat:write', 'users:read'],
  },
  discord: {
    type: 'oauth',
    name: 'Discord',
    description: 'Integration with Discord servers',
    baseUrl: 'https://discord.com/api/v10',
    endpoints: {
      guilds: '/users/@me/guilds',
      channels: '/guilds/{id}/channels',
      messages: '/channels/{id}/messages',
      sendMessage: '/channels/{id}/messages',
    },
    scopes: ['identify', 'guilds', 'messages.read', 'messages.send'],
  },
  google: {
    type: 'oauth',
    name: 'Google',
    description: 'Integration with Google services',
    baseUrl: 'https://www.googleapis.com',
    endpoints: {
      drive: '/drive/v3/files',
      calendar: '/calendar/v3/calendars',
      gmail: '/gmail/v1/users/me/messages',
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  },
  stripe: {
    type: 'api-key',
    name: 'Stripe',
    description: 'Integration with Stripe payment API',
    baseUrl: 'https://api.stripe.com/v1',
    endpoints: {
      customers: '/customers',
      payments: '/payments',
      invoices: '/invoices',
      webhooks: '/webhooks',
    },
  },
  zapier: {
    type: 'webhook',
    name: 'Zapier',
    description: 'Integration with Zapier webhooks',
    baseUrl: 'https://hooks.zapier.com',
    endpoints: {
      webhook: '/hooks/catch',
    },
  },
  make: {
    type: 'webhook',
    name: 'Make (Integromat)',
    description: 'Integration with Make webhooks',
    baseUrl: 'https://hook.make.com',
  },
  n8n: {
    type: 'webhook',
    name: 'n8n',
    description: 'Integration with n8n webhooks',
    baseUrl: 'https://n8n.io',
  },
};

// ============ EXTERNAL INTEGRATION MANAGER ============

/**
 * Gestionnaire des intégrations externes
 */
export class ExternalIntegrationManager {
  private integrations: Map<string, ExternalIntegrationWithStatus> = new Map();
  private eventListeners: Map<string, Set<(event: ExternalIntegrationEvent) => void>> = new Map();
  private webhookListeners: Map<string, Set<(data: WebhookData) => void>> = new Map();
  
  constructor() {
    // Initialiser les intégrations par défaut
    this.initializeDefaultIntegrations();
  }
  
  /**
   * Initialiser les intégrations par défaut
   */
  private initializeDefaultIntegrations(): void {
    // Rien pour l'instant, les intégrations sont ajoutées manuellement
  }
  
  /**
   * Ajouter une intégration
   */
  public addIntegration(config: ExternalIntegrationConfig): string {
    const id = `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const integration: ExternalIntegrationWithStatus = {
      ...config,
      id,
      status: 'idle',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.integrations.set(id, integration);
    this.emit({ type: 'connect', integrationId: id, timestamp: Date.now() });
    
    return id;
  }
  
  /**
   * Supprimer une intégration
   */
  public removeIntegration(id: string): boolean {
    const integration = this.integrations.get(id);
    if (integration) {
      this.disconnect(id);
      this.integrations.delete(id);
      this.emit({ type: 'disconnect', integrationId: id, timestamp: Date.now() });
      return true;
    }
    return false;
  }
  
  /**
   * Obtenir une intégration
   */
  public getIntegration(id: string): ExternalIntegrationWithStatus | null {
    return this.integrations.get(id) || null;
  }
  
  /**
   * Obtenir toutes les intégrations
   */
  public getAllIntegrations(): ExternalIntegrationWithStatus[] {
    return Array.from(this.integrations.values());
  }
  
  /**
   * Obtenir les intégrations par type
   */
  public getIntegrationsByType(type: ExternalIntegrationType): ExternalIntegrationWithStatus[] {
    return Array.from(this.integrations.values()).filter(i => i.type === type);
  }
  
  /**
   * Obtenir les intégrations par statut
   */
  public getIntegrationsByStatus(status: ExternalIntegrationStatus): ExternalIntegrationWithStatus[] {
    return Array.from(this.integrations.values()).filter(i => i.status === status);
  }
  
  /**
   * Obtenir les intégrations par module
   */
  public getIntegrationsByModule(moduleType: ModuleType): ExternalIntegrationWithStatus[] {
    return Array.from(this.integrations.values()).filter(i =>
      i.associatedModules?.includes(moduleType)
    );
  }
  
  /**
   * Connecter une intégration
   */
  public async connect(id: string): Promise<boolean> {
    const integration = this.integrations.get(id);
    if (!integration) return false;
    
    try {
      this.updateStatus(id, 'connecting');
      
      switch (integration.type) {
        case 'webhook':
          await this.connectWebhook(id);
          break;
        case 'oauth':
          await this.connectOAuth(id);
          break;
        case 'api-key':
          await this.connectApiKey(id);
          break;
        case 'basic-auth':
          await this.connectBasicAuth(id);
          break;
        case 'websocket':
          await this.connectWebSocket(id);
          break;
        case 'server-sent-events':
          await this.connectSSE(id);
          break;
        case 'custom':
          await this.connectCustom(id);
          break;
      }
      
      this.updateStatus(id, 'connected');
      this.emit({ type: 'connect', integrationId: id, timestamp: Date.now() });
      return true;
    } catch (error) {
      this.updateStatus(id, 'error', error instanceof Error ? error.message : 'Unknown error');
      this.emit({ type: 'error', integrationId: id, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now() });
      return false;
    }
  }
  
  /**
   * Déconnecter une intégration
   */
  public disconnect(id: string): boolean {
    const integration = this.integrations.get(id);
    if (!integration) return false;
    
    this.updateStatus(id, 'disconnected');
    this.emit({ type: 'disconnect', integrationId: id, timestamp: Date.now() });
    return true;
  }
  
  /**
   * Mettre à jour le statut
   */
  private updateStatus(id: string, status: ExternalIntegrationStatus, error?: string): void {
    const integration = this.integrations.get(id);
    if (integration) {
      this.integrations.set(id, {
        ...integration,
        status,
        lastError: error || undefined,
        lastConnectedAt: status === 'connected' ? Date.now() : integration.lastConnectedAt,
        updatedAt: Date.now(),
      });
    }
  }
  
  /**
   * Connecter un webhook
   */
  private async connectWebhook(id: string): Promise<void> {
    const integration = this.integrations.get(id);
    if (!integration) throw new Error('Integration not found');
    
    // Pour les webhooks, on ne fait que configurer l'écouteur
    // La connexion est gérée par le serveur distant
    this.updateStatus(id, 'connected');
  }
  
  /**
   * Connecter OAuth
   */
  private async connectOAuth(id: string): Promise<void> {
    const integration = this.integrations.get(id);
    if (!integration) throw new Error('Integration not found');
    
    // Implémentation de base pour OAuth
    // À compléter avec le flow OAuth complet
    if (!integration.clientId || !integration.clientSecret) {
      throw new Error('OAuth requires clientId and clientSecret');
    }
    
    // Pour l'instant, on simule la connexion
    this.updateStatus(id, 'authenticated');
  }
  
  /**
   * Connecter avec API Key
   */
  private async connectApiKey(id: string): Promise<void> {
    const integration = this.integrations.get(id);
    if (!integration) throw new Error('Integration not found');
    
    if (!integration.apiKey) {
      throw new Error('API Key integration requires apiKey');
    }
    
    // Tester la connexion avec un appel simple
    try {
      const response = await fetch(`${integration.baseUrl || ''}/`, {
        headers: {
          'Authorization': `Bearer ${integration.apiKey}`,
          ...integration.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`API Key rejected: ${response.status}`);
      }
      
      this.updateStatus(id, 'connected');
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Connecter avec Basic Auth
   */
  private async connectBasicAuth(id: string): Promise<void> {
    const integration = this.integrations.get(id);
    if (!integration) throw new Error('Integration not found');
    
    if (!integration.username || !integration.password) {
      throw new Error('Basic Auth requires username and password');
    }
    
    // Tester la connexion
    try {
      const response = await fetch(`${integration.baseUrl || ''}/`, {
        headers: {
          'Authorization': `Basic ${btoa(`${integration.username}:${integration.password}`)}`,
          ...integration.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Basic Auth failed: ${response.status}`);
      }
      
      this.updateStatus(id, 'connected');
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Connecter WebSocket
   */
  private async connectWebSocket(id: string): Promise<void> {
    const integration = this.integrations.get(id);
    if (!integration) throw new Error('Integration not found');
    
    // À implémenter
    this.updateStatus(id, 'connected');
  }
  
  /**
   * Connecter Server-Sent Events
   */
  private async connectSSE(id: string): Promise<void> {
    const integration = this.integrations.get(id);
    if (!integration) throw new Error('Integration not found');
    
    // À implémenter
    this.updateStatus(id, 'connected');
  }
  
  /**
   * Connecter une intégration personnalisée
   */
  private async connectCustom(id: string): Promise<void> {
    const integration = this.integrations.get(id);
    if (!integration) throw new Error('Integration not found');
    
    // À implémenter par l'utilisateur
    this.updateStatus(id, 'connected');
  }
  
  /**
   * Exécuter une action sur une intégration
   */
  public async executeAction(
    integrationId: string,
    actionName: string,
    params?: Record<string, unknown>
  ): Promise<ExternalIntegrationActionResult> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return {
        success: false,
        error: 'Integration not found',
        duration: 0,
        timestamp: Date.now(),
      };
    }
    
    const action = integration.actions?.find(a => a.name === actionName);
    if (!action) {
      return {
        success: false,
        error: `Action '${actionName}' not found`,
        duration: 0,
        timestamp: Date.now(),
      };
    }
    
    const startTime = Date.now();
    
    try {
      // Préparer les paramètres
      const finalParams = { ...params };
      
      // Vérifier les paramètres requis
      for (const requiredParam of action.requiredParams) {
        if (finalParams[requiredParam] === undefined) {
          throw new Error(`Missing required parameter: ${requiredParam}`);
        }
      }
      
      // Construire l'URL
      let url = `${integration.baseUrl || ''}${action.endpoint}`;
      
      // Ajouter les paramètres de query
      const queryParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(finalParams)) {
        if (action.optionalParams?.includes(key) || action.requiredParams.includes(key)) {
          if (value !== undefined && value !== null) {
            queryParams[key] = String(value);
          }
        }
      }
      
      if (Object.keys(queryParams).length > 0) {
        url += `?${new URLSearchParams(queryParams).toString()}`;
      }
      
      // Construire les headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...integration.headers,
      };
      
      // Ajouter l'authentification
      if (integration.apiKey) {
        headers['Authorization'] = `Bearer ${integration.apiKey}`;
      } else if (integration.username && integration.password) {
        headers['Authorization'] = `Basic ${btoa(`${integration.username}:${integration.password}`)}`;
      } else if (integration.accessToken) {
        headers['Authorization'] = `Bearer ${integration.accessToken}`;
      }
      
      // Exécuter la requête
      const options: RequestInit = {
        method: action.method,
        headers,
      };
      
      if (action.method !== 'GET' && action.method !== 'HEAD') {
        if (action.requestBody) {
          options.body = JSON.stringify(
            typeof action.requestBody === 'function' 
              ? action.requestBody(finalParams)
              : action.requestBody
          );
        } else if (Object.keys(finalParams).length > 0) {
          options.body = JSON.stringify(finalParams);
        }
      }
      
      const response = await fetch(url, options);
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }
      
      // Appliquer la transformation de la réponse
      if (action.responseTransform) {
        data = action.responseTransform(data);
      }
      
      this.emit({ type: 'data', integrationId, data, timestamp: Date.now() });
      
      return {
        success: true,
        data,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        duration,
        timestamp: Date.now(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (action.errorHandler) {
        action.errorHandler(error instanceof Error ? error : new Error(String(error)), params);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * Enregistrer un webhook
   */
  public registerWebhook(url: string, events: string[], callback: (data: WebhookData) => void): string {
    const id = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.webhookListeners.has(id)) {
      this.webhookListeners.set(id, new Set());
    }
    
    this.webhookListeners.get(id)!.add(callback);
    
    return id;
  }
  
  /**
   * Désenregistrer un webhook
   */
  public unregisterWebhook(id: string, callback: (data: WebhookData) => void): boolean {
    const listeners = this.webhookListeners.get(id);
    if (listeners) {
      listeners.delete(callback);
      return true;
    }
    return false;
  }
  
  /**
   * Recevoir un webhook
   */
  public receiveWebhook(id: string, data: WebhookData): void {
    const listeners = this.webhookListeners.get(id);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in webhook callback:', error);
        }
      });
    }
  }
  
  /**
   * Émettre un événement
   */
  public emit(event: ExternalIntegrationEvent): void {
    const listeners = this.eventListeners.get(event.integrationId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in integration event callback:', error);
        }
      });
    }
    
    // Émettre à tous les listeners
    for (const [, callbackSet] of this.eventListeners) {
      if (callbackSet !== listeners) {
        callbackSet.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error('Error in integration event callback:', error);
          }
        });
      }
    }
  }
  
  /**
   * Écouter les événements d'une intégration
   */
  public onIntegrationEvent(integrationId: string, callback: (event: ExternalIntegrationEvent) => void): void {
    if (!this.eventListeners.has(integrationId)) {
      this.eventListeners.set(integrationId, new Set());
    }
    this.eventListeners.get(integrationId)!.add(callback);
  }
  
  /**
   * Arrêter d'écouter les événements
   */
  public offIntegrationEvent(integrationId: string, callback: (event: ExternalIntegrationEvent) => void): void {
    const listeners = this.eventListeners.get(integrationId);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  /**
   * Mettre à jour une intégration
   */
  public updateIntegration(id: string, updates: Partial<ExternalIntegrationConfig>): boolean {
    const integration = this.integrations.get(id);
    if (integration) {
      this.integrations.set(id, {
        ...integration,
        ...updates,
        updatedAt: Date.now(),
      });
      return true;
    }
    return false;
  }
  
  /**
   * Nettoyer
   */
  public cleanup(): void {
    this.integrations.clear();
    this.eventListeners.clear();
    this.webhookListeners.clear();
  }
}

/**
 * Instance singleton du gestionnaire d'intégrations
 */
export const externalIntegrationManager = new ExternalIntegrationManager();

// ============ UTILITY FUNCTIONS ============

/**
 * Créer une configuration OAuth
 */
export function createOAuthConfig(
  clientId: string,
  clientSecret: string,
  authorizeUrl: string,
  tokenUrl: string,
  redirectUri: string,
  scopes: string[]
): OAuthConfig {
  return {
    clientId,
    clientSecret,
    authorizeUrl,
    tokenUrl,
    redirectUri,
    scopes,
    grantType: 'authorization_code',
    pkce: true,
  };
}

/**
 * Créer une configuration de webhook
 */
export function createWebhookConfig(
  url: string,
  events: string[],
  secret?: string
): WebhookConfig {
  return {
    url,
    method: 'POST',
    events,
    secret,
  };
}

/**
 * Créer une intégration API Key
 */
export function createApiKeyIntegration(
  name: string,
  baseUrl: string,
  apiKey: string,
  endpoints?: Record<string, string>
): ExternalIntegrationConfig {
  return {
    name,
    type: 'api-key',
    description: `API Key integration for ${name}`,
    baseUrl,
    apiKey,
    endpoints,
    timeout: 30000,
    retry: {
      maxAttempts: 3,
      delay: 1000,
      backoff: 2,
    },
    sslVerify: true,
  };
}

/**
 * Créer une intégration Basic Auth
 */
export function createBasicAuthIntegration(
  name: string,
  baseUrl: string,
  username: string,
  password: string
): ExternalIntegrationConfig {
  return {
    name,
    type: 'basic-auth',
    description: `Basic Auth integration for ${name}`,
    baseUrl,
    username,
    password,
    timeout: 30000,
    sslVerify: true,
  };
}

/**
 * Vérifier si une URL est valide
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Générer un ID unique pour une intégration
 */
export function generateIntegrationId(): string {
  return `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============ EXPORT ============

export const externalIntegrationExports = {
  externalIntegrationManager,
  ExternalIntegrationManager,
  createOAuthConfig,
  createWebhookConfig,
  createApiKeyIntegration,
  createBasicAuthIntegration,
  isValidUrl,
  generateIntegrationId,
  PROVIDER_CONFIGS,
};
