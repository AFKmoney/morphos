"use client";

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type {
  VoiceSettings,
  VoiceStatus,
  VoiceCommand,
  VoiceCommandId,
  VoiceCommandWithStatus,
  VoiceTranscription,
  VoiceEvent,
  VoiceEventType,
  VoiceProvider,
  VoiceProviderConfig,
  MicrophoneStatus,
} from './voice-types';

// ============ DEFAULT SETTINGS ============

/** Paramètres par défaut */
export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  activationShortcut: 'Ctrl+Shift+Space',
  stopShortcut: 'Ctrl+Shift+Escape',
  microphoneSensitivity: 0.8,
  noiseSuppression: true,
  echoCancellation: true,
  recognition: {
    defaultLanguage: 'en-US',
    defaultModel: 'web-speech-api',
    continuous: false,
    maxDuration: 60000,
    silenceThreshold: 3000,
    filterProfanity: true,
    includeWordTimestamps: false,
    maxAlternatives: 1,
  },
  synthesis: {
    defaultVoice: '',
    defaultRate: 1,
    defaultPitch: 1,
    defaultVolume: 1,
    defaultLang: 'en-US',
  },
  enabledCommands: [
    'system',
    'window',
    'module',
    'plugin',
    'workflow',
    'file',
    'navigation',
    'ai',
    'collaboration',
    'settings',
    'custom',
  ],
  disabledCommands: [],
  requireConfirmationForDangerous: true,
  dangerousActions: [
    'close_window',
    'close_current_window',
    'delete',
    'remove',
    'quit',
    'exit',
  ],
};

/** Statut par défaut */
export const DEFAULT_VOICE_STATUS: VoiceStatus = {
  microphone: 'idle',
  isListening: false,
  isSpeaking: false,
  currentCommandId: null,
  lastTranscription: null,
  lastError: null,
  microphoneVolume: 0,
  available: true,
  permitted: true,
};

// ============ STORES ============

/** Store des paramètres */
export const voiceSettingsStore: Writable<VoiceSettings> = writable(DEFAULT_VOICE_SETTINGS);

/** Store du statut */
export const voiceStatusStore: Writable<VoiceStatus> = writable(DEFAULT_VOICE_STATUS);

/** Store de la transcription actuelle */
export const voiceTranscriptionStore: Writable<VoiceTranscription | null> = writable(null);

/** Store des commandes */
export const voiceCommandsStore: Writable<VoiceCommand[]> = writable([]);

/** Store de la commande en cours */
export const currentVoiceCommandStore: Writable<VoiceCommandWithStatus | null> = writable(null);

/** Store de la file d'attente */
export const voiceCommandQueueStore: Writable<VoiceCommandWithStatus[]> = writable([]);

/** Store du fournisseur actuel */
export const voiceProviderStore: Writable<VoiceProvider> = writable('web-speech-api');

/** Store de la configuration du fournisseur */
export const voiceProviderConfigStore: Writable<VoiceProviderConfig> = writable({
  provider: 'web-speech-api',
  language: 'en-US',
});

/** Store des événements */
export const voiceEventsStore: Writable<VoiceEvent[]> = writable([]);

// ============ DERIVED STORES ============

/** Statut du microphone */
export const microphoneStatusStore: Readable<MicrophoneStatus> = derived(
  voiceStatusStore,
  ($status) => $status.microphone
);

/** Écoute en cours */
export const isListeningStore: Readable<boolean> = derived(
  voiceStatusStore,
  ($status) => $status.isListening
);

/** Parle en cours */
export const isSpeakingStore: Readable<boolean> = derived(
  voiceStatusStore,
  ($status) => $status.isSpeaking
);

/** Commande en cours */
export const currentCommandIdStore: Readable<VoiceCommandId | null> = derived(
  voiceStatusStore,
  ($status) => $status.currentCommandId
);

/** Dernière transcription */
export const lastTranscriptionStore: Readable<VoiceTranscription | null> = derived(
  voiceStatusStore,
  ($status) => $status.lastTranscription
);

/** Dernière erreur */
export const lastErrorStore: Readable<string | null> = derived(
  voiceStatusStore,
  ($status) => $status.lastError
);

/** Activation de la voix */
export const voiceEnabledStore: Readable<boolean> = derived(
  voiceSettingsStore,
  ($settings) => $settings.enabled
);

/** Langue actuelle */
export const currentLanguageStore: Readable<string> = derived(
  voiceSettingsStore,
  ($settings) => $settings.recognition.defaultLanguage
);

// ============ ACTIONS ============

/**
 * Initialiser les stores de voix
 */
export function initializeVoiceStores(): void {
  // Charger les paramètres depuis le localStorage
  const savedSettings = localStorage.getItem('morphos-voice-settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings) as VoiceSettings;
      voiceSettingsStore.set({ ...DEFAULT_VOICE_SETTINGS, ...settings });
    } catch {
      // Utiliser les paramètres par défaut
    }
  }
  
  // Sauvegarder les paramètres lors des changements
  voiceSettingsStore.subscribe((settings) => {
    localStorage.setItem('morphos-voice-settings', JSON.stringify(settings));
  });
  
  // Initialiser le statut
  voiceStatusStore.set(DEFAULT_VOICE_STATUS);
}

/**
 * Mettre à jour le statut
 */
export function updateVoiceStatus(updates: Partial<VoiceStatus>): void {
  voiceStatusStore.update((status) => ({ ...status, ...updates }));
}

/**
 * Mettre à jour les paramètres
 */
export function updateVoiceSettings(updates: Partial<VoiceSettings>): void {
  voiceSettingsStore.update((settings) => ({ ...settings, ...updates }));
}

/**
 * Réinitialiser les paramètres
 */
export function resetVoiceSettings(): void {
  voiceSettingsStore.set(DEFAULT_VOICE_SETTINGS);
}

/**
 * Réinitialiser le statut
 */
export function resetVoiceStatus(): void {
  voiceStatusStore.set(DEFAULT_VOICE_STATUS);
}

/**
 * Ajouter une commande
 */
export function addVoiceCommand(command: VoiceCommand): void {
  voiceCommandsStore.update((commands) => [...commands, command]);
}

/**
 * Supprimer une commande
 */
export function removeVoiceCommand(id: VoiceCommandId): void {
  voiceCommandsStore.update((commands) => commands.filter(cmd => cmd.id !== id));
}

/**
 * Mettre à jour une commande
 */
export function updateVoiceCommand(id: VoiceCommandId, updates: Partial<VoiceCommand>): void {
  voiceCommandsStore.update((commands) =>
    commands.map(cmd => cmd.id === id ? { ...cmd, ...updates } : cmd)
  );
}

/**
 * Définir les commandes
 */
export function setVoiceCommands(commands: VoiceCommand[]): void {
  voiceCommandsStore.set(commands);
}

/**
 * Ajouter un événement
 */
export function addVoiceEvent(event: VoiceEvent): void {
  voiceEventsStore.update((events) => [...events, event]);
}

/**
 * Nettoyer les événements
 */
export function clearVoiceEvents(): void {
  voiceEventsStore.set([]);
}

/**
 * Définir la transcription actuelle
 */
export function setCurrentTranscription(transcription: VoiceTranscription | null): void {
  voiceTranscriptionStore.set(transcription);
}

/**
 * Définir la commande en cours
 */
export function setCurrentVoiceCommand(command: VoiceCommandWithStatus | null): void {
  currentVoiceCommandStore.set(command);
}

/**
 * Définir la file d'attente
 */
export function setVoiceCommandQueue(queue: VoiceCommandWithStatus[]): void {
  voiceCommandQueueStore.set(queue);
}

/**
 * Définir le fournisseur
 */
export function setVoiceProvider(provider: VoiceProvider): void {
  voiceProviderStore.set(provider);
}

/**
 * Définir la configuration du fournisseur
 */
export function setVoiceProviderConfig(config: VoiceProviderConfig): void {
  voiceProviderConfigStore.set(config);
}

// ============ HELPERS ============

/**
 * Obtenir le volume du microphone
 * (À implémenter avec l'API AudioContext)
 */
export async function getMicrophoneVolume(): Promise<number> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: new () => AudioContext }).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(2048, 1, 1);
    
    source.connect(processor);
    processor.connect(audioContext.destination);
    
    let volume = 0;
    
    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer.getChannelData(0);
      let sum = 0;
      
      for (let i = 0; i < input.length; i++) {
        sum += Math.abs(input[i]);
      }
      
      volume = Math.sqrt(sum / input.length);
    };
    
    // Attendre un peu pour obtenir une lecture
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Nettoyer
    stream.getTracks().forEach(track => track.stop());
    audioContext.close();
    
    return volume;
  } catch {
    return 0;
  }
}

/**
 * Vérifier si le microphone est disponible
 */
export async function checkMicrophoneAvailability(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifier les permissions du microphone
 */
export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    const permission = await navigator.permissions?.query({ name: 'microphone' as never });
    return permission?.state === 'granted';
  } catch {
    return false;
  }
}

/**
 * Demander les permissions du microphone
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
}

// ============ CUSTOM STORE ============

/**
 * Store personnalisé pour la voix avec gestion automatique
 */
export function createVoiceStore() {
  const { subscribe, set, update } = writable<{
    settings: VoiceSettings;
    status: VoiceStatus;
    commands: VoiceCommand[];
    events: VoiceEvent[];
  }>({
    settings: DEFAULT_VOICE_SETTINGS,
    status: DEFAULT_VOICE_STATUS,
    commands: [],
    events: [],
  });
  
  return {
    subscribe,
    setSettings: (settings: Partial<VoiceSettings>) => update(state => ({
      ...state,
      settings: { ...state.settings, ...settings },
    })),
    setStatus: (status: Partial<VoiceStatus>) => update(state => ({
      ...state,
      status: { ...state.status, ...status },
    })),
    addCommand: (command: VoiceCommand) => update(state => ({
      ...state,
      commands: [...state.commands, command],
    })),
    removeCommand: (id: VoiceCommandId) => update(state => ({
      ...state,
      commands: state.commands.filter(cmd => cmd.id !== id),
    })),
    addEvent: (event: VoiceEvent) => update(state => ({
      ...state,
      events: [...state.events, event],
    })),
    clearEvents: () => update(state => ({
      ...state,
      events: [],
    })),
    reset: () => set({
      settings: DEFAULT_VOICE_SETTINGS,
      status: DEFAULT_VOICE_STATUS,
      commands: [],
      events: [],
    }),
  };
}

// ============ INITIALIZATION ============

// Initialiser automatiquement
if (typeof window !== 'undefined') {
  initializeVoiceStores();
}
