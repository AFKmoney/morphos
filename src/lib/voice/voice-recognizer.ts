"use client";

import type {
  VoiceRecognitionOptions,
  VoiceRecognitionResult,
  VoiceProvider,
  VoiceProviderConfig,
  VoiceTranscription,
  VoiceEvent,
  VoiceEventType,
  MicrophoneStatus,
} from './voice-types';

/**
 * Interface pour le reconnaissance vocale
 * Implémente l'API Web Speech et d'autres fournisseurs
 */
export interface VoiceRecognizerInterface {
  /** Démarrer la reconnaissance */
  start(options?: VoiceRecognitionOptions): Promise<VoiceRecognitionResult>;
  
  /** Arrêter la reconnaissance */
  stop(): Promise<void>;
  
  /** Mettre en pause la reconnaissance */
  pause(): Promise<void>;
  
  /** Reprendre la reconnaissance */
  resume(): Promise<void>;
  
  /** Obtenir le statut du microphone */
  getMicrophoneStatus(): MicrophoneStatus;
  
  /** Obtenir la liste des langues supportées */
  getSupportedLanguages(): string[];
  
  /** Obtenir la liste des voix disponibles */
  getAvailableVoices(): SpeechSynthesisVoice[];
  
  /** Configurer le fournisseur */
  configure(config: VoiceProviderConfig): Promise<void>;
  
  /** Vérifier si le fournisseur est disponible */
  isAvailable(): boolean;
  
  /** Écouter les événements */
  on(event: VoiceEventType, callback: (event: VoiceEvent) => void): void;
  
  /** Arrêter d'écouter les événements */
  off(event: VoiceEventType, callback: (event: VoiceEvent) => void): void;
  
  /** Émettre un événement */
  emit(event: VoiceEventType, data?: Record<string, unknown>): void;
}

/**
 * Classe de base pour les reconnaisseurs vocaux
 */
export abstract class BaseVoiceRecognizer implements VoiceRecognizerInterface {
  protected listeners: Map<VoiceEventType, Set<(event: VoiceEvent) => void>> = new Map();
  protected config: VoiceProviderConfig;
  protected isListening = false;
  protected isPaused = false;
  protected microphoneStatus: MicrophoneStatus = 'idle';
  
  constructor(config: VoiceProviderConfig) {
    this.config = config;
    this.setupEventListeners();
  }
  
  /** Configurer les écouteurs d'événements */
  protected abstract setupEventListeners(): void;
  
  /** Démarrer la reconnaissance */
  public abstract start(options?: VoiceRecognitionOptions): Promise<VoiceRecognitionResult>;
  
  /** Arrêter la reconnaissance */
  public abstract stop(): Promise<void>;
  
  /** Mettre en pause */
  public async pause(): Promise<void> {
    this.isPaused = true;
    this.microphoneStatus = 'processing';
    this.emit('recognition.pause', {});
  }
  
  /** Reprendre */
  public async resume(): Promise<void> {
    this.isPaused = false;
    this.microphoneStatus = 'listening';
    this.emit('recognition.resume', {});
  }
  
  /** Obtenir le statut du microphone */
  public getMicrophoneStatus(): MicrophoneStatus {
    return this.microphoneStatus;
  }
  
  /** Obtenir les langues supportées */
  public abstract getSupportedLanguages(): string[];
  
  /** Obtenir les voix disponibles */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return window.speechSynthesis?.getVoices() || [];
  }
  
  /** Configurer */
  public async configure(config: VoiceProviderConfig): Promise<void> {
    this.config = config;
    await this.setupConfig();
  }
  
  /** Configurer après changement */
  protected abstract setupConfig(): Promise<void>;
  
  /** Vérifier la disponibilité */
  public isAvailable(): boolean {
    return true;
  }
  
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
    const eventData: VoiceEvent = {
      type: event,
      timestamp: Date.now(),
      data,
    };
    
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(eventData);
        } catch (error) {
          console.error('Error in voice event callback:', error);
        }
      });
    }
  }
  
  /** Nettoyer */
  public cleanup(): void {
    this.listeners.clear();
    this.isListening = false;
    this.isPaused = false;
    this.microphoneStatus = 'idle';
  }
}

/**
 * Reconnaisseur utilisant l'API Web Speech
 */
export class WebSpeechVoiceRecognizer extends BaseVoiceRecognizer {
  private recognition: SpeechRecognition | null = null;
  private finalTranscript: string = '';
  private interimTranscript: string = '';
  private lastResult: VoiceTranscription | null = null;
  
  constructor(config: VoiceProviderConfig = { provider: 'web-speech-api' }) {
    super(config);
  }
  
  /** Configurer les écouteurs */
  protected setupEventListeners(): void {
    // Rien à faire ici, on configure dans start()
  }
  
  /** Configurer après changement */
  protected async setupConfig(): Promise<void> {
    // Recreate recognition with new config
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }
  
  /** Créer l'objet de reconnaissance */
  private createRecognition(): SpeechRecognition | null {
    try {
      // @ts-expect-error - SpeechRecognition peut ne pas être défini
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        this.microphoneStatus = 'unavailable';
        this.emit('microphone.error', { error: 'Speech Recognition API not available' });
        return null;
      }
      
      const recognition = new SpeechRecognition();
      
      // Configuration
      recognition.continuous = this.config.options?.continuous as boolean || false;
      recognition.interimResults = true;
      recognition.lang = this.config.language || 'en-US';
      recognition.maxAlternatives = this.config.options?.maxAlternatives as number || 1;
      
      // Écouteurs
      recognition.onstart = () => {
        this.isListening = true;
        this.microphoneStatus = 'listening';
        this.emit('recognition.start', {});
      };
      
      recognition.onend = () => {
        this.isListening = false;
        if (this.microphoneStatus !== 'processing' && this.microphoneStatus !== 'paused') {
          this.microphoneStatus = 'idle';
        }
        this.emit('recognition.end', {});
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        // @ts-expect-error - speechRecognitionEvent.results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        this.interimTranscript = interimTranscript;
        this.finalTranscript += finalTranscript;
        
        if (finalTranscript) {
          this.lastResult = {
            text: finalTranscript,
            confidence: 1.0, // L'API Web Speech ne fournit pas de confiance
            confidenceLevel: 'high',
            language: this.config.language || 'en-US',
            startTime: Date.now(),
            endTime: Date.now(),
            words: [],
          };
          
          this.emit('recognition.result', {
            transcription: this.lastResult,
            isFinal: true,
          });
        }
        
        if (interimTranscript) {
          this.emit('recognition.result', {
            transcription: {
              text: interimTranscript,
              confidence: 0.8,
              confidenceLevel: 'medium',
              language: this.config.language || 'en-US',
              startTime: Date.now(),
              endTime: Date.now(),
              words: [],
            },
            isFinal: false,
          });
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.isListening = false;
        this.microphoneStatus = 'error';
        
        let error = 'Unknown error';
        
        switch (event.error) {
          case 'no-speech':
            error = 'No speech detected';
            break;
          case 'audio-capture':
            error = 'No microphone available';
            break;
          case 'not-allowed':
            error = 'Microphone access denied';
            this.microphoneStatus = 'denied';
            break;
          case 'aborted':
            error = 'Recognition aborted';
            break;
          case 'network':
            error = 'Network error';
            break;
          case 'service-not-allowed':
            error = 'Service not allowed';
            break;
          case 'language-not-supported':
            error = 'Language not supported';
            break;
          default:
            error = event.error || 'Unknown error';
        }
        
        this.emit('recognition.error', { error });
        this.emit('microphone.error', { error });
      };
      
      return recognition;
    } catch (error) {
      this.microphoneStatus = 'error';
      this.emit('microphone.error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }
  
  /** Démarrer la reconnaissance */
  public async start(options?: VoiceRecognitionOptions): Promise<VoiceRecognitionResult> {
    if (this.isListening && !this.isPaused) {
      return {
        success: false,
        error: 'Already listening',
      };
    }
    
    // Appliquer les options
    const mergedOptions = { ...this.config.options, ...options } as VoiceRecognitionOptions;
    
    // Vérifier la disponibilité
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Voice recognition not available',
      };
    }
    
    // Créer la reconnaissance
    this.recognition = this.createRecognition();
    if (!this.recognition) {
      return {
        success: false,
        error: 'Failed to create speech recognition',
      };
    }
    
    // Mettre à jour la configuration
    this.recognition.continuous = mergedOptions.continuous || false;
    this.recognition.lang = mergedOptions.language || this.config.language || 'en-US';
    
    // Réinitialiser les transcriptions
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.lastResult = null;
    
    // Démarrer
    try {
      this.recognition.start();
      
      // Si continuous est false, on attend la fin
      if (!this.recognition.continuous) {
        return new Promise((resolve) => {
          const onEnd = () => {
            this.recognition?.removeEventListener('end', onEnd);
            resolve({
              success: true,
              transcription: this.lastResult,
              alternatives: [],
              metadata: {
                duration: 0,
                audioLength: 0,
                processingTime: 0,
              },
            });
          };
          this.recognition.addEventListener('end', onEnd);
        });
      }
      
      return {
        success: true,
        transcription: null,
        alternatives: [],
        metadata: {
          duration: 0,
          audioLength: 0,
          processingTime: 0,
        },
      };
    } catch (error) {
      this.isListening = false;
      this.microphoneStatus = 'error';
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /** Arrêter la reconnaissance */
  public async stop(): Promise<void> {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    this.isListening = false;
    this.isPaused = false;
    this.microphoneStatus = 'idle';
  }
  
  /** Obtenir les langues supportées */
  public getSupportedLanguages(): string[] {
    // L'API Web Speech supporte de nombreuses langues
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
      'fr-FR', 'fr-CA',
      'de-DE',
      'es-ES', 'es-MX',
      'it-IT',
      'pt-PT', 'pt-BR',
      'ru-RU',
      'zh-CN', 'zh-TW',
      'ja-JP',
      'ko-KR',
      'nl-NL',
      'sv-SE',
    ];
  }
  
  /** Configurer après changement */
  protected override async setupConfig(): Promise<void> {
    // Recreate recognition with new config
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    
    this.recognition = this.createRecognition();
  }
  
  /** Obtenir la dernière transcription */
  public getLastTranscription(): VoiceTranscription | null {
    return this.lastResult;
  }
  
  /** Obtenir la transcription finale */
  public getFinalTranscript(): string {
    return this.finalTranscript;
  }
  
  /** Obtenir la transcription intermédiaire */
  public getInterimTranscript(): string {
    return this.interimTranscript;
  }
}

/**
 * Reconnaisseur Whisper (simulé pour l'instant)
 * À remplacer par l'intégration réelle avec Whisper
 */
export class WhisperVoiceRecognizer extends BaseVoiceRecognizer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private audioBuffer: Float32Array[] = [];
  private isProcessing = false;
  
  constructor(config: VoiceProviderConfig) {
    super(config);
  }
  
  protected setupEventListeners(): void {
    // Rien pour l'instant
  }
  
  protected async setupConfig(): Promise<void> {
    // Recreate avec la nouvelle config
  }
  
  /** Démarrer la reconnaissance */
  public async start(options?: VoiceRecognitionOptions): Promise<VoiceRecognitionResult> {
    if (this.isListening && !this.isPaused) {
      return {
        success: false,
        error: 'Already listening',
      };
    }
    
    try {
      // Vérifier les permissions
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.microphoneStatus = 'unavailable';
        return {
          success: false,
          error: 'Media devices not available',
        };
      }
      
      // Obtenir le stream audio
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.microphoneStatus = 'listening';
      this.isListening = true;
      
      // Créer le contexte audio
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: new () => AudioContext }).webkitAudioContext)();
      
      // Créer le processeur
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
      this.processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const input = e.inputBuffer.getChannelData(0);
        this.audioBuffer.push(new Float32Array(input));
      };
      
      // Simuler la reconnaissance (à remplacer par l'appel réel à Whisper)
      this.emit('recognition.start', {});
      
      // Retourner une promesse qui se résout après un délai
      return new Promise((resolve) => {
        setTimeout(() => {
          this.stop().then(() => {
            resolve({
              success: true,
              transcription: {
                text: 'This is a simulated Whisper transcription',
                confidence: 0.95,
                confidenceLevel: 'very-high',
                language: this.config.language || 'en-US',
                startTime: Date.now() - 5000,
                endTime: Date.now(),
                words: [
                  { word: 'This', startTime: 0, endTime: 500, confidence: 0.98 },
                  { word: 'is', startTime: 500, endTime: 1000, confidence: 0.98 },
                  { word: 'a', startTime: 1000, endTime: 1500, confidence: 0.95 },
                  { word: 'simulated', startTime: 1500, endTime: 2500, confidence: 0.95 },
                  { word: 'Whisper', startTime: 2500, endTime: 3000, confidence: 0.98 },
                  { word: 'transcription', startTime: 3000, endTime: 5000, confidence: 0.95 },
                ],
              },
              alternatives: [],
              metadata: {
                duration: 5000,
                audioLength: this.audioBuffer.length * 4096,
                processingTime: 100,
              },
            });
          });
        }, 5000);
      });
    } catch (error) {
      this.isListening = false;
      this.microphoneStatus = 'error';
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        this.microphoneStatus = 'denied';
        this.emit('microphone.error', { error: 'Microphone access denied' });
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /** Arrêter la reconnaissance */
  public async stop(): Promise<void> {
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.isListening = false;
    this.isPaused = false;
    this.microphoneStatus = 'idle';
    this.audioBuffer = [];
  }
  
  /** Obtenir les langues supportées */
  public getSupportedLanguages(): string[] {
    return [
      'en', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'zh', 'ja', 'ko',
    ];
  }
}

/**
 * Factory pour créer les reconnaisseurs
 */
export class VoiceRecognizerFactory {
  private static instances: Map<string, BaseVoiceRecognizer> = new Map();
  
  /** Créer un reconnaisseur */
  public static create(config: VoiceProviderConfig): BaseVoiceRecognizer {
    const key = `${config.provider}:${config.model || 'default'}:${config.language || 'en-US'}`;
    
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }
    
    let recognizer: BaseVoiceRecognizer;
    
    switch (config.provider) {
      case 'web-speech-api':
        recognizer = new WebSpeechVoiceRecognizer(config);
        break;
      case 'whisper':
        recognizer = new WhisperVoiceRecognizer(config);
        break;
      default:
        // Par défaut, on utilise Web Speech API
        recognizer = new WebSpeechVoiceRecognizer(config);
    }
    
    this.instances.set(key, recognizer);
    return recognizer;
  }
  
  /** Obtenir un reconnaisseur existant */
  public static get(provider: VoiceProvider, model?: string, language?: string): BaseVoiceRecognizer | null {
    const key = `${provider}:${model || 'default'}:${language || 'en-US'}`;
    return this.instances.get(key) || null;
  }
  
  /** Nettoyer toutes les instances */
  public static cleanup(): void {
    this.instances.forEach(recognizer => recognizer.cleanup());
    this.instances.clear();
  }
}

/**
 * Reconnaisseur par défaut (Web Speech API)
 */
export const defaultRecognizer = VoiceRecognizerFactory.create({
  provider: 'web-speech-api',
  language: 'en-US',
});
