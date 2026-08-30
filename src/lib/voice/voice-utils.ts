/**
 * Utilitaires pour les commandes vocales
 */

import type {
  VoiceCommand,
  VoiceTrigger,
  VoiceTranscription,
  ConfidenceLevel,
} from './voice-types';

/**
 * Générer un ID unique pour une commande vocale
 */
export function generateVoiceCommandId(): string {
  return `vc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Normaliser un texte pour le matching
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,\/#!$%\^&\*;:{}=\_`~()]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculer la similarité entre deux textes
 */
export function calculateSimilarity(a: string, b: string): number {
  const normalizedA = normalizeText(a);
  const normalizedB = normalizeText(b);
  
  if (normalizedA === normalizedB) return 1;
  
  // Calculer la distance de Levenshtein
  const distance = levenshteinDistance(normalizedA, normalizedB);
  const maxLength = Math.max(normalizedA.length, normalizedB.length);
  
  if (maxLength === 0) return 1;
  
  return 1 - (distance / maxLength);
}

/**
 * Distance de Levenshtein
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Vérifier si un déclencheur correspond à un texte
 */
export function matchTrigger(text: string, trigger: VoiceTrigger, threshold: number = 0.7): { matches: boolean; score: number } {
  const pattern = trigger.pattern.toLowerCase().trim();
  const normalizedText = normalizeText(text);
  
  switch (trigger.patternType) {
    case 'exact':
      return { matches: normalizedText === pattern, score: normalizedText === pattern ? 1 : 0 };
    
    case 'keyword':
      return { matches: normalizedText.includes(pattern), score: normalizedText.includes(pattern) ? 0.8 : 0 };
    
    case 'regex':
      try {
        const regex = new RegExp(pattern, trigger.regexFlags || '');
        return { matches: regex.test(text), score: regex.test(text) ? 0.9 : 0 };
      } catch {
        return { matches: false, score: 0 };
      }
    
    case 'fuzzy':
      const similarity = calculateSimilarity(text, pattern);
      return { matches: similarity >= (trigger.similarityThreshold || threshold), score: similarity };
    
    case 'intent':
      return { matches: intentMatch(text, pattern), score: intentMatchScore(text, pattern) };
    
    default:
      return { matches: normalizedText.includes(pattern), score: normalizedText.includes(pattern) ? 0.8 : 0 };
  }
}

/**
 * Matching d'intention
 */
export function intentMatch(text: string, intent: string): boolean {
  const intentKeywords = intent.split(' ').map(k => k.toLowerCase());
  const textWords = normalizeText(text).split(' ');
  
  const matchedKeywords = intentKeywords.filter(keyword =>
    textWords.some(word => word.includes(keyword) || keyword.includes(word))
  );
  
  return matchedKeywords.length >= Math.ceil(intentKeywords.length / 2);
}

/**
 * Score de matching d'intention
 */
export function intentMatchScore(text: string, intent: string): number {
  const intentKeywords = intent.split(' ').map(k => k.toLowerCase());
  const textWords = normalizeText(text).split(' ');
  
  let score = 0;
  
  for (const keyword of intentKeywords) {
    for (const word of textWords) {
      if (word.includes(keyword) || keyword.includes(word)) {
        score += 1;
        break;
      }
    }
  }
  
  return score / intentKeywords.length;
}

/**
 * Obtenir le niveau de confiance à partir d'un score
 */
export function getConfidenceLevel(score: number, transcriptionConfidence: number = 1): ConfidenceLevel {
  const combinedScore = score * transcriptionConfidence;
  
  if (combinedScore >= 0.9) return 'very-high';
  if (combinedScore >= 0.7) return 'high';
  if (combinedScore >= 0.5) return 'medium';
  return 'low';
}

/**
 * Trier les commandes par priorité et confiance
 */
export function sortCommandsByPriority(
  commands: VoiceCommand[],
  scores: Map<string, { score: number; confidence: ConfidenceLevel }>
): VoiceCommand[] {
  return [...commands].sort((a, b) => {
    const scoreA = scores.get(a.id) || { score: 0, confidence: 'low' };
    const scoreB = scores.get(b.id) || { score: 0, confidence: 'low' };
    
    // D'abord par priorité
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    // Puis par score
    if (scoreA.score !== scoreB.score) {
      return scoreB.score - scoreA.score;
    }
    
    // Puis par niveau de confiance
    const confidenceOrder = { 'very-high': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const confidenceA = confidenceOrder[scoreA.confidence] || 0;
    const confidenceB = confidenceOrder[scoreB.confidence] || 0;
    
    if (confidenceA !== confidenceB) {
      return confidenceB - confidenceA;
    }
    
    // Enfin par nom
    return a.name.localeCompare(b.name);
  });
}

/**
 * Valider une commande vocale
 */
export function validateVoiceCommand(command: Partial<VoiceCommand>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!command.id) {
    errors.push('Command ID is required');
  }
  
  if (!command.name) {
    errors.push('Command name is required');
  }
  
  if (!command.description) {
    errors.push('Command description is required');
  }
  
  if (!command.triggers || command.triggers.length === 0) {
    errors.push('At least one trigger is required');
  } else {
    for (let i = 0; i < command.triggers.length; i++) {
      const trigger = command.triggers[i];
      if (!trigger.pattern) {
        errors.push(`Trigger ${i + 1} pattern is required`);
      }
      if (!trigger.patternType) {
        errors.push(`Trigger ${i + 1} patternType is required`);
      }
    }
  }
  
  if (!command.actions || command.actions.length === 0) {
    errors.push('At least one action is required');
  }
  
  if (command.priority !== undefined && (command.priority < 0 || command.priority > 10)) {
    errors.push('Priority must be between 0 and 10');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Créer une commande vocale par défaut
 */
export function createDefaultVoiceCommand(name: string, description: string, triggers: string[], actions: { type: string; params?: Record<string, unknown> }[]): VoiceCommand {
  return {
    id: generateVoiceCommandId(),
    name,
    description,
    category: 'custom',
    type: 'action',
    triggers: triggers.map(pattern => ({ pattern, patternType: 'keyword' as const })),
    actions: actions.map(action => ({ type: action.type, params: action.params })),
    priority: 5,
    enabled: true,
    requireConfirmation: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Cloner une commande vocale
 */
export function cloneVoiceCommand(command: VoiceCommand): VoiceCommand {
  return {
    ...command,
    id: generateVoiceCommandId(),
    name: `${command.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Formater une transcription pour l'affichage
 */
export function formatTranscription(transcription: VoiceTranscription): string {
  if (!transcription.text) return '';
  
  // Capitaliser la première lettre
  let formatted = transcription.text.charAt(0).toUpperCase() + transcription.text.slice(1);
  
  // Ajouter un point si nécessaire
  if (![ '.', '!', '?' ].includes(formatted.charAt(formatted.length - 1))) {
    formatted += '.';
  }
  
  return formatted;
}

/**
 * Formater la durée
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/**
 * Formater la confiance
 */
export function formatConfidence(confidence: number, level: ConfidenceLevel): string {
  const percentage = Math.round(confidence * 100);
  
  switch (level) {
    case 'very-high': return `Very High (${percentage}%)`;
    case 'high': return `High (${percentage}%)`;
    case 'medium': return `Medium (${percentage}%)`;
    case 'low': return `Low (${percentage}%)`;
    default: return `${percentage}%`;
  }
}

/**
 * Obtenir la couleur du niveau de confiance
 */
export function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'very-high': return 'text-primary';
    case 'high': return 'text-accent';
    case 'medium': return 'text-warning';
    case 'low': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
}

/**
 * Vérifier si le navigateur supporte la voix
 */
export function checkBrowserVoiceSupport(): { recognition: boolean; synthesis: boolean } {
  const recognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const synthesis = 'speechSynthesis' in window;
  
  return { recognition, synthesis };
}

/**
 * Obtenir le fournisseur par défaut en fonction du navigateur
 */
export function getDefaultVoiceProvider(): string {
  const { recognition, synthesis } = checkBrowserVoiceSupport();
  
  if (recognition && synthesis) {
    return 'web-speech-api';
  }
  
  if (recognition) {
    return 'web-speech-api';
  }
  
  return 'none';
}

/**
 * Obtenir les langues supportées par le navigateur
 */
export function getBrowserSupportedLanguages(): string[] {
  // @ts-expect-error - SpeechRecognition peut ne pas être défini
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) return [];
  
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

/**
 * Obtenir les voix disponibles pour la synthèse
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
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
 * Dire un texte
 */
export function speak(text: string, options?: Partial<SpeechSynthesisUtterance>): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Speech synthesis not available'));
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (options) {
      Object.assign(utterance, options);
    }
    
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(event.error));
    
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Arrêter la parole
 */
export function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Mettre en pause la parole
 */
export function pauseSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
}

/**
 * Reprendre la parole
 */
export function resumeSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}

/**
 * Vérifier si la parole est en cours
 */
export function isSpeaking(): boolean {
  return window.speechSynthesis?.speaking || false;
}

/**
 * Vérifier si la parole est en pause
 */
export function isPaused(): boolean {
  return window.speechSynthesis?.paused || false;
}

/**
 * Obtenir la voix par défaut
 */
export function getDefaultVoice(): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  return voices.find(v => v.default) || voices[0] || null;
}

/**
 * Obtenir la voix par nom
 */
export function getVoiceByName(name: string): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  return voices.find(v => v.name === name) || null;
}

/**
 * Obtenir la voix par langue
 */
export function getVoiceByLang(lang: string): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  return voices.find(v => v.lang.startsWith(lang)) || null;
}

// ============ EXPORT ============

export const voiceExports = {
  generateVoiceCommandId,
  normalizeText,
  calculateSimilarity,
  levenshteinDistance,
  matchTrigger,
  intentMatch,
  intentMatchScore,
  getConfidenceLevel,
  sortCommandsByPriority,
  validateVoiceCommand,
  createDefaultVoiceCommand,
  cloneVoiceCommand,
  formatTranscription,
  formatDuration,
  formatConfidence,
  getConfidenceColor,
  checkBrowserVoiceSupport,
  getDefaultVoiceProvider,
  getBrowserSupportedLanguages,
  getAvailableVoices,
  loadVoices,
  speak,
  stopSpeaking,
  pauseSpeaking,
  resumeSpeaking,
  isSpeaking,
  isPaused,
  getDefaultVoice,
  getVoiceByName,
  getVoiceByLang,
};
