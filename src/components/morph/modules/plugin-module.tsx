"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Puzzle, 
  Search, 
  Loader2, 
  CheckCircle,
  XCircle,
  Settings, 
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { usePluginRegistry } from "@/lib/plugins/plugin-registry";
import type { MorphOSPlugin, PluginStatus } from "@/lib/plugins/plugin-types";

/**
 * Module de gestion des plugins
 * 
 * Ce module permet de:
 * - Voir tous les plugins installés
 * - Charger/décharger des plugins
 * - Configurer les plugins
 * - Rechercher des plugins
 */

export function PluginModule() {
  const registry = usePluginRegistry();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialisation
  useEffect(() => {
    // Charger tous les plugins au démarrage
    registry.loadAll().then(() => {
      setIsInitialized(true);
    });
    
    return () => {
      // Ne pas décharger les plugins au démontage pour éviter des problèmes
    };
  }, [registry]);

  // Récupérer tous les plugins
  const allPlugins = useMemo(() => {
    return registry.getAll();
  }, [registry]);

  // Plugins filtrés par recherche
  const filteredPlugins = useMemo(() => {
    if (!searchQuery) return allPlugins;
    return registry.search(searchQuery);
  }, [allPlugins, searchQuery, registry]);

  // Statut global
  const stats = useMemo(() => {
    const total = allPlugins.length;
    const loaded = allPlugins.filter(p => registry.get(p.id) !== undefined).length;
    const unloaded = total - loaded;
    
    return { total, loaded, unloaded };
  }, [allPlugins, registry]);

  // Charger un plugin
  const handleLoad = async (pluginId: string) => {
    setLoading(pluginId);
    try {
      await registry.load(pluginId);
    } finally {
      setLoading(null);
    }
  };

  // Décharger un plugin
  const handleUnload = async (pluginId: string) => {
    setLoading(pluginId);
    try {
      await registry.unload(pluginId);
    } finally {
      setLoading(null);
    }
  };

  // Recharger un plugin
  const handleReload = async (pluginId: string) => {
    setLoading(pluginId);
    try {
      await registry.unload(pluginId);
      await registry.load(pluginId, { force: true });
    } finally {
      setLoading(null);
    }
  };

  // Obtenir le statut d'un plugin
  const getPluginStatus = (pluginId: string): PluginStatus => {
    const state = registry.getState();
    return state.status.get(pluginId) || 'unloaded';
  };

  // Obtenir l'erreur d'un plugin
  const getPluginError = (pluginId: string): string | undefined => {
    const state = registry.getState();
    return state.errors.get(pluginId);
  };

  // Plugin sélectionné
  const selectedPluginData = useMemo(() => {
    if (!selectedPlugin) return null;
    return allPlugins.find(p => p.id === selectedPlugin);
  }, [selectedPlugin, allPlugins]);

  // Render d'une carte de plugin
  const renderPluginCard = (plugin: MorphOSPlugin) => {
    const pluginId = plugin.id;
    const status = getPluginStatus(pluginId);
    const error = getPluginError(pluginId);
    const isLoading = loading === pluginId;
    const isLoaded = status === 'loaded';
    const isError = status === 'error';
    
    const Icon = plugin.icon;

    return (
      <div
        key={pluginId}
        onClick={() => setSelectedPlugin(prev => prev === pluginId ? null : pluginId)}
        className={`
          flex flex-col gap-3 p-4 rounded-lg border transition-all
          ${selectedPlugin === pluginId 
            ? 'border-cyan-400 bg-cyan-500/10' 
            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
          }
          ${isError ? 'border-rose-400 bg-rose-500/10' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {typeof Icon === 'string' ? (
              <img src={Icon} alt={plugin.name} className="w-6 h-6 rounded" />
            ) : (
              <Icon className="w-6 h-6 text-cyan-400" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{plugin.name}</span>
              <span className="text-[10px] text-white/40">v{plugin.version}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isError && (
              <span className="text-[10px] text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                Error
              </span>
            )}
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-white/60" />
            ) : isLoaded ? (
              <CheckCircle className="w-3 h-3 text-emerald-400" />
            ) : (
              <XCircle className="w-3 h-3 text-white/40" />
            )}
            
            {showSettings === pluginId ? (
              <Settings className="w-3 h-3 text-white/60" />
            ) : null}
          </div>
        </div>
        
        <p className="text-[11px] text-white/50 line-clamp-2">{plugin.description}</p>
        
        {selectedPlugin === pluginId && (
          <div className="flex gap-2 mt-2 pt-3 border-t border-white/10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isLoaded) {
                  handleUnload(pluginId);
                } else {
                  handleLoad(pluginId);
                }
              }}
              className="flex-1 text-[10px] py-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isLoaded ? (
                <>
                  <XCircle className="w-3 h-3" /> Unload
                </>
              ) : (
                <>
                  <Plugin className="w-3 h-3" /> Load
                </>
              )}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(prev => prev === pluginId ? null : pluginId);
              }}
              className="text-[10px] py-1.5 px-3 rounded bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center gap-1"
            >
              <Settings className="w-3 h-3" /> Settings
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReload(pluginId);
              }}
              className="text-[10px] py-1.5 px-3 rounded bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}
        
        {showSettings === pluginId && selectedPluginData && (
          <div className="mt-3 p-3 bg-white/5 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-3">Plugin Settings</h4>
            {selectedPluginData.settingsComponent && (
              <selectedPluginData.settingsComponent
                onSave={async (newSettings) => {
                  await registry.setSettings(pluginId, newSettings);
                }}
                currentSettings={registry.getSettings(pluginId)}
              />
            )}
          </div>
        )}
        
        {error && (
          <div className="mt-2 p-2 bg-rose-500/10 rounded text-[10px] text-rose-400">
            Error: {error}
          </div>
        )}
      </div>
    );
  };

  // Render du panneau de détails
  const renderDetailsPanel = () => {
    if (!selectedPluginData) return null;
    
    const plugin = selectedPluginData;
    const Icon = plugin.icon;
    const status = getPluginStatus(plugin.id);
    const permissions = plugin.permissions;

    return (
      <div className="w-full max-w-md bg-black/30 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          {typeof Icon === 'string' ? (
            <img src={Icon} alt={plugin.name} className="w-10 h-10 rounded-lg" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-cyan-400" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-white">{plugin.name}</h3>
            <span className="text-[10px] text-white/40">v{plugin.version} by {plugin.author}</span>
          </div>
        </div>
        
        <p className="text-sm text-white/60 mb-4">{plugin.description}</p>
        
        <div className="space-y-3 text-[11px]">
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/10 px-2 py-1 rounded">
              {plugin.category}
            </span>
            {plugin.tags?.map(tag => (
              <span key={tag} className="bg-white/5 px-2 py-1 rounded text-white/60">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="pt-2 border-t border-white/10">
            <span className="text-white/40 mr-2">Status:</span>
            <span className={`font-mono ${status === 'loaded' ? 'text-emerald-400' : 'text-white/60'}`}>
              {status}
            </span>
          </div>
          
          <div>
            <span className="text-white/40 mr-2">Permissions:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {permissions.map(perm => (
                <span key={perm} className="bg-white/5 px-1.5 py-0.5 rounded text-[10px]">
                  {perm}
                </span>
              ))}
            </div>
          </div>
          
          {plugin.repository && (
            <div className="pt-2 border-t border-white/10">
              <span className="text-white/40 mr-2">Repository:</span>
              <a 
                href={plugin.repository} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 text-[11px]"
              >
                {plugin.repository}
              </a>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
          <button
            onClick={() => setShowSettings(plugin.id)}
            className="flex-1 flex items-center justify-center gap-1 text-[11px] py-2 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <Settings className="w-3 h-3" /> Settings
          </button>
          <button
            onClick={() => handleReload(plugin.id)}
            className="flex-1 flex items-center justify-center gap-1 text-[11px] py-2 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Reload
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-black/20">
      {/* Sidebar - Liste des plugins */}
      <div className="w-64 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Puzzle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Plugins</h2>
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search plugins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              onClick={() => {
                // À implémenter: ouvrir le modal d'ajout de plugin
              }}
              className="p-1.5 rounded bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-4 mt-4 text-[10px] text-white/40">
            <span>
              <span className="text-white">{stats.total}</span> total
            </span>
            <span>
              <span className="text-emerald-400">{stats.loaded}</span> loaded
            </span>
            <span>
              <span className="text-white/60">{stats.unloaded}</span> unloaded
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!isInitialized ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            </div>
          ) : filteredPlugins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm">
              <Puzzle className="w-8 h-8 mb-2" />
              No plugins found
            </div>
          ) : (
            filteredPlugins.map(renderPluginCard)
          )}
        </div>
      </div>
      
      {/* Main Content - Détails du plugin */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedPlugin ? (
          <div className="flex flex-col gap-4">
            {renderDetailsPanel()}
            
            {/* Espace pour le composant du plugin */}
            {selectedPluginData && (
              <div className="bg-black/30 rounded-xl p-4">
                <h3 className="text-sm font-medium text-white mb-3">
                  Plugin Preview
                </h3>
                <div className="bg-white/5 rounded-lg p-4 min-h-[200px]">
                  <selectedPluginData.component />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white/40">
            <Puzzle className="w-12 h-12 mb-4" />
            <p className="text-lg">Select a plugin to view details</p>
            <p className="text-sm mt-2">
              {allPlugins.length} plugins available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
