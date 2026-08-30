"use client";

/**
 * Types pour le Marketplace de MorphOS
 */

// ============ MODULE TYPES ============

/** Identifiant unique d'un module/plugin */
export type ModuleId = string;

/** Catégorie d'un module */
export type ModuleCategory = 
  | 'utility'      // Utilitaires
  | 'development'  // Développement
  | 'productivity' // Productivité
  | 'entertainment' // Divertissement
  | 'finance'      // Finance
  | 'social'       // Social
  | 'ai'           // IA
  | 'data'         // Données
  | 'system'       // Système
  | 'custom'       // Personnalisé
  | 'game'         // Jeux
  | 'education'    // Éducation
  | 'design'       // Design
  | 'security'     // Sécurité
  | 'network';     // Réseau

/** Statut de publication */
export type PublishStatus = 
  | 'draft'      // Brouillon
  | 'published'  // Publié
  | 'archived'   // Archivé
  | 'rejected'   // Rejeté
  | 'pending';   // En attente de modération

/** Type de licence */
export type LicenseType = 
  | 'MIT'
  | 'Apache-2.0'
  | 'GPL-3.0'
  | 'LGPL-3.0'
  | 'BSD-2-Clause'
  | 'BSD-3-Clause'
  | 'MPL-2.0'
  | 'ISC'
  | 'Unlicense'
  | 'Proprietary'
  | 'Other';

/** Niveau de maturité */
export type MaturityLevel = 
  | 'experimental'  // Expérimental
  | 'alpha'        // Alpha
  | 'beta'         // Beta
  | 'stable'       // Stable
  | 'deprecated';  // Déprécié

/** Tags populaires */
export const POPULAR_TAGS = [
  'ai', 'chat', 'code', 'editor', 'game', 'music', 'video', 'image',
  'finance', 'crypto', 'stock', 'weather', 'clock', 'calendar',
  'notes', 'todo', 'kanban', 'pomodoro', 'timer', 'stopwatch',
  'calculator', 'converter', 'browser', 'terminal', 'files',
  'network', 'http', 'websocket', 'database', 'api',
  'utility', 'tools', 'productivity', 'organization',
] as const;

/** Type de tag */
export type Tag = typeof POPULAR_TAGS[number] | string;

// ============ MODULE MANIFEST ============

/** Manifest d'un module/plugin pour le marketplace */
export interface MarketplaceModuleManifest {
  /** Identifiant unique (format: @author/module-name) */
  id: ModuleId;
  
  /** Nom du module */
  name: string;
  
  /** Description */
  description: string;
  
  /** Version (semver) */
  version: string;
  
  /** Auteur */
  author: string;
  
  /** ID de l'auteur (référence au user store) */
  authorId?: string;
  
  /** URL de l'avatar de l'auteur */
  authorAvatar?: string;
  
  /** Catégorie */
  category: ModuleCategory;
  
  /** Tags */
  tags: Tag[];
  
  /** Icône (URL ou nom d'icône Lucide) */
  icon: string;
  
  /** Capture d'écran (URLs) */
  screenshots?: string[];
  
  /** Vidéo de démonstration (URL) */
  demoVideo?: string;
  
  /** Licence */
  license: LicenseType;
  
  /** Lien vers le repository */
  repository?: string;
  
  /** Lien vers la documentation */
  docsUrl?: string;
  
  /** Lien vers le site web */
  homepage?: string;
  
  /** Mots-clés pour la recherche */
  keywords?: string[];
  
  // ============ MÉTADONNÉES DE PUBLICATION ============
  
  /** Statut de publication */
  publishStatus: PublishStatus;
  
  /** Date de publication */
  publishedAt?: number;
  
  /** Date de dernière mise à jour */
  updatedAt: number;
  
  /** Date de création */
  createdAt: number;
  
  /** Niveau de maturité */
  maturity: MaturityLevel;
  
  // ============ STATISTIQUES ============
  
  /** Nombre de téléchargements */
  downloads: number;
  
  /** Nombre d'étoiles */
  stars: number;
  
  /** Nombre de forks */
  forks: number;
  
  /** Note moyenne (1-5) */
  rating: number;
  
  /** Nombre de notes */
  ratingCount: number;
  
  // ============ DÉPENDANCES ============
  
  /** Dépendances (IDs d'autres modules) */
  dependencies?: ModuleId[];
  
  /** Dépendances incompatibles */
  peerDependencies?: ModuleId[];
  
  // ============ COMPATIBILITÉ ============
  
  /** Version minimale de MorphOS requise */
  morphosVersion?: string;
  
  /** Compatible avec le mode desktop */
  desktopCompatible?: boolean;
  
  /** Compatible avec le mode web */
  webCompatible?: boolean;
  
  /** Nécessite des permissions spécifiques */
  requiredPermissions?: string[];
  
  // ============ MONÉTISATION ============
  
  /** Gratuit ou payant */
  isFree: boolean;
  
  /** Prix (si payant) */
  price?: {
    amount: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'JPY';
    period?: 'one-time' | 'monthly' | 'yearly';
  };
  
  /** Modèle de licence */
  licenseModel?: 'open-source' | 'freemium' | 'paid' | 'subscription' | 'donation';
  
  // ============ MODÉRATION ============
  
  /** Approuvé par l'équipe MorphOS */
  verified?: boolean;
  
  /** Raison du rejet (si rejeté) */
  rejectionReason?: string;
  
  /** Modérateur */
  moderatorId?: string;
  
  /** Date de modération */
  moderatedAt?: number;
}

// ============ MODULE FILE ============

/** Fichier d'un module */
export interface MarketplaceModuleFile {
  /** Nom du fichier */
  name: string;
  
  /** Chemin du fichier */
  path: string;
  
  /** Taille en octets */
  size: number;
  
  /** Type MIME */
  mimeType: string;
  
  /** Contenu (base64 ou URL) */
  content: string;
  
  /** Hash SHA-256 pour vérification */
  hash: string;
}

// ============ MODULE VERSION ============

/** Version d'un module */
export interface MarketplaceModuleVersion {
  /** Version (semver) */
  version: string;
  
  /** Date de publication */
  publishedAt: number;
  
  /** Changelog */
  changelog?: string;
  
  /** Fichiers */
  files: MarketplaceModuleFile[];
  
  /** Taille totale */
  size: number;
  
  /** Hash SHA-256 de l'archive */
  hash: string;
  
  /** Téléchargements */
  downloads: number;
}

// ============ COMPLETE MODULE ============

/** Module complet avec toutes ses versions */
export interface MarketplaceModule {
  /** Manifest */
  manifest: MarketplaceModuleManifest;
  
  /** Versions */
  versions: MarketplaceModuleVersion[];
  
  /** Version actuelle */
  currentVersion: MarketplaceModuleVersion;
  
  /** Fichier principal (pour chargement direct) */
  mainFile?: MarketplaceModuleFile;
  
  /** Code source complet (pour développement) */
  sourceCode?: string;
}

// ============ SEARCH & FILTER ============

/** Options de recherche */
export interface MarketplaceSearchOptions {
  /** Requête de recherche */
  query?: string;
  
  /** Catégorie */
  category?: ModuleCategory;
  
  /** Tags */
  tags?: Tag[];
  
  /** Auteur */
  author?: string;
  
  /** Statut */
  status?: PublishStatus;
  
  /** Gratuit uniquement */
  freeOnly?: boolean;
  
  /** Licence */
  license?: LicenseType;
  
  /** Niveau de maturité */
  maturity?: MaturityLevel;
  
  /** Compatible desktop */
  desktopCompatible?: boolean;
  
  /** Compatible web */
  webCompatible?: boolean;
  
  /** Tri */
  sortBy?: 'downloads' | 'rating' | 'updatedAt' | 'createdAt' | 'name';
  
  /** Ordre */
  sortOrder?: 'asc' | 'desc';
  
  /** Limite */
  limit?: number;
  
  /** Offset */
  offset?: number;
}

/** Résultat de recherche */
export interface MarketplaceSearchResult {
  /** Modules */
  modules: MarketplaceModule[];
  
  /** Nombre total */
  total: number;
  
  /** Offset */
  offset: number;
  
  /** Limite */
  limit: number;
}

// ============ USER MODULES ============

/** Module installé par un utilisateur */
export interface UserModule {
  /** ID du module */
  moduleId: ModuleId;
  
  /** Version installée */
  version: string;
  
  /** Date d'installation */
  installedAt: number;
  
  /** Date de dernière mise à jour */
  updatedAt: number;
  
  /** Configuration utilisateur */
  config?: Record<string, unknown>;
  
  /** Actif */
  enabled: boolean;
  
  /** Favoris */
  starred: boolean;
  
  /** Note personnelle */
  personalRating?: number;
}

// ============ REVIEW & RATING ============

/** Avis d'un utilisateur sur un module */
export interface ModuleReview {
  /** ID unique */
  id: string;
  
  /** ID du module */
  moduleId: ModuleId;
  
  /** ID de l'utilisateur */
  userId: string;
  
  /** Nom de l'utilisateur */
  userName: string;
  
  /** Avatar de l'utilisateur */
  userAvatar?: string;
  
  /** Note (1-5) */
  rating: number;
  
  /** Titre */
  title: string;
  
  /** Commentaire */
  comment?: string;
  
  /** Points positifs */
  pros?: string[];
  
  /** Points négatifs */
  cons?: string[];
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt?: number;
  
  /** Utile */
  helpful: number;
  
  /** Non utile */
  notHelpful: number;
  
  /** Réponse de l'auteur */
  authorResponse?: string;
  
  /** Date de la réponse */
  authorResponseAt?: number;
}

// ============ COLLECTIONS ============

/** Collection de modules */
export interface ModuleCollection {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** ID de l'auteur */
  authorId: string;
  
  /** Nom de l'auteur */
  authorName: string;
  
  /** Modules dans la collection */
  moduleIds: ModuleId[];
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Public */
  isPublic: boolean;
  
  /** Nombre d'abonnés */
  subscribers: number;
}

// ============ EVENTS ============

/** Type d'événement du marketplace */
export type MarketplaceEventType = 
  | 'module.published'
  | 'module.updated'
  | 'module.deleted'
  | 'module.installed'
  | 'module.uninstalled'
  | 'module.rated'
  | 'module.reviewed'
  | 'collection.created'
  | 'collection.updated'
  | 'collection.deleted'
  | 'collection.subscribed'
  | 'collection.unsubscribed';

/** Événement du marketplace */
export interface MarketplaceEvent {
  type: MarketplaceEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

// ============ API RESPONSES ============

/** Réponse d'une requête API */
export interface MarketplaceApiResponse<T> {
  /** Succès */
  success: boolean;
  
  /** Données */
  data?: T;
  
  /** Erreur */
  error?: string;
  
  /** Message */
  message?: string;
  
  /** Code HTTP */
  statusCode?: number;
}

// ============ STATISTICS ============

/** Statistiques du marketplace */
export interface MarketplaceStats {
  /** Nombre total de modules */
  totalModules: number;
  
  /** Nombre de modules par catégorie */
  modulesByCategory: Record<ModuleCategory, number>;
  
  /** Nombre de téléchargements total */
  totalDownloads: number;
  
  /** Nombre d'auteurs */
  totalAuthors: number;
  
  /** Nombre de collections */
  totalCollections: number;
  
  /** Top 5 modules les plus téléchargés */
  topDownloads: { moduleId: ModuleId; downloads: number }[];
  
  /** Top 5 modules les mieux notés */
  topRated: { moduleId: ModuleId; rating: number }[];
  
  /** Top 5 auteurs les plus actifs */
  topAuthors: { authorId: string; moduleCount: number }[];
  
  /** Statistiques par jour */
  dailyStats: {
    date: string;
    newModules: number;
    downloads: number;
    newAuthors: number;
  }[];
}
