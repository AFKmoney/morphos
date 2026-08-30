"use client";

/**
 * Plugin Initializer
 * 
 * Ce fichier est responsable de l'initialisation des plugins MorphOS.
 * Il charge les plugins built-in et gère leur enregistrement.
 */

import { registerPlugin } from "./plugin-registry";
import type { MorphOSPlugin, PluginSource } from "./plugin-types";

// Liste des plugins built-in à charger
const BUILTIN_PLUGINS: { plugin: MorphOSPlugin; source: PluginSource }[] = [];

// Fonction pour ajouter un plugin built-in
// À appeler depuis les fichiers de plugins
let initialized = false;

export function addBuiltinPlugin(plugin: MorphOSPlugin, source: PluginSource = { type: 'builtin' }) {
  BUILTIN_PLUGINS.push({ plugin, source });
}

// Fonction pour initialiser tous les plugins built-in
export async function initializePlugins(): Promise<void> {
  if (initialized) {
    console.log('[PluginInitializer] Already initialized');
    return;
  }

  console.log(`[PluginInitializer] Loading ${BUILTIN_PLUGINS.length} built-in plugins`);

  for (const { plugin, source } of BUILTIN_PLUGINS) {
    try {
      registerPlugin(plugin, source);
      console.log(`[PluginInitializer] Registered plugin: ${plugin.id}`);
    } catch (error) {
      console.error(`[PluginInitializer] Failed to register plugin ${plugin.id}:`, error);
    }
  }

  initialized = true;
  console.log('[PluginInitializer] All plugins initialized');
}

// Fonction pour charger dynamiquement un plugin depuis une URL
export async function loadPluginFromURL(url: string): Promise<MorphOSPlugin | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch plugin: HTTP ${response.status}`);
    }

    const pluginModule = await response.json();
    
    if (!pluginModule.default || !pluginModule.default.id) {
      throw new Error('Invalid plugin module: missing default export with id');
    }

    const plugin: MorphOSPlugin = pluginModule.default;
    registerPlugin(plugin, { type: 'remote', url });
    
    return plugin;
  } catch (error) {
    console.error(`[PluginInitializer] Failed to load plugin from ${url}:`, error);
    return null;
  }
}

// Fonction pour charger un plugin depuis le filesystem local
// (à utiliser avec Tauri ou Electron)
export async function loadPluginFromPath(path: string): Promise<MorphOSPlugin | null> {
  // À implémenter avec Tauri/Electron
  console.warn('[PluginInitializer] loadPluginFromPath not yet implemented (requires Tauri/Electron)');
  return null;
}

// Fonction pour recharger tous les plugins
export async function reloadPlugins(): Promise<void> {
  // Désenregistrer tous les plugins
  // Recharger depuis BUILTIN_PLUGINS
  // Pour l'instant, on se contente de réinitialiser
  initialized = false;
  await initializePlugins();
}

// Exporter pour usage dans l'app
export { BUILTIN_PLUGINS, initialized };
