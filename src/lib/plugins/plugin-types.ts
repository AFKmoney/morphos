"use client";

import type { ModuleType } from "../window-store";

/**
 * Permissions qu'un plugin peut demander
 * Chaque permission donne accès à une fonctionnalité spécifique de MorphOS
 */
export type PluginPermission = 
  // Filesystem
  | 'fs.read'      // Lire des fichiers (VFS)
  | 'fs.write'     // Écrire des fichiers (VFS)
  | 'fs.delete'    // Supprimer des fichiers (VFS)
  | 'fs.list'      // Lister les fichiers (VFS)
  
  // Network
  | 'network.http'      // Requêtes HTTP (fetch)
  | 'network.websocket' // Connexions WebSocket
  | 'network.sse'      // Server-Sent Events
  
  // Storage
  | 'storage.local'     // Accès à localStorage
  | 'storage.session'    // Accès à sessionStorage
  | 'storage.indexeddb' // Accès direct à IndexedDB
  
  // IA
  | 'ai.chat'          // Utiliser les APIs de chat IA
  | 'ai.generate'      // Générer du code/module via IA
  | 'ai.image'         // Générer des images via IA
  | 'ai.embed'         // Accès aux embeddings (RAG)
  
  // UI
  | 'ui.notify'        // Afficher des notifications
  | 'ui.modal'         // Ouvrir des modales
  | 'ui.toast'         // Afficher des toasts
  | 'ui.contextmenu'   // Ajouter des items au menu contextuel
  | 'ui.topbar'        // Ajouter des items à la top bar
  | 'ui.sidebar'       // Ajouter des items à la sidebar
  
  // Windows
  | 'window.create'    // Créer de nouvelles fenêtres
  | 'window.close'     // Fermer des fenêtres
  | 'window.control'   // Contrôler les fenêtres (minimize, maximize)
  | 'window.layout'    // Modifier le layout des fenêtres
  
  // System
  | 'system.info'      // Accès aux infos système (navigateur, OS)
  | 'system.clipboard' // Accès au clipboard
  | 'system.voice'     // Accès à la reconnaissance vocale
  | 'system.geolocation' // Accès à la géolocalisation
  
  // Advanced
  | 'plugin.manage'    // Gérer d'autres plugins (admin)
  | 'user.auth'        // Accès à l'authentification user
  | 'user.data'        // Accès aux données user (avec consentement)
  | 'settings.read'    // Lire les settings
  | 'settings.write';   // Modifier les settings

/**
 * Manifest d'un plugin - Métadonnées statiques
 */
export interface PluginManifest {
  /** Identifiant unique du plugin (format: @author/plugin-name) */
  id: string;
  
  /** Nom affiché du plugin */
  name: string;
  
  /** Description du plugin */
  description: string;
  
  /** Version du plugin (semver) */
  version: string;
  
  /** Auteur du plugin */
  author: string;
  
  /** URL du repository (optionnel) */
  repository?: string;
  
  /** URL de la documentation (optionnel) */
  docsUrl?: string;
  
  /** Icône du plugin (composant React ou URL) */
  icon: React.ComponentType<{ className?: string }> | string;
  
  /** Catégorie du plugin */
  category: PluginCategory;
  
  /** Permissions requises par le plugin */
  permissions: PluginPermission[];
  
  /** Dépendances (IDs d'autres plugins) */
  dependencies?: string[];
  
  /** Version minimale de MorphOS requise */
  morphosVersion?: string;
  
  /** Tags pour la recherche */
  tags?: string[];
}

/** Catégories de plugins */
export type PluginCategory = 
  | 'utility'      // Utilitaires (calculatrice, convertisseur, etc.)
  | 'development'  // Développement (éditeurs, debuggers, etc.)
  | 'productivity' // Productivité (todo, notes, calendar, etc.)
  | 'entertainment' // Divertissement (jeux, musique, etc.)
  | 'finance'      // Finance (crypto, stocks, budget, etc.)
  | 'social'       // Social (chat, collaboration, etc.)
  | 'ai'           // IA (génération, analyse, etc.)
  | 'data'         // Données (visualisation, bases de données, etc.)
  | 'system'       // Système (monitor, metrics, etc.)
  | 'custom';      // Personnalisé

/**
 * Runtime d'un plugin - Code exécutable
 */
export interface PluginRuntime {
  /** Composant principal du plugin (affiché dans une fenêtre) */
  component: React.ComponentType<{ 
    windowId?: string;
    config?: Record<string, unknown>;
  }>;
  
  /** Composant de configuration (optionnel) */
  settingsComponent?: React.ComponentType<{
    onSave: (settings: Record<string, unknown>) => void;
    currentSettings: Record<string, unknown>;
  }>;
  
  /** Callback appelé quand le plugin est chargé */
  onLoad?: (context: PluginContext) => void | Promise<void>;
  
  /** Callback appelé quand le plugin est déchargé */
  onUnload?: () => void | Promise<void>;
  
  /** Callback appelé quand les settings changent */
  onSettingsChange?: (settings: Record<string, unknown>) => void;
  
  /** Fonctions API exposées par le plugin */
  api?: Record<string, (...args: unknown[]) => unknown>;
}

/**
 * Contexte passé au plugin au chargement
 */
export interface PluginContext {
  /** ID du plugin */
  pluginId: string;
  
  /** Instance de MorphOS */
  morphos: {
    // Filesystem
    fs: {
      readFile: (path: string) => Promise<string | undefined>;
      writeFile: (path: string, content: string) => Promise<void>;
      deleteFile: (path: string) => Promise<void>;
      listFiles: (path: string) => Promise<string[]>;
      exists: (path: string) => Promise<boolean>;
    };
    
    // Windows
    windows: {
      create: (options: {
        type: ModuleType | string;
        title: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        config?: Record<string, unknown>;
      }) => Promise<string>;
      close: (windowId: string) => Promise<void>;
      get: (windowId: string) => Promise<unknown | null>;
      list: () => Promise<unknown[]>;
    };
    
    // UI
    ui: {
      notify: (options: { 
        title: string; 
        message: string; 
        type?: 'info' | 'success' | 'warning' | 'error';
        duration?: number;
      }) => void;
      showModal: (component: React.ReactNode, options?: { 
        title?: string; 
        size?: 'sm' | 'md' | 'lg' | 'full';
      }) => void;
      showToast: (message: string, options?: { 
        type?: 'info' | 'success' | 'warning' | 'error';
        duration?: number;
      }) => void;
    };
    
    // Network
    network: {
      fetch: (url: string, options?: RequestInit) => Promise<Response>;
      websocket: (url: string) => WebSocket;
    };
    
    // Storage
    storage: {
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
    };
    
    // IA
    ai: {
      chat: (messages: { role: string; content: string }[], options?: { 
        provider?: string;
        model?: string;
        temperature?: number;
      }) => Promise<string>;
      generate: (prompt: string, options?: { 
        provider?: string;
        model?: string;
        type?: 'code' | 'text' | 'module';
      }) => Promise<string>;
    };
    
    // Events
    events: {
      on: (event: string, callback: (...args: unknown[]) => void) => () => void;
      emit: (event: string, ...args: unknown[]) => void;
    };
  };
  
  /** Settings du plugin */
  settings: Record<string, unknown>;
  
  /** Fonction pour mettre à jour les settings */
  updateSettings: (newSettings: Record<string, unknown>) => Promise<void>;
}

/**
 * Plugin complet = Manifest + Runtime
 */
export interface MorphOSPlugin extends PluginManifest, PluginRuntime {}

/**
 * Statut d'un plugin
 */
export type PluginStatus = 
  | 'unloaded'    // Non chargé
  | 'loading'     // En cours de chargement
  | 'loaded'      // Chargé
  | 'error'       // Erreur de chargement
  | 'disabled';   // Désactivé

/**
 * Informations sur un plugin installé
 */
export interface InstalledPlugin {
  manifest: PluginManifest;
  runtime: PluginRuntime;
  status: PluginStatus;
  error?: string;
  loadedAt?: number;
  settings: Record<string, unknown>;
}

/**
 * Source d'un plugin
 */
export type PluginSource = 
  | { type: 'local'; path: string }
  | { type: 'remote'; url: string }
  | { type: 'registry'; id: string; version?: string }
  | { type: 'builtin' };

/**
 * Événements du plugin system
 */
export type PluginEvent = 
  | { type: 'plugin.registered'; pluginId: string }
  | { type: 'plugin.unregistered'; pluginId: string }
  | { type: 'plugin.loaded'; pluginId: string }
  | { type: 'plugin.unloaded'; pluginId: string }
  | { type: 'plugin.error'; pluginId: string; error: string }
  | { type: 'plugin.settings_changed'; pluginId: string; settings: Record<string, unknown> };

/**
 * Options de chargement d'un plugin
 */
export interface PluginLoadOptions {
  /** Forcer le rechargement */
  force?: boolean;
  /** Ignorer les dépendances manquantes */
  ignoreMissingDeps?: boolean;
  /** Settings initiales */
  initialSettings?: Record<string, unknown>;
}
