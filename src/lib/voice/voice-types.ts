"use client";

/**
 * Types pour le système de Voice Commands avancées
 */

// ============ COMMAND TYPES ============

/** Identifiant unique d'une commande vocale */
export type VoiceCommandId = string;

/** Catégorie de commande vocale */
export type VoiceCommandCategory = 
  | 'system'       // Commandes système
  | 'window'       // Gestion des fenêtres
  | 'module'       // Gestion des modules
  | 'plugin'       // Gestion des plugins
  | 'workflow'     // Gestion des workflows
  | 'file'         // Gestion des fichiers
  | 'navigation'   // Navigation
  | 'ai'           // Commandes IA
  | 'collaboration'// Collaboration
  | 'settings'     // Paramètres
  | 'custom';      // Commandes personnalisées

/** Type de commande */
export type VoiceCommandType = 
  | 'action'       // Action simple (ex: ouvrir, fermer)
  | 'query'        // Requête (ex: recherche, question)
  | 'sequence'     // Séquence de commandes
  | 'conditional'  // Commande conditionnelle
  | 'loop';        // Boucle

/** Statut de la commande */
export type VoiceCommandStatus = 
  | 'pending'      // En attente
  | 'listening'    // Écoute en cours
  | 'processing'   // Traitement en cours
  | 'executing'    // Exécution en cours
  | 'completed'    // Terminé
  | 'error'        // Erreur
  | 'cancelled';   // Annulé

/** Niveau de confiance de la reconnaissance */
export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very-high';

// ============ VOICE INPUT TYPES ============

/** Transcription de l'audio */
export interface VoiceTranscription {
  /** Texte transcrit */
  text: string;
  
  /** Confiance (0-1) */
  confidence: number;
  
  /** Niveau de confiance */
  confidenceLevel: ConfidenceLevel;
  
  /** Langue détectée */
  language: string;
  
  /** Timestamp de début */
  startTime: number;
  
  /** Timestamp de fin */
  endTime: number;
  
  /** Mots avec leurs timestamps */
  words?: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
}

/** Options de reconnaissance vocale */
export interface VoiceRecognitionOptions {
  /** Langue (BCP 47 code) */
  language?: string;
  
  /** Modèle de reconnaissance */
  model?: string;
  
  /** Continuer l'écoute après une pause */
  continuous?: boolean;
  
  /** Durée maximale d'enregistrement (en ms) */
  maxDuration?: number;
  
  /** Seuil de silence pour arrêter (en ms) */
  silenceThreshold?: number;
  
  /** Nombre maximal d'hypothèses */
  maxAlternatives?: number;
  
  /** Filtrer les mots grossiers */
  filterProfanity?: boolean;
  
  /** Inclure les timestamps des mots */
  includeWordTimestamps?: boolean;
}

/** Résultat de la reconnaissance vocale */
export interface VoiceRecognitionResult {
  /** Succès */
  success: boolean;
  
  /** Transcription */
  transcription?: VoiceTranscription;
  
  /** Erreur */
  error?: string;
  
  /** Alternatives (si disponibles) */
  alternatives?: VoiceTranscription[];
  
  /** Métadonnées */
  metadata?: {
    duration: number;
    audioLength: number;
    processingTime: number;
  };
}

// ============ COMMAND DEFINITION ============

/** Déclencheur de commande vocale */
export interface VoiceTrigger {
  /** Texte ou pattern à reconnaître */
  pattern: string;
  
  /** Type de pattern */
  patternType: 'exact' | 'regex' | 'fuzzy' | 'keyword' | 'intent';
  
  /** Seuil de similarité (pour fuzzy) */
  similarityThreshold?: number;
  
  /** Sensible à la casse */
  caseSensitive?: boolean;
  
  /** Expression régulière (si patternType = regex) */
  regexFlags?: string;
}

/** Action d'une commande vocale */
export interface VoiceAction {
  /** Type d'action */
  type: string;
  
  /** Paramètres de l'action */
  params?: Record<string, unknown>;
  
  /** Target (fenêtre, module, etc.) */
  target?: string;
  
  /** Délai avant exécution (en ms) */
  delay?: number;
}

/** Commande vocale */
export interface VoiceCommand {
  /** Identifiant unique */
  id: VoiceCommandId;
  
  /** Nom de la commande */
  name: string;
  
  /** Description */
  description: string;
  
  /** Catégorie */
  category: VoiceCommandCategory;
  
  /** Type */
  type: VoiceCommandType;
  
  /** Déclencheurs */
  triggers: VoiceTrigger[];
  
  /** Actions à exécuter */
  actions: VoiceAction[];
  
  /** Conditions d'exécution */
  conditions?: {
    /** Module requis */
    requiredModule?: string;
    
    /** Fenêtre requise */
    requiredWindow?: string;
    
    /** Contexte requis */
    requiredContext?: string[];
    
    /** Heure requise (ex: "morning", "afternoon", "night") */
    requiredTime?: string;
    
    /** Expression conditionnelle */
    expression?: string;
  };
  
  /** Réponse vocale (si la commande doit répondre) */
  response?: {
    /** Type de réponse */
    type: 'text' | 'speech' | 'action' | 'none';
    
    /** Texte à dire */
    text?: string;
    
    /** Utiliser la synthèse vocale */
    useTTS?: boolean;
    
    /** Voice à utiliser pour TTS */
    voice?: string;
    
    /** Vitesse de la voix */
    rate?: number;
    
    /** Hauteur de la voix */
    pitch?: number;
  };
  
  /** Priorité (0 = haute, 10 = basse) */
  priority: number;
  
  /** Actif */
  enabled: boolean;
  
  /** Nécessite une confirmation */
  requireConfirmation: boolean;
  
  /** Alias */
  aliases?: string[];
  
  /** Exemples */
  examples?: string[];
  
  /** Tags */
  tags?: string[];
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Auteur */
  author?: string;
}

/** Commande vocale avec son statut */
export interface VoiceCommandWithStatus extends VoiceCommand {
  /** Statut */
  status: VoiceCommandStatus;
  
  /** Progression (0-1) */
  progress: number;
  
  /** Message de statut */
  statusMessage?: string;
  
  /** Erreur */
  error?: string;
  
  /** Timestamp de début */
  startedAt?: number;
  
  /** Timestamp de fin */
  completedAt?: number;
}

// ============ COMMAND EXECUTION ============

/** Contexte d'exécution d'une commande vocale */
export interface VoiceCommandContext {
  /** ID de la commande */
  commandId: VoiceCommandId;
  
  /** Transcription */
  transcription: VoiceTranscription;
  
  /** Commande */
  command: VoiceCommand;
  
  /** Variables disponibles */
  variables: Record<string, unknown>;
  
  /** Fonctions utilitaires */
  utils: {
    /** Obtenir la valeur d'une variable */
    getVariable: (name: string) => unknown;
    
    /** Définir une variable */
    setVariable: (name: string, value: unknown) => void;
    
    /** Exécuter une commande MorphOS */
    executeCommand: (command: string, params?: Record<string, unknown>) => Promise<unknown>;
    
    /** Ouvrir une fenêtre */
    openWindow: (options: { type: string; title?: string; config?: Record<string, unknown> }) => Promise<string>;
    
    /** Fermer une fenêtre */
    closeWindow: (windowId: string) => Promise<void>;
    
    /** Exécuter une action sur un module */
    executeModuleAction: (moduleId: string, action: string, params?: Record<string, unknown>) => Promise<unknown>;
    
    /** Appeler l'API IA */
    callAI: (prompt: string, options?: { model?: string; temperature?: number }) => Promise<string>;
    
    /** Notifier l'utilisateur */
    notify: (options: { title: string; message: string; type?: string }) => void;
    
    /** Lire un texte à voix haute */
    speak: (text: string, options?: { voice?: string; rate?: number; pitch?: number }) => Promise<void>;
  };
}

/** Résultat d'exécution d'une commande vocale */
export interface VoiceCommandExecutionResult {
  /** ID de la commande */
  commandId: VoiceCommandId;
  
  /** Succès */
  success: boolean;
  
  /** Résultat */
  result?: unknown;
  
  /** Erreur */
  error?: string;
  
  /** Actions exécutées */
  executedActions: VoiceAction[];
  
  /** Actions échouées */
  failedActions: Array<{ action: VoiceAction; error: string }>;
  
  /** Durée d'exécution (en ms) */
  duration: number;
  
  /** Timestamp */
  timestamp: number;
}

// ============ VOICE SETTINGS ============

/** Paramètres de reconnaissance vocale */
export interface VoiceRecognitionSettings {
  /** Langue par défaut */
  defaultLanguage: string;
  
  /** Modèle par défaut */
  defaultModel: string;
  
  /** Continuer l'écoute */
  continuous: boolean;
  
  /** Durée maximale */
  maxDuration: number;
  
  /** Seuil de silence */
  silenceThreshold: number;
  
  /** Filtrer les mots grossiers */
  filterProfanity: boolean;
  
  /** Inclure les timestamps */
  includeWordTimestamps: boolean;
  
  /** Nombre maximal d'alternatives */
  maxAlternatives: number;
}

/** Paramètres de synthèse vocale */
export interface VoiceSynthesisSettings {
  /** Voice par défaut */
  defaultVoice: string;
  
  /** Vitesse par défaut */
  defaultRate: number;
  
  /** Hauteur par défaut */
  defaultPitch: number;
  
  /** Volume par défaut */
  defaultVolume: number;
  
  /** Langue par défaut */
  defaultLang: string;
}

/** Paramètres globaux de la voix */
export interface VoiceSettings {
  /** Activation/désactivation */
  enabled: boolean;
  
  /** Raccourci pour activer l'écoute */
  activationShortcut: string;
  
  /** Raccourci pour arrêter l'écoute */
  stopShortcut: string;
  
  /** Sensibilité du microphone */
  microphoneSensitivity: number;
  
  /** Réduction du bruit */
  noiseSuppression: boolean;
  
  /** Écho cancellation */
  echoCancellation: boolean;
  
  /** Paramètres de reconnaissance */
  recognition: VoiceRecognitionSettings;
  
  /** Paramètres de synthèse */
  synthesis: VoiceSynthesisSettings;
  
  /** Commandes activées */
  enabledCommands: VoiceCommandCategory[];
  
  /** Commandes désactivées */
  disabledCommands: VoiceCommandId[];
  
  /** Nécessite une confirmation pour les actions dangereuses */
  requireConfirmationForDangerous: boolean;
  
  /** Actions dangereuses */
  dangerousActions: string[];
}

// ============ VOICE EVENTS ============

/** Type d'événement vocal */
export type VoiceEventType = 
  | 'recognition.start'
  | 'recognition.stop'
  | 'recognition.result'
  | 'recognition.error'
  | 'recognition.end'
  | 'command.triggered'
  | 'command.executing'
  | 'command.completed'
  | 'command.error'
  | 'command.cancelled'
  | 'synthesis.start'
  | 'synthesis.stop'
  | 'synthesis.error'
  | 'synthesis.end'
  | 'microphone.muted'
  | 'microphone.unmuted'
  | 'microphone.error';

/** Événement vocal */
export interface VoiceEvent {
  type: VoiceEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

// ============ VOICE STATE ============

/** Statut du microphone */
export type MicrophoneStatus = 
  | 'idle'        // Inactif
  | 'listening'   // Écoute en cours
  | 'processing'  // Traitement en cours
  | 'speaking'    // Parle en cours
  | 'muted'       // Microphone muet
  | 'error'       // Erreur
  | 'unavailable' // Microphone indisponible
  | 'denied';     // Accès refusé

/** Statut global de la voix */
export interface VoiceStatus {
  /** Statut du microphone */
  microphone: MicrophoneStatus;
  
  /** Écoute en cours */
  isListening: boolean;
  
  /** Parle en cours */
  isSpeaking: boolean;
  
  /** Commande en cours */
  currentCommandId: VoiceCommandId | null;
  
  /** Dernière transcription */
  lastTranscription: VoiceTranscription | null;
  
  /** Dernière erreur */
  lastError: string | null;
  
  /** Volume du microphone */
  microphoneVolume: number;
  
  /** Disponible */
  available: boolean;
  
  /** Autorisé */
  permitted: boolean;
}

// ============ PREDEFINED COMMANDS ============

/** Commandes vocales par défaut */
export const DEFAULT_VOICE_COMMANDS: VoiceCommand[] = [
  // Commandes système
  {
    id: 'vc-open-settings',
    name: 'Open Settings',
    description: 'Open the settings panel',
    category: 'system',
    type: 'action',
    triggers: [
      { pattern: 'open settings', patternType: 'keyword' },
      { pattern: 'show settings', patternType: 'keyword' },
      { pattern: 'settings', patternType: 'keyword' },
    ],
    actions: [
      { type: 'open_settings' },
    ],
    priority: 0,
    enabled: true,
    requireConfirmation: false,
    examples: ['Open settings', 'Show me the settings'],
    tags: ['settings', 'open', 'show'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'vc-open-marketplace',
    name: 'Open Marketplace',
    description: 'Open the marketplace to browse modules',
    category: 'system',
    type: 'action',
    triggers: [
      { pattern: 'open marketplace', patternType: 'keyword' },
      { pattern: 'show marketplace', patternType: 'keyword' },
      { pattern: 'browse modules', patternType: 'keyword' },
    ],
    actions: [
      { type: 'open_marketplace' },
    ],
    priority: 0,
    enabled: true,
    requireConfirmation: false,
    examples: ['Open marketplace', 'Show me available modules'],
    tags: ['marketplace', 'modules', 'browse'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'vc-open-collaboration',
    name: 'Open Collaboration',
    description: 'Open the collaboration panel',
    category: 'system',
    type: 'action',
    triggers: [
      { pattern: 'open collaboration', patternType: 'keyword' },
      { pattern: 'show users', patternType: 'keyword' },
      { pattern: 'collaborate', patternType: 'keyword' },
    ],
    actions: [
      { type: 'open_collaboration' },
    ],
    priority: 0,
    enabled: true,
    requireConfirmation: false,
    examples: ['Open collaboration', 'Show me online users'],
    tags: ['collaboration', 'users', 'team'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  
  // Commandes de fenêtre
  {
    id: 'vc-new-window',
    name: 'New Window',
    description: 'Create a new window',
    category: 'window',
    type: 'action',
    triggers: [
      { pattern: 'new window', patternType: 'keyword' },
      { pattern: 'create window', patternType: 'keyword' },
      { pattern: 'open window', patternType: 'keyword' },
    ],
    actions: [
      { type: 'create_window', params: { type: 'chat' } },
    ],
    priority: 1,
    enabled: true,
    requireConfirmation: false,
    examples: ['New window', 'Create a new window'],
    tags: ['window', 'new', 'create'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'vc-close-window',
    name: 'Close Window',
    description: 'Close the current window',
    category: 'window',
    type: 'action',
    triggers: [
      { pattern: 'close window', patternType: 'keyword' },
      { pattern: 'close this', patternType: 'keyword' },
      { pattern: 'exit window', patternType: 'keyword' },
    ],
    actions: [
      { type: 'close_current_window' },
    ],
    priority: 1,
    enabled: true,
    requireConfirmation: true,
    examples: ['Close window', 'Close this window'],
    tags: ['window', 'close', 'exit'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'vc-minimize-window',
    name: 'Minimize Window',
    description: 'Minimize the current window',
    category: 'window',
    type: 'action',
    triggers: [
      { pattern: 'minimize', patternType: 'keyword' },
      { pattern: 'minimize window', patternType: 'keyword' },
      { pattern: 'hide window', patternType: 'keyword' },
    ],
    actions: [
      { type: 'minimize_current_window' },
    ],
    priority: 1,
    enabled: true,
    requireConfirmation: false,
    examples: ['Minimize', 'Minimize window'],
    tags: ['window', 'minimize', 'hide'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'vc-maximize-window',
    name: 'Maximize Window',
    description: 'Maximize the current window',
    category: 'window',
    type: 'action',
    triggers: [
      { pattern: 'maximize', patternType: 'keyword' },
      { pattern: 'maximize window', patternType: 'keyword' },
      { pattern: 'fullscreen', patternType: 'keyword' },
    ],
    actions: [
      { type: 'maximize_current_window' },
    ],
    priority: 1,
    enabled: true,
    requireConfirmation: false,
    examples: ['Maximize', 'Maximize window', 'Go fullscreen'],
    tags: ['window', 'maximize', 'fullscreen'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  
  // Commandes de module
  {
    id: 'vc-open-chat',
    name: 'Open Chat',
    description: 'Open a chat module',
    category: 'module',
    type: 'action',
    triggers: [
      { pattern: 'open chat', patternType: 'keyword' },
      { pattern: 'new chat', patternType: 'keyword' },
      { pattern: 'start chat', patternType: 'keyword' },
    ],
    actions: [
      { type: 'create_window', params: { type: 'chat' } },
    ],
    priority: 2,
    enabled: true,
    requireConfirmation: false,
    examples: ['Open chat', 'Start a new chat'],
    tags: ['chat', 'module', 'open'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'vc-open-terminal',
    name: 'Open Terminal',
    description: 'Open a terminal module',
    category: 'module',
    type: 'action',
    triggers: [
      { pattern: 'open terminal', patternType: 'keyword' },
      { pattern: 'new terminal', patternType: 'keyword' },
      { pattern: 'terminal', patternType: 'keyword' },
    ],
    actions: [
      { type: 'create_window', params: { type: 'terminal' } },
    ],
    priority: 2,
    enabled: true,
    requireConfirmation: false,
    examples: ['Open terminal', 'New terminal'],
    tags: ['terminal', 'module', 'command'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'vc-open-code',
    name: 'Open Code Editor',
    description: 'Open a code editor module',
    category: 'module',
    type: 'action',
    triggers: [
      { pattern: 'open code', patternType: 'keyword' },
      { pattern: 'code editor', patternType: 'keyword' },
      { pattern: 'new code', patternType: 'keyword' },
    ],
    actions: [
      { type: 'create_window', params: { type: 'code' } },
    ],
    priority: 2,
    enabled: true,
    requireConfirmation: false,
    examples: ['Open code', 'Open code editor'],
    tags: ['code', 'editor', 'module'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  
  // Commandes IA
  {
    id: 'vc-ask-ai',
    name: 'Ask AI',
    description: 'Ask the AI a question',
    category: 'ai',
    type: 'query',
    triggers: [
      { pattern: 'ask', patternType: 'keyword' },
      { pattern: 'hey morphos', patternType: 'keyword' },
      { pattern: 'what is', patternType: 'keyword' },
      { pattern: 'how to', patternType: 'keyword' },
      { pattern: 'explain', patternType: 'keyword' },
    ],
    actions: [
      { type: 'ai_chat', params: { useQuery: true } },
    ],
    response: {
      type: 'speech',
      useTTS: true,
    },
    priority: 0,
    enabled: true,
    requireConfirmation: false,
    examples: ['Ask AI about quantum computing', 'Hey MorphOS, what is the capital of France?'],
    tags: ['ai', 'ask', 'question', 'chat'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'vc-generate-code',
    name: 'Generate Code',
    description: 'Generate code using AI',
    category: 'ai',
    type: 'query',
    triggers: [
      { pattern: 'generate code', patternType: 'keyword' },
      { pattern: 'write code', patternType: 'keyword' },
      { pattern: 'create function', patternType: 'keyword' },
      { pattern: 'code for', patternType: 'keyword' },
    ],
    actions: [
      { type: 'ai_generate', params: { type: 'code', useQuery: true } },
    ],
    priority: 1,
    enabled: true,
    requireConfirmation: false,
    examples: ['Generate code for a calculator', 'Write a Python function'],
    tags: ['ai', 'code', 'generate', 'write'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  
  // Commandes de navigation
  {
    id: 'vc-scroll-up',
    name: 'Scroll Up',
    description: 'Scroll up in the current window',
    category: 'navigation',
    type: 'action',
    triggers: [
      { pattern: 'scroll up', patternType: 'keyword' },
      { pattern: 'go up', patternType: 'keyword' },
      { pattern: 'up', patternType: 'keyword' },
    ],
    actions: [
      { type: 'scroll', params: { direction: 'up', amount: 'page' } },
    ],
    priority: 3,
    enabled: true,
    requireConfirmation: false,
    examples: ['Scroll up', 'Go up'],
    tags: ['scroll', 'navigation', 'up'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'vc-scroll-down',
    name: 'Scroll Down',
    description: 'Scroll down in the current window',
    category: 'navigation',
    type: 'action',
    triggers: [
      { pattern: 'scroll down', patternType: 'keyword' },
      { pattern: 'go down', patternType: 'keyword' },
      { pattern: 'down', patternType: 'keyword' },
    ],
    actions: [
      { type: 'scroll', params: { direction: 'down', amount: 'page' } },
    ],
    priority: 3,
    enabled: true,
    requireConfirmation: false,
    examples: ['Scroll down', 'Go down'],
    tags: ['scroll', 'navigation', 'down'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'vc-go-back',
    name: 'Go Back',
    description: 'Go back in the current window',
    category: 'navigation',
    type: 'action',
    triggers: [
      { pattern: 'go back', patternType: 'keyword' },
      { pattern: 'back', patternType: 'keyword' },
      { pattern: 'previous', patternType: 'keyword' },
    ],
    actions: [
      { type: 'go_back' },
    ],
    priority: 3,
    enabled: true,
    requireConfirmation: false,
    examples: ['Go back', 'Back'],
    tags: ['navigation', 'back', 'previous'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  
  // Commandes de fichier
  {
    id: 'vc-save-file',
    name: 'Save File',
    description: 'Save the current file',
    category: 'file',
    type: 'action',
    triggers: [
      { pattern: 'save', patternType: 'keyword' },
      { pattern: 'save file', patternType: 'keyword' },
      { pattern: 'save this', patternType: 'keyword' },
    ],
    actions: [
      { type: 'save_current_file' },
    ],
    priority: 4,
    enabled: true,
    requireConfirmation: false,
    examples: ['Save', 'Save file'],
    tags: ['file', 'save'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'vc-new-file',
    name: 'New File',
    description: 'Create a new file',
    category: 'file',
    type: 'action',
    triggers: [
      { pattern: 'new file', patternType: 'keyword' },
      { pattern: 'create file', patternType: 'keyword' },
      { pattern: 'new document', patternType: 'keyword' },
    ],
    actions: [
      { type: 'create_file' },
    ],
    priority: 4,
    enabled: true,
    requireConfirmation: false,
    examples: ['New file', 'Create a new file'],
    tags: ['file', 'new', 'create'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// ============ VOICE PROVIDER TYPES ============

/** Fournisseur de reconnaissance vocale */
export type VoiceProvider = 
  | 'web-speech-api'    // API Web Speech (navigateur)
  | 'whisper'          // Whisper (local ou API)
  | 'google'           // Google Speech-to-Text
  | 'azure'            // Azure Speech Services
  | 'aws'              // AWS Transcribe
  | 'deepgram'          // Deepgram
  | 'assembly-ai'      // AssemblyAI
  | 'rev'              // Rev AI
  | 'custom';          // Personnalisé

/** Configuration d'un fournisseur */
export interface VoiceProviderConfig {
  /** Nom du fournisseur */
  provider: VoiceProvider;
  
  /** Clé API (si nécessaire) */
  apiKey?: string;
  
  /** URL de l'API (pour les fournisseurs personnalisés) */
  apiUrl?: string;
  
  /** Modèle à utiliser */
  model?: string;
  
  /** Langue par défaut */
  language?: string;
  
  /** Options supplémentaires */
  options?: Record<string, unknown>;
}
