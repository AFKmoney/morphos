/**
 * Custom Themes System - Types
 * 
 * Système complet de thèmes personnalisés pour MorphOS
 */

// ============ CORE TYPES ============

/** Identifiant unique d'un thème */
export type ThemeId = string;

/** Type de thème */
export type ThemeType = 
  | 'light'      // Clair
  | 'dark'       // Sombre
  | 'system'     // Système
  | 'custom';    // Personnalisé

/** Statut d'un thème */
export type ThemeStatus = 
  | 'active'     // Actif
  | 'inactive'   // Inactif
  | 'loading'    // Chargement
  | 'error'      // Erreur
  | 'disabled';  // Désactivé

/** Mode de thème */
export type ThemeMode = 'light' | 'dark' | 'system';

// ============ COLOR TYPES ============

/** Couleur au format CSS */
export type CSSColor = string;

/** Palette de couleurs */
export interface ColorPalette {
  /** Couleur principale */
  primary: CSSColor;
  
  /** Couleur primaire claire */
  primaryLight: CSSColor;
  
  /** Couleur primaire foncée */
  primaryDark: CSSColor;
  
  /** Couleur secondaire */
  secondary: CSSColor;
  
  /** Couleur secondaire claire */
  secondaryLight: CSSColor;
  
  /** Couleur secondaire foncée */
  secondaryDark: CSSColor;
  
  /** Couleur d'accent */
  accent: CSSColor;
  
  /** Couleur d'accent claire */
  accentLight: CSSColor;
  
  /** Couleur d'accent foncée */
  accentDark: CSSColor;
  
  /** Couleur de succès */
  success: CSSColor;
  
  /** Couleur d'avertissement */
  warning: CSSColor;
  
  /** Couleur d'erreur */
  error: CSSColor;
  
  /** Couleur d'information */
  info: CSSColor;
}

/** Couleurs de texte */
export interface TextColors {
  /** Texte principal */
  primary: CSSColor;
  
  /** Texte secondaire */
  secondary: CSSColor;
  
  /** Texte tertiaire */
  tertiary: CSSColor;
  
  /** Texte inversé */
  inverse: CSSColor;
  
  /** Texte désactivé */
  disabled: CSSColor;
  
  /** Texte de lien */
  link: CSSColor;
  
  /** Texte de lien au survol */
  linkHover: CSSColor;
}

/** Couleurs de fond */
export interface BackgroundColors {
  /** Fond principal */
  primary: CSSColor;
  
  /** Fond secondaire */
  secondary: CSSColor;
  
  /** Fond tertiaire */
  tertiary: CSSColor;
  
  /** Fond de la barre latérale */
  sidebar: CSSColor;
  
  /** Fond de l'en-tête */
  header: CSSColor;
  
  /** Fond de la carte */
  card: CSSColor;
  
  /** Fond au survol */
  hover: CSSColor;
  
  /** Fond actif */
  active: CSSColor;
}

/** Couleurs de bordure */
export interface BorderColors {
  /** Bordure principale */
  primary: CSSColor;
  
  /** Bordure secondaire */
  secondary: CSSColor;
  
  /** Bordure de succès */
  success: CSSColor;
  
  /** Bordure d'avertissement */
  warning: CSSColor;
  
  /** Bordure d'erreur */
  error: CSSColor;
}

/** Couleurs de surface */
export interface SurfaceColors {
  /** Surface principale */
  primary: CSSColor;
  
  /** Surface élevée */
  elevated: CSSColor;
  
  /** Surface enfoncée */
  sunken: CSSColor;
  
  /** Surface de l'ombre */
  shadow: CSSColor;
}

// ============ THEME TYPES ============

/** Thème de base */
export interface BaseTheme {
  /** ID unique */
  id: ThemeId;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type */
  type: ThemeType;
  
  /** Mode */
  mode: ThemeMode;
  
  /** Auteur */
  author?: string;
  
  /** Version */
  version: string;
  
  /** Actif */
  active: boolean;
  
  /** Statut */
  status: ThemeStatus;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Thème complet */
export interface Theme extends BaseTheme {
  /** Palette de couleurs */
  colors: {
    palette: ColorPalette;
    text: TextColors;
    background: BackgroundColors;
    border: BorderColors;
    surface: SurfaceColors;
  };
  
  /** Styles CSS */
  styles?: {
    /** Variables CSS */
    cssVariables?: Record<string, CSSColor>;
    
    /** Styles globaux */
    global?: string;
    
    /** Styles des composants */
    components?: Record<string, string>;
  };
  
  /** Polices */
  fonts?: {
    /** Police principale */
    primary?: string;
    
    /** Police secondaire */
    secondary?: string;
    
    /** Police monospace */
    monospace?: string;
    
    /** Taille de base */
    baseSize?: string;
    
    /** Hauteur de ligne */
    lineHeight?: string;
    
    /** Poids */
    weights?: {
      normal?: number;
      medium?: number;
      bold?: number;
    };
  };
  
  /** Espacements */
  spacing?: {
    /** Unité de base */
    base?: string;
    
    /** Multiplicateurs */
    multipliers?: number[];
  };
  
  /** Bordures */
  borders?: {
    /** Rayon de base */
    baseRadius?: string;
    
    /** Épaisseur de base */
    baseWidth?: string;
    
    /** Style de base */
    baseStyle?: 'solid' | 'dashed' | 'dotted';
  };
  
  /** Ombres */
  shadows?: {
    /** Ombre de base */
    base?: string;
    
    /** Ombre élevée */
    elevated?: string;
    
    /** Ombre de la carte */
    card?: string;
    
    /** Ombre du bouton */
    button?: string;
  };
  
  /** Transitions */
  transitions?: {
    /** Transition de base */
    base?: string;
    
    /** Durée de base */
    baseDuration?: string;
    
    /** Fonction de timing */
    timingFunction?: string;
  };
  
  /** Animations */
  animations?: {
    /** Animation de chargement */
    loading?: string;
    
    /** Animation de survol */
    hover?: string;
    
    /** Animation de focus */
    focus?: string;
  };
}

/** Thème système */
export interface SystemTheme extends Theme {
  type: 'system';
  mode: 'system';
}

/** Thème clair */
export interface LightTheme extends Theme {
  type: 'light';
  mode: 'light';
}

/** Thème sombre */
export interface DarkTheme extends Theme {
  type: 'dark';
  mode: 'dark';
}

/** Thème personnalisé */
export interface CustomTheme extends Theme {
  type: 'custom';
}

// ============ THEME VARIANTS ============

/** Variante de thème */
export interface ThemeVariant {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Couleurs modifiées */
  colorOverrides?: Partial<{
    palette: Partial<ColorPalette>;
    text: Partial<TextColors>;
    background: Partial<BackgroundColors>;
    border: Partial<BorderColors>;
    surface: Partial<SurfaceColors>;
  }>;
  
  /** Styles modifiés */
  styleOverrides?: Partial<Theme['styles']>;
}

// ============ THEME PRESETS ============

/** Présélection de thème */
export interface ThemePreset {
  /** ID unique */
  id: string;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Thème de base */
  baseTheme: Theme;
  
  /** Variantes */
  variants?: ThemeVariant[];
  
  /** Auteur */
  author?: string;
  
  /** Catégorie */
  category?: string;
  
  /** Tags */
  tags?: string[];
}

// ============ THEME COMPONENTS ============

/** Style d'un composant */
export interface ComponentStyle {
  /** Sélecteur */
  selector: string;
  
  /** Styles */
  styles: Record<string, CSSColor | string>;
  
  /** Styles au survol */
  hoverStyles?: Record<string, CSSColor | string>;
  
  /** Styles au focus */
  focusStyles?: Record<string, CSSColor | string>;
  
  /** Styles actifs */
  activeStyles?: Record<string, CSSColor | string>;
  
  /** Styles désactivés */
  disabledStyles?: Record<string, CSSColor | string>;
}

/** Styles des composants */
export interface ComponentStyles {
  /** Boutons */
  button?: ComponentStyle;
  
  /** Cartes */
  card?: ComponentStyle;
  
  /** Inputs */
  input?: ComponentStyle;
  
  /** Modales */
  modal?: ComponentStyle;
  
  /** Barre latérale */
  sidebar?: ComponentStyle;
  
  /** En-tête */
  header?: ComponentStyle;
  
  /** Pied de page */
  footer?: ComponentStyle;
  
  /** Tableaux */
  table?: ComponentStyle;
  
  /** Listes */
  list?: ComponentStyle;
  
  /** Badges */
  badge?: ComponentStyle;
  
  /** Alertes */
  alert?: ComponentStyle;
  
  /** Tooltips */
  tooltip?: ComponentStyle;
  
  /** Composants personnalisés */
  custom?: Record<string, ComponentStyle>;
}

// ============ THEME SETTINGS ============

/** Paramètres des thèmes */
export interface ThemeSettings {
  /** Thème actif */
  activeThemeId: ThemeId | null;
  
  /** Mode */
  mode: ThemeMode;
  
  /** Thèmes installés */
  installedThemes: ThemeId[];
  
  /** Thèmes favoris */
  favoriteThemes: ThemeId[];
  
  /** Thèmes récents */
  recentThemes: ThemeId[];
  
  /** Auto-switch */
  autoSwitch: boolean;
  
  /** Heure de switch automatique */
  autoSwitchTime?: string;
  
  /** Thème clair par défaut */
  defaultLightTheme: ThemeId;
  
  /** Thème sombre par défaut */
  defaultDarkTheme: ThemeId;
  
  /** Thème système par défaut */
  defaultSystemTheme: ThemeId;
  
  /** Synchronisation */
  sync: boolean;
  
  /** Synchronisation avec le système */
  syncWithSystem: boolean;
}

// ============ THEME EVENTS ============

/** Type d'événement de thème */
export type ThemeEventType = 
  | 'theme.added'
  | 'theme.removed'
  | 'theme.updated'
  | 'theme.activated'
  | 'theme.deactivated'
  | 'theme.error'
  | 'variant.added'
  | 'variant.removed'
  | 'variant.updated'
  | 'mode.changed'
  | 'settings.changed';

/** Événement de thème */
export interface ThemeEvent {
  type: ThemeEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

// ============ THEME EXPORT ============

/** Thème exportable */
export interface ExportableTheme {
  /** ID unique */
  id: ThemeId;
  
  /** Nom */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Type */
  type: ThemeType;
  
  /** Mode */
  mode: ThemeMode;
  
  /** Auteur */
  author?: string;
  
  /** Version */
  version: string;
  
  /** Palette de couleurs */
  colors: {
    palette: ColorPalette;
    text: TextColors;
    background: BackgroundColors;
    border: BorderColors;
    surface: SurfaceColors;
  };
  
  /** Polices */
  fonts?: Theme['fonts'];
  
  /** Espacements */
  spacing?: Theme['spacing'];
  
  /** Bordures */
  borders?: Theme['borders'];
  
  /** Ombres */
  shadows?: Theme['shadows'];
  
  /** Transitions */
  transitions?: Theme['transitions'];
  
  /** Animations */
  animations?: Theme['animations'];
  
  /** Styles CSS */
  styles?: Theme['styles'];
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Tags */
  tags?: string[];
}

// ============ DEFAULT THEMES ============

/** Thème clair par défaut */
export const DEFAULT_LIGHT_THEME: LightTheme = {
  id: 'light',
  name: 'Light',
  description: 'Default light theme',
  type: 'light',
  mode: 'light',
  active: true,
  status: 'active',
  version: '1.0.0',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: ['default', 'light'],
  colors: {
    palette: {
      primary: '#3b82f6',
      primaryLight: '#60a5fa',
      primaryDark: '#2563eb',
      secondary: '#10b981',
      secondaryLight: '#34d399',
      secondaryDark: '#059669',
      accent: '#8b5cf6',
      accentLight: '#a78bfa',
      accentDark: '#7c3aed',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
      inverse: '#ffffff',
      disabled: '#9ca3af',
      link: '#3b82f6',
      linkHover: '#2563eb',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      sidebar: '#f9fafb',
      header: '#ffffff',
      card: '#ffffff',
      hover: '#f3f4f6',
      active: '#e5e7eb',
    },
    border: {
      primary: '#e5e7eb',
      secondary: '#d1d5db',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    surface: {
      primary: '#ffffff',
      elevated: '#f9fafb',
      sunken: '#f3f4f6',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'Inter, system-ui, sans-serif',
    monospace: 'JetBrains Mono, monospace',
    baseSize: '16px',
    lineHeight: '1.5',
    weights: {
      normal: 400,
      medium: 500,
      bold: 600,
    },
  },
  spacing: {
    base: '1rem',
    multipliers: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64],
  },
  borders: {
    baseRadius: '0.5rem',
    baseWidth: '1px',
    baseStyle: 'solid',
  },
  shadows: {
    base: '0 1px 3px rgba(0, 0, 0, 0.1)',
    elevated: '0 4px 6px rgba(0, 0, 0, 0.1)',
    card: '0 1px 3px rgba(0, 0, 0, 0.1)',
    button: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    base: 'all 0.2s ease',
    baseDuration: '200ms',
    timingFunction: 'ease',
  },
  animations: {
    loading: 'spin 1s linear infinite',
    hover: 'scale(1.02)',
    focus: 'ring-2 ring-primary',
  },
};

/** Thème sombre par défaut */
export const DEFAULT_DARK_THEME: DarkTheme = {
  id: 'dark',
  name: 'Dark',
  description: 'Default dark theme',
  type: 'dark',
  mode: 'dark',
  active: false,
  status: 'active',
  version: '1.0.0',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: ['default', 'dark'],
  colors: {
    palette: {
      primary: '#60a5fa',
      primaryLight: '#93c5fd',
      primaryDark: '#3b82f6',
      secondary: '#34d399',
      secondaryLight: '#6ee7b7',
      secondaryDark: '#10b981',
      accent: '#a78bfa',
      accentLight: '#c4b5fd',
      accentDark: '#8b5cf6',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
    },
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      tertiary: '#9ca3af',
      inverse: '#1f2937',
      disabled: '#6b7280',
      link: '#60a5fa',
      linkHover: '#93c5fd',
    },
    background: {
      primary: '#111827',
      secondary: '#1f2937',
      tertiary: '#374151',
      sidebar: '#1f2937',
      header: '#1f2937',
      card: '#1f2937',
      hover: '#374151',
      active: '#4b5563',
    },
    border: {
      primary: '#374151',
      secondary: '#4b5563',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
    },
    surface: {
      primary: '#1f2937',
      elevated: '#374151',
      sunken: '#111827',
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
  },
  fonts: {
    primary: 'Inter, system-ui, sans-serif',
    secondary: 'Inter, system-ui, sans-serif',
    monospace: 'JetBrains Mono, monospace',
    baseSize: '16px',
    lineHeight: '1.5',
    weights: {
      normal: 400,
      medium: 500,
      bold: 600,
    },
  },
  spacing: {
    base: '1rem',
    multipliers: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64],
  },
  borders: {
    baseRadius: '0.5rem',
    baseWidth: '1px',
    baseStyle: 'solid',
  },
  shadows: {
    base: '0 1px 3px rgba(0, 0, 0, 0.3)',
    elevated: '0 4px 6px rgba(0, 0, 0, 0.3)',
    card: '0 1px 3px rgba(0, 0, 0, 0.3)',
    button: '0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  transitions: {
    base: 'all 0.2s ease',
    baseDuration: '200ms',
    timingFunction: 'ease',
  },
  animations: {
    loading: 'spin 1s linear infinite',
    hover: 'scale(1.02)',
    focus: 'ring-2 ring-primary',
  },
};

/** Thème système par défaut */
export const DEFAULT_SYSTEM_THEME: SystemTheme = {
  id: 'system',
  name: 'System',
  description: 'Follow system theme preference',
  type: 'system',
  mode: 'system',
  active: false,
  status: 'active',
  version: '1.0.0',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: ['default', 'system'],
  colors: DEFAULT_LIGHT_THEME.colors,
  fonts: DEFAULT_LIGHT_THEME.fonts,
  spacing: DEFAULT_LIGHT_THEME.spacing,
  borders: DEFAULT_LIGHT_THEME.borders,
  shadows: DEFAULT_LIGHT_THEME.shadows,
  transitions: DEFAULT_LIGHT_THEME.transitions,
  animations: DEFAULT_LIGHT_THEME.animations,
};

// ============ EXPORT ============

export default {
  // Core Types
  ThemeId,
  ThemeType,
  ThemeStatus,
  ThemeMode,
  
  // Color Types
  CSSColor,
  ColorPalette,
  TextColors,
  BackgroundColors,
  BorderColors,
  SurfaceColors,
  
  // Theme Types
  BaseTheme,
  Theme,
  SystemTheme,
  LightTheme,
  DarkTheme,
  CustomTheme,
  
  // Variant Types
  ThemeVariant,
  
  // Preset Types
  ThemePreset,
  
  // Component Types
  ComponentStyle,
  ComponentStyles,
  
  // Settings Types
  ThemeSettings,
  
  // Event Types
  ThemeEventType,
  ThemeEvent,
  
  // Export Types
  ExportableTheme,
  
  // Default Themes
  DEFAULT_LIGHT_THEME,
  DEFAULT_DARK_THEME,
  DEFAULT_SYSTEM_THEME,
};
