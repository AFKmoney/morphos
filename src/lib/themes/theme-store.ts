/**
 * Custom Themes System - Store
 * 
 * Stores Svelte pour la gestion des thèmes
 */

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type {
  Theme,
  ThemeId,
  ThemeType,
  ThemeMode,
  ThemeStatus,
  ThemeVariant,
  ThemePreset,
  ThemeSettings,
  ThemeEvent,
  ThemeEventType,
} from './theme-types';

import { themeManager } from './theme-engine';

// ============ DEFAULT VALUES ============

/** Paramètres par défaut */
export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  activeThemeId: null,
  mode: 'system',
  installedThemes: ['light', 'dark', 'system'],
  favoriteThemes: [],
  recentThemes: [],
  autoSwitch: false,
  defaultLightTheme: 'light',
  defaultDarkTheme: 'dark',
  defaultSystemTheme: 'system',
  sync: false,
  syncWithSystem: true,
};

// ============ STORES ============

/** Store des thèmes */
export const themesStore: Writable<Theme[]> = writable([]);

/** Store des variantes */
export const variantsStore: Writable<Record<ThemeId, ThemeVariant[]>> = writable({});

/** Store des présélections */
export const presetsStore: Writable<ThemePreset[]> = writable([]);

/** Store des paramètres */
export const themeSettingsStore: Writable<ThemeSettings> = writable(DEFAULT_THEME_SETTINGS);

/** Store du thème actif */
export const activeThemeStore: Writable<Theme | null> = writable(null);

/** Store du mode */
export const themeModeStore: Writable<ThemeMode> = writable('system');

/** Store des événements */
export const themeEventsStore: Writable<ThemeEvent[]> = writable([]);

// ============ DERIVED STORES ============

/** Nombre de thèmes */
export const themeCountStore: Readable<number> = derived(
  themesStore,
  ($themes) => $themes.length
);

/** Thèmes par type */
export const themesByTypeStore: Readable<Record<ThemeType, Theme[]>> = derived(
  themesStore,
  ($themes) => {
    const byType: Record<ThemeType, Theme[]> = {
      light: [],
      dark: [],
      system: [],
      custom: [],
    };
    
    for (const theme of $themes) {
      byType[theme.type].push(theme);
    }
    
    return byType;
  }
);

/** Thèmes installés */
export const installedThemesStore: Readable<Theme[]> = derived(
  [themesStore, themeSettingsStore],
  ([$themes, $settings]) => {
    return $themes.filter(t => $settings.installedThemes.includes(t.id));
  }
);

/** Thèmes favoris */
export const favoriteThemesStore: Readable<Theme[]> = derived(
  [themesStore, themeSettingsStore],
  ([$themes, $settings]) => {
    return $themes.filter(t => $settings.favoriteThemes.includes(t.id));
  }
);

/** Thèmes récents */
export const recentThemesStore: Readable<Theme[]> = derived(
  [themesStore, themeSettingsStore],
  ([$themes, $settings]) => {
    return $themes.filter(t => $settings.recentThemes.includes(t.id));
  }
);

/** Thèmes clairs */
export const lightThemesStore: Readable<Theme[]> = derived(
  themesStore,
  ($themes) => $themes.filter(t => t.type === 'light')
);

/** Thèmes sombres */
export const darkThemesStore: Readable<Theme[]> = derived(
  themesStore,
  ($themes) => $themes.filter(t => t.type === 'dark')
);

/** Thèmes personnalisés */
export const customThemesStore: Readable<Theme[]> = derived(
  themesStore,
  ($themes) => $themes.filter(t => t.type === 'custom')
);

// ============ INITIALIZATION ============

/**
 * Initialiser les stores de thèmes
 */
export function initializeThemeStores(): void {
  // Charger les données depuis le localStorage
  const savedThemes = localStorage.getItem('morphos-themes');
  const savedSettings = localStorage.getItem('morphos-theme-settings');
  const savedActiveThemeId = localStorage.getItem('morphos-active-theme-id');
  
  if (savedThemes) {
    try {
      themesStore.set(JSON.parse(savedThemes));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedSettings) {
    try {
      themeSettingsStore.set(JSON.parse(savedSettings));
    } catch {
      // Utiliser les valeurs par défaut
    }
  }
  
  if (savedActiveThemeId) {
    themeManager.setActiveTheme(savedActiveThemeId);
  }
  
  // Sauvegarder les données lors des changements
  themesStore.subscribe((themes) => {
    localStorage.setItem('morphos-themes', JSON.stringify(themes));
  });
  
  themeSettingsStore.subscribe((settings) => {
    localStorage.setItem('morphos-theme-settings', JSON.stringify(settings));
  });
  
  // S'abonner aux changements du manager
  themeManager.onThemeChange((theme) => {
    activeThemeStore.set(theme);
    themeModeStore.set(themeManager.getMode());
    localStorage.setItem('morphos-active-theme-id', theme.id);
  });
  
  // S'abonner aux événements
  themeManager.onEvent('*', (event) => {
    themeEventsStore.update(events => [event, ...events].slice(0, 100));
  });
  
  // Charger les thèmes
  const managerThemes = themeManager.getAllThemes();
  themesStore.set(managerThemes);
  
  const managerSettings = themeManager.getSettings();
  themeSettingsStore.set(managerSettings);
  
  const activeTheme = themeManager.getActiveTheme();
  activeThemeStore.set(activeTheme);
  
  const mode = themeManager.getMode();
  themeModeStore.set(mode);
}

// ============ ACTIONS ============

/**
 * Ajouter un thème
 */
export function addTheme(theme: Theme): ThemeId {
  const id = themeManager.addTheme(theme);
  themesStore.update(themes => [...themes, theme]);
  return id;
}

/**
 * Obtenir un thème par ID
 */
export function getTheme(id: ThemeId): Theme | null {
  return themeManager.getTheme(id);
}

/**
 * Obtenir tous les thèmes
 */
export function getAllThemes(): Theme[] {
  return themeManager.getAllThemes();
}

/**
 * Supprimer un thème
 */
export function removeTheme(id: ThemeId): boolean {
  const success = themeManager.removeTheme(id);
  if (success) {
    themesStore.update(themes => themes.filter(t => t.id !== id));
  }
  return success;
}

/**
 * Mettre à jour un thème
 */
export function updateTheme(id: ThemeId, updates: Partial<Theme>): boolean {
  const success = themeManager.updateTheme(id, updates);
  if (success) {
    themesStore.update(themes => themes.map(t => t.id === id ? { ...t, ...updates } : t));
  }
  return success;
}

/**
 * Créer un thème
 */
export function createTheme(
  name: string,
  type: ThemeType,
  mode: ThemeMode,
  colors: Theme['colors'],
  options?: Partial<Theme>
): ThemeId {
  const id = themeManager.createTheme(name, type, mode, colors, options);
  const theme = themeManager.getTheme(id);
  if (theme) {
    themesStore.update(themes => [...themes, theme]);
  }
  return id;
}

/**
 * Définir le thème actif
 */
export function setActiveTheme(id: ThemeId): boolean {
  const success = themeManager.setActiveTheme(id);
  if (success) {
    themeSettingsStore.update(settings => ({ ...settings, activeThemeId: id }));
    localStorage.setItem('morphos-active-theme-id', id);
  }
  return success;
}

/**
 * Obtenir le thème actif
 */
export function getActiveTheme(): Theme | null {
  return themeManager.getActiveTheme();
}

/**
 * Obtenir l'ID du thème actif
 */
export function getActiveThemeId(): ThemeId | null {
  return themeManager.getActiveThemeId();
}

/**
 * Définir le mode
 */
export function setThemeMode(mode: ThemeMode): void {
  themeManager.setMode(mode);
  themeModeStore.set(mode);
  themeSettingsStore.update(settings => ({ ...settings, mode }));
}

/**
 * Obtenir le mode
 */
export function getThemeMode(): ThemeMode {
  return themeManager.getMode();
}

/**
 * Basculer le mode
 */
export function toggleThemeMode(): void {
  themeManager.toggleMode();
  themeModeStore.update(mode => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(mode);
    return modes[(currentIndex + 1) % modes.length];
  });
}

/**
 * Basculer vers le thème clair
 */
export function switchToLightTheme(): void {
  themeManager.switchToLight();
  themeModeStore.set('light');
}

/**
 * Basculer vers le thème sombre
 */
export function switchToDarkTheme(): void {
  themeManager.switchToDark();
  themeModeStore.set('dark');
}

/**
 * Basculer vers le thème système
 */
export function switchToSystemTheme(): void {
  themeManager.switchToSystem();
  themeModeStore.set('system');
}

/**
 * Basculer vers le thème suivant
 */
export function switchToNextTheme(): void {
  themeManager.switchToNextTheme();
}

/**
 * Basculer vers le thème précédent
 */
export function switchToPreviousTheme(): void {
  themeManager.switchToPreviousTheme();
}

/**
 * Ajouter une variante
 */
export function addVariant(themeId: ThemeId, variant: ThemeVariant): string {
  const id = themeManager.addVariant(themeId, variant);
  variantsStore.update(variants => {
    const themeVariants = variants[themeId] || [];
    return { ...variants, [themeId]: [...themeVariants, variant] };
  });
  return id;
}

/**
 * Obtenir les variantes d'un thème
 */
export function getVariants(themeId: ThemeId): ThemeVariant[] {
  return themeManager.getVariants(themeId);
}

/**
 * Supprimer une variante
 */
export function removeVariant(themeId: ThemeId, variantId: string): boolean {
  const success = themeManager.removeVariant(themeId, variantId);
  if (success) {
    variantsStore.update(variants => {
      const themeVariants = (variants[themeId] || []).filter(v => v.id !== variantId);
      return { ...variants, [themeId]: themeVariants };
    });
  }
  return success;
}

/**
 * Appliquer une variante
 */
export function applyVariant(themeId: ThemeId, variantId: string): boolean {
  return themeManager.applyVariant(themeId, variantId);
}

/**
 * Ajouter une présélection
 */
export function addPreset(preset: ThemePreset): string {
  const id = themeManager.addPreset(preset);
  presetsStore.update(presets => [...presets, preset]);
  return id;
}

/**
 * Obtenir une présélection
 */
export function getPreset(id: string): ThemePreset | null {
  return themeManager.getPreset(id);
}

/**
 * Obtenir toutes les présélections
 */
export function getAllPresets(): ThemePreset[] {
  return themeManager.getAllPresets();
}

/**
 * Supprimer une présélection
 */
export function removePreset(id: string): boolean {
  const success = themeManager.removePreset(id);
  if (success) {
    presetsStore.update(presets => presets.filter(p => p.id !== id));
  }
  return success;
}

/**
 * Obtenir les paramètres
 */
export function getThemeSettings(): ThemeSettings {
  return themeManager.getSettings();
}

/**
 * Mettre à jour les paramètres
 */
export function updateThemeSettings(updates: Partial<ThemeSettings>): void {
  themeManager.updateSettings(updates);
  themeSettingsStore.update(settings => ({ ...settings, ...updates }));
}

/**
 * Ajouter un thème aux favoris
 */
export function addToFavorites(themeId: ThemeId): void {
  themeManager.addToFavorites(themeId);
  themeSettingsStore.update(settings => ({
    ...settings,
    favoriteThemes: [...new Set([...settings.favoriteThemes, themeId])],
  }));
}

/**
 * Supprimer un thème des favoris
 */
export function removeFromFavorites(themeId: ThemeId): void {
  themeManager.removeFromFavorites(themeId);
  themeSettingsStore.update(settings => ({
    ...settings,
    favoriteThemes: settings.favoriteThemes.filter(t => t !== themeId),
  }));
}

/**
 * Vérifier si un thème est dans les favoris
 */
export function isFavoriteTheme(themeId: ThemeId): boolean {
  return themeManager.isFavorite(themeId);
}

/**
 * Exporter un thème
 */
export function exportTheme(themeId: ThemeId): string {
  return themeManager.exportTheme(themeId);
}

/**
 * Importer un thème
 */
export function importTheme(json: string): ThemeId {
  return themeManager.importTheme(json);
}

/**
 * Générer le CSS pour un thème
 */
export function generateThemeCSS(theme?: Theme): string {
  return themeManager.generateThemeCSS(theme);
}

/**
 * Appliquer le thème au DOM
 */
export function applyThemeToDOM(theme?: Theme): void {
  themeManager.applyThemeToDOM(theme);
}

/**
 * S'abonner aux changements de thème
 */
export function onThemeChange(callback: (theme: Theme) => void): () => void {
  return themeManager.onThemeChange(callback);
}

/**
 * S'abonner à un événement
 */
export function onThemeEvent(type: ThemeEventType, callback: (event: ThemeEvent) => void): () => void {
  return themeManager.onEvent(type, callback);
}

/**
 * Mélanger deux couleurs
 */
export function blendColors(color1: string, color2: string, ratio: number = 0.5): string {
  return themeManager.blendColors(color1, color2, ratio);
}

/**
 * Obtenir le contraste pour une couleur
 */
export function getContrastColor(color: string): string {
  return themeManager.getContrastColor(color);
}

/**
 * Nettoyer les données
 */
export function clearThemeData(): void {
  themesStore.set([]);
  variantsStore.set({});
  presetsStore.set([]);
  themeSettingsStore.set(DEFAULT_THEME_SETTINGS);
  activeThemeStore.set(null);
  themeModeStore.set('system');
  themeEventsStore.set([]);
  
  themeManager.cleanup();
}

/**
 * Réinitialiser les thèmes
 */
export function resetThemes(): void {
  clearThemeData();
  localStorage.removeItem('morphos-themes');
  localStorage.removeItem('morphos-theme-settings');
  localStorage.removeItem('morphos-active-theme-id');
}

// ============ INITIALIZATION ============

// Initialiser automatiquement
if (typeof window !== 'undefined') {
  initializeThemeStores();
}

// ============ EXPORT ============

export default {
  // Stores
  themesStore,
  variantsStore,
  presetsStore,
  themeSettingsStore,
  activeThemeStore,
  themeModeStore,
  themeEventsStore,
  
  // Derived stores
  themeCountStore,
  themesByTypeStore,
  installedThemesStore,
  favoriteThemesStore,
  recentThemesStore,
  lightThemesStore,
  darkThemesStore,
  customThemesStore,
  
  // Actions
  initializeThemeStores,
  addTheme,
  getTheme,
  getAllThemes,
  removeTheme,
  updateTheme,
  createTheme,
  setActiveTheme,
  getActiveTheme,
  getActiveThemeId,
  setThemeMode,
  getThemeMode,
  toggleThemeMode,
  switchToLightTheme,
  switchToDarkTheme,
  switchToSystemTheme,
  switchToNextTheme,
  switchToPreviousTheme,
  addVariant,
  getVariants,
  removeVariant,
  applyVariant,
  addPreset,
  getPreset,
  getAllPresets,
  removePreset,
  getThemeSettings,
  updateThemeSettings,
  addToFavorites,
  removeFromFavorites,
  isFavoriteTheme,
  exportTheme,
  importTheme,
  generateThemeCSS,
  applyThemeToDOM,
  onThemeChange,
  onThemeEvent,
  blendColors,
  getContrastColor,
  clearThemeData,
  resetThemes,
};
