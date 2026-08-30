"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  VoiceSettings,
  VoiceStatus,
  VoiceCommand,
  VoiceCommandId,
  VoiceTranscription,
  VoiceEvent,
  VoiceEventType,
  VoiceProvider,
  VoiceProviderConfig,
  MicrophoneStatus,
} from './voice-types';

import {
  voiceSettingsStore,
  voiceStatusStore,
  voiceTranscriptionStore,
  voiceCommandsStore,
  currentVoiceCommandStore,
  voiceCommandQueueStore,
  voiceProviderStore,
  voiceProviderConfigStore,
  voiceEventsStore,
} from './voice-store';

import { voiceCommandEngine } from './voice-engine';
import { WebSpeechVoiceRecognizer, WhisperVoiceRecognizer, VoiceRecognizerFactory } from './voice-recognizer';
import { WebSpeechTextToSpeech, TextToSpeechFactory, voiceManager } from './voice-tts';

// ============ GENERAL VOICE HOOKS ============

/**
 * Hook pour gérer l'état global de la voix
 */
export function useVoiceState() {
  const [settings, setSettings] = useState<VoiceSettings>({} as VoiceSettings);
  const [status, setStatus] = useState<VoiceStatus>({} as VoiceStatus);
  const [transcription, setTranscription] = useState<VoiceTranscription | null>(null);
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState<VoiceCommand | null>(null);
  const [queue, setQueue] = useState<VoiceCommand[]>([]);
  const [provider, setProvider] = useState<VoiceProvider>('web-speech-api');
  const [providerConfig, setProviderConfig] = useState<VoiceProviderConfig>({} as VoiceProviderConfig);
  const [events, setEvents] = useState<VoiceEvent[]>([]);
  
  useEffect(() => {
    // S'abonner aux stores
    const unsubscribeSettings = voiceSettingsStore.subscribe(setSettings);
    const unsubscribeStatus = voiceStatusStore.subscribe(setStatus);
    const unsubscribeTranscription = voiceTranscriptionStore.subscribe(setTranscription);
    const unsubscribeCommands = voiceCommandsStore.subscribe(setCommands);
    const unsubscribeCurrentCommand = currentVoiceCommandStore.subscribe(setCurrentCommand);
    const unsubscribeQueue = voiceCommandQueueStore.subscribe(setQueue as (q: VoiceCommand[]) => void);
    const unsubscribeProvider = voiceProviderStore.subscribe(setProvider);
    const unsubscribeProviderConfig = voiceProviderConfigStore.subscribe(setProviderConfig);
    const unsubscribeEvents = voiceEventsStore.subscribe(setEvents);
    
    return () => {
      unsubscribeSettings();
      unsubscribeStatus();
      unsubscribeTranscription();
      unsubscribeCommands();
      unsubscribeCurrentCommand();
      unsubscribeQueue();
      unsubscribeProvider();
      unsubscribeProviderConfig();
      unsubscribeEvents();
    };
  }, []);
  
  return {
    settings,
    status,
    transcription,
    commands,
    currentCommand,
    queue,
    provider,
    providerConfig,
    events,
  };
}

/**
 * Hook pour gérer la reconnaissance vocale
 */
export function useVoiceRecognition() {
  const [recognizer, setRecognizer] = useState<WebSpeechVoiceRecognizer | WhisperVoiceRecognizer | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState<MicrophoneStatus>('idle');
  const [lastTranscription, setLastTranscription] = useState<VoiceTranscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recognizerRef = useRef<WebSpeechVoiceRecognizer | WhisperVoiceRecognizer | null>(null);
  
  // Initialiser le reconnaisseur
  useEffect(() => {
    const initRecognizer = () => {
      const recognizer = VoiceRecognizerFactory.create({
        provider: 'web-speech-api',
        language: 'en-US',
      });
      
      recognizerRef.current = recognizer;
      setRecognizer(recognizer);
      setIsSupported(recognizer.isAvailable());
      setMicrophoneStatus(recognizer.getMicrophoneStatus());
      
      // Écouter les événements
      recognizer.on('recognition.start', () => {
        setIsListening(true);
        setMicrophoneStatus('listening');
        setError(null);
      });
      
      recognizer.on('recognition.stop', () => {
        setIsListening(false);
      });
      
      recognizer.on('recognition.result', (event) => {
        if (event.data?.transcription) {
          setLastTranscription(event.data.transcription as VoiceTranscription);
        }
      });
      
      recognizer.on('recognition.error', (event) => {
        setError(event.data?.error as string || 'Unknown error');
        setIsListening(false);
      });
      
      recognizer.on('microphone.error', (event) => {
        setError(event.data?.error as string || 'Microphone error');
        setMicrophoneStatus('error' as MicrophoneStatus);
      });
      
      recognizer.on('recognition.end', () => {
        setIsListening(false);
        setMicrophoneStatus('idle');
      });
    };
    
    initRecognizer();
    
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
        recognizerRef.current.cleanup();
      }
    };
  }, []);
  
  // Démarrer la reconnaissance
  const startRecognition = useCallback(async (options?: { language?: string; continuous?: boolean }) => {
    if (!recognizerRef.current) return null;
    
    try {
      setError(null);
      const result = await recognizerRef.current.start({
        language: options?.language,
        continuous: options?.continuous,
      });
      
      if (result.transcription) {
        setLastTranscription(result.transcription);
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);
  
  // Arrêter la reconnaissance
  const stopRecognition = useCallback(async () => {
    if (!recognizerRef.current) return;
    
    await recognizerRef.current.stop();
    setIsListening(false);
    setMicrophoneStatus('idle');
  }, []);
  
  // Mettre en pause
  const pauseRecognition = useCallback(async () => {
    if (!recognizerRef.current) return;
    
    await recognizerRef.current.pause();
    setMicrophoneStatus('processing');
  }, []);
  
  // Reprendre
  const resumeRecognition = useCallback(async () => {
    if (!recognizerRef.current) return;
    
    await recognizerRef.current.resume();
    setMicrophoneStatus('listening');
  }, []);
  
  // Changer la langue
  const setLanguage = useCallback(async (language: string) => {
    if (!recognizerRef.current) return;
    
    await recognizerRef.current.configure({
      provider: 'web-speech-api',
      language,
    });
  }, []);
  
  // Changer le fournisseur
  const setProvider = useCallback(async (provider: VoiceProvider) => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      recognizerRef.current.cleanup();
    }
    
    const recognizer = VoiceRecognizerFactory.create({
      provider,
      language: 'en-US',
    });
    
    recognizerRef.current = recognizer;
    setRecognizer(recognizer);
    setIsSupported(recognizer.isAvailable());
    setMicrophoneStatus(recognizer.getMicrophoneStatus());
  }, []);
  
  return {
    recognizer,
    isListening,
    isSupported,
    microphoneStatus,
    lastTranscription,
    error,
    startRecognition,
    stopRecognition,
    pauseRecognition,
    resumeRecognition,
    setLanguage,
    setProvider,
  };
}

/**
 * Hook pour la synthèse vocale
 */
export function useTextToSpeech() {
  const [tts, setTts] = useState<WebSpeechTextToSpeech | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const ttsRef = useRef<WebSpeechTextToSpeech | null>(null);
  
  // Initialiser
  useEffect(() => {
    const initTTS = () => {
      const tts = TextToSpeechFactory.create();
      ttsRef.current = tts;
      setTts(tts);
      setVoices(tts.getVoices());
      
      // Écouter les événements
      tts.on('synthesis.start', () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setError(null);
      });
      
      tts.on('synthesis.stop', () => {
        setIsSpeaking(false);
      });
      
      tts.on('synthesis.pause', () => {
        setIsPaused(true);
      });
      
      tts.on('synthesis.resume', () => {
        setIsPaused(false);
      });
      
      tts.on('synthesis.error', (event) => {
        setError(event.data?.error as string || 'Unknown error');
        setIsSpeaking(false);
      });
      
      tts.on('synthesis.end', () => {
        setIsSpeaking(false);
      });
      
      // Écouter les changements de voix
      tts.on('synthesis.voiceschanged', () => {
        setVoices(tts.getVoices());
      });
    };
    
    initTTS();
    
    return () => {
      if (ttsRef.current) {
        ttsRef.current.stop();
        ttsRef.current.cleanup();
      }
    };
  }, []);
  
  // Dire un texte
  const speak = useCallback(async (text: string, options?: Partial<SpeechSynthesisUtterance>) => {
    if (!ttsRef.current) return;
    
    try {
      setError(null);
      await ttsRef.current.speak(text, options as SpeechSynthesisUtterance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);
  
  // Arrêter
  const stop = useCallback(async () => {
    if (!ttsRef.current) return;
    
    await ttsRef.current.stop();
    setIsSpeaking(false);
  }, []);
  
  // Mettre en pause
  const pause = useCallback(async () => {
    if (!ttsRef.current) return;
    
    await ttsRef.current.pause();
    setIsPaused(true);
  }, []);
  
  // Reprendre
  const resume = useCallback(async () => {
    if (!ttsRef.current) return;
    
    await ttsRef.current.resume();
    setIsPaused(false);
  }, []);
  
  // Changer la voix
  const setVoice = useCallback(async (voiceName: string) => {
    if (!ttsRef.current) return;
    
    await ttsRef.current.configure({
      defaultVoice: voiceName,
      defaultRate: 1,
      defaultPitch: 1,
      defaultVolume: 1,
      defaultLang: 'en-US',
    });
  }, []);
  
  // Changer le taux
  const setRate = useCallback(async (rate: number) => {
    if (!ttsRef.current) return;
    
    await ttsRef.current.configure({
      defaultVoice: ttsRef.current.getDefaultVoice()?.name || '',
      defaultRate: rate,
      defaultPitch: 1,
      defaultVolume: 1,
      defaultLang: 'en-US',
    });
  }, []);
  
  // Changer le pitch
  const setPitch = useCallback(async (pitch: number) => {
    if (!ttsRef.current) return;
    
    await ttsRef.current.configure({
      defaultVoice: ttsRef.current.getDefaultVoice()?.name || '',
      defaultRate: 1,
      defaultPitch: pitch,
      defaultVolume: 1,
      defaultLang: 'en-US',
    });
  }, []);
  
  // Ajouter à la file
  const queueSpeak = useCallback((text: string, options?: Partial<SpeechSynthesisUtterance>) => {
    if (!ttsRef.current) return;
    
    ttsRef.current.queueSpeak(text, options as SpeechSynthesisUtterance);
  }, []);
  
  return {
    tts,
    isSpeaking,
    isPaused,
    voices,
    error,
    speak,
    stop,
    pause,
    resume,
    setVoice,
    setRate,
    setPitch,
    queueSpeak,
  };
}

// ============ COMMAND ENGINE HOOKS ============

/**
 * Hook pour le moteur de commandes vocales
 */
export function useVoiceCommandEngine() {
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState<VoiceCommand | null>(null);
  const [queue, setQueue] = useState<VoiceCommand[]>([]);
  const [variables, setVariables] = useState<Record<string, unknown>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  // S'abonner aux changements du moteur
  useEffect(() => {
    // Obtenir les commandes
    queueMicrotask(() => {
      setCommands(voiceCommandEngine.getAllCommands());
    });
    
    // Écouter les événements
    const onCommandAdded = (event: VoiceEvent) => {
      if (event.type === 'command.added') {
        queueMicrotask(() => {
          setCommands(voiceCommandEngine.getAllCommands());
        });
      }
    };
    
    const onCommandRemoved = (event: VoiceEvent) => {
      if (event.type === 'command.removed') {
        queueMicrotask(() => {
          setCommands(voiceCommandEngine.getAllCommands());
        });
      }
    };
    
    const onCommandExecuting = (event: VoiceEvent) => {
      if (event.type === 'command.executing') {
        queueMicrotask(() => {
          const cmd = voiceCommandEngine.getCurrentCommand();
          setCurrentCommand(cmd);
          setIsProcessing(true);
        });
      }
    };
    
    const onCommandCompleted = (event: VoiceEvent) => {
      if (event.type === 'command.completed' || event.type === 'command.error') {
        queueMicrotask(() => {
          setCurrentCommand(null);
          setIsProcessing(false);
          setQueue(voiceCommandEngine.getCommandQueue());
        });
      }
    };
    
    const onVariableSet = (event: VoiceEvent) => {
      if (event.type === 'variable.set') {
        queueMicrotask(() => {
          setVariables(voiceCommandEngine.getAllVariables());
        });
      }
    };
    
    voiceCommandEngine.on('command.added', onCommandAdded);
    voiceCommandEngine.on('command.removed', onCommandRemoved);
    voiceCommandEngine.on('command.executing', onCommandExecuting);
    voiceCommandEngine.on('command.completed', onCommandCompleted);
    voiceCommandEngine.on('command.error', onCommandCompleted);
    voiceCommandEngine.on('variable.set', onVariableSet);
    
    return () => {
      voiceCommandEngine.off('command.added', onCommandAdded);
      voiceCommandEngine.off('command.removed', onCommandRemoved);
      voiceCommandEngine.off('command.executing', onCommandExecuting);
      voiceCommandEngine.off('command.completed', onCommandCompleted);
      voiceCommandEngine.off('command.error', onCommandCompleted);
      voiceCommandEngine.off('variable.set', onVariableSet);
    };
  }, []);
  
  // Ajouter une commande
  const addCommand = useCallback((command: VoiceCommand) => {
    voiceCommandEngine.addCommand(command);
  }, []);
  
  // Supprimer une commande
  const removeCommand = useCallback((id: VoiceCommandId) => {
    voiceCommandEngine.removeCommand(id);
  }, []);
  
  // Mettre à jour une commande
  const updateCommand = useCallback((id: VoiceCommandId, updates: Partial<VoiceCommand>) => {
    voiceCommandEngine.updateCommand(id, updates);
  }, []);
  
  // Exécuter une commande
  const executeCommand = useCallback(async (commandId: VoiceCommandId, transcription: VoiceTranscription) => {
    return voiceCommandEngine.executeCommand(commandId, transcription);
  }, []);
  
  // Trouver les commandes correspondantes
  const findMatchingCommands = useCallback((transcription: VoiceTranscription) => {
    return voiceCommandEngine.findMatchingCommands(transcription);
  }, []);
  
  // Définir une variable
  const setVariable = useCallback((name: string, value: unknown) => {
    voiceCommandEngine.setVariable(name, value);
  }, []);
  
  // Obtenir une variable
  const getVariable = useCallback((name: string) => {
    return voiceCommandEngine.getVariable(name);
  }, []);
  
  // Annuler toutes les commandes
  const cancelAllCommands = useCallback(() => {
    voiceCommandEngine.cancelAllCommands();
  }, []);
  
  // Annuler une commande
  const cancelCommand = useCallback((commandId: VoiceCommandId) => {
    voiceCommandEngine.cancelCommand(commandId);
  }, []);
  
  return {
    commands,
    currentCommand,
    queue,
    variables,
    isProcessing,
    addCommand,
    removeCommand,
    updateCommand,
    executeCommand,
    findMatchingCommands,
    setVariable,
    getVariable,
    cancelAllCommands,
    cancelCommand,
  };
}

// ============ VOICE CONTROL HOOKS ============

/**
 * Hook pour contrôler la voix avec le clavier
 */
export function useVoiceKeyboardShortcuts() {
  const { startRecognition, stopRecognition } = useVoiceRecognition();
  const { speak } = useTextToSpeech();
  
  // Gérer les raccourcis clavier
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Ctrl+Shift+Space pour démarrer l'écoute
      if (event.ctrlKey && event.shiftKey && event.code === 'Space') {
        event.preventDefault();
        await startRecognition();
      }
      
      // Ctrl+Shift+Escape pour arrêter l'écoute
      if (event.ctrlKey && event.shiftKey && event.code === 'Escape') {
        event.preventDefault();
        await stopRecognition();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [startRecognition, stopRecognition]);
}

/**
 * Hook pour la gestion complète de la voix
 */
export function useVoice() {
  const recognition = useVoiceRecognition();
  const tts = useTextToSpeech();
  const engine = useVoiceCommandEngine();
  const state = useVoiceState();
  
  return {
    // État
    ...state,
    
    // Reconnaissance
    recognition,
    
    // Synthèse vocale
    tts,
    
    // Moteur de commandes
    engine,
    
    // Méthodes utilitaires
    async handleVoiceCommand(text: string) {
      const transcription: VoiceTranscription = {
        text,
        confidence: 1,
        confidenceLevel: 'very-high',
        language: 'en-US',
        startTime: Date.now(),
        endTime: Date.now(),
        words: [],
      };
      
      const matchingCommands = engine.findMatchingCommands(transcription);
      
      if (matchingCommands.length > 0) {
        // Exécuter la première commande correspondante
        await engine.executeCommand(matchingCommands[0].id, transcription);
        return matchingCommands[0];
      }
      
      return null;
    },
    
    async toggleListening() {
      if (recognition.isListening) {
        await recognition.stopRecognition();
      } else {
        await recognition.startRecognition();
      }
    },
    
    async toggleSpeaking(text: string) {
      if (tts.isSpeaking) {
        await tts.stop();
      } else {
        await tts.speak(text);
      }
    },
  };
}

// ============ CUSTOM HOOKS ============

/**
 * Hook pour créer des commandes vocales personnalisées
 */
export function useCustomVoiceCommands() {
  const { addCommand, removeCommand, updateCommand } = useVoiceCommandEngine();
  
  // Créer une commande personnalisée
  const createCommand = useCallback((command: Omit<VoiceCommand, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullCommand: VoiceCommand = {
      ...command,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    addCommand(fullCommand);
    return id;
  }, [addCommand]);
  
  // Supprimer une commande personnalisée
  const deleteCommand = useCallback((id: VoiceCommandId) => {
    removeCommand(id);
  }, [removeCommand]);
  
  // Mettre à jour une commande personnalisée
  const editCommand = useCallback((id: VoiceCommandId, updates: Partial<VoiceCommand>) => {
    updateCommand(id, updates);
  }, [updateCommand]);
  
  return {
    createCommand,
    deleteCommand,
    editCommand,
  };
}

/**
 * Hook pour la gestion des raccourcis vocaux
 */
export function useVoiceShortcuts() {
  const { speak } = useTextToSpeech();
  const { executeCommand } = useVoiceCommandEngine();
  
  // Enregistrer un raccourci vocal
  const registerShortcut = useCallback((trigger: string, action: () => void) => {
    // À implémenter avec le moteur de commandes
    const command: VoiceCommand = {
      id: `shortcut-${Date.now()}`,
      name: `Shortcut: ${trigger}`,
      description: `Execute action for ${trigger}`,
      category: 'custom',
      type: 'action',
      triggers: [{ pattern: trigger, patternType: 'keyword' }],
      actions: [{ type: 'custom', params: { action: 'execute_callback' } }],
      priority: 0,
      enabled: true,
      requireConfirmation: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    voiceCommandEngine.addCommand(command);
    
    // Stocker l'action
    const callbackMap = new Map<string, () => void>();
    callbackMap.set(command.id, action);
    
    return () => {
      voiceCommandEngine.removeCommand(command.id);
      callbackMap.delete(command.id);
    };
  }, []);
  
  return {
    registerShortcut,
  };
}

// ============ EXPORT DEFAULT ============

export const voiceHookExports = {
  useVoiceState,
  useVoiceRecognition,
  useTextToSpeech,
  useVoiceCommandEngine,
  useVoiceKeyboardShortcuts,
  useVoice,
  useCustomVoiceCommands,
  useVoiceShortcuts,
};
