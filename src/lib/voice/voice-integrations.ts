/**
 * Intégrations des commandes vocales avec MorphOS
 * 
 * Ce module fournit des intégrations spécifiques avec les autres parties de MorphOS
 */

import type { VoiceCommand, VoiceAction } from './voice-types';
import { voiceCommandEngine } from './voice-engine';
import { generateVoiceCommandId } from './voice-utils';

/**
 * Créer des commandes vocales pour la gestion des fenêtres
 */
export function createWindowVoiceCommands(): VoiceCommand[] {
  return [
    {
      id: generateVoiceCommandId(),
      name: 'New Window',
      description: 'Create a new window',
      category: 'window',
      type: 'action',
      triggers: [
        { pattern: 'new window', patternType: 'keyword' },
        { pattern: 'create window', patternType: 'keyword' },
        { pattern: 'open window', patternType: 'keyword' },
      ],
      actions: [{ type: 'create_window', params: { type: 'chat' } }],
      priority: 1,
      enabled: true,
      requireConfirmation: false,
      examples: ['New window', 'Create a new window'],
      tags: ['window', 'new', 'create'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Close Window',
      description: 'Close the current window',
      category: 'window',
      type: 'action',
      triggers: [
        { pattern: 'close window', patternType: 'keyword' },
        { pattern: 'close this', patternType: 'keyword' },
        { pattern: 'exit window', patternType: 'keyword' },
      ],
      actions: [{ type: 'close_current_window' }],
      priority: 1,
      enabled: true,
      requireConfirmation: true,
      examples: ['Close window', 'Close this window'],
      tags: ['window', 'close', 'exit'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Minimize Window',
      description: 'Minimize the current window',
      category: 'window',
      type: 'action',
      triggers: [
        { pattern: 'minimize', patternType: 'keyword' },
        { pattern: 'minimize window', patternType: 'keyword' },
        { pattern: 'hide window', patternType: 'keyword' },
      ],
      actions: [{ type: 'minimize_current_window' }],
      priority: 1,
      enabled: true,
      requireConfirmation: false,
      examples: ['Minimize', 'Minimize window'],
      tags: ['window', 'minimize', 'hide'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Maximize Window',
      description: 'Maximize the current window',
      category: 'window',
      type: 'action',
      triggers: [
        { pattern: 'maximize', patternType: 'keyword' },
        { pattern: 'maximize window', patternType: 'keyword' },
        { pattern: 'fullscreen', patternType: 'keyword' },
      ],
      actions: [{ type: 'maximize_current_window' }],
      priority: 1,
      enabled: true,
      requireConfirmation: false,
      examples: ['Maximize', 'Maximize window', 'Go fullscreen'],
      tags: ['window', 'maximize', 'fullscreen'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Switch Window',
      description: 'Switch to a different window',
      category: 'window',
      type: 'action',
      triggers: [
        { pattern: 'switch to', patternType: 'keyword' },
        { pattern: 'go to', patternType: 'keyword' },
      ],
      actions: [{ type: 'switch_window', params: { useQuery: true } }],
      priority: 2,
      enabled: true,
      requireConfirmation: false,
      examples: ['Switch to chat', 'Go to terminal'],
      tags: ['window', 'switch', 'navigate'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
}

/**
 * Créer des commandes vocales pour la gestion des modules
 */
export function createModuleVoiceCommands(): VoiceCommand[] {
  return [
    {
      id: generateVoiceCommandId(),
      name: 'Open Chat',
      description: 'Open a chat module',
      category: 'module',
      type: 'action',
      triggers: [
        { pattern: 'open chat', patternType: 'keyword' },
        { pattern: 'new chat', patternType: 'keyword' },
        { pattern: 'start chat', patternType: 'keyword' },
      ],
      actions: [{ type: 'create_window', params: { type: 'chat' } }],
      priority: 2,
      enabled: true,
      requireConfirmation: false,
      examples: ['Open chat', 'Start a new chat'],
      tags: ['chat', 'module', 'open'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Open Terminal',
      description: 'Open a terminal module',
      category: 'module',
      type: 'action',
      triggers: [
        { pattern: 'open terminal', patternType: 'keyword' },
        { pattern: 'new terminal', patternType: 'keyword' },
        { pattern: 'terminal', patternType: 'keyword' },
      ],
      actions: [{ type: 'create_window', params: { type: 'terminal' } }],
      priority: 2,
      enabled: true,
      requireConfirmation: false,
      examples: ['Open terminal', 'New terminal'],
      tags: ['terminal', 'module', 'command'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Open Code Editor',
      description: 'Open a code editor module',
      category: 'module',
      type: 'action',
      triggers: [
        { pattern: 'open code', patternType: 'keyword' },
        { pattern: 'code editor', patternType: 'keyword' },
        { pattern: 'new code', patternType: 'keyword' },
      ],
      actions: [{ type: 'create_window', params: { type: 'code' } }],
      priority: 2,
      enabled: true,
      requireConfirmation: false,
      examples: ['Open code', 'Open code editor'],
      tags: ['code', 'editor', 'module'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Open File Explorer',
      description: 'Open a file explorer module',
      category: 'module',
      type: 'action',
      triggers: [
        { pattern: 'open files', patternType: 'keyword' },
        { pattern: 'file explorer', patternType: 'keyword' },
        { pattern: 'browse files', patternType: 'keyword' },
      ],
      actions: [{ type: 'create_window', params: { type: 'files' } }],
      priority: 2,
      enabled: true,
      requireConfirmation: false,
      examples: ['Open files', 'Browse files'],
      tags: ['files', 'explorer', 'browse'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Close Module',
      description: 'Close the current module',
      category: 'module',
      type: 'action',
      triggers: [
        { pattern: 'close module', patternType: 'keyword' },
        { pattern: 'close this module', patternType: 'keyword' },
      ],
      actions: [{ type: 'close_current_module' }],
      priority: 2,
      enabled: true,
      requireConfirmation: true,
      examples: ['Close module'],
      tags: ['module', 'close'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
}

/**
 * Créer des commandes vocales pour l'IA
 */
export function createAIVoiceCommands(): VoiceCommand[] {
  return [
    {
      id: generateVoiceCommandId(),
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
      actions: [{ type: 'ai_chat', params: { useQuery: true } }],
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
      id: generateVoiceCommandId(),
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
      actions: [{ type: 'ai_generate', params: { type: 'code', useQuery: true } }],
      priority: 1,
      enabled: true,
      requireConfirmation: false,
      examples: ['Generate code for a calculator', 'Write a Python function'],
      tags: ['ai', 'code', 'generate', 'write'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Generate Text',
      description: 'Generate text using AI',
      category: 'ai',
      type: 'query',
      triggers: [
        { pattern: 'generate text', patternType: 'keyword' },
        { pattern: 'write text', patternType: 'keyword' },
        { pattern: 'create text', patternType: 'keyword' },
      ],
      actions: [{ type: 'ai_generate', params: { type: 'text', useQuery: true } }],
      priority: 1,
      enabled: true,
      requireConfirmation: false,
      examples: ['Generate text about the future', 'Write an essay'],
      tags: ['ai', 'text', 'generate', 'write'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Summarize',
      description: 'Summarize the current content',
      category: 'ai',
      type: 'action',
      triggers: [
        { pattern: 'summarize', patternType: 'keyword' },
        { pattern: 'summarize this', patternType: 'keyword' },
        { pattern: 'give me a summary', patternType: 'keyword' },
      ],
      actions: [{ type: 'ai_summarize' }],
      priority: 1,
      enabled: true,
      requireConfirmation: false,
      examples: ['Summarize this document', 'Give me a summary'],
      tags: ['ai', 'summarize', 'summary'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Translate',
      description: 'Translate text using AI',
      category: 'ai',
      type: 'query',
      triggers: [
        { pattern: 'translate', patternType: 'keyword' },
        { pattern: 'translate to', patternType: 'keyword' },
        { pattern: 'in', patternType: 'keyword' },
      ],
      actions: [{ type: 'ai_translate', params: { useQuery: true } }],
      priority: 1,
      enabled: true,
      requireConfirmation: false,
      examples: ['Translate this to French', 'In Spanish'],
      tags: ['ai', 'translate', 'language'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
}

/**
 * Créer des commandes vocales pour la navigation
 */
export function createNavigationVoiceCommands(): VoiceCommand[] {
  return [
    {
      id: generateVoiceCommandId(),
      name: 'Go Back',
      description: 'Go back in the current window',
      category: 'navigation',
      type: 'action',
      triggers: [
        { pattern: 'go back', patternType: 'keyword' },
        { pattern: 'back', patternType: 'keyword' },
        { pattern: 'previous', patternType: 'keyword' },
      ],
      actions: [{ type: 'go_back' }],
      priority: 3,
      enabled: true,
      requireConfirmation: false,
      examples: ['Go back', 'Back'],
      tags: ['navigation', 'back', 'previous'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Go Forward',
      description: 'Go forward in the current window',
      category: 'navigation',
      type: 'action',
      triggers: [
        { pattern: 'go forward', patternType: 'keyword' },
        { pattern: 'forward', patternType: 'keyword' },
        { pattern: 'next', patternType: 'keyword' },
      ],
      actions: [{ type: 'go_forward' }],
      priority: 3,
      enabled: true,
      requireConfirmation: false,
      examples: ['Go forward', 'Forward'],
      tags: ['navigation', 'forward', 'next'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Scroll Up',
      description: 'Scroll up in the current window',
      category: 'navigation',
      type: 'action',
      triggers: [
        { pattern: 'scroll up', patternType: 'keyword' },
        { pattern: 'go up', patternType: 'keyword' },
        { pattern: 'up', patternType: 'keyword' },
      ],
      actions: [{ type: 'scroll', params: { direction: 'up', amount: 'page' } }],
      priority: 3,
      enabled: true,
      requireConfirmation: false,
      examples: ['Scroll up', 'Go up'],
      tags: ['scroll', 'navigation', 'up'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Scroll Down',
      description: 'Scroll down in the current window',
      category: 'navigation',
      type: 'action',
      triggers: [
        { pattern: 'scroll down', patternType: 'keyword' },
        { pattern: 'go down', patternType: 'keyword' },
        { pattern: 'down', patternType: 'keyword' },
      ],
      actions: [{ type: 'scroll', params: { direction: 'down', amount: 'page' } }],
      priority: 3,
      enabled: true,
      requireConfirmation: false,
      examples: ['Scroll down', 'Go down'],
      tags: ['scroll', 'navigation', 'down'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Scroll to Top',
      description: 'Scroll to the top of the current window',
      category: 'navigation',
      type: 'action',
      triggers: [
        { pattern: 'scroll to top', patternType: 'keyword' },
        { pattern: 'go to top', patternType: 'keyword' },
        { pattern: 'top', patternType: 'keyword' },
      ],
      actions: [{ type: 'scroll', params: { direction: 'top' } }],
      priority: 3,
      enabled: true,
      requireConfirmation: false,
      examples: ['Scroll to top', 'Go to top'],
      tags: ['scroll', 'navigation', 'top'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Scroll to Bottom',
      description: 'Scroll to the bottom of the current window',
      category: 'navigation',
      type: 'action',
      triggers: [
        { pattern: 'scroll to bottom', patternType: 'keyword' },
        { pattern: 'go to bottom', patternType: 'keyword' },
        { pattern: 'bottom', patternType: 'keyword' },
      ],
      actions: [{ type: 'scroll', params: { direction: 'bottom' } }],
      priority: 3,
      enabled: true,
      requireConfirmation: false,
      examples: ['Scroll to bottom', 'Go to bottom'],
      tags: ['scroll', 'navigation', 'bottom'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
}

/**
 * Créer des commandes vocales pour les fichiers
 */
export function createFileVoiceCommands(): VoiceCommand[] {
  return [
    {
      id: generateVoiceCommandId(),
      name: 'New File',
      description: 'Create a new file',
      category: 'file',
      type: 'action',
      triggers: [
        { pattern: 'new file', patternType: 'keyword' },
        { pattern: 'create file', patternType: 'keyword' },
        { pattern: 'new document', patternType: 'keyword' },
      ],
      actions: [{ type: 'create_file' }],
      priority: 4,
      enabled: true,
      requireConfirmation: false,
      examples: ['New file', 'Create a new file'],
      tags: ['file', 'new', 'create'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Save File',
      description: 'Save the current file',
      category: 'file',
      type: 'action',
      triggers: [
        { pattern: 'save', patternType: 'keyword' },
        { pattern: 'save file', patternType: 'keyword' },
        { pattern: 'save this', patternType: 'keyword' },
      ],
      actions: [{ type: 'save_current_file' }],
      priority: 4,
      enabled: true,
      requireConfirmation: false,
      examples: ['Save', 'Save file'],
      tags: ['file', 'save'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Save As',
      description: 'Save the current file with a new name',
      category: 'file',
      type: 'action',
      triggers: [
        { pattern: 'save as', patternType: 'keyword' },
        { pattern: 'save copy', patternType: 'keyword' },
      ],
      actions: [{ type: 'save_as' }],
      priority: 4,
      enabled: true,
      requireConfirmation: false,
      examples: ['Save as', 'Save a copy'],
      tags: ['file', 'save', 'copy'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Open File',
      description: 'Open a file',
      category: 'file',
      type: 'action',
      triggers: [
        { pattern: 'open file', patternType: 'keyword' },
        { pattern: 'open', patternType: 'keyword' },
      ],
      actions: [{ type: 'open_file', params: { useQuery: true } }],
      priority: 4,
      enabled: true,
      requireConfirmation: false,
      examples: ['Open file', 'Open document.txt'],
      tags: ['file', 'open'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Close File',
      description: 'Close the current file',
      category: 'file',
      type: 'action',
      triggers: [
        { pattern: 'close file', patternType: 'keyword' },
        { pattern: 'close this file', patternType: 'keyword' },
      ],
      actions: [{ type: 'close_current_file' }],
      priority: 4,
      enabled: true,
      requireConfirmation: true,
      examples: ['Close file'],
      tags: ['file', 'close'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
}

/**
 * Créer des commandes vocales pour le système
 */
export function createSystemVoiceCommands(): VoiceCommand[] {
  return [
    {
      id: generateVoiceCommandId(),
      name: 'Open Settings',
      description: 'Open the settings panel',
      category: 'system',
      type: 'action',
      triggers: [
        { pattern: 'open settings', patternType: 'keyword' },
        { pattern: 'show settings', patternType: 'keyword' },
        { pattern: 'settings', patternType: 'keyword' },
      ],
      actions: [{ type: 'open_settings' }],
      priority: 0,
      enabled: true,
      requireConfirmation: false,
      examples: ['Open settings', 'Show me the settings'],
      tags: ['settings', 'open', 'show'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Open Marketplace',
      description: 'Open the marketplace to browse modules',
      category: 'system',
      type: 'action',
      triggers: [
        { pattern: 'open marketplace', patternType: 'keyword' },
        { pattern: 'show marketplace', patternType: 'keyword' },
        { pattern: 'browse modules', patternType: 'keyword' },
      ],
      actions: [{ type: 'open_marketplace' }],
      priority: 0,
      enabled: true,
      requireConfirmation: false,
      examples: ['Open marketplace', 'Show me available modules'],
      tags: ['marketplace', 'modules', 'browse'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Open Collaboration',
      description: 'Open the collaboration panel',
      category: 'system',
      type: 'action',
      triggers: [
        { pattern: 'open collaboration', patternType: 'keyword' },
        { pattern: 'show users', patternType: 'keyword' },
        { pattern: 'collaborate', patternType: 'keyword' },
      ],
      actions: [{ type: 'open_collaboration' }],
      priority: 0,
      enabled: true,
      requireConfirmation: false,
      examples: ['Open collaboration', 'Show me online users'],
      tags: ['collaboration', 'users', 'team'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Open Help',
      description: 'Open the help panel',
      category: 'system',
      type: 'action',
      triggers: [
        { pattern: 'help', patternType: 'keyword' },
        { pattern: 'show help', patternType: 'keyword' },
        { pattern: 'what can i do', patternType: 'keyword' },
      ],
      actions: [{ type: 'open_help' }],
      priority: 0,
      enabled: true,
      requireConfirmation: false,
      examples: ['Help', 'Show help'],
      tags: ['help', 'support', 'guide'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: generateVoiceCommandId(),
      name: 'Exit MorphOS',
      description: 'Exit the MorphOS application',
      category: 'system',
      type: 'action',
      triggers: [
        { pattern: 'exit', patternType: 'keyword' },
        { pattern: 'quit', patternType: 'keyword' },
        { pattern: 'close morphos', patternType: 'keyword' },
      ],
      actions: [{ type: 'exit' }],
      priority: 0,
      enabled: true,
      requireConfirmation: true,
      examples: ['Exit', 'Quit MorphOS'],
      tags: ['exit', 'quit', 'close'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
}

/**
 * Créer toutes les commandes vocales par défaut
 */
export function createAllDefaultVoiceCommands(): VoiceCommand[] {
  return [
    ...createSystemVoiceCommands(),
    ...createWindowVoiceCommands(),
    ...createModuleVoiceCommands(),
    ...createAIVoiceCommands(),
    ...createNavigationVoiceCommands(),
    ...createFileVoiceCommands(),
  ];
}

/**
 * Enregistrer toutes les commandes vocales par défaut
 */
export function registerDefaultVoiceCommands(): void {
  const commands = createAllDefaultVoiceCommands();
  
  for (const command of commands) {
    voiceCommandEngine.addCommand(command);
  }
}

/**
 * Enregistrer des commandes personnalisées
 */
export function registerCustomVoiceCommands(commands: VoiceCommand[]): void {
  for (const command of commands) {
    voiceCommandEngine.addCommand(command);
  }
}

/**
 * Exécuter une action MorphOS
 */
export async function executeMorphOSAction(action: VoiceAction): Promise<unknown> {
  // À implémenter avec l'API MorphOS
  // Cela dépendra de l'implémentation spécifique de MorphOS
  
  switch (action.type) {
    case 'open_settings':
      // Ouvrir les paramètres
      console.log('Opening settings');
      break;
    case 'open_marketplace':
      // Ouvrir le marketplace
      console.log('Opening marketplace');
      break;
    case 'open_collaboration':
      // Ouvrir la collaboration
      console.log('Opening collaboration');
      break;
    case 'create_window':
      // Créer une fenêtre
      console.log('Creating window:', action.params);
      break;
    case 'close_current_window':
      // Fermer la fenêtre actuelle
      console.log('Closing current window');
      break;
    case 'minimize_current_window':
      // Minimiser la fenêtre actuelle
      console.log('Minimizing current window');
      break;
    case 'maximize_current_window':
      // Maximiser la fenêtre actuelle
      console.log('Maximizing current window');
      break;
    case 'save_current_file':
      // Sauvegarder le fichier actuel
      console.log('Saving current file');
      break;
    case 'create_file':
      // Créer un fichier
      console.log('Creating file');
      break;
    case 'go_back':
      // Retour en arrière
      console.log('Going back');
      break;
    case 'scroll':
      // Scroll
      console.log('Scrolling:', action.params);
      break;
    case 'ai_chat':
      // Chat IA
      console.log('AI chat:', action.params);
      break;
    case 'ai_generate':
      // Génération IA
      console.log('AI generate:', action.params);
      break;
    default:
      console.log('Executing action:', action.type, action.params);
  }
  
  return {};
}

// ============ EXPORT ============

export const voiceIntegrationExports = {
  createWindowVoiceCommands,
  createModuleVoiceCommands,
  createAIVoiceCommands,
  createNavigationVoiceCommands,
  createFileVoiceCommands,
  createSystemVoiceCommands,
  createAllDefaultVoiceCommands,
  registerDefaultVoiceCommands,
  registerCustomVoiceCommands,
  executeMorphOSAction,
};
