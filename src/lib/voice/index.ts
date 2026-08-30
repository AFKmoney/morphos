/**
 * Module Voice Commands - Système de commandes vocales avancées
 * 
 * Ce module fournit un système complet pour la reconnaissance vocale,
 * la synthèse vocale et l'exécution de commandes vocales.
 * 
 * Fonctionnalités:
 * - Reconnaissance vocale (Web Speech API, Whisper, etc.)
 * - Synthèse vocale (Text-to-Speech)
 * - Moteur de commandes vocales
 * - Gestion des commandes personnalisées
 * - Intégration avec le système MorphOS
 */

// ============ TYPES ============

export * from './voice-types';

// ============ RECOGNITION ============

export {
  VoiceRecognizerInterface,
  BaseVoiceRecognizer,
  WebSpeechVoiceRecognizer,
  WhisperVoiceRecognizer,
  VoiceRecognizerFactory,
  defaultRecognizer,
} from './voice-recognizer';

// ============ TTS (Text-to-Speech) ============

export {
  TextToSpeechInterface,
  BaseTextToSpeech,
  WebSpeechTextToSpeech,
  TextToSpeechFactory,
  voiceManager,
  VoiceManager,
  getAllVoices,
  loadVoices,
  speakText,
  stopSpeech,
  isSpeechSynthesisSupported,
} from './voice-tts';

// ============ ENGINE ============

export {
  VoiceCommandEngine,
  voiceCommandEngine,
} from './voice-engine';

// ============ STORES ============

export {
  DEFAULT_VOICE_SETTINGS,
  DEFAULT_VOICE_STATUS,
  voiceSettingsStore,
  voiceStatusStore,
  voiceTranscriptionStore,
  voiceCommandsStore,
  currentVoiceCommandStore,
  voiceCommandQueueStore,
  voiceProviderStore,
  voiceProviderConfigStore,
  voiceEventsStore,
  microphoneStatusStore,
  isListeningStore,
  isSpeakingStore,
  currentCommandIdStore,
  lastTranscriptionStore,
  lastErrorStore,
  voiceEnabledStore,
  currentLanguageStore,
  initializeVoiceStores,
  updateVoiceStatus,
  updateVoiceSettings,
  resetVoiceSettings,
  resetVoiceStatus,
  addVoiceCommand,
  removeVoiceCommand,
  updateVoiceCommand,
  setVoiceCommands,
  addVoiceEvent,
  clearVoiceEvents,
  setCurrentTranscription,
  setCurrentVoiceCommand,
  setVoiceCommandQueue,
  setVoiceProvider,
  setVoiceProviderConfig,
  getMicrophoneVolume,
  checkMicrophoneAvailability,
  checkMicrophonePermission,
  requestMicrophonePermission,
  createVoiceStore,
} from './voice-store';

// ============ HOOKS ============

export {
  useVoiceState,
  useVoiceRecognition,
  useTextToSpeech,
  useVoiceCommandEngine,
  useVoiceKeyboardShortcuts,
  useVoice,
  useCustomVoiceCommands,
  useVoiceShortcuts,
} from './voice-hooks';

// ============ UTILITIES ============

/**
 * Vérifier si la voix est supportée
 */
export function isVoiceSupported(): boolean {
  return 'speechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Vérifier si la synthèse vocale est supportée
 */
export function isTTSSupported(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Vérifier si la voix est complètement supportée
 */
export function isFullVoiceSupported(): boolean {
  return isVoiceSupported() && isTTSSupported();
}

/**
 * Obtenir le niveau de support de la voix
 */
export function getVoiceSupportLevel(): 'full' | 'partial' | 'none' {
  const hasRecognition = isVoiceSupported();
  const hasSynthesis = isTTSSupported();
  
  if (hasRecognition && hasSynthesis) return 'full';
  if (hasRecognition || hasSynthesis) return 'partial';
  return 'none';
}
