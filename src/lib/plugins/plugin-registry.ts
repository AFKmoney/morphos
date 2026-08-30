"use client";

import { create } from "zustand";
import type {
  MorphOSPlugin,
  PluginManifest,
  PluginPermission,
  PluginStatus,
  InstalledPlugin,
  PluginSource,
  PluginEvent,
  PluginLoadOptions,
} from "./plugin-types";

/**
 * Registry central pour la gestion des plugins MorphOS
 * 
 * Features:
 * - Enregistrement/désenregistrement de plugins
 * - Chargement/déchargement dynamique
 * - Gestion des permissions
 * - Cycle de vie des plugins
 * - Événements
 */

interface PluginStore {
  // Plugins enregistrés (manifests)
  manifests: Map<string, PluginManifest>;
  
  // Plugins installés (manifest + runtime)
  installed: Map<string, InstalledPlugin>;
  
  // Plugins chargés en mémoire
  loaded: Map<string, MorphOSPlugin>;
  
  // Sources des plugins
  sources: Map<string, PluginSource>;
  
  // Statut de chaque plugin
  status: Map<string, PluginStatus>;
  
  // Erreurs de chargement
  errors: Map<string, string>;
  
  // Écoutes d'événements
  eventListeners: Set<(event: PluginEvent) => void>;
  
  // Actions
  register: (plugin: MorphOSPlugin, source?: PluginSource) => string;
  unregister: (pluginId: string) => boolean;
  load: (pluginId: string, options?: PluginLoadOptions) => Promise<boolean>;
  unload: (pluginId: string) => Promise<boolean>;
  loadAll: (options?: PluginLoadOptions) => Promise<Map<string, boolean>>;
  unloadAll: () => Promise<void>;
  
  get: (pluginId: string) => MorphOSPlugin | undefined;
  getInstalled: (pluginId: string) => InstalledPlugin | undefined;
  getAll: () => MorphOSPlugin[];
  getAllInstalled: () => InstalledPlugin[];
  
  has: (pluginId: string) => boolean;
  hasPermission: (pluginId: string, permission: PluginPermission) => boolean;
  checkPermission: (pluginId: string, permission: PluginPermission) => boolean;
  requestPermission: (pluginId: string, permission: PluginPermission) => Promise<boolean>;
  
  getByCategory: (category: string) => MorphOSPlugin[];
  search: (query: string) => MorphOSPlugin[];
  
  // Settings
  getSettings: (pluginId: string) => Record<string, unknown>;
  setSettings: (pluginId: string, settings: Record<string, unknown>) => Promise<void>;
  
  // Events
  on: (callback: (event: PluginEvent) => void) => () => void;
  emit: (event: PluginEvent) => void;
  
  // Debug
  debug: () => void;
}

// Instance unique du registry
let pluginRegistryInstance: PluginStore | null = null;

/**
 * Crée ou retourne l'instance unique du PluginRegistry
 */
export function getPluginRegistry(): PluginStore {
  if (pluginRegistryInstance) {
    return pluginRegistryInstance;
  }
  
  pluginRegistryInstance = create<PluginStore>((set, get) => ({
    manifests: new Map(),
    installed: new Map(),
    loaded: new Map(),
    sources: new Map(),
    status: new Map(),
    errors: new Map(),
    eventListeners: new Set(),
    
    // ============ REGISTRATION ============
    
    register: (plugin: MorphOSPlugin, source?: PluginSource) => {
      const pluginId = plugin.id;
      
      // Vérifier que l'ID est unique
      if (get().manifests.has(pluginId)) {
        console.warn(`[PluginRegistry] Plugin with id "${pluginId}" already registered`);
        return pluginId;
      }
      
      // Stocker le manifest
      const manifests = new Map(get().manifests);
      manifests.set(pluginId, plugin);
      
      // Stocker la source
      const sources = new Map(get().sources);
      if (source) {
        sources.set(pluginId, source);
      }
      
      // Statut initial
      const status = new Map(get().status);
      status.set(pluginId, 'unloaded');
      
      set({ manifests, sources, status });
      
      // Émettre un événement
      get().emit({ type: 'plugin.registered', pluginId });
      
      return pluginId;
    },
    
    unregister: (pluginId: string) => {
      const state = get();
      
      if (!state.manifests.has(pluginId)) {
        return false;
      }
      
      // Supprimer de tous les maps
      const manifests = new Map(state.manifests);
      const installed = new Map(state.installed);
      const loaded = new Map(state.loaded);
      const sources = new Map(state.sources);
      const status = new Map(state.status);
      const errors = new Map(state.errors);
      
      manifests.delete(pluginId);
      installed.delete(pluginId);
      loaded.delete(pluginId);
      sources.delete(pluginId);
      status.delete(pluginId);
      errors.delete(pluginId);
      
      set({ manifests, installed, loaded, sources, status, errors });
      
      // Émettre un événement
      get().emit({ type: 'plugin.unregistered', pluginId });
      
      return true;
    },
    
    // ============ LOADING ============
    
    load: async (pluginId: string, options?: PluginLoadOptions) => {
      const state = get();
      
      // Vérifier que le plugin existe
      if (!state.manifests.has(pluginId)) {
        console.error(`[PluginRegistry] Plugin "${pluginId}" not found`);
        return false;
      }
      
      const manifest = state.manifests.get(pluginId)!;
      const installedPlugin = state.installed.get(pluginId);
      
      // Si déjà chargé et pas de force, retourner
      if (state.loaded.has(pluginId) && !options?.force) {
        return true;
      }
      
      // Mettre à jour le statut
      const status = new Map(state.status);
      status.set(pluginId, 'loading');
      set({ status });
      
      try {
        // Vérifier les dépendances
        if (manifest.dependencies && manifest.dependencies.length > 0) {
          const missingDeps = manifest.dependencies.filter(depId => !state.manifests.has(depId));
          
          if (missingDeps.length > 0 && !options?.ignoreMissingDeps) {
            throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
          }
          
          // Charger les dépendances d'abord
          for (const depId of manifest.dependencies) {
            if (!state.loaded.has(depId)) {
              await get().load(depId, options);
            }
          }
        }
        
        // Charger le runtime du plugin
        // Pour l'instant, on suppose que le runtime est déjà inclus
        // Dans une version future, on chargera dynamiquement depuis la source
        const runtime = installedPlugin?.runtime;
        
        if (!runtime) {
          throw new Error(`No runtime found for plugin "${pluginId}"`);
        }
        
        // Créer le plugin complet
        const plugin: MorphOSPlugin = {
          ...manifest,
          ...runtime,
        };
        
        // Stocker dans loaded
        const loaded = new Map(state.loaded);
        loaded.set(pluginId, plugin);
        
        // Mettre à jour le statut
        status.set(pluginId, 'loaded');
        
        // Stocker dans installed si ce n'est pas déjà fait
        if (!installedPlugin) {
          const installed = new Map(state.installed);
          installed.set(pluginId, {
            manifest,
            runtime,
            status: 'loaded',
            settings: options?.initialSettings || {},
          });
          set({ installed });
        }
        
        set({ loaded, status });
        
        // Appeler onLoad si défini
        if (plugin.onLoad) {
          try {
            await plugin.onLoad(createPluginContext(pluginId, get()));
          } catch (error) {
            console.error(`[PluginRegistry] Error in onLoad for plugin "${pluginId}":`, error);
          }
        }
        
        // Émettre un événement
        get().emit({ type: 'plugin.loaded', pluginId });
        
        return true;
      } catch (error) {
        const errors = new Map(state.errors);
        errors.set(pluginId, error instanceof Error ? error.message : String(error));
        
        status.set(pluginId, 'error');
        set({ errors, status });
        
        // Émettre un événement
        get().emit({ 
          type: 'plugin.error', 
          pluginId, 
          error: error instanceof Error ? error.message : String(error) 
        });
        
        return false;
      }
    },
    
    unload: async (pluginId: string) => {
      const state = get();
      
      if (!state.loaded.has(pluginId)) {
        return false;
      }
      
      const plugin = state.loaded.get(pluginId)!;
      
      // Appeler onUnload si défini
      if (plugin.onUnload) {
        try {
          await plugin.onUnload();
        } catch (error) {
          console.error(`[PluginRegistry] Error in onUnload for plugin "${pluginId}":`, error);
        }
      }
      
      // Supprimer de loaded
      const loaded = new Map(state.loaded);
      loaded.delete(pluginId);
      
      // Mettre à jour le statut
      const status = new Map(state.status);
      status.set(pluginId, 'unloaded');
      
      set({ loaded, status });
      
      // Émettre un événement
      get().emit({ type: 'plugin.unloaded', pluginId });
      
      return true;
    },
    
    loadAll: async (options?: PluginLoadOptions) => {
      const state = get();
      const results = new Map<string, boolean>();
      
      const manifestEntries = Array.from(state.manifests.entries());
      
      for (const [pluginId] of manifestEntries) {
        results.set(pluginId, await get().load(pluginId, options));
      }
      
      return results;
    },
    
    unloadAll: async () => {
      const state = get();
      const unloadPromises: Promise<boolean>[] = [];
      
      for (const pluginId of state.loaded.keys()) {
        unloadPromises.push(get().unload(pluginId));
      }
      
      await Promise.all(unloadPromises);
    },
    
    // ============ GETTERS ============
    
    get: (pluginId: string) => {
      return get().loaded.get(pluginId);
    },
    
    getInstalled: (pluginId: string) => {
      return get().installed.get(pluginId);
    },
    
    getAll: () => {
      return Array.from(get().loaded.values());
    },
    
    getAllInstalled: () => {
      return Array.from(get().installed.values());
    },
    
    has: (pluginId: string) => {
      return get().manifests.has(pluginId);
    },
    
    // ============ PERMISSIONS ============
    
    hasPermission: (pluginId: string, permission: PluginPermission) => {
      const plugin = get().manifests.get(pluginId);
      if (!plugin) return false;
      return plugin.permissions.includes(permission);
    },
    
    checkPermission: (pluginId: string, permission: PluginPermission) => {
      return get().hasPermission(pluginId, permission);
    },
    
    requestPermission: async (pluginId: string, permission: PluginPermission) => {
      // Pour l'instant, on retourne true si le plugin a déjà la permission
      // Dans une version future, on demandera à l'utilisateur
      return get().hasPermission(pluginId, permission);
    },
    
    // ============ CATEGORY & SEARCH ============
    
    getByCategory: (category: string) => {
      return Array.from(get().loaded.values())
        .filter(plugin => plugin.category === category);
    },
    
    search: (query: string) => {
      const plugins = get().getAll();
      const lowerQuery = query.toLowerCase();
      
      return plugins.filter(plugin => 
        plugin.name.toLowerCase().includes(lowerQuery) ||
        plugin.description.toLowerCase().includes(lowerQuery) ||
        plugin.id.toLowerCase().includes(lowerQuery) ||
        (plugin.tags && plugin.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
    },
    
    // ============ SETTINGS ============
    
    getSettings: (pluginId: string) => {
      const installedPlugin = get().installed.get(pluginId);
      return installedPlugin?.settings || {};
    },
    
    setSettings: async (pluginId: string, settings: Record<string, unknown>) => {
      const installed = new Map(get().installed);
      const plugin = installed.get(pluginId);
      
      if (plugin) {
        installed.set(pluginId, {
          ...plugin,
          settings: { ...plugin.settings, ...settings },
        });
        set({ installed });
        
        // Appeler onSettingsChange si défini
        const loadedPlugin = get().loaded.get(pluginId);
        if (loadedPlugin?.onSettingsChange) {
          loadedPlugin.onSettingsChange(settings);
        }
        
        // Émettre un événement
        get().emit({ 
          type: 'plugin.settings_changed', 
          pluginId, 
          settings 
        });
      }
    },
    
    // ============ EVENTS ============
    
    on: (callback: (event: PluginEvent) => void) => {
      const listeners = new Set(get().eventListeners);
      listeners.add(callback);
      set({ eventListeners: listeners });
      
      return () => {
        const currentListeners = new Set(get().eventListeners);
        currentListeners.delete(callback);
        set({ eventListeners: currentListeners });
      };
    },
    
    emit: (event: PluginEvent) => {
      const listeners = get().eventListeners;
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(`[PluginRegistry] Error in event listener:`, error);
        }
      }
    },
    
    // ============ DEBUG ============
    
    debug: () => {
      const state = get();
      console.group('[PluginRegistry] Debug');
      console.log('Registered plugins:', Array.from(state.manifests.keys()));
      console.log('Loaded plugins:', Array.from(state.loaded.keys()));
      console.log('Status:', Object.fromEntries(state.status));
      console.log('Errors:', Object.fromEntries(state.errors));
      console.groupEnd();
    },
  }));
  
  return pluginRegistryInstance;
}

/**
 * Crée un contexte pour un plugin
 */
function createPluginContext(pluginId: string, store: PluginStore): any {
  const state = store.getState();
  const plugin = state.loaded.get(pluginId);
  const manifest = state.manifests.get(pluginId);
  
  if (!plugin || !manifest) {
    throw new Error(`Plugin "${pluginId}" not found`);
  }
  
  return {
    pluginId,
    morphos: {
      fs: {
        readFile: async (path: string) => {
          if (!store.hasPermission(pluginId, 'fs.read')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "fs.read"`);
          }
          // À implémenter: intégration avec VFS
          return '';
        },
        writeFile: async (path: string, content: string) => {
          if (!store.hasPermission(pluginId, 'fs.write')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "fs.write"`);
          }
          // À implémenter: intégration avec VFS
        },
        deleteFile: async (path: string) => {
          if (!store.hasPermission(pluginId, 'fs.delete')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "fs.delete"`);
          }
          // À implémenter: intégration avec VFS
        },
        listFiles: async (path: string) => {
          if (!store.hasPermission(pluginId, 'fs.list')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "fs.list"`);
          }
          // À implémenter: intégration avec VFS
          return [];
        },
        exists: async (path: string) => {
          if (!store.hasPermission(pluginId, 'fs.read')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "fs.read"`);
          }
          // À implémenter: intégration avec VFS
          return false;
        },
      },
      windows: {
        create: async (options: any) => {
          if (!store.hasPermission(pluginId, 'window.create')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "window.create"`);
          }
          // À implémenter: intégration avec useWindowStore
          return '';
        },
        close: async (windowId: string) => {
          if (!store.hasPermission(pluginId, 'window.close')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "window.close"`);
          }
          // À implémenter: intégration avec useWindowStore
        },
        get: async (windowId: string) => {
          // À implémenter
          return null;
        },
        list: async () => {
          // À implémenter
          return [];
        },
      },
      ui: {
        notify: (options: any) => {
          if (!store.hasPermission(pluginId, 'ui.notify')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "ui.notify"`);
          }
          // À implémenter: utiliser le système de toast existant
        },
        showModal: (component: any, options?: any) => {
          if (!store.hasPermission(pluginId, 'ui.modal')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "ui.modal"`);
          }
          // À implémenter
        },
        showToast: (message: string, options?: any) => {
          if (!store.hasPermission(pluginId, 'ui.toast')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "ui.toast"`);
          }
          // À implémenter
        },
      },
      network: {
        fetch: async (url: string, options?: RequestInit) => {
          if (!store.hasPermission(pluginId, 'network.http')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "network.http"`);
          }
          return fetch(url, options);
        },
        websocket: (url: string) => {
          if (!store.hasPermission(pluginId, 'network.websocket')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "network.websocket"`);
          }
          return new WebSocket(url);
        },
      },
      storage: {
        getItem: (key: string) => {
          if (!store.hasPermission(pluginId, 'storage.local')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "storage.local"`);
          }
          return localStorage.getItem(key);
        },
        setItem: (key: string, value: string) => {
          if (!store.hasPermission(pluginId, 'storage.local')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "storage.local"`);
          }
          localStorage.setItem(key, value);
        },
        removeItem: (key: string) => {
          if (!store.hasPermission(pluginId, 'storage.local')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "storage.local"`);
          }
          localStorage.removeItem(key);
        },
      },
      ai: {
        chat: async (messages: any[], options?: any) => {
          if (!store.hasPermission(pluginId, 'ai.chat')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "ai.chat"`);
          }
          // À implémenter: intégration avec les APIs IA
          return '';
        },
        generate: async (prompt: string, options?: any) => {
          if (!store.hasPermission(pluginId, 'ai.generate')) {
            throw new Error(`Plugin "${pluginId}" does not have permission "ai.generate"`);
          }
          // À implémenter
          return '';
        },
      },
      events: {
        on: (event: string, callback: (...args: any[]) => void) => {
          // À implémenter: système d'événements global
          return () => {};
        },
        emit: (event: string, ...args: any[]) => {
          // À implémenter
        },
      },
    },
    settings: state.installed.get(pluginId)?.settings || {},
    updateSettings: async (newSettings: Record<string, unknown>) => {
      await store.getState().setSettings(pluginId, newSettings);
    },
  };
}

// Exporter le registry
export const pluginRegistry = getPluginRegistry();

// Hook pour utiliser le registry dans les composants
export function usePluginRegistry() {
  return getPluginRegistry();
}

// Fonction utilitaire pour enregistrer un plugin facilement
export function registerPlugin(plugin: MorphOSPlugin, source?: PluginSource) {
  return pluginRegistry.register(plugin, source);
}

// Fonction utilitaire pour désenregistrer un plugin
export function unregisterPlugin(pluginId: string) {
  return pluginRegistry.unregister(pluginId);
}
