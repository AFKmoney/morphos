/**
 * Custom Themes System - Engine
 * 
 * Moteur de gestion des thèmes pour MorphOS
 */

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
  LightTheme,
  DarkTheme,
  SystemTheme,
  CustomTheme,
  ColorPalette,
  TextColors,
  BackgroundColors,
  BorderColors,
  SurfaceColors,
} from './theme-types';

import {
  DEFAULT_LIGHT_THEME,
  DEFAULT_DARK_THEME,
  DEFAULT_SYSTEM_THEME,
} from './theme-types';

// ============ THEME MANAGER ============

/**
 * Gestionnaire des thèmes
 */
export class ThemeManager {
  private themes: Map<ThemeId, Theme> = new Map();
  private variants: Map<string, ThemeVariant[]> = new Map();
  private presets: Map<string, ThemePreset> = new Map();
  private settings: ThemeSettings;
  private activeThemeId: ThemeId | null = null;
  private eventListeners: Map<ThemeEventType, Set<(event: ThemeEvent) => void>> = new Map();
  private themeChangeCallbacks: Set<(theme: Theme) => void> = new Set();
  
  constructor() {
    // Initialiser avec les thèmes par défaut
    this.themes.set('light', { ...DEFAULT_LIGHT_THEME });
    this.themes.set('dark', { ...DEFAULT_DARK_THEME });
    this.themes.set('system', { ...DEFAULT_SYSTEM_THEME });
    
    // Initialiser les paramètres par défaut
    this.settings = {
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
    
    // Définir le thème actif par défaut
    this.setActiveTheme('system');
    
    // Écouter les changements de mode système
    this.setupSystemModeListener();
  }
  
  /**
   * Configurer l'écouteur du mode système
   */
  private setupSystemModeListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      mediaQuery.addEventListener('change', (e) => {
        if (this.settings.syncWithSystem && this.settings.mode === 'system') {
          this.updateSystemTheme(e.matches);
        }
      });
      
      // Initialiser
      this.updateSystemTheme(mediaQuery.matches);
    }
  }
  
  /**
   * Mettre à jour le thème système
   */
  private updateSystemTheme(isDark: boolean): void {
    const theme = this.getTheme('system');
    if (theme) {
      const updatedTheme: SystemTheme = {
        ...theme,
        colors: isDark ? DEFAULT_DARK_THEME.colors : DEFAULT_LIGHT_THEME.colors,
        updatedAt: Date.now(),
      };
      
      this.themes.set('system', updatedTheme);
      this.emitThemeChange(updatedTheme);
    }
  }
  
  // ============ THEME MANAGEMENT ============
  
  /**
   * Ajouter un thème
   */
  public addTheme(theme: Theme): ThemeId {
    const id = theme.id || `theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Vérifier si le thème existe déjà
    if (this.themes.has(id)) {
      throw new Error(`Theme with ID ${id} already exists`);
    }
    
    const newTheme: Theme = {
      ...theme,
      id,
      active: false,
      status: 'active',
      createdAt: theme.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    
    this.themes.set(id, newTheme);
    this.settings.installedThemes.push(id);
    
    // Si c'est le premier thème, le définir comme actif
    if (this.themes.size === 1) {
      this.setActiveTheme(id);
    }
    
    this.emitEvent('theme.added', { themeId: id });
    
    return id;
  }
  
  /**
   * Obtenir un thème par ID
   */
  public getTheme(id: ThemeId): Theme | null {
    return this.themes.get(id) || null;
  }
  
  /**
   * Obtenir tous les thèmes
   */
  public getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }
  
  /**
   * Obtenir les thèmes par type
   */
  public getThemesByType(type: ThemeType): Theme[] {
    return Array.from(this.themes.values()).filter(t => t.type === type);
  }
  
  /**
   * Obtenir les thèmes par mode
   */
  public getThemesByMode(mode: ThemeMode): Theme[] {
    return Array.from(this.themes.values()).filter(t => t.mode === mode);
  }
  
  /**
   * Obtenir les thèmes installés
   */
  public getInstalledThemes(): Theme[] {
    return this.settings.installedThemes
      .map(id => this.themes.get(id))
      .filter((t): t is Theme => t !== null);
  }
  
  /**
   * Supprimer un thème
   */
  public removeTheme(id: ThemeId): boolean {
    if (!this.themes.has(id)) {
      return false;
    }
    
    // Ne pas supprimer les thèmes par défaut
    if (['light', 'dark', 'system'].includes(id)) {
      return false;
    }
    
    // Ne pas supprimer le thème actif
    if (this.activeThemeId === id) {
      this.setActiveTheme('system');
    }
    
    this.themes.delete(id);
    this.settings.installedThemes = this.settings.installedThemes.filter(t => t !== id);
    this.settings.favoriteThemes = this.settings.favoriteThemes.filter(t => t !== id);
    this.settings.recentThemes = this.settings.recentThemes.filter(t => t !== id);
    
    this.emitEvent('theme.removed', { themeId: id });
    
    return true;
  }
  
  /**
   * Mettre à jour un thème
   */
  public updateTheme(id: ThemeId, updates: Partial<Theme>): boolean {
    if (!this.themes.has(id)) {
      return false;
    }
    
    const theme = this.themes.get(id)!;
    const updatedTheme: Theme = {
      ...theme,
      ...updates,
      updatedAt: Date.now(),
    };
    
    this.themes.set(id, updatedTheme);
    
    this.emitEvent('theme.updated', { themeId: id });
    
    // Si c'est le thème actif, émettre le changement
    if (this.activeThemeId === id) {
      this.emitThemeChange(updatedTheme);
    }
    
    return true;
  }
  
  // ============ ACTIVE THEME ============
  
  /**
   * Définir le thème actif
   */
  public setActiveTheme(id: ThemeId): boolean {
    const theme = this.getTheme(id);
    if (!theme) {
      return false;
    }
    
    // Désactiver le thème actuel
    if (this.activeThemeId) {
      const currentTheme = this.getTheme(this.activeThemeId);
      if (currentTheme) {
        currentTheme.active = false;
        this.themes.set(this.activeThemeId, currentTheme);
      }
    }
    
    // Activer le nouveau thème
    theme.active = true;
    theme.status = 'active';
    this.themes.set(id, theme);
    this.activeThemeId = id;
    this.settings.activeThemeId = id;
    
    // Mettre à jour les thèmes récents
    this.settings.recentThemes = [
      id,
      ...this.settings.recentThemes.filter(t => t !== id),
    ].slice(0, 5);
    
    this.emitEvent('theme.activated', { themeId: id });
    this.emitThemeChange(theme);
    
    return true;
  }
  
  /**
   * Obtenir le thème actif
   */
  public getActiveTheme(): Theme | null {
    if (!this.activeThemeId) {
      return null;
    }
    return this.getTheme(this.activeThemeId);
  }
  
  /**
   * Obtenir l'ID du thème actif
   */
  public getActiveThemeId(): ThemeId | null {
    return this.activeThemeId;
  }
  
  // ============ THEME MODE ============
  
  /**
   * Définir le mode
   */
  public setMode(mode: ThemeMode): void {
    this.settings.mode = mode;
    
    // Si le mode est système, activer le thème système
    if (mode === 'system') {
      this.setActiveTheme('system');
    } else {
      // Sinon, activer le thème par défaut pour ce mode
      const defaultTheme = mode === 'dark' ? this.settings.defaultDarkTheme : this.settings.defaultLightTheme;
      this.setActiveTheme(defaultTheme);
    }
    
    this.emitEvent('mode.changed', { mode });
  }
  
  /**
   * Obtenir le mode
   */
  public getMode(): ThemeMode {
    return this.settings.mode;
  }
  
  /**
   * Basculer entre les modes
   */
  public toggleMode(): void {
    const currentMode = this.getMode();
    const nextMode: ThemeMode = currentMode === 'light' ? 'dark' : currentMode === 'dark' ? 'system' : 'light';
    this.setMode(nextMode);
  }
  
  // ============ THEME SWITCHING ============
  
  /**
   * Basculer vers le thème clair
   */
  public switchToLight(): void {
    this.setMode('light');
  }
  
  /**
   * Basculer vers le thème sombre
   */
  public switchToDark(): void {
    this.setMode('dark');
  }
  
  /**
   * Basculer vers le thème système
   */
  public switchToSystem(): void {
    this.setMode('system');
  }
  
  /**
   * Basculer vers le thème suivant
   */
  public switchToNextTheme(): void {
    const themes = this.getInstalledThemes();
    if (themes.length === 0) return;
    
    const currentIndex = themes.findIndex(t => t.id === this.activeThemeId);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setActiveTheme(themes[nextIndex].id);
  }
  
  /**
   * Basculer vers le thème précédent
   */
  public switchToPreviousTheme(): void {
    const themes = this.getInstalledThemes();
    if (themes.length === 0) return;
    
    const currentIndex = themes.findIndex(t => t.id === this.activeThemeId);
    const prevIndex = (currentIndex - 1 + themes.length) % themes.length;
    this.setActiveTheme(themes[prevIndex].id);
  }
  
  // ============ THEME VARIANTS ============
  
  /**
   * Ajouter une variante à un thème
   */
  public addVariant(themeId: ThemeId, variant: ThemeVariant): string {
    if (!this.themes.has(themeId)) {
      throw new Error(`Theme with ID ${themeId} does not exist`);
    }
    
    const id = variant.id || `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const themeVariant: ThemeVariant = {
      ...variant,
      id,
    };
    
    if (!this.variants.has(themeId)) {
      this.variants.set(themeId, []);
    }
    
    this.variants.get(themeId)!.push(themeVariant);
    
    this.emitEvent('variant.added', { themeId, variantId: id });
    
    return id;
  }
  
  /**
   * Obtenir les variantes d'un thème
   */
  public getVariants(themeId: ThemeId): ThemeVariant[] {
    return this.variants.get(themeId) || [];
  }
  
  /**
   * Obtenir une variante par ID
   */
  public getVariant(themeId: ThemeId, variantId: string): ThemeVariant | null {
    const variants = this.getVariants(themeId);
    return variants.find(v => v.id === variantId) || null;
  }
  
  /**
   * Supprimer une variante
   */
  public removeVariant(themeId: ThemeId, variantId: string): boolean {
    const variants = this.getVariants(themeId);
    const index = variants.findIndex(v => v.id === variantId);
    
    if (index === -1) {
      return false;
    }
    
    variants.splice(index, 1);
    this.variants.set(themeId, variants);
    
    this.emitEvent('variant.removed', { themeId, variantId });
    
    return true;
  }
  
  /**
   * Appliquer une variante
   */
  public applyVariant(themeId: ThemeId, variantId: string): boolean {
    const theme = this.getTheme(themeId);
    const variant = this.getVariant(themeId, variantId);
    
    if (!theme || !variant) {
      return false;
    }
    
    // Appliquer les modifications de couleurs
    const updatedTheme: Theme = {
      ...theme,
      colors: {
        ...theme.colors,
        palette: { ...theme.colors.palette, ...variant.colorOverrides?.palette },
        text: { ...theme.colors.text, ...variant.colorOverrides?.text },
        background: { ...theme.colors.background, ...variant.colorOverrides?.background },
        border: { ...theme.colors.border, ...variant.colorOverrides?.border },
        surface: { ...theme.colors.surface, ...variant.colorOverrides?.surface },
      },
      styles: {
        ...theme.styles,
        ...variant.styleOverrides,
      },
      updatedAt: Date.now(),
    };
    
    this.themes.set(themeId, updatedTheme);
    
    // Si c'est le thème actif, émettre le changement
    if (this.activeThemeId === themeId) {
      this.emitThemeChange(updatedTheme);
    }
    
    this.emitEvent('variant.updated', { themeId, variantId });
    
    return true;
  }
  
  // ============ THEME PRESETS ============
  
  /**
   * Ajouter une présélection
   */
  public addPreset(preset: ThemePreset): string {
    const id = preset.id || `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.presets.has(id)) {
      throw new Error(`Preset with ID ${id} already exists`);
    }
    
    const newPreset: ThemePreset = {
      ...preset,
      id,
    };
    
    this.presets.set(id, newPreset);
    
    // Ajouter le thème de base
    if (newPreset.baseTheme) {
      this.addTheme(newPreset.baseTheme);
    }
    
    // Ajouter les variantes
    if (newPreset.variants) {
      for (const variant of newPreset.variants) {
        this.addVariant(newPreset.baseTheme.id, variant);
      }
    }
    
    return id;
  }
  
  /**
   * Obtenir une présélection par ID
   */
  public getPreset(id: string): ThemePreset | null {
    return this.presets.get(id) || null;
  }
  
  /**
   * Obtenir toutes les présélections
   */
  public getAllPresets(): ThemePreset[] {
    return Array.from(this.presets.values());
  }
  
  /**
   * Supprimer une présélection
   */
  public removePreset(id: string): boolean {
    if (!this.presets.has(id)) {
      return false;
    }
    
    const preset = this.presets.get(id)!;
    
    // Supprimer le thème de base
    this.removeTheme(preset.baseTheme.id);
    
    // Supprimer les variantes
    if (preset.variants) {
      for (const variant of preset.variants) {
        this.removeVariant(preset.baseTheme.id, variant.id);
      }
    }
    
    this.presets.delete(id);
    
    return true;
  }
  
  // ============ THEME SETTINGS ============
  
  /**
   * Obtenir les paramètres
   */
  public getSettings(): ThemeSettings {
    return { ...this.settings };
  }
  
  /**
   * Mettre à jour les paramètres
   */
  public updateSettings(updates: Partial<ThemeSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
    };
    
    this.emitEvent('settings.changed', { settings: this.settings });
  }
  
  /**
   * Ajouter un thème aux favoris
   */
  public addToFavorites(themeId: ThemeId): void {
    if (!this.settings.favoriteThemes.includes(themeId)) {
      this.settings.favoriteThemes.push(themeId);
      this.emitEvent('settings.changed', { settings: this.settings });
    }
  }
  
  /**
   * Supprimer un thème des favoris
   */
  public removeFromFavorites(themeId: ThemeId): void {
    this.settings.favoriteThemes = this.settings.favoriteThemes.filter(t => t !== themeId);
    this.emitEvent('settings.changed', { settings: this.settings });
  }
  
  /**
   * Vérifier si un thème est dans les favoris
   */
  public isFavorite(themeId: ThemeId): boolean {
    return this.settings.favoriteThemes.includes(themeId);
  }
  
  // ============ THEME EXPORT/IMPORT ============
  
  /**
   * Exporter un thème
   */
  public exportTheme(themeId: ThemeId): string {
    const theme = this.getTheme(themeId);
    if (!theme) {
      throw new Error(`Theme with ID ${themeId} does not exist`);
    }
    
    const exportableTheme = {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      type: theme.type,
      mode: theme.mode,
      author: theme.author,
      version: theme.version,
      colors: theme.colors,
      fonts: theme.fonts,
      spacing: theme.spacing,
      borders: theme.borders,
      shadows: theme.shadows,
      transitions: theme.transitions,
      animations: theme.animations,
      styles: theme.styles,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
      tags: theme.tags,
    };
    
    return JSON.stringify(exportableTheme, null, 2);
  }
  
  /**
   * Importer un thème
   */
  public importTheme(json: string): ThemeId {
    const theme = JSON.parse(json);
    return this.addTheme(theme);
  }
  
  // ============ THEME CSS ============
  
  /**
   * Générer le CSS pour un thème
   */
  public generateThemeCSS(theme?: Theme): string {
    const targetTheme = theme || this.getActiveTheme();
    if (!targetTheme) {
      return '';
    }
    
    const { colors, fonts, spacing, borders, shadows, transitions } = targetTheme;
    
    const cssVariables: string[] = [];
    
    // Couleurs de la palette
    cssVariables.push(`--color-primary: ${colors.palette.primary}`);
    cssVariables.push(`--color-primary-light: ${colors.palette.primaryLight}`);
    cssVariables.push(`--color-primary-dark: ${colors.palette.primaryDark}`);
    cssVariables.push(`--color-secondary: ${colors.palette.secondary}`);
    cssVariables.push(`--color-secondary-light: ${colors.palette.secondaryLight}`);
    cssVariables.push(`--color-secondary-dark: ${colors.palette.secondaryDark}`);
    cssVariables.push(`--color-accent: ${colors.palette.accent}`);
    cssVariables.push(`--color-accent-light: ${colors.palette.accentLight}`);
    cssVariables.push(`--color-accent-dark: ${colors.palette.accentDark}`);
    cssVariables.push(`--color-success: ${colors.palette.success}`);
    cssVariables.push(`--color-warning: ${colors.palette.warning}`);
    cssVariables.push(`--color-error: ${colors.palette.error}`);
    cssVariables.push(`--color-info: ${colors.palette.info}`);
    
    // Couleurs de texte
    cssVariables.push(`--color-text-primary: ${colors.text.primary}`);
    cssVariables.push(`--color-text-secondary: ${colors.text.secondary}`);
    cssVariables.push(`--color-text-tertiary: ${colors.text.tertiary}`);
    cssVariables.push(`--color-text-inverse: ${colors.text.inverse}`);
    cssVariables.push(`--color-text-disabled: ${colors.text.disabled}`);
    cssVariables.push(`--color-text-link: ${colors.text.link}`);
    cssVariables.push(`--color-text-link-hover: ${colors.text.linkHover}`);
    
    // Couleurs de fond
    cssVariables.push(`--color-bg-primary: ${colors.background.primary}`);
    cssVariables.push(`--color-bg-secondary: ${colors.background.secondary}`);
    cssVariables.push(`--color-bg-tertiary: ${colors.background.tertiary}`);
    cssVariables.push(`--color-bg-sidebar: ${colors.background.sidebar}`);
    cssVariables.push(`--color-bg-header: ${colors.background.header}`);
    cssVariables.push(`--color-bg-card: ${colors.background.card}`);
    cssVariables.push(`--color-bg-hover: ${colors.background.hover}`);
    cssVariables.push(`--color-bg-active: ${colors.background.active}`);
    
    // Couleurs de bordure
    cssVariables.push(`--color-border-primary: ${colors.border.primary}`);
    cssVariables.push(`--color-border-secondary: ${colors.border.secondary}`);
    cssVariables.push(`--color-border-success: ${colors.border.success}`);
    cssVariables.push(`--color-border-warning: ${colors.border.warning}`);
    cssVariables.push(`--color-border-error: ${colors.border.error}`);
    
    // Couleurs de surface
    cssVariables.push(`--color-surface-primary: ${colors.surface.primary}`);
    cssVariables.push(`--color-surface-elevated: ${colors.surface.elevated}`);
    cssVariables.push(`--color-surface-sunken: ${colors.surface.sunken}`);
    cssVariables.push(`--color-surface-shadow: ${colors.surface.shadow}`);
    
    // Polices
    if (fonts) {
      cssVariables.push(`--font-primary: ${fonts.primary || 'Inter, system-ui, sans-serif'}`);
      cssVariables.push(`--font-secondary: ${fonts.secondary || fonts.primary || 'Inter, system-ui, sans-serif'}`);
      cssVariables.push(`--font-monospace: ${fonts.monospace || 'JetBrains Mono, monospace'}`);
      cssVariables.push(`--font-base-size: ${fonts.baseSize || '16px'}`);
      cssVariables.push(`--font-line-height: ${fonts.lineHeight || '1.5'}`);
    }
    
    // Espacements
    if (spacing) {
      cssVariables.push(`--spacing-base: ${spacing.base || '1rem'}`);
    }
    
    // Bordures
    if (borders) {
      cssVariables.push(`--border-radius: ${borders.baseRadius || '0.5rem'}`);
      cssVariables.push(`--border-width: ${borders.baseWidth || '1px'}`);
      cssVariables.push(`--border-style: ${borders.baseStyle || 'solid'}`);
    }
    
    // Ombres
    if (shadows) {
      cssVariables.push(`--shadow-base: ${shadows.base || '0 1px 3px rgba(0, 0, 0, 0.1)'}`);
      cssVariables.push(`--shadow-elevated: ${shadows.elevated || '0 4px 6px rgba(0, 0, 0, 0.1)'}`);
      cssVariables.push(`--shadow-card: ${shadows.card || '0 1px 3px rgba(0, 0, 0, 0.1)'}`);
      cssVariables.push(`--shadow-button: ${shadows.button || '0 2px 4px rgba(0, 0, 0, 0.1)'}`);
    }
    
    // Transitions
    if (transitions) {
      cssVariables.push(`--transition-base: ${transitions.base || 'all 0.2s ease'}`);
      cssVariables.push(`--transition-duration: ${transitions.baseDuration || '200ms'}`);
      cssVariables.push(`--transition-function: ${transitions.timingFunction || 'ease'}`);
    }
    
    // Variables CSS personnalisées
    if (targetTheme.styles?.cssVariables) {
      for (const [key, value] of Object.entries(targetTheme.styles.cssVariables)) {
        cssVariables.push(`--${key}: ${value}`);
      }
    }
    
    const css = `
      :root {
        ${cssVariables.map(v => `  ${v};`).join('\n')}
      }
      
      ${targetTheme.styles?.global || ''}
      
      ${this.generateComponentStyles(targetTheme)}
    `;
    
    return css;
  }
  
  /**
   * Générer les styles des composants
   */
  private generateComponentStyles(theme: Theme): string {
    if (!theme.styles?.components) {
      return '';
    }
    
    const styles: string[] = [];
    
    for (const [selector, css] of Object.entries(theme.styles.components)) {
      styles.push(`${selector} { ${css} }`);
    }
    
    return styles.join('\n');
  }
  
  /**
   * Appliquer le thème au DOM
   */
  public applyThemeToDOM(theme?: Theme): void {
    const css = this.generateThemeCSS(theme);
    
    // Créer ou mettre à jour le style element
    let styleElement = document.getElementById('morphos-theme-style');
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'morphos-theme-style';
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;
    
    // Mettre à jour l'attribut data-theme
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme.id);
      document.documentElement.setAttribute('data-theme-mode', theme.mode);
    }
  }
  
  // ============ THEME CHANGE CALLBACKS ============
  
  /**
   * S'abonner aux changements de thème
   */
  public onThemeChange(callback: (theme: Theme) => void): () => void {
    this.themeChangeCallbacks.add(callback);
    return () => this.themeChangeCallbacks.delete(callback);
  }
  
  /**
   * Émettre un changement de thème
   */
  private emitThemeChange(theme: Theme): void {
    for (const callback of this.themeChangeCallbacks) {
      try {
        callback(theme);
      } catch (error) {
        console.error('Error in theme change callback:', error);
      }
    }
    
    // Appliquer au DOM
    this.applyThemeToDOM(theme);
  }
  
  // ============ EVENT LISTENERS ============
  
  /**
   * Écouter un événement
   */
  public onEvent(type: ThemeEventType, callback: (event: ThemeEvent) => void): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);
    return () => this.eventListeners.get(type)?.delete(callback);
  }
  
  /**
   * Émettre un événement
   */
  private emitEvent(type: ThemeEventType, data?: Record<string, unknown>): void {
    const event: ThemeEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in theme event callback:', error);
        }
      });
    }
    
    // Émettre à tous les listeners
    const allListeners = this.eventListeners.get('*' as ThemeEventType);
    if (allListeners) {
      allListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in theme event callback:', error);
        }
      });
    }
  }
  
  // ============ UTILITY FUNCTIONS ============
  
  /**
   * Créer un thème
   */
  public createTheme(
    name: string,
    type: ThemeType,
    mode: ThemeMode,
    colors: {
      palette: ColorPalette;
      text: TextColors;
      background: BackgroundColors;
      border: BorderColors;
      surface: SurfaceColors;
    },
    options?: Partial<Theme>
  ): ThemeId {
    const theme: Theme = {
      id: `theme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      mode,
      colors,
      active: false,
      status: 'active',
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...options,
    };
    
    return this.addTheme(theme);
  }
  
  /**
   * Créer une variante
   */
  public createVariant(
    themeId: ThemeId,
    name: string,
    colorOverrides?: Partial<{
      palette: Partial<ColorPalette>;
      text: Partial<TextColors>;
      background: Partial<BackgroundColors>;
      border: Partial<BorderColors>;
      surface: Partial<SurfaceColors>;
    }>,
    styleOverrides?: Partial<Theme['styles']>
  ): string {
    const variant: ThemeVariant = {
      id: `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      colorOverrides,
      styleOverrides,
    };
    
    return this.addVariant(themeId, variant);
  }
  
  /**
   * Mélanger deux couleurs
   */
  public blendColors(color1: CSSColor, color2: CSSColor, ratio: number = 0.5): CSSColor {
    // Simple blending (à améliorer avec une vraie implémentation)
    return ratio < 0.5 ? color1 : color2;
  }
  
  /**
   * Assombrir une couleur
   */
  public darkenColor(color: CSSColor, amount: number = 0.1): CSSColor {
    // Simple implementation (à améliorer)
    return color;
  }
  
  /**
   * Éclaircir une couleur
   */
  public lightenColor(color: CSSColor, amount: number = 0.1): CSSColor {
    // Simple implementation (à améliorer)
    return color;
  }
  
  /**
   * Convertir hex en RGB
   */
  public hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      };
    }
    return null;
  }
  
  /**
   * Convertir RGB en hex
   */
  public rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  }
  
  /**
   * Vérifier si une couleur est claire
   */
  public isLightColor(color: CSSColor): boolean {
    const rgb = this.hexToRgb(color);
    if (!rgb) return true;
    
    // Calculer la luminosité
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128;
  }
  
  /**
   * Obtenir le contraste pour une couleur
   */
  public getContrastColor(color: CSSColor): CSSColor {
    return this.isLightColor(color) ? '#000000' : '#ffffff';
  }
  
  // ============ CLEANUP ============
  
  /**
   * Nettoyer
   */
  public cleanup(): void {
    this.themes.clear();
    this.variants.clear();
    this.presets.clear();
    this.eventListeners.clear();
    this.themeChangeCallbacks.clear();
    this.activeThemeId = null;
    
    this.settings = {
      activeThemeId: null,
      mode: 'system',
      installedThemes: [],
      favoriteThemes: [],
      recentThemes: [],
      autoSwitch: false,
      defaultLightTheme: 'light',
      defaultDarkTheme: 'dark',
      defaultSystemTheme: 'system',
      sync: false,
      syncWithSystem: true,
    };
  }
}

// ============ INSTANCE ============

/**
 * Instance singleton du gestionnaire de thèmes
 */
export const themeManager = new ThemeManager();

// ============ EXPORT ============

export {
  ThemeManager,
  themeManager,
};
