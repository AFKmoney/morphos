"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  MarketplaceModule,
  MarketplaceModuleManifest,
  MarketplaceModuleVersion,
  ModuleId,
  ModuleCategory,
  PublishStatus,
  Tag,
  UserModule,
  ModuleReview,
  ModuleCollection,
  MarketplaceSearchOptions,
  MarketplaceSearchResult,
} from "./marketplace-types";

/**
 * Marketplace Store
 * 
 * Store principal pour la gestion du marketplace.
 * Les données sont sauvegardées dans localStorage.
 */

interface MarketplaceStoreState {
  // Modules disponibles
  modules: Map<ModuleId, MarketplaceModule>;
  
  // Modules installés par l'utilisateur
  installedModules: Map<ModuleId, UserModule>;
  
  // Avis des utilisateurs
  reviews: Map<string, ModuleReview>;
  
  // Collections
  collections: Map<string, ModuleCollection>;
  
  // Collections abonnées
  subscribedCollections: Set<string>;
  
  // Statut de chargement
  isLoading: boolean;
  
  // Erreur
  error: string | null;
  
  // Actions
  fetchModules: (options?: MarketplaceSearchOptions) => Promise<MarketplaceSearchResult>;
  fetchModule: (moduleId: ModuleId) => Promise<MarketplaceModule | null>;
  fetchFeatured: () => Promise<MarketplaceModule[]>;
  fetchPopular: () => Promise<MarketplaceModule[]>;
  fetchRecent: () => Promise<MarketplaceModule[]>;
  fetchByCategory: (category: ModuleCategory) => Promise<MarketplaceModule[]>;
  fetchByAuthor: (authorId: string) => Promise<MarketplaceModule[]>;
  fetchByTag: (tag: Tag) => Promise<MarketplaceModule[]>;
  
  // Installation
  installModule: (moduleId: ModuleId, version?: string) => Promise<boolean>;
  uninstallModule: (moduleId: ModuleId) => Promise<boolean>;
  updateModule: (moduleId: ModuleId) => Promise<boolean>;
  
  // Gestion des modules installés
  getInstalledModule: (moduleId: ModuleId) => UserModule | undefined;
  getAllInstalled: () => UserModule[];
  isInstalled: (moduleId: ModuleId) => boolean;
  enableModule: (moduleId: ModuleId) => void;
  disableModule: (moduleId: ModuleId) => void;
  starModule: (moduleId: ModuleId) => void;
  unstarModule: (moduleId: ModuleId) => void;
  updateModuleConfig: (moduleId: ModuleId, config: Record<string, unknown>) => void;
  
  // Avis
  addReview: (review: Omit<ModuleReview, 'id' | 'createdAt' | 'updatedAt' | 'helpful' | 'notHelpful'>) => Promise<string>;
  updateReview: (reviewId: string, updates: Partial<ModuleReview>) => Promise<boolean>;
  deleteReview: (reviewId: string) => Promise<boolean>;
  rateReview: (reviewId: string, helpful: boolean) => Promise<boolean>;
  getModuleReviews: (moduleId: ModuleId) => ModuleReview[];
  getUserReviews: (userId: string) => ModuleReview[];
  
  // Collections
  createCollection: (collection: Omit<ModuleCollection, 'id' | 'createdAt' | 'updatedAt' | 'subscribers'>) => string;
  updateCollection: (collectionId: string, updates: Partial<ModuleCollection>) => boolean;
  deleteCollection: (collectionId: string) => boolean;
  subscribeToCollection: (collectionId: string) => boolean;
  unsubscribeFromCollection: (collectionId: string) => boolean;
  getCollection: (collectionId: string) => ModuleCollection | undefined;
  getAllCollections: () => ModuleCollection[];
  getUserCollections: (userId: string) => ModuleCollection[];
  getSubscribedCollections: () => ModuleCollection[];
  
  // Publication
  publishModule: (manifest: MarketplaceModuleManifest, files: File[]) => Promise<ModuleId | null>;
  updateModule: (moduleId: ModuleId, updates: Partial<MarketplaceModuleManifest>) => Promise<boolean>;
  unpublishModule: (moduleId: ModuleId) => Promise<boolean>;
  
  // Statistiques
  getStats: () => Promise<any>;
  
  // Recherche
  search: (options?: MarketplaceSearchOptions) => Promise<MarketplaceSearchResult>;
  
  // Utilitaires
  reset: () => void;
}

const STORAGE_KEY = "morphos-marketplace";

// Modules par défaut (à charger depuis une API dans une vraie implémentation)
const DEFAULT_MODULES: MarketplaceModule[] = [
  {
    manifest: {
      id: "@morphos/example-plugin",
      name: "Example Plugin",
      description: "A demonstration plugin showing the basics of MorphOS plugin development",
      version: "1.0.0",
      author: "MorphOS Team",
      authorId: "user-local-default",
      category: "utility",
      tags: ["example", "demo", "tutorial"],
      icon: "Puzzle",
      license: "MIT",
      repository: "https://github.com/AFKmoney/morphos",
      publishStatus: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
      createdAt: Date.now(),
      maturity: "stable",
      downloads: 1000,
      stars: 50,
      forks: 10,
      rating: 4.5,
      ratingCount: 20,
      isFree: true,
      verified: true,
      desktopCompatible: true,
      webCompatible: true,
      morphosVersion: "0.2.0",
    },
    versions: [
      {
        version: "1.0.0",
        publishedAt: Date.now(),
        changelog: "Initial release",
        files: [],
        size: 0,
        hash: "",
        downloads: 1000,
      },
    ],
    currentVersion: {
      version: "1.0.0",
      publishedAt: Date.now(),
      changelog: "Initial release",
      files: [],
      size: 0,
      hash: "",
      downloads: 1000,
    },
  },
  {
    manifest: {
      id: "@morphos/ai-chat",
      name: "AI Chat Enhanced",
      description: "Enhanced AI chat module with advanced features",
      version: "2.0.0",
      author: "MorphOS Team",
      authorId: "user-local-default",
      category: "ai",
      tags: ["ai", "chat", "gpt", "llm"],
      icon: "MessageSquare",
      license: "MIT",
      repository: "https://github.com/AFKmoney/morphos",
      publishStatus: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
      createdAt: Date.now(),
      maturity: "stable",
      downloads: 5000,
      stars: 250,
      forks: 50,
      rating: 4.8,
      ratingCount: 120,
      isFree: true,
      verified: true,
      desktopCompatible: true,
      webCompatible: true,
      morphosVersion: "0.2.0",
      requiredPermissions: ["ai.chat", "ai.generate"],
    },
    versions: [
      {
        version: "2.0.0",
        publishedAt: Date.now(),
        changelog: "Added multi-provider support",
        files: [],
        size: 0,
        hash: "",
        downloads: 3000,
      },
      {
        version: "1.0.0",
        publishedAt: Date.now() - 86400000,
        changelog: "Initial release",
        files: [],
        size: 0,
        hash: "",
        downloads: 2000,
      },
    ],
    currentVersion: {
      version: "2.0.0",
      publishedAt: Date.now(),
      changelog: "Added multi-provider support",
      files: [],
      size: 0,
      hash: "",
      downloads: 3000,
    },
  },
];

export const useMarketplaceStore = create<MarketplaceStoreState>()(
  persist(
    (set, get) => ({
      modules: new Map(),
      installedModules: new Map(),
      reviews: new Map(),
      collections: new Map(),
      subscribedCollections: new Set(),
      isLoading: false,
      error: null,
      
      // ============ FETCH ACTIONS ============
      
      fetchModules: async (options?: MarketplaceSearchOptions) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simuler un délai de chargement
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Pour l'instant, on retourne les modules par défaut
          // Dans une vraie implémentation, on appellerait une API
          let modules = Array.from(get().modules.values());
          
          if (modules.length === 0) {
            // Charger les modules par défaut
            for (const defaultModule of DEFAULT_MODULES) {
              get().modules.set(defaultModule.manifest.id, defaultModule);
            }
            modules = [...DEFAULT_MODULES];
          }
          
          // Appliquer les filtres
          if (options) {
            if (options.query) {
              const query = options.query.toLowerCase();
              modules = modules.filter(m =>
                m.manifest.name.toLowerCase().includes(query) ||
                m.manifest.description.toLowerCase().includes(query) ||
                m.manifest.author.toLowerCase().includes(query) ||
                m.manifest.tags.some(tag => tag.toLowerCase().includes(query))
              );
            }
            
            if (options.category) {
              modules = modules.filter(m => m.manifest.category === options.category);
            }
            
            if (options.tags && options.tags.length > 0) {
              modules = modules.filter(m =>
                options.tags!.some(tag => m.manifest.tags.includes(tag))
              );
            }
            
            if (options.freeOnly) {
              modules = modules.filter(m => m.manifest.isFree);
            }
            
            if (options.desktopCompatible) {
              modules = modules.filter(m => m.manifest.desktopCompatible !== false);
            }
            
            if (options.webCompatible) {
              modules = modules.filter(m => m.manifest.webCompatible !== false);
            }
            
            // Tri
            if (options.sortBy) {
              modules.sort((a, b) => {
                const aVal = a.manifest[options.sortBy! as keyof MarketplaceModuleManifest] as any;
                const bVal = b.manifest[options.sortBy! as keyof MarketplaceModuleManifest] as any;
                
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                  return options.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
                }
                
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                  return options.sortOrder === 'asc' 
                    ? aVal.localeCompare(bVal) 
                    : bVal.localeCompare(aVal);
                }
                
                return 0;
              });
            }
            
            // Limite et offset
            if (options.limit) {
              modules = modules.slice(options.offset || 0, (options.offset || 0) + options.limit);
            }
          }
          
          return {
            modules,
            total: modules.length,
            offset: options?.offset || 0,
            limit: options?.limit || modules.length,
          };
        } catch (error) {
          set({ error: error instanceof Error ? error.message : String(error) });
          return { modules: [], total: 0, offset: 0, limit: 0 };
        } finally {
          set({ isLoading: false });
        }
      },
      
      fetchModule: async (moduleId: ModuleId) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          return get().modules.get(moduleId) || null;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : String(error) });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
      
      fetchFeatured: async () => {
        return get().fetchModules({
          sortBy: 'downloads',
          sortOrder: 'desc',
          limit: 10,
        }).then(r => r.modules);
      },
      
      fetchPopular: async () => {
        return get().fetchModules({
          sortBy: 'rating',
          sortOrder: 'desc',
          limit: 10,
        }).then(r => r.modules);
      },
      
      fetchRecent: async () => {
        return get().fetchModules({
          sortBy: 'updatedAt',
          sortOrder: 'desc',
          limit: 10,
        }).then(r => r.modules);
      },
      
      fetchByCategory: async (category: ModuleCategory) => {
        return get().fetchModules({ category, limit: 20 }).then(r => r.modules);
      },
      
      fetchByAuthor: async (authorId: string) => {
        return get().fetchModules({ author: authorId }).then(r => r.modules);
      },
      
      fetchByTag: async (tag: Tag) => {
        return get().fetchModules({ tags: [tag], limit: 20 }).then(r => r.modules);
      },
      
      // ============ INSTALLATION ACTIONS ============
      
      installModule: async (moduleId: ModuleId, version?: string) => {
        const marketplaceModule = get().modules.get(moduleId);
        if (!module) return false;
        
        const targetVersion = version || moduleCurrentVersion.version;
        const moduleVersion = module.versions.find(v => v.version === targetVersion);
        if (!moduleVersion) return false;
        
        const userModule: UserModule = {
          moduleId,
          version: targetVersion,
          installedAt: Date.now(),
          updatedAt: Date.now(),
          config: {},
          enabled: true,
          starred: false,
        };
        
        const installedModules = new Map(get().installedModules);
        installedModules.set(moduleId, userModule);
        set({ installedModules });
        
        // Mettre à jour les statistiques
        moduleCurrentVersion.downloads++;
        moduleManifest.downloads++;
        const modules = new Map(get().modules);
        modules.set(moduleId, marketplaceModule);
        set({ modules });
        
        return true;
      },
      
      uninstallModule: async (moduleId: ModuleId) => {
        const installedModules = new Map(get().installedModules);
        if (!installedModules.has(moduleId)) return false;
        
        installedModules.delete(moduleId);
        set({ installedModules });
        
        return true;
      },
      
      updateModule: async (moduleId: ModuleId) => {
        const marketplaceModule = get().modules.get(moduleId);
        if (!module) return false;
        
        const installed = get().installedModules.get(moduleId);
        if (!installed) return false;
        
        const latestVersion = moduleCurrentVersion.version;
        if (installed.version === latestVersion) return true; // Déjà à jour
        
        return get().installModule(moduleId, latestVersion);
      },
      
      // ============ INSTALLED MODULES ACTIONS ============
      
      getInstalledModule: (moduleId: ModuleId) => {
        return get().installedModules.get(moduleId);
      },
      
      getAllInstalled: () => {
        return Array.from(get().installedModules.values());
      },
      
      isInstalled: (moduleId: ModuleId) => {
        return get().installedModules.has(moduleId);
      },
      
      enableModule: (moduleId: ModuleId) => {
        const installedModules = new Map(get().installedModules);
        const marketplaceModule = installedModules.get(moduleId);
        if (module) {
          installedModules.set(moduleId, { ...module, enabled: true });
          set({ installedModules });
        }
      },
      
      disableModule: (moduleId: ModuleId) => {
        const installedModules = new Map(get().installedModules);
        const marketplaceModule = installedModules.get(moduleId);
        if (module) {
          installedModules.set(moduleId, { ...module, enabled: false });
          set({ installedModules });
        }
      },
      
      starModule: (moduleId: ModuleId) => {
        const installedModules = new Map(get().installedModules);
        const marketplaceModule = installedModules.get(moduleId);
        if (module) {
          installedModules.set(moduleId, { ...module, starred: true });
          set({ installedModules });
        }
      },
      
      unstarModule: (moduleId: ModuleId) => {
        const installedModules = new Map(get().installedModules);
        const marketplaceModule = installedModules.get(moduleId);
        if (module) {
          installedModules.set(moduleId, { ...module, starred: false });
          set({ installedModules });
        }
      },
      
      updateModuleConfig: (moduleId: ModuleId, config: Record<string, unknown>) => {
        const installedModules = new Map(get().installedModules);
        const marketplaceModule = installedModules.get(moduleId);
        if (module) {
          installedModules.set(moduleId, { ...module, config, updatedAt: Date.now() });
          set({ installedModules });
        }
      },
      
      // ============ REVIEW ACTIONS ============
      
      addReview: async (review: Omit<ModuleReview, 'id' | 'createdAt' | 'updatedAt' | 'helpful' | 'notHelpful'>) => {
        const id = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newReview: ModuleReview = {
          ...review,
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          helpful: 0,
          notHelpful: 0,
        };
        
        const reviews = new Map(get().reviews);
        reviews.set(id, newReview);
        set({ reviews });
        
        // Mettre à jour la note du module
        const marketplaceModule = get().modules.get(review.moduleId);
        if (module) {
          const moduleReviews = get().getModuleReviews(review.moduleId);
          const avgRating = moduleReviews.reduce((sum, r) => sum + r.rating, 0) / moduleReviews.length;
          moduleManifest.rating = avgRating;
          moduleManifest.ratingCount = moduleReviews.length;
          
          const modules = new Map(get().modules);
          modules.set(review.moduleId, marketplaceModule);
          set({ modules });
        }
        
        return id;
      },
      
      updateReview: async (reviewId: string, updates: Partial<ModuleReview>) => {
        const reviews = new Map(get().reviews);
        const review = reviews.get(reviewId);
        if (!review) return false;
        
        reviews.set(reviewId, { ...review, ...updates, updatedAt: Date.now() });
        set({ reviews });
        
        return true;
      },
      
      deleteReview: async (reviewId: string) => {
        const reviews = new Map(get().reviews);
        if (!reviews.has(reviewId)) return false;
        
        const review = reviews.get(reviewId)!;
        reviews.delete(reviewId);
        set({ reviews });
        
        // Mettre à jour la note du module
        const marketplaceModule = get().modules.get(review.moduleId);
        if (module) {
          const moduleReviews = get().getModuleReviews(review.moduleId);
          const avgRating = moduleReviews.length > 0 
            ? moduleReviews.reduce((sum, r) => sum + r.rating, 0) / moduleReviews.length 
            : 0;
          moduleManifest.rating = avgRating;
          moduleManifest.ratingCount = moduleReviews.length;
          
          const modules = new Map(get().modules);
          modules.set(review.moduleId, marketplaceModule);
          set({ modules });
        }
        
        return true;
      },
      
      rateReview: async (reviewId: string, helpful: boolean) => {
        const reviews = new Map(get().reviews);
        const review = reviews.get(reviewId);
        if (!review) return false;
        
        if (helpful) {
          reviews.set(reviewId, { ...review, helpful: review.helpful + 1 });
        } else {
          reviews.set(reviewId, { ...review, notHelpful: review.notHelpful + 1 });
        }
        set({ reviews });
        
        return true;
      },
      
      getModuleReviews: (moduleId: ModuleId) => {
        return Array.from(get().reviews.values())
          .filter(r => r.moduleId === moduleId)
          .sort((a, b) => b.createdAt - a.createdAt);
      },
      
      getUserReviews: (userId: string) => {
        return Array.from(get().reviews.values())
          .filter(r => r.userId === userId)
          .sort((a, b) => b.createdAt - a.createdAt);
      },
      
      // ============ COLLECTION ACTIONS ============
      
      createCollection: (collection: Omit<ModuleCollection, 'id' | 'createdAt' | 'updatedAt' | 'subscribers'>) => {
        const id = `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newCollection: ModuleCollection = {
          ...collection,
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          subscribers: 0,
        };
        
        const collections = new Map(get().collections);
        collections.set(id, newCollection);
        set({ collections });
        
        return id;
      },
      
      updateCollection: (collectionId: string, updates: Partial<ModuleCollection>) => {
        const collections = new Map(get().collections);
        const collection = collections.get(collectionId);
        if (!collection) return false;
        
        collections.set(collectionId, { ...collection, ...updates, updatedAt: Date.now() });
        set({ collections });
        
        return true;
      },
      
      deleteCollection: (collectionId: string) => {
        const collections = new Map(get().collections);
        if (!collections.has(collectionId)) return false;
        
        collections.delete(collectionId);
        set({ collections });
        
        // Retirer des abonnements
        const subscribedCollections = new Set(get().subscribedCollections);
        subscribedCollections.delete(collectionId);
        set({ subscribedCollections });
        
        return true;
      },
      
      subscribeToCollection: (collectionId: string) => {
        const collection = get().collections.get(collectionId);
        if (!collection) return false;
        
        const subscribedCollections = new Set(get().subscribedCollections);
        subscribedCollections.add(collectionId);
        set({ subscribedCollections });
        
        // Mettre à jour le compteur d'abonnés
        collection.subscribers++;
        const collections = new Map(get().collections);
        collections.set(collectionId, collection);
        set({ collections });
        
        return true;
      },
      
      unsubscribeFromCollection: (collectionId: string) => {
        const subscribedCollections = new Set(get().subscribedCollections);
        if (!subscribedCollections.has(collectionId)) return false;
        
        subscribedCollections.delete(collectionId);
        set({ subscribedCollections });
        
        // Mettre à jour le compteur d'abonnés
        const collection = get().collections.get(collectionId);
        if (collection) {
          collection.subscribers--;
          const collections = new Map(get().collections);
          collections.set(collectionId, collection);
          set({ collections });
        }
        
        return true;
      },
      
      getCollection: (collectionId: string) => {
        return get().collections.get(collectionId);
      },
      
      getAllCollections: () => {
        return Array.from(get().collections.values());
      },
      
      getUserCollections: (userId: string) => {
        return Array.from(get().collections.values())
          .filter(c => c.authorId === userId);
      },
      
      getSubscribedCollections: () => {
        return Array.from(get().subscribedCollections.values())
          .map(id => get().collections.get(id))
          .filter(Boolean) as ModuleCollection[];
      },
      
      // ============ PUBLISH ACTIONS ============
      
      publishModule: async (manifest: MarketplaceModuleManifest, files: File[]) => {
        const moduleId = manifest.id;
        
        // Vérifier que le module n'existe pas déjà
        if (get().modules.has(moduleId)) {
          return null;
        }
        
        const newModule: MarketplaceModule = {
          manifest,
          versions: [
            {
              version: manifest.version,
              publishedAt: Date.now(),
              changelog: manifest.changelog || `Initial release of ${manifest.name}`,
              files: [],
              size: 0,
              hash: '',
              downloads: 0,
            },
          ],
          currentVersion: {
            version: manifest.version,
            publishedAt: Date.now(),
            changelog: manifest.changelog || `Initial release of ${manifest.name}`,
            files: [],
            size: 0,
            hash: '',
            downloads: 0,
          },
        };
        
        const modules = new Map(get().modules);
        modules.set(moduleId, marketplaceModule);
        set({ modules });
        
        return moduleId;
      },
      
      updateModule: async (moduleId: ModuleId, updates: Partial<MarketplaceModuleManifest>) => {
        const modules = new Map(get().modules);
        const marketplaceModule = modules.get(moduleId);
        if (!module) return false;
        
        modules.set(moduleId, {
          ...module,
          manifest: { ...moduleManifest, ...updates, updatedAt: Date.now() },
        });
        set({ modules });
        
        return true;
      },
      
      unpublishModule: async (moduleId: ModuleId) => {
        const modules = new Map(get().modules);
        const marketplaceModule = modules.get(moduleId);
        if (!module) return false;
        
        moduleManifest.publishStatus = 'archived';
        modules.set(moduleId, marketplaceModule);
        set({ modules });
        
        return true;
      },
      
      // ============ STATS ACTIONS ============
      
      getStats: async () => {
        const modules = Array.from(get().modules.values());
        const categories: Record<string, number> = {};
        
        for (const m of modules) {
          const category = m.manifest.category;
          categories[category] = (categories[category] || 0) + 1;
        }
        
        return {
          totalModules: modules.length,
          modulesByCategory: categories,
          totalDownloads: modules.reduce((sum, m) => sum + m.manifest.downloads, 0),
          totalAuthors: new Set(modules.map(m => m.manifest.authorId)).size,
          topDownloads: modules
            .sort((a, b) => b.manifest.downloads - a.manifest.downloads)
            .slice(0, 5)
            .map(m => ({ moduleId: m.manifest.id, downloads: m.manifest.downloads })),
          topRated: modules
            .filter(m => m.manifest.ratingCount > 0)
            .sort((a, b) => b.manifest.rating - a.manifest.rating)
            .slice(0, 5)
            .map(m => ({ moduleId: m.manifest.id, rating: m.manifest.rating })),
        };
      },
      
      // ============ SEARCH ACTIONS ============
      
      search: async (options?: MarketplaceSearchOptions) => {
        return get().fetchModules(options);
      },
      
      // ============ UTILITIES ============
      
      reset: () => {
        set({
          modules: new Map(),
          installedModules: new Map(),
          reviews: new Map(),
          collections: new Map(),
          subscribedCollections: new Set(),
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        modules: Array.from(state.modules.values()),
        installedModules: Array.from(state.installedModules.values()),
        reviews: Array.from(state.reviews.values()),
        collections: Array.from(state.collections.values()),
        subscribedCollections: Array.from(state.subscribedCollections.values()),
      }),
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          modules: new Map(persistedState.modules?.map((m: MarketplaceModule) => [m.manifest.id, m]) || []),
          installedModules: new Map(persistedState.installedModules?.map((m: UserModule) => [m.moduleId, m]) || []),
          reviews: new Map(persistedState.reviews?.map((r: ModuleReview) => [r.id, r]) || []),
          collections: new Map(persistedState.collections?.map((c: ModuleCollection) => [c.id, c]) || []),
          subscribedCollections: new Set(persistedState.subscribedCollections || []),
        };
      },
    }
  )
);

// ============ UTILITY FUNCTIONS ============

/**
 * Obtenir les modules populaires
 */
export function getPopularModules(limit: number = 10): MarketplaceModule[] {
  return useMarketplaceStore.getState().fetchPopular().then(modules => modules.slice(0, limit)) as any;
}

/**
 * Obtenir les modules récents
 */
export function getRecentModules(limit: number = 10): MarketplaceModule[] {
  return useMarketplaceStore.getState().fetchRecent().then(modules => modules.slice(0, limit)) as any;
}

/**
 * Obtenir les modules par catégorie
 */
export function getModulesByCategory(category: ModuleCategory): MarketplaceModule[] {
  return useMarketplaceStore.getState().fetchByCategory(category) as any;
}

/**
 * Vérifier si un module est installé
 */
export function isModuleInstalled(moduleId: ModuleId): boolean {
  return useMarketplaceStore.getState().isInstalled(moduleId);
}

/**
 * Obtenir les modules installés
 */
export function getInstalledModules(): UserModule[] {
  return useMarketplaceStore.getState().getAllInstalled();
}

/**
 * Obtenir les modules favoris
 */
export function getStarredModules(): UserModule[] {
  return useMarketplaceStore.getState().getAllInstalled()
    .filter(m => m.starred);
}

/**
 * Obtenir les modules activés
 */
export function getEnabledModules(): UserModule[] {
  return useMarketplaceStore.getState().getAllInstalled()
    .filter(m => m.enabled);
}

// ============ EXPORTS ============

export type * from "./marketplace-types";
