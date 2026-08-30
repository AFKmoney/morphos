"use client";

import type {
  VoiceCommand,
  VoiceCommandId,
  VoiceCommandContext,
  VoiceCommandExecutionResult,
  VoiceTrigger,
  VoiceAction,
  VoiceTranscription,
  VoiceCommandWithStatus,
  VoiceEventType,
  VoiceEvent,
  ConfidenceLevel,
} from './voice-types';

import { DEFAULT_VOICE_COMMANDS } from './voice-types';

/**
 * Moteur de commandes vocales
 * Gère la reconnaissance, le matching et l'exécution des commandes
 */
export class VoiceCommandEngine {
  private commands: Map<VoiceCommandId, VoiceCommand> = new Map();
  private commandQueue: VoiceCommandWithStatus[] = [];
  private currentCommand: VoiceCommandWithStatus | null = null;
  private eventListeners: Map<VoiceEventType, Set<(event: VoiceEvent) => void>> = new Map();
  private variables: Map<string, unknown> = new Map();
  private isProcessing = false;
  
  constructor() {
    // Charger les commandes par défaut
    this.loadDefaultCommands();
  }
  
  /**
   * Charger les commandes par défaut
   */
  private loadDefaultCommands(): void {
    DEFAULT_VOICE_COMMANDS.forEach(command => {
      this.commands.set(command.id, { ...command });
    });
  }
  
  /**
   * Obtenir toutes les commandes
   */
  public getAllCommands(): VoiceCommand[] {
    return Array.from(this.commands.values());
  }
  
  /**
   * Obtenir une commande par ID
   */
  public getCommand(id: VoiceCommandId): VoiceCommand | null {
    return this.commands.get(id) || null;
  }
  
  /**
   * Ajouter une commande
   */
  public addCommand(command: VoiceCommand): VoiceCommandId {
    const id = command.id;
    this.commands.set(id, { ...command, createdAt: Date.now(), updatedAt: Date.now() });
    this.emit('command.added', { commandId: id });
    return id;
  }
  
  /**
   * Supprimer une commande
   */
  public removeCommand(id: VoiceCommandId): boolean {
    if (this.commands.has(id)) {
      this.commands.delete(id);
      this.emit('command.removed', { commandId: id });
      return true;
    }
    return false;
  }
  
  /**
   * Mettre à jour une commande
   */
  public updateCommand(id: VoiceCommandId, updates: Partial<VoiceCommand>): boolean {
    const command = this.commands.get(id);
    if (command) {
      this.commands.set(id, { ...command, ...updates, updatedAt: Date.now() });
      this.emit('command.updated', { commandId: id });
      return true;
    }
    return false;
  }
  
  /**
   * Activer/Désactiver une commande
   */
  public toggleCommand(id: VoiceCommandId, enabled: boolean): boolean {
    const command = this.commands.get(id);
    if (command) {
      this.commands.set(id, { ...command, enabled, updatedAt: Date.now() });
      this.emit('command.toggled', { commandId: id, enabled });
      return true;
    }
    return false;
  }
  
  /**
   * Activer/Désactiver une catégorie de commandes
   */
  public toggleCategory(category: string, enabled: boolean): number {
    let count = 0;
    this.commands.forEach((command, id) => {
      if (command.category === category) {
        this.commands.set(id, { ...command, enabled, updatedAt: Date.now() });
        count++;
      }
    });
    this.emit('category.toggled', { category, enabled, count });
    return count;
  }
  
  /**
   * Trouver les commandes correspondantes à une transcription
   */
  public findMatchingCommands(transcription: VoiceTranscription): VoiceCommandWithStatus[] {
    const text = transcription.text.toLowerCase().trim();
    const matches: VoiceCommandWithStatus[] = [];
    
    this.commands.forEach((command) => {
      if (!command.enabled) return;
      
      // Vérifier chaque déclencheur
      for (const trigger of command.triggers) {
        const matchResult = this.matchTrigger(text, trigger);
        if (matchResult.matches) {
          const confidence = this.calculateConfidence(matchResult, transcription);
          
          matches.push({
            ...command,
            status: 'pending',
            progress: 0,
            startedAt: Date.now(),
          });
          
          // Trier par priorité puis par confiance
          matches.sort((a, b) => {
            if (a.priority !== b.priority) {
              return a.priority - b.priority;
            }
            return b.priority - a.priority;
          });
          
          break; // Une seule correspondance par commande suffit
        }
      }
    });
    
    return matches;
  }
  
  /**
   * Vérifier si un déclencheur correspond
   */
  private matchTrigger(text: string, trigger: VoiceTrigger): { matches: boolean; score: number } {
    const pattern = trigger.pattern.toLowerCase().trim();
    const patternType = trigger.patternType;
    
    switch (patternType) {
      case 'exact':
        return { matches: text === pattern, score: text === pattern ? 1 : 0 };
      
      case 'keyword':
        return { matches: text.includes(pattern), score: text.includes(pattern) ? 0.8 : 0 };
      
      case 'regex':
        try {
          const regex = new RegExp(pattern, trigger.regexFlags || '');
          return { matches: regex.test(text), score: regex.test(text) ? 0.9 : 0 };
        } catch {
          return { matches: false, score: 0 };
        }
      
      case 'fuzzy':
        return {
          matches: this.fuzzyMatch(text, pattern, trigger.similarityThreshold || 0.7),
          score: this.fuzzyMatchScore(text, pattern),
        };
      
      case 'intent':
        // Matching d'intention (à implémenter)
        return { matches: this.intentMatch(text, pattern), score: this.intentMatchScore(text, pattern) };
      
      default:
        return { matches: text.includes(pattern), score: text.includes(pattern) ? 0.8 : 0 };
    }
  }
  
  /**
   * Matching flou
   */
  private fuzzyMatch(text: string, pattern: string, threshold: number): boolean {
    const score = this.fuzzyMatchScore(text, pattern);
    return score >= threshold;
  }
  
  /**
   * Score de matching flou
   */
  private fuzzyMatchScore(text: string, pattern: string): number {
    // Implémentation simple de Levenshtein distance
    const distance = this.levenshteinDistance(text, pattern);
    const maxLength = Math.max(text.length, pattern.length);
    
    if (maxLength === 0) return 1;
    
    const similarity = 1 - (distance / maxLength);
    return Math.max(0, similarity);
  }
  
  /**
   * Distance de Levenshtein
   */
  private levenshteinDistance(a: string, b: string): number {
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
   * Matching d'intention
   */
  private intentMatch(text: string, intent: string): boolean {
    // Implémentation simple pour l'instant
    const intentKeywords = intent.split(' ');
    const textWords = text.split(' ');
    
    const matchedKeywords = intentKeywords.filter(keyword =>
      textWords.some(word => word.includes(keyword) || keyword.includes(word))
    );
    
    return matchedKeywords.length >= Math.ceil(intentKeywords.length / 2);
  }
  
  /**
   * Score de matching d'intention
   */
  private intentMatchScore(text: string, intent: string): number {
    const intentKeywords = intent.split(' ');
    const textWords = text.split(' ');
    
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
   * Calculer la confiance
   */
  private calculateConfidence(matchResult: { matches: boolean; score: number }, transcription: VoiceTranscription): ConfidenceLevel {
    const score = matchResult.score * transcription.confidence;
    
    if (score >= 0.9) return 'very-high';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }
  
  /**
   * Exécuter une commande
   */
  public async executeCommand(
    commandId: VoiceCommandId,
    transcription: VoiceTranscription,
    context?: Partial<VoiceCommandContext>
  ): Promise<VoiceCommandExecutionResult> {
    const command = this.commands.get(commandId);
    if (!command) {
      return {
        commandId,
        success: false,
        error: `Command not found: ${commandId}`,
        executedActions: [],
        failedActions: [],
        duration: 0,
        timestamp: Date.now(),
      };
    }
    
    // Créer le contexte
    const executionContext: VoiceCommandContext = {
      commandId,
      transcription,
      command,
      variables: Object.fromEntries(this.variables),
      utils: {
        getVariable: (name: string) => this.getVariable(name),
        setVariable: (name: string, value: unknown) => this.setVariable(name, value),
        executeCommand: async (cmd: string, params?: Record<string, unknown>) => {
          return this.executeCommand(cmd as VoiceCommandId, transcription, context);
        },
        openWindow: async (options) => {
          // À implémenter avec l'API MorphOS
          this.emit('window.open', options);
          return 'window-id';
        },
        closeWindow: async (windowId: string) => {
          // À implémenter avec l'API MorphOS
          this.emit('window.close', { windowId });
        },
        executeModuleAction: async (moduleId: string, action: string, params?: Record<string, unknown>) => {
          // À implémenter avec l'API MorphOS
          this.emit('module.action', { moduleId, action, params });
          return {};
        },
        callAI: async (prompt: string, options?: { model?: string; temperature?: number }) => {
          // À implémenter avec l'API IA MorphOS
          this.emit('ai.call', { prompt, options });
          return 'AI response';
        },
        notify: (options: { title: string; message: string; type?: string }) => {
          // À implémenter avec le système de notifications
          this.emit('notification', options);
        },
        speak: async (text: string, options?: { voice?: string; rate?: number; pitch?: number }) => {
          // À implémenter avec la synthèse vocale
          this.emit('synthesis.speak', { text, options });
        },
      },
      ...context,
    };
    
    // Vérifier les conditions
    if (command.conditions) {
      const conditionsMet = await this.checkConditions(executionContext, command.conditions);
      if (!conditionsMet) {
        return {
          commandId,
          success: false,
          error: 'Command conditions not met',
          executedActions: [],
          failedActions: [],
          duration: 0,
          timestamp: Date.now(),
        };
      }
    }
    
    // Demander confirmation si nécessaire
    if (command.requireConfirmation) {
      const confirmed = await this.requestConfirmation(command);
      if (!confirmed) {
        return {
          commandId,
          success: false,
          error: 'Command cancelled by user',
          executedActions: [],
          failedActions: [],
          duration: 0,
          timestamp: Date.now(),
        };
      }
    }
    
    // Créer la commande avec statut
    const commandWithStatus: VoiceCommandWithStatus = {
      ...command,
      status: 'executing',
      progress: 0,
      startedAt: Date.now(),
    };
    
    this.currentCommand = commandWithStatus;
    this.emit('command.executing', { commandId });
    
    const startTime = Date.now();
    const executedActions: VoiceAction[] = [];
    const failedActions: Array<{ action: VoiceAction; error: string }> = [];
    
    // Exécuter les actions
    for (let i = 0; i < command.actions.length; i++) {
      const action = command.actions[i];
      
      try {
        // Attendre le délai si spécifié
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }
        
        // Exécuter l'action
        const result = await this.executeAction(action, executionContext);
        
        if (result.success) {
          executedActions.push(action);
          commandWithStatus.progress = (i + 1) / command.actions.length;
          this.emit('command.progress', { commandId, progress: commandWithStatus.progress });
        } else {
          failedActions.push({ action, error: result.error || 'Unknown error' });
          
          // Arrêter si l'action est critique
          if (command.type === 'sequence' || command.type === 'conditional') {
            break;
          }
        }
      } catch (error) {
        failedActions.push({ action, error: error instanceof Error ? error.message : 'Unknown error' });
        
        if (command.type === 'sequence' || command.type === 'conditional') {
          break;
        }
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Mettre à jour le statut
    commandWithStatus.status = failedActions.length === 0 ? 'completed' : 'error';
    commandWithStatus.completedAt = Date.now();
    commandWithStatus.progress = 1;
    
    this.currentCommand = null;
    
    if (commandWithStatus.status === 'completed') {
      this.emit('command.completed', { commandId, duration });
    } else {
      this.emit('command.error', { commandId, error: 'Action execution failed' });
    }
    
    // Exécuter la réponse si spécifiée
    if (command.response && commandWithStatus.status === 'completed') {
      await this.executeResponse(command.response, executionContext);
    }
    
    return {
      commandId,
      success: failedActions.length === 0,
      result: executedActions.length > 0 ? executedActions : undefined,
      error: failedActions.length > 0 ? failedActions[0].error : undefined,
      executedActions,
      failedActions,
      duration,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Exécuter une action
   */
  private async executeAction(action: VoiceAction, context: VoiceCommandContext): Promise<{ success: boolean; error?: string }> {
    try {
      switch (action.type) {
        case 'open_settings':
          await context.utils.openWindow({ type: 'settings' });
          break;
        case 'open_marketplace':
          await context.utils.openWindow({ type: 'marketplace' });
          break;
        case 'open_collaboration':
          await context.utils.openWindow({ type: 'collaboration' });
          break;
        case 'create_window':
          await context.utils.openWindow({ type: action.params?.type as string || 'chat', ...action.params });
          break;
        case 'close_current_window':
          await context.utils.closeWindow('current');
          break;
        case 'minimize_current_window':
          this.emit('window.minimize', {});
          break;
        case 'maximize_current_window':
          this.emit('window.maximize', {});
          break;
        case 'save_current_file':
          this.emit('file.save', {});
          break;
        case 'create_file':
          this.emit('file.create', {});
          break;
        case 'go_back':
          this.emit('navigation.back', {});
          break;
        case 'scroll':
          this.emit('navigation.scroll', action.params);
          break;
        case 'ai_chat':
          const query = action.params?.useQuery ? context.transcription.text : action.params?.query as string;
          await context.utils.callAI(query);
          break;
        case 'ai_generate':
          const type = action.params?.type as string || 'text';
          const prompt = action.params?.useQuery ? context.transcription.text : action.params?.prompt as string;
          await context.utils.callAI(`Generate ${type}: ${prompt}`);
          break;
        default:
          // Essayer d'exécuter via MorphOS
          await context.utils.executeCommand(action.type, action.params);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Vérifier les conditions
   */
  private async checkConditions(context: VoiceCommandContext, conditions: VoiceCommand['conditions']): Promise<boolean> {
    if (!conditions) return true;
    
    // Vérifier le module requis
    if (conditions.requiredModule) {
      // À implémenter avec l'API des modules
      const moduleAvailable = await this.checkModuleAvailable(conditions.requiredModule);
      if (!moduleAvailable) return false;
    }
    
    // Vérifier la fenêtre requise
    if (conditions.requiredWindow) {
      // À implémenter avec l'API des fenêtres
      const windowAvailable = await this.checkWindowAvailable(conditions.requiredWindow);
      if (!windowAvailable) return false;
    }
    
    // Vérifier le contexte requis
    if (conditions.requiredContext && conditions.requiredContext.length > 0) {
      for (const requiredContext of conditions.requiredContext) {
        const hasContext = context.variables[requiredContext] !== undefined;
        if (!hasContext) return false;
      }
    }
    
    // Vérifier l'heure requise
    if (conditions.requiredTime) {
      const timeAvailable = this.checkTimeAvailable(conditions.requiredTime);
      if (!timeAvailable) return false;
    }
    
    // Vérifier l'expression conditionnelle
    if (conditions.expression) {
      const expressionResult = await this.evaluateExpression(conditions.expression, context);
      if (!expressionResult) return false;
    }
    
    return true;
  }
  
  /**
   * Vérifier si un module est disponible
   */
  private async checkModuleAvailable(moduleId: string): Promise<boolean> {
    // À implémenter avec l'API des modules
    this.emit('module.check', { moduleId });
    return true; // Par défaut
  }
  
  /**
   * Vérifier si une fenêtre est disponible
   */
  private async checkWindowAvailable(windowType: string): Promise<boolean> {
    // À implémenter avec l'API des fenêtres
    this.emit('window.check', { type: windowType });
    return true; // Par défaut
  }
  
  /**
   * Vérifier si l'heure est disponible
   */
  private checkTimeAvailable(time: string): boolean {
    const hour = new Date().getHours();
    
    switch (time.toLowerCase()) {
      case 'morning':
        return hour >= 6 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 18;
      case 'evening':
        return hour >= 18 && hour < 22;
      case 'night':
        return hour >= 22 || hour < 6;
      default:
        return true;
    }
  }
  
  /**
   * Évaluer une expression
   */
  private async evaluateExpression(expression: string, context: VoiceCommandContext): Promise<boolean> {
    // Implémentation simple pour l'instant
    // À remplacer par un évaluateur plus avancé
    
    try {
      // Remplacer les variables
      let evaluatedExpression = expression;
      for (const [key, value] of Object.entries(context.variables)) {
        evaluatedExpression = evaluatedExpression.replace(new RegExp(`\${key}`, 'g'), String(value));
      }
      
      // Évaluer l'expression
      // @ts-expect-error - Évaluation dynamique
      return !!eval(evaluatedExpression);
    } catch {
      return false;
    }
  }
  
  /**
   * Demander confirmation
   */
  private async requestConfirmation(command: VoiceCommand): Promise<boolean> {
    return new Promise((resolve) => {
      this.emit('command.confirmation', {
        commandId: command.id,
        name: command.name,
        description: command.description,
        resolve,
      });
      
      // Timeout de 10 secondes
      setTimeout(() => resolve(false), 10000);
    });
  }
  
  /**
   * Exécuter la réponse
   */
  private async executeResponse(response: VoiceCommand['response'], context: VoiceCommandContext): Promise<void> {
    if (!response) return;
    
    switch (response.type) {
      case 'text':
        // Afficher le texte
        this.emit('response.text', { text: response.text || '' });
        break;
      case 'speech':
        // Dire le texte
        await context.utils.speak(response.text || '', {
          voice: response.voice,
          rate: response.rate,
          pitch: response.pitch,
        });
        break;
      case 'action':
        // Exécuter une action
        if (response.text) {
          await this.executeCommand(response.text as VoiceCommandId, context.transcription);
        }
        break;
      case 'none':
        // Ne rien faire
        break;
    }
  }
  
  /**
   * Ajouter une commande à la file d'attente
   */
  public queueCommand(commandWithStatus: VoiceCommandWithStatus): void {
    this.commandQueue.push(commandWithStatus);
    this.emit('command.queued', { commandId: commandWithStatus.id });
    
    // Traiter la file si on ne fait rien
    if (!this.isProcessing) {
      this.processQueue();
    }
  }
  
  /**
   * Traiter la file d'attente
   */
  private async processQueue(): Promise<void> {
    if (this.commandQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    
    while (this.commandQueue.length > 0) {
      const command = this.commandQueue.shift()!;
      
      try {
        // Attendre que la commande actuelle soit terminée
        while (this.currentCommand) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Exécuter la commande
        const result = await this.executeCommand(
          command.id,
          command.status === 'listening' ? { text: '', confidence: 1, confidenceLevel: 'high', language: 'en-US', startTime: Date.now(), endTime: Date.now() } : 
          { text: command.name, confidence: 1, confidenceLevel: 'high', language: 'en-US', startTime: Date.now(), endTime: Date.now() }
        );
        
        if (!result.success) {
          this.emit('command.error', { commandId: command.id, error: result.error });
        }
      } catch (error) {
        this.emit('command.error', { commandId: command.id, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    
    this.isProcessing = false;
  }
  
  /**
   * Annuler toutes les commandes
   */
  public cancelAllCommands(): void {
    this.commandQueue = [];
    this.currentCommand = null;
    this.isProcessing = false;
    this.emit('command.cancelled.all', {});
  }
  
  /**
   * Annuler une commande spécifique
   */
  public cancelCommand(commandId: VoiceCommandId): boolean {
    const index = this.commandQueue.findIndex(cmd => cmd.id === commandId);
    if (index !== -1) {
      this.commandQueue.splice(index, 1);
      this.emit('command.cancelled', { commandId });
      return true;
    }
    
    if (this.currentCommand?.id === commandId) {
      this.currentCommand = null;
      this.emit('command.cancelled', { commandId });
      return true;
    }
    
    return false;
  }
  
  /**
   * Obtenir la commande en cours
   */
  public getCurrentCommand(): VoiceCommandWithStatus | null {
    return this.currentCommand;
  }
  
  /**
   * Obtenir la file d'attente
   */
  public getCommandQueue(): VoiceCommandWithStatus[] {
    return [...this.commandQueue];
  }
  
  // ============ VARIABLES ============
  
  /**
   * Obtenir une variable
   */
  public getVariable(name: string): unknown {
    return this.variables.get(name);
  }
  
  /**
   * Définir une variable
   */
  public setVariable(name: string, value: unknown): void {
    this.variables.set(name, value);
    this.emit('variable.set', { name, value });
  }
  
  /**
   * Supprimer une variable
   */
  public deleteVariable(name: string): boolean {
    if (this.variables.has(name)) {
      this.variables.delete(name);
      this.emit('variable.deleted', { name });
      return true;
    }
    return false;
  }
  
  /**
   * Obtenir toutes les variables
   */
  public getAllVariables(): Record<string, unknown> {
    return Object.fromEntries(this.variables);
  }
  
  /**
   * Nettoyer les variables
   */
  public clearVariables(): void {
    this.variables.clear();
    this.emit('variable.cleared', {});
  }
  
  // ============ EVENTS ============
  
  /**
   * Écouter les événements
   */
  public on(event: VoiceEventType, callback: (event: VoiceEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }
  
  /**
   * Arrêter d'écouter les événements
   */
  public off(event: VoiceEventType, callback: (event: VoiceEvent) => void): void {
    const eventListeners = this.eventListeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }
  
  /**
   * Émettre un événement
   */
  public emit(event: VoiceEventType, data?: Record<string, unknown>): void {
    const voiceEvent: VoiceEvent = {
      type: event,
      timestamp: Date.now(),
      data,
    };
    
    const eventListeners = this.eventListeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(voiceEvent);
        } catch (error) {
          console.error('Error in voice command event callback:', error);
        }
      });
    }
  }
  
  /**
   * Nettoyer
   */
  public cleanup(): void {
    this.eventListeners.clear();
    this.variables.clear();
    this.commandQueue = [];
    this.currentCommand = null;
    this.isProcessing = false;
  }
}

/**
 * Instance singleton du moteur de commandes vocales
 */
export const voiceCommandEngine = new VoiceCommandEngine();
