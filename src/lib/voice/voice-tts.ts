"use client";

import type {
  VoiceSynthesisSettings,
  VoiceEvent,
  VoiceEventType,
} from './voice-types';

/**
 * Interface pour la synthèse vocale
 */
export interface TextToSpeechInterface {
  /** Dire un texte */
  speak(text: string, options?: SpeechSynthesisUtterance): Promise<void>;
  
  /** Arrêter la parole */
  stop(): Promise<void>;
  
  /** Mettre en pause la parole */
  pause(): Promise<void>;
  
  /** Reprendre la parole */
  resume(): Promise<void>;
  
  /** Obtenir les voix disponibles */
  getVoices(): SpeechSynthesisVoice[];
  
  /** Obtenir la voix par défaut */
  getDefaultVoice(): SpeechSynthesisVoice | null;
  
  /** Obtenir la voix par nom */
  getVoiceByName(name: string): SpeechSynthesisVoice | null;
  
  /** Vérifier si la parole est en cours */
  isSpeaking(): boolean;
  
  /** Vérifier si la parole est en pause */
  isPaused(): boolean;
  
  /** Configurer les paramètres */
  configure(settings: VoiceSynthesisSettings): Promise<void>;
  
  /** Écouter les événements */
  on(event: VoiceEventType, callback: (event: VoiceEvent) => void): void;
  
  /** Arrêter d'écouter les événements */
  off(event: VoiceEventType, callback: (event: VoiceEvent) => void): void;
  
  /** Émettre un événement */
  emit(event: VoiceEventType, data?: Record<string, unknown>): void;
}

/**
 * Classe de base pour la synthèse vocale
 */
export abstract class BaseTextToSpeech implements TextToSpeechInterface {
  protected listeners: Map<VoiceEventType, Set<(event: VoiceEvent) => void>> = new Map();
  protected settings: VoiceSynthesisSettings;
  protected utteranceQueue: SpeechSynthesisUtterance[] = [];
  protected isSpeaking = false;
  protected isPaused = false;
  
  constructor(settings: VoiceSynthesisSettings = {
    defaultVoice: '',
    defaultRate: 1,
    defaultPitch: 1,
    defaultVolume: 1,
    defaultLang: 'en-US',
  }) {
    this.settings = settings;
    this.setupEventListeners();
  }
  
  /** Configurer les écouteurs */
  protected abstract setupEventListeners(): void;
  
  /** Dire un texte */
  public abstract speak(text: string, options?: SpeechSynthesisUtterance): Promise<void>;
  
  /** Arrêter la parole */
  public abstract stop(): Promise<void>;
  
  /** Mettre en pause */
  public abstract pause(): Promise<void>;
  
  /** Reprendre */
  public abstract resume(): Promise<void>;
  
  /** Obtenir les voix disponibles */
  public getVoices(): SpeechSynthesisVoice[] {
    return window.speechSynthesis?.getVoices() || [];
  }
  
  /** Obtenir la voix par défaut */
  public getDefaultVoice(): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    
    if (this.settings.defaultVoice) {
      return voices.find(v => v.name === this.settings.defaultVoice) || null;
    }
    
    // Trouver une voix par défaut
    return voices.find(v => v.default) || voices[0] || null;
  }
  
  /** Obtenir la voix par nom */
  public getVoiceByName(name: string): SpeechSynthesisVoice | null {
    return this.getVoices().find(v => v.name === name) || null;
  }
  
  /** Vérifier si la parole est en cours */
  public isSpeaking(): boolean {
    return this.isSpeaking || window.speechSynthesis?.speaking || false;
  }
  
  /** Vérifier si la parole est en pause */
  public isPaused(): boolean {
    return this.isPaused || window.speechSynthesis?.paused || false;
  }
  
  /** Configurer */
  public async configure(settings: VoiceSynthesisSettings): Promise<void> {
    this.settings = settings;
    await this.setupConfig();
  }
  
  /** Configurer après changement */
  protected abstract setupConfig(): Promise<void>;
  
  /** Écouter les événements */
  public on(event: VoiceEventType, callback: (event: VoiceEvent) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }
  
  /** Arrêter d'écouter */
  public off(event: VoiceEventType, callback: (event: VoiceEvent) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }
  
  /** Émettre un événement */
  public emit(event: VoiceEventType, data?: Record<string, unknown>): void {
    const voiceEvent: VoiceEvent = {
      type: event,
      timestamp: Date.now(),
      data,
    };
    
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(voiceEvent);
        } catch (error) {
          console.error('Error in TTS event callback:', error);
        }
      });
    }
  }
  
  /** Nettoyer */
  public cleanup(): void {
    this.listeners.clear();
    this.utteranceQueue = [];
    this.isSpeaking = false;
    this.isPaused = false;
  }
}

/**
 * Synthèse vocale utilisant l'API Web Speech
 */
export class WebSpeechTextToSpeech extends BaseTextToSpeech {
  private utterance: SpeechSynthesisUtterance | null = null;
  
  constructor(settings?: VoiceSynthesisSettings) {
    super(settings);
  }
  
  protected setupEventListeners(): void {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.onvoiceschanged = () => {
      this.emit('synthesis.voiceschanged', {});
    };
  }
  
  protected async setupConfig(): Promise<void> {
    // Rien à faire pour l'instant
  }
  
  /** Dire un texte */
  public async speak(text: string, options?: SpeechSynthesisUtterance): Promise<void> {
    if (!window.speechSynthesis) {
      this.emit('synthesis.error', { error: 'Speech synthesis not available' });
      return;
    }
    
    // Arrêter la parole en cours si nécessaire
    if (this.isSpeaking()) {
      await this.stop();
    }
    
    // Créer l'utterance
    const utterance = options || new SpeechSynthesisUtterance(text);
    
    // Appliquer les paramètres par défaut
    const voice = this.getDefaultVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = options?.rate || this.settings.defaultRate;
    utterance.pitch = options?.pitch || this.settings.defaultPitch;
    utterance.volume = options?.volume || this.settings.defaultVolume;
    utterance.lang = options?.lang || this.settings.defaultLang;
    
    // Écouteurs
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.emit('synthesis.start', { text });
    };
    
    utterance.onend = () => {
      this.isSpeaking = false;
      this.emit('synthesis.end', { text });
      
      // Exécuter la prochaine utterance dans la file
      this.processQueue();
    };
    
    utterance.onpause = () => {
      this.isPaused = true;
      this.emit('synthesis.pause', { text });
    };
    
    utterance.onresume = () => {
      this.isPaused = false;
      this.emit('synthesis.resume', { text });
    };
    
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      this.isSpeaking = false;
      this.emit('synthesis.error', { error: event.error, text });
    };
    
    // Stocker l'utterance
    this.utterance = utterance;
    
    // Dire
    window.speechSynthesis.speak(utterance);
  }
  
  /** Arrêter la parole */
  public async stop(): Promise<void> {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    this.isSpeaking = false;
    this.isPaused = false;
    this.utterance = null;
    this.emit('synthesis.stop', {});
  }
  
  /** Mettre en pause */
  public async pause(): Promise<void> {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    
    this.isPaused = true;
    this.emit('synthesis.pause', {});
  }
  
  /** Reprendre */
  public async resume(): Promise<void> {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
    
    this.isPaused = false;
    this.emit('synthesis.resume', {});
  }
  
  /** Ajouter à la file d'attente */
  public queueSpeak(text: string, options?: SpeechSynthesisUtterance): void {
    const utterance = options || new SpeechSynthesisUtterance(text);
    
    const voice = this.getDefaultVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = options?.rate || this.settings.defaultRate;
    utterance.pitch = options?.pitch || this.settings.defaultPitch;
    utterance.volume = options?.volume || this.settings.defaultVolume;
    utterance.lang = options?.lang || this.settings.defaultLang;
    
    this.utteranceQueue.push(utterance);
    
    // Si on ne parle pas, démarrer
    if (!this.isSpeaking()) {
      this.processQueue();
    }
  }
  
  /** Traiter la file d'attente */
  private processQueue(): void {
    if (this.utteranceQueue.length === 0) {
      return;
    }
    
    const utterance = this.utteranceQueue.shift()!;
    
    utterance.onend = () => {
      this.processQueue();
    };
    
    window.speechSynthesis?.speak(utterance);
  }
  
  /** Vider la file d'attente */
  public clearQueue(): void {
    this.utteranceQueue = [];
    this.emit('synthesis.queue_cleared', {});
  }
  
  /** Obtenir la file d'attente */
  public getQueue(): SpeechSynthesisUtterance[] {
    return [...this.utteranceQueue];
  }
}

/**
 * Factory pour créer les synthétiseurs vocaux
 */
export class TextToSpeechFactory {
  private static instances: Map<string, BaseTextToSpeech> = new Map();
  
  /** Créer un synthétiseur */
  public static create(settings?: VoiceSynthesisSettings): BaseTextToSpeech {
    const key = `web-speech:${settings?.defaultVoice || 'default'}:${settings?.defaultLang || 'en-US'}`;
    
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }
    
    const tts = new WebSpeechTextToSpeech(settings);
    this.instances.set(key, tts);
    return tts;
  }
  
  /** Obtenir un synthétiseur existant */
  public static get(voice?: string, lang?: string): BaseTextToSpeech | null {
    const key = `web-speech:${voice || 'default'}:${lang || 'en-US'}`;
    return this.instances.get(key) || null;
  }
  
  /** Nettoyer toutes les instances */
  public static cleanup(): void {
    this.instances.forEach(tts => tts.cleanup());
    this.instances.clear();
  }
}

/**
 * Synthétiseur par défaut
 */
export const defaultTTS = TextToSpeechFactory.create();

// ============ VOICE MANAGER ============

/**
 * Gestionnaire complet de la voix (reconnaissance + synthèse)
 */
export class VoiceManager {
  private recognizer: BaseTextToSpeech | null = null;
  private tts: BaseTextToSpeech | null = null;
  private isInitialized = false;
  
  constructor() {
    this.initialize();
  }
  
  /** Initialiser */
  private initialize(): void {
    if (this.isInitialized) return;
    
    this.tts = TextToSpeechFactory.create();
    this.isInitialized = true;
  }
  
  /** Obtenir le synthétiseur */
  public getTTS(): BaseTextToSpeech | null {
    return this.tts;
  }
  
  /** Dire un texte */
  public async speak(text: string, options?: SpeechSynthesisUtterance): Promise<void> {
    if (!this.tts) {
      throw new Error('Voice manager not initialized');
    }
    
    await this.tts.speak(text, options);
  }
  
  /** Arrêter la parole */
  public async stop(): Promise<void> {
    if (this.tts) {
      await this.tts.stop();
    }
  }
  
  /** Mettre en pause */
  public async pause(): Promise<void> {
    if (this.tts) {
      await this.tts.pause();
    }
  }
  
  /** Reprendre */
  public async resume(): Promise<void> {
    if (this.tts) {
      await this.tts.resume();
    }
  }
  
  /** Vérifier si la parole est en cours */
  public isSpeaking(): boolean {
    return this.tts?.isSpeaking() || false;
  }
  
  /** Obtenir les voix disponibles */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.tts?.getVoices() || [];
  }
  
  /** Nettoyer */
  public cleanup(): void {
    this.tts?.cleanup();
    this.tts = null;
    this.isInitialized = false;
  }
}

/**
 * Instance singleton du gestionnaire de voix
 */
export const voiceManager = new VoiceManager();

// ============ UTILITY FUNCTIONS ============

/**
 * Obtenir toutes les voix disponibles
 */
export function getAllVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis?.getVoices() || [];
}

/**
 * Charger les voix (certains navigateurs ont besoin de ça)
 */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis?.getVoices();
    
    if (voices && voices.length > 0) {
      resolve(voices);
      return;
    }
    
    window.speechSynthesis?.onvoiceschanged = () => {
      resolve(window.speechSynthesis?.getVoices() || []);
    };
    
    // Timeout de 2 secondes
    setTimeout(() => {
      resolve(window.speechSynthesis?.getVoices() || []);
    }, 2000);
  });
}

/**
 * Dire un texte (fonction utilitaire)
 */
export async function speakText(text: string, options?: Partial<SpeechSynthesisUtterance>): Promise<void> {
  await voiceManager.speak(text, options as SpeechSynthesisUtterance);
}

/**
 * Arrêter la parole (fonction utilitaire)
 */
export async function stopSpeech(): Promise<void> {
  await voiceManager.stop();
}

/**
 * Vérifier si la synthèse vocale est supportée
 */
export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window;
}
