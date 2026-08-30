"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Store,
  Search,
  Grid3X3,
  List,
  Star,
  Download,
  Heart,
  MessageSquare,
  Eye,
  ChevronRight,
  ChevronLeft,
  Filter,
  SortAsc,
  SortDesc,
  Plus,
  Settings,
  X,
  Trash2,
  Pencil,
} from "lucide-react";
import { useMarketplaceStore, getPopularModules, getRecentModules, getModulesByCategory } from "@/lib/marketplace";
import type { MarketplaceModule, ModuleCategory, MarketplaceSearchOptions, Tag } from "@/lib/marketplace/marketplace-types";

/**
 * Panneau du Marketplace
 * 
 * Permet de:
 * - Parcourir les modules disponibles
 * - Installer/désinstaller des modules
 * - Voir les détails des modules
 * - Gérer ses modules installés
 * - Publier ses propres modules
 */

const CATEGORIES: { id: ModuleCategory; label: string; icon: React.ElementType }[] = [
  { id: 'ai', label: 'AI', icon: Store },
  { id: 'development', label: 'Development', icon: Grid3X3 },
  { id: 'productivity', label: 'Productivity', icon: List },
  { id: 'utility', label: 'Utility', icon: Settings },
  { id: 'finance', label: 'Finance', icon: Store },
  { id: 'entertainment', label: 'Entertainment', icon: Heart },
  { id: 'system', label: 'System', icon: Settings },
  { id: 'data', label: 'Data', icon: Grid3X3 },
];

const SORT_OPTIONS = [
  { id: 'downloads', label: 'Most Downloaded' },
  { id: 'rating', label: 'Top Rated' },
  { id: 'updatedAt', label: 'Recently Updated' },
  { id: 'createdAt', label: 'Newest' },
  { id: 'name', label: 'Name (A-Z)' },
];

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free Only' },
  { id: 'verified', label: 'Verified' },
  { id: 'desktop', label: 'Desktop Compatible' },
];

export function MarketplacePanel() {
  const [activeTab, setActiveTab] = useState<'discover' | 'installed' | 'collections' | 'publish'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | null>(null);
  const [selectedModule, setSelectedModule] = useState<MarketplaceModule | null>(null);
  const [sortBy, setSortBy] = useState<string>('downloads');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const marketplace = useMarketplaceStore();

  // Récupérer les modules
  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const options: MarketplaceSearchOptions = {
        query: searchQuery || undefined,
        category: selectedCategory || undefined,
        sortBy: sortBy as any,
        sortOrder,
        freeOnly: filterBy === 'free',
        desktopCompatible: filterBy === 'desktop',
        limit: 50,
      };
      
      await marketplace.fetchModules(options);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => fetchModules());
  }, [searchQuery, selectedCategory, sortBy, sortOrder, filterBy]);

  // Modules à afficher
  const modules = useMemo(() => {
    return Array.from(marketplace.modules.values());
  }, [marketplace.modules]);

  // Modules installés
  const installedModules = useMemo(() => {
    return marketplace.getAllInstalled();
  }, [marketplace]);

  // Filtrer les modules
  const filteredModules = useMemo(() => {
    let result = modules;
    
    if (filterBy === 'verified') {
      result = result.filter(m => m.manifest.verified);
    }
    
    return result;
  }, [modules, filterBy]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: modules.length,
      installed: installedModules.length,
      popular: modules.filter(m => m.manifest.downloads > 1000).length,
      verified: modules.filter(m => m.manifest.verified).length,
    };
  }, [modules, installedModules]);

  // Installer un module
  const handleInstall = async (module: MarketplaceModule) => {
    if (marketplace.isInstalled(module.manifest.id)) {
      // Désinstaller
      await marketplace.uninstallModule(module.manifest.id);
    } else {
      // Installer
      await marketplace.installModule(module.manifest.id);
    }
  };

  // Toggle star
  const handleStar = (module: MarketplaceModule) => {
    if (marketplace.isInstalled(module.manifest.id)) {
      const installed = marketplace.getInstalledModule(module.manifest.id);
      if (installed) {
        if (installed.starred) {
          marketplace.unstarModule(module.manifest.id);
        } else {
          marketplace.starModule(module.manifest.id);
        }
      }
    }
  };

  // Obtenir le statut d'installation
  const getInstallStatus = (moduleId: string) => {
    const installed = marketplace.getInstalledModule(moduleId);
    if (!installed) return 'not-installed';
    return installed.enabled ? 'installed' : 'disabled';
  };

  // Obtenir le statut de star
  const getStarStatus = (moduleId: string) => {
    const installed = marketplace.getInstalledModule(moduleId);
    return installed?.starred || false;
  };

  // Render d'une carte de module
  const renderModuleCard = (module: MarketplaceModule) => {
    const manifest = module.manifest;
    const status = getInstallStatus(manifest.id);
    const starred = getStarStatus(manifest.id);
    
    // Obtenir l'icône
    const Icon = manifest.icon as any;

    return (
      <div
        key={manifest.id}
        onClick={() => {
          setSelectedModule(module);
          setShowDetails(true);
        }}
        className="group flex flex-col gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-400 transition-all cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {typeof Icon === 'string' ? (
              <img src={Icon} alt={manifest.name} className="w-8 h-8 rounded-lg" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-cyan-400" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                {manifest.name}
              </span>
              <span className="text-[11px] text-white/50">{manifest.author}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {manifest.verified && (
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                Verified
              </span>
            )}
            {manifest.isFree && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                Free
              </span>
            )}
          </div>
        </div>
        
        <p className="text-[11px] text-white/60 line-clamp-2">{manifest.description}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-[10px] text-white/40">
              <Download className="w-3 h-3" />
              <span>{manifest.downloads.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-white/40">
              <Star className="w-3 h-3" />
              <span>{manifest.rating.toFixed(1)}</span>
            </div>
            {manifest.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/60">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStar(module);
              }}
              className={`p-1.5 rounded transition-colors ${starred ? 'bg-amber-500/20 text-amber-400' : 'text-white/40 hover:text-amber-400 hover:bg-white/5'}`}
            >
              <Heart className={`w-3.5 h-3.5 ${starred ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleInstall(module);
              }}
              className={`p-1.5 rounded transition-colors ${status === 'installed' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-cyan-400 hover:bg-cyan-500/20'}`}
            >
              {status === 'installed' ? <Eye className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render du panneau de détails
  const renderDetailsPanel = () => {
    if (!selectedModule) return null;
    
    const manifest = selectedModule.manifest;
    const installed = marketplace.getInstalledModule(manifest.id);
    const status = getInstallStatus(manifest.id);
    const starred = getStarStatus(manifest.id);
    
    // Obtenir l'icône
    const Icon = manifest.icon as any;

    return (
      <div className="absolute inset-0 bg-black/80 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {typeof Icon === 'string' ? (
              <img src={Icon} alt={manifest.name} className="w-10 h-10 rounded-lg" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Icon className="w-6 h-6 text-cyan-400" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">{manifest.name}</h3>
              <span className="text-[11px] text-white/50">v{manifest.version} by {manifest.author}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStar(selectedModule)}
              className={`p-1.5 rounded transition-colors ${starred ? 'bg-amber-500/20 text-amber-400' : 'text-white/40 hover:text-amber-400 hover:bg-white/5'}`}
            >
              <Heart className={`w-4 h-4 ${starred ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => {
                if (installed) {
                  marketplace.disableModule(manifest.id);
                } else {
                  marketplace.installModule(manifest.id);
                }
              }}
              className="px-4 py-1.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors text-sm font-medium"
            >
              {status === 'installed' ? 'Disable' : 'Install'}
            </button>
            <button
              onClick={() => setShowDetails(false)}
              className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm text-white/60">{manifest.description}</p>
          
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/10 px-2 py-1 rounded text-[11px]">
              {manifest.category}
            </span>
            {manifest.tags.map(tag => (
              <span key={tag} className="bg-white/5 px-2 py-1 rounded text-[11px] text-white/60">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-[10px] text-white/40 mb-1">Downloads</div>
              <div className="text-lg font-semibold text-white">{manifest.downloads.toLocaleString()}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-[10px] text-white/40 mb-1">Rating</div>
              <div className="text-lg font-semibold text-white">{manifest.rating.toFixed(1)}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-[10px] text-white/40 mb-1">License</div>
              <div className="text-lg font-semibold text-white">{manifest.license}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-[10px] text-white/40 mb-1">Maturity</div>
              <div className="text-lg font-semibold text-white capitalize">{manifest.maturity}</div>
            </div>
          </div>
          
          {manifest.repository && (
            <div className="pt-2 border-t border-white/10">
              <a 
                href={manifest.repository} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Store className="w-4 h-4" />
                View on GitHub
              </a>
            </div>
          )}
          
          <div className="pt-2 border-t border-white/10">
            <h4 className="text-sm font-medium text-white mb-2">Versions</h4>
            <div className="space-y-1">
              {selectedModule.versions.map(version => (
                <div
                  key={version.version}
                  className={`flex items-center justify-between p-2 rounded ${version.version === selectedModule.currentVersion.version ? 'bg-cyan-500/20' : 'bg-white/5'}`}
                >
                  <span className="text-sm text-white">{version.version}</span>
                  <span className="text-[11px] text-white/50">{new Date(version.publishedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-black/20 border-l border-white/10">
      {/* Sidebar */}
      <div className="w-48 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Marketplace</h2>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('discover')}
              className={`
                flex-1 text-[11px] py-1.5 rounded transition-colors
                ${activeTab === 'discover' 
                  ? 'bg-cyan-500/20 text-cyan-300' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('installed')}
              className={`
                flex-1 text-[11px] py-1.5 rounded transition-colors
                ${activeTab === 'installed' 
                  ? 'bg-cyan-500/20 text-cyan-300' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              Installed ({installedModules.length})
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`
                flex-1 text-[11px] py-1.5 rounded transition-colors
                ${activeTab === 'collections' 
                  ? 'bg-cyan-500/20 text-cyan-300' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              Collections
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="text-[10px] text-white/40 mb-2">Categories</div>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                setSearchQuery('');
              }}
              className={`
                w-full flex items-center gap-2 text-[11px] py-1.5 rounded transition-colors
                ${selectedCategory === cat.id 
                  ? 'bg-cyan-500/20 text-cyan-300' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <cat.icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
        
        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="text-[10px] text-white/40 mb-2">Stats</div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-white/60">Total</span>
              <span className="text-white">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Installed</span>
              <span className="text-emerald-400">{stats.installed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Popular</span>
              <span className="text-cyan-400">{stats.popular}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Verified</span>
              <span className="text-amber-400">{stats.verified}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-400"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id} className="bg-black text-white">
                {opt.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className={`p-1.5 rounded transition-colors ${sortOrder === 'asc' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </button>
          
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-400"
          >
            {FILTER_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id} className="bg-black text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        
        {activeTab === 'discover' && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 rounded-full bg-cyan-400 animate-pulse" />
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/40">
                <Store className="w-12 h-12 mb-4" />
                <p>No modules found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredModules.map(renderModuleCard)}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'installed' && (
          <div className="space-y-3">
            {installedModules.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/40">
                <Download className="w-12 h-12 mb-4" />
                <p>No modules installed</p>
                <p className="text-sm mt-2">Browse the marketplace to install modules</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {installedModules.map(installed => {
                  const marketplaceModule = marketplace.modules.get(installed.moduleId);
                  return marketplaceModule ? renderModuleCard(marketplaceModule) : null;
                })}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Details Panel */}
      {showDetails && renderDetailsPanel()}
    </div>
  );
}

// Exporter
export { MarketplacePanel };
