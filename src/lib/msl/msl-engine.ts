/**
 * MorphOS Scripting Language (MSL) - Engine
 * 
 * Moteur d'exécution des scripts MSL
 * Interprète et exécute le code MSL
 */

import type {
  MSLScript,
  MSLScriptWithContext,
  MSLValue,
  MSLFunction,
  MSLModule,
  ExecutionContext,
  ExecutionResult,
  ExecutionEvent,
  ScriptId,
  ScriptType,
  ExecutionMode,
  ScriptTrigger,
  ExecutionCondition,
  ScriptDependency,
} from './msl-types';

import { parseMSL, validateMSL } from './msl-parser';
import { BUILT_IN_FUNCTIONS } from './msl-types';

// ============ EXECUTION CONTEXT ============

/**
 * Créer un contexte d'exécution
 */
export function createExecutionContext(
  script: MSLScript,
  globals: Record<string, MSLValue> = {},
  morphosFunctions: Partial<Record<string, unknown>> = {},
  utils: Partial<Record<string, unknown>> = {}
): ExecutionContext {
  return {
    executionId: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    scriptId: script.id,
    globals: { ...globals },
    locals: {},
    functions: {},
    modules: {},
    morphos: {
      windows: {
        create: async () => '',
        close: async () => {},
        get: async () => ({}),
        list: async () => [],
        focus: async () => {},
        minimize: async () => {},
        maximize: async () => {},
        restore: async () => {},
      },
      modules: {
        create: async () => '',
        close: async () => {},
        get: async () => ({}),
        list: async () => [],
        action: async () => ({}),
      },
      workspaces: {
        create: async () => '',
        save: async () => {},
        load: async () => {},
        delete: async () => {},
        list: async () => [],
      },
      files: {
        read: async () => '',
        write: async () => {},
        delete: async () => {},
        list: async () => [],
        exists: async () => false,
        mkdir: async () => {},
        rmdir: async () => {},
      },
      ai: {
        chat: async () => '',
        generate: async () => '',
        embed: async () => [],
        analyze: async () => ({}),
      },
      notifications: {
        show: () => {},
        toast: () => {},
        alert: async () => {},
        confirm: async () => false,
      },
      voice: {
        speak: async () => {},
        listen: async () => '',
        stopListening: async () => {},
        isListening: () => false,
      },
      integrations: {
        call: async () => ({}),
        trigger: async () => {},
      },
      system: {
        exit: async () => {},
        restart: async () => {},
        info: async () => ({}),
        config: async () => ({}),
      },
      ...morphosFunctions,
    },
    utils: {
      log: console.log,
      error: console.error,
      warn: console.warn,
      wait: async (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
      delay: async (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
      now: () => Date.now(),
      uuid: () => `uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      copy: (value: unknown) => ({ ...value as Record<string, unknown> }),
      clone: (value: unknown) => JSON.parse(JSON.stringify(value)),
      merge: (target: Record<string, unknown>, ...sources: Record<string, unknown>[]) => {
        const result = { ...target };
        for (const source of sources) {
          Object.assign(result, source);
        }
        return result;
      },
      test: (condition: boolean, message?: string) => {
        if (!condition) {
          throw new Error(message || 'Test failed');
        }
      },
      assert: (condition: boolean, message?: string) => {
        if (!condition) {
          throw new Error(message || 'Assertion failed');
        }
      },
      ...utils,
    },
  };
}

// ============ SCRIPT MANAGER ============

/**
 * Gestionnaire des scripts MSL
 */
export class MSLScriptManager {
  private scripts: Map<ScriptId, MSLScript> = new Map();
  private runningScripts: Map<string, MSLScriptWithContext> = new Map();
  private eventListeners: Map<string, Set<(event: ExecutionEvent) => void>> = new Map();
  private globalFunctions: Map<string, MSLFunction> = new Map();
  private globalModules: Map<string, MSLModule> = new Map();
  
  constructor() {
    // Enregistrer les fonctions built-in
    this.registerBuiltInFunctions();
  }
  
  /**
   * Enregistrer les fonctions built-in
   */
  private registerBuiltInFunctions(): void {
    for (const func of BUILT_IN_FUNCTIONS) {
      this.globalFunctions.set(func.name, {
        name: func.name,
        type: 'function',
        parameters: func.parameters,
        body: [],
        async: func.async,
        generator: false,
        implementation: func.implementation,
      } as unknown as MSLFunction);
    }
  }
  
  /**
   * Ajouter un script
   */
  public addScript(script: MSLScript): ScriptId {
    const id = script.id;
    this.scripts.set(id, { ...script, status: 'idle' });
    this.emit({
      type: 'start',
      executionId: '',
      scriptId: id,
      timestamp: Date.now(),
    });
    return id;
  }
  
  /**
   * Supprimer un script
   */
  public removeScript(id: ScriptId): boolean {
    if (this.scripts.has(id)) {
      this.stopScript(id);
      this.scripts.delete(id);
      return true;
    }
    return false;
  }
  
  /**
   * Obtenir un script
   */
  public getScript(id: ScriptId): MSLScript | null {
    return this.scripts.get(id) || null;
  }
  
  /**
   * Obtenir tous les scripts
   */
  public getAllScripts(): MSLScript[] {
    return Array.from(this.scripts.values());
  }
  
  /**
   * Obtenir les scripts par type
   */
  public getScriptsByType(type: ScriptType): MSLScript[] {
    return Array.from(this.scripts.values()).filter(s => s.type === type);
  }
  
  /**
   * Obtenir les scripts par catégorie
   */
  public getScriptsByCategory(category: string): MSLScript[] {
    return Array.from(this.scripts.values()).filter(s => s.category === category);
  }
  
  /**
   * Obtenir les scripts par tag
   */
  public getScriptsByTag(tag: string): MSLScript[] {
    return Array.from(this.scripts.values()).filter(s => s.tags?.includes(tag));
  }
  
  /**
   * Charger un script depuis le code source
   */
  public loadScript(source: string, options?: { name?: string; type?: ScriptType; category?: string; tags?: string[] }): MSLScript {
    const id = `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Parser le code
    const parseResult = parseMSL(source);
    
    const script: MSLScript = {
      id,
      name: options?.name || `Script ${id}`,
      description: '',
      type: options?.type || 'action',
      version: '1.0.0',
      category: options?.category || 'custom',
      tags: options?.tags || [],
      source,
      ast: parseResult.ast,
      tokens: parseResult.tokens,
      triggers: [],
      conditions: {},
      dependencies: [],
      executionMode: 'sync',
      globals: {},
      parameters: [],
      exports: [],
      status: 'loaded',
      enabled: true,
      priority: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.scripts.set(id, script);
    
    return script;
  }
  
  /**
   * Charger un script depuis un fichier
   */
  public async loadScriptFromFile(path: string): Promise<MSLScript | null> {
    try {
      // À implémenter avec le système de fichiers MorphOS
      // const content = await morphos.files.read(path);
      const content = ''; // Placeholder
      return this.loadScript(content, { name: path.split('/').pop() || 'unnamed' });
    } catch {
      return null;
    }
  }
  
  /**
   * Sauvegarder un script
   */
  public async saveScript(script: MSLScript, path?: string): Promise<boolean> {
    try {
      if (path) {
        // À implémenter avec le système de fichiers MorphOS
        // await morphos.files.write(path, script.source);
      }
      
      this.scripts.set(script.id, script);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Exécuter un script
   */
  public async executeScript(
    id: ScriptId,
    context?: Partial<ExecutionContext>,
    params?: Record<string, MSLValue>
  ): Promise<ExecutionResult> {
    const script = this.scripts.get(id);
    if (!script) {
      return {
        success: false,
        error: `Script not found: ${id}`,
        duration: 0,
        stepsExecuted: 0,
        stepsFailed: 0,
        finalGlobals: {},
        timestamp: Date.now(),
      };
    }
    
    // Vérifier si le script est activé
    if (!script.enabled) {
      return {
        success: false,
        error: `Script is disabled: ${script.name}`,
        duration: 0,
        stepsExecuted: 0,
        stepsFailed: 0,
        finalGlobals: {},
        timestamp: Date.now(),
      };
    }
    
    // Vérifier les conditions
    if (script.conditions && !this.checkConditions(script.conditions, context)) {
      return {
        success: false,
        error: 'Script conditions not met',
        duration: 0,
        stepsExecuted: 0,
        stepsFailed: 0,
        finalGlobals: {},
        timestamp: Date.now(),
      };
    }
    
    // Créer le contexte d'exécution
    const executionContext: ExecutionContext = {
      ...createExecutionContext(script),
      ...context,
      globals: { ...script.globals, ...context?.globals },
    };
    
    // Ajouter les paramètres
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        executionContext.globals[key] = value;
      }
    }
    
    // Mettre à jour le statut
    script.status = 'running';
    this.scripts.set(id, script);
    
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.emit({
      type: 'start',
      executionId,
      scriptId: id,
      timestamp: Date.now(),
    });
    
    const startTime = Date.now();
    let stepsExecuted = 0;
    let stepsFailed = 0;
    let result: MSLValue | null = null;
    let error: string | null = null;
    
    try {
      // Exécuter selon le mode
      switch (script.executionMode) {
        case 'sync':
          result = await this.executeSync(script, executionContext, executionId);
          break;
        case 'async':
          result = await this.executeAsync(script, executionContext, executionId);
          break;
        case 'parallel':
          result = await this.executeParallel(script, executionContext, executionId);
          break;
        case 'sequence':
          result = await this.executeSequence(script, executionContext, executionId);
          break;
        case 'background':
          // Exécuter en arrière-plan
          this.executeBackground(script, executionContext, executionId);
          return {
            success: true,
            result: { type: 'null', value: null },
            duration: 0,
            stepsExecuted,
            stepsFailed,
            finalGlobals: executionContext.globals,
            timestamp: Date.now(),
          };
        default:
          result = await this.executeSync(script, executionContext, executionId);
      }
      
      // Mettre à jour les statistiques
      script.lastExecutedAt = Date.now();
      script.lastExecutionDuration = Date.now() - startTime;
      script.lastExecutionError = undefined;
      script.status = 'completed';
      this.scripts.set(id, script);
      
      this.emit({
        type: 'complete',
        executionId,
        scriptId: id,
        timestamp: Date.now(),
      });
      
      return {
        success: true,
        result,
        duration: Date.now() - startTime,
        stepsExecuted,
        stepsFailed,
        finalGlobals: executionContext.globals,
        timestamp: Date.now(),
      };
    } catch (err) {
      const duration = Date.now() - startTime;
      error = err instanceof Error ? err.message : String(err);
      
      // Mettre à jour les statistiques
      script.lastExecutedAt = Date.now();
      script.lastExecutionDuration = duration;
      script.lastExecutionError = error;
      script.status = 'error';
      this.scripts.set(id, script);
      
      this.emit({
        type: 'error',
        executionId,
        scriptId: id,
        error,
        timestamp: Date.now(),
      });
      
      return {
        success: false,
        error,
        duration,
        stepsExecuted,
        stepsFailed,
        finalGlobals: executionContext.globals,
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * Exécuter en mode synchrone
   */
  private async executeSync(
    script: MSLScript,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    if (!script.ast) {
      throw new Error('Script AST not available');
    }
    
    // Exécuter chaque enfant de l'AST
    const children = script.ast.children as Statement[];
    let result: MSLValue = { type: 'null', value: null };
    
    for (const child of children) {
      result = await this.executeStatement(child, context, executionId);
    }
    
    return result;
  }
  
  /**
   * Exécuter en mode asynchrone
   */
  private async executeAsync(
    script: MSLScript,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    return this.executeSync(script, context, executionId);
  }
  
  /**
   * Exécuter en mode parallèle
   */
  private async executeParallel(
    script: MSLScript,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    if (!script.ast) {
      throw new Error('Script AST not available');
    }
    
    const children = script.ast.children as Statement[];
    
    // Exécuter tous les enfants en parallèle
    const promises = children.map(child => this.executeStatement(child, context, executionId));
    const results = await Promise.allSettled(promises);
    
    // Retourner le dernier résultat réussi
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i].status === 'fulfilled') {
        return results[i].value;
      }
    }
    
    // Si tous ont échoué, lancer la première erreur
    for (const result of results) {
      if (result.status === 'rejected') {
        throw result.reason;
      }
    }
    
    return { type: 'null', value: null };
  }
  
  /**
   * Exécuter en mode séquence
   */
  private async executeSequence(
    script: MSLScript,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    return this.executeSync(script, context, executionId);
  }
  
  /**
   * Exécuter en arrière-plan
   */
  private executeBackground(
    script: MSLScript,
    context: ExecutionContext,
    executionId: string
  ): void {
    // Exécuter sans attendre
    this.executeSync(script, context, executionId).catch(error => {
      this.emit({
        type: 'error',
        executionId,
        scriptId: script.id,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
    });
  }
  
  /**
   * Exécuter un statement
   */
  private async executeStatement(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    try {
      switch (statement.type) {
        case 'expression':
          return this.executeExpression(statement.expression as Expression, context, executionId);
        
        case 'block':
          return this.executeBlock(statement.children as Statement[], context, executionId);
        
        case 'if':
          return this.executeIf(statement, context, executionId);
        
        case 'switch':
          return this.executeSwitch(statement, context, executionId);
        
        case 'for':
          return this.executeFor(statement, context, executionId);
        
        case 'while':
          return this.executeWhile(statement, context, executionId);
        
        case 'do while':
          return this.executeDoWhile(statement, context, executionId);
        
        case 'break':
          throw new BreakError(statement.label);
        
        case 'continue':
          throw new ContinueError(statement.label);
        
        case 'return':
          throw new ReturnError(statement.argument ? await this.executeExpression(statement.argument, context, executionId) : { type: 'null', value: null });
        
        case 'throw':
          throw await this.executeExpression(statement.argument as Expression, context, executionId);
        
        case 'try':
          return this.executeTry(statement, context, executionId);
        
        case 'const':
        case 'let':
        case 'var':
          return this.executeVariableDeclaration(statement as Statement, context, executionId);
        
        case 'function':
          return this.executeFunctionDeclaration(statement as Statement, context, executionId);
        
        case 'class':
          return this.executeClassDeclaration(statement as Statement, context, executionId);
        
        case 'import':
          return this.executeImportDeclaration(statement as Statement, context, executionId);
        
        case 'export':
          return this.executeExportDeclaration(statement as Statement, context, executionId);
        
        case 'with':
          return this.executeWith(statement, context, executionId);
        
        case 'debugger':
          debugger;
          return { type: 'null', value: null };
        
        default:
          throw new Error(`Unknown statement type: ${statement.type}`);
      }
    } catch (error) {
      if (error instanceof ReturnError) {
        throw error;
      }
      if (error instanceof BreakError || error instanceof ContinueError) {
        throw error;
      }
      
      this.emit({
        type: 'error',
        executionId,
        scriptId: context.currentModule || '',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      });
      
      throw error;
    }
  }
  
  /**
   * Exécuter une expression
   */
  private async executeExpression(
    expression: Expression,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    switch (expression.type) {
      case 'literal':
        return { type: this.getValueType(expression.literalValue), value: expression.literalValue };
      
      case 'identifier':
        return this.getVariable(expression.identifierName || '', context);
      
      case 'binary':
        return this.executeBinaryExpression(expression, context, executionId);
      
      case 'unary':
        return this.executeUnaryExpression(expression, context, executionId);
      
      case 'call':
        return this.executeCallExpression(expression, context, executionId);
      
      case 'member':
        return this.executeMemberExpression(expression, context, executionId);
      
      case 'index':
        return this.executeIndexExpression(expression, context, executionId);
      
      case 'conditional':
        return this.executeConditionalExpression(expression, context, executionId);
      
      case 'logical':
        return this.executeLogicalExpression(expression, context, executionId);
      
      case 'comparison':
        return this.executeComparisonExpression(expression, context, executionId);
      
      case 'arithmetic':
        return this.executeArithmeticExpression(expression, context, executionId);
      
      case 'bitwise':
        return this.executeBitwiseExpression(expression, context, executionId);
      
      default:
        throw new Error(`Unknown expression type: ${expression.type}`);
    }
  }
  
  /**
   * Obtenir le type d'une valeur
   */
  private getValueType(value: unknown): MSLValueType {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    if (typeof value === 'function') return 'function';
    return 'null';
  }
  
  /**
   * Obtenir une variable
   */
  private getVariable(name: string, context: ExecutionContext): MSLValue {
    // Chercher dans les locales
    if (context.locals[name]) {
      return context.locals[name];
    }
    
    // Chercher dans les globales
    if (context.globals[name]) {
      return context.globals[name];
    }
    
    // Chercher dans les fonctions built-in
    if (this.globalFunctions.has(name)) {
      const func = this.globalFunctions.get(name)!;
      return {
        type: 'function',
        value: func,
      };
    }
    
    // Chercher dans les modules
    if (context.modules[name]) {
      return {
        type: 'module',
        value: context.modules[name],
      };
    }
    
    // Chercher dans MorphOS
    if (context.morphos[name as keyof typeof context.morphos]) {
      return {
        type: 'object',
        value: context.morphos[name as keyof typeof context.morphos],
      };
    }
    
    // Chercher dans les utils
    if (context.utils[name as keyof typeof context.utils]) {
      return {
        type: 'function',
        value: context.utils[name as keyof typeof context.utils],
      };
    }
    
    throw new Error(`Variable not found: ${name}`);
  }
  
  /**
   * Définir une variable
   */
  private setVariable(name: string, value: MSLValue, context: ExecutionContext, kind: 'const' | 'let' | 'var' = 'let'): void {
    if (kind === 'const' && (context.locals[name] || context.globals[name])) {
      throw new Error(`Cannot reassign const variable: ${name}`);
    }
    
    context.locals[name] = value;
  }
  
  /**
   * Exécuter un bloc
   */
  private async executeBlock(
    statements: Statement[],
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    let result: MSLValue = { type: 'null', value: null };
    
    for (const statement of statements) {
      result = await this.executeStatement(statement, context, executionId);
    }
    
    return result;
  }
  
  /**
   * Exécuter un if
   */
  private async executeIf(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const test = await this.executeExpression(statement.test as Expression, context, executionId);
    
    if (this.isTruthy(test)) {
      return this.executeStatement(statement.consequent as Statement, context, executionId);
    } else if (statement.alternate) {
      return this.executeStatement(statement.alternate, context, executionId);
    }
    
    return { type: 'null', value: null };
  }
  
  /**
   * Vérifier si une valeur est truthy
   */
  private isTruthy(value: MSLValue): boolean {
    if (value.type === 'null' || value.type === 'undefined') return false;
    if (value.type === 'boolean') return value.value as boolean;
    if (value.type === 'number') return value.value !== 0;
    if (value.type === 'string') return value.value !== '';
    if (value.type === 'array') return (value.value as unknown[]).length > 0;
    if (value.type === 'object') return Object.keys(value.value as Record<string, unknown>).length > 0;
    return true;
  }
  
  /**
   * Exécuter un switch
   */
  private async executeSwitch(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const discriminant = await this.executeExpression(statement.discriminant as Expression, context, executionId);
    const cases = statement.cases as Statement[];
    
    for (const caseStatement of cases) {
      if (caseStatement.type === 'case') {
        const test = await this.executeExpression(caseStatement.test as Expression, context, executionId);
        
        if (this.isEqual(test, discriminant)) {
          return this.executeBlock(caseStatement.consequent as Statement[], context, executionId);
        }
      } else if (caseStatement.type === 'default') {
        return this.executeBlock(caseStatement.consequent as Statement[], context, executionId);
      }
    }
    
    return { type: 'null', value: null };
  }
  
  /**
   * Vérifier l'égalité
   */
  private isEqual(a: MSLValue, b: MSLValue): boolean {
    if (a.type !== b.type) return false;
    return a.value === b.value;
  }
  
  /**
   * Exécuter un for
   */
  private async executeFor(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    // Initialisation
    if (statement.init) {
      if (statement.init.type === 'const' || statement.init.type === 'let' || statement.init.type === 'var') {
        await this.executeVariableDeclaration(statement.init, context, executionId);
      } else {
        await this.executeExpression(statement.init as Expression, context, executionId);
      }
    }
    
    // Boucle
    while (true) {
      // Condition
      if (statement.test) {
        const test = await this.executeExpression(statement.test, context, executionId);
        if (!this.isTruthy(test)) {
          break;
        }
      }
      
      try {
        // Corps
        await this.executeStatement(statement.body as Statement, context, executionId);
      } catch (error) {
        if (error instanceof BreakError) {
          break;
        }
        if (error instanceof ContinueError) {
          // Continuer
        } else {
          throw error;
        }
      }
      
      // Mise à jour
      if (statement.update) {
        await this.executeExpression(statement.update, context, executionId);
      }
    }
    
    return { type: 'null', value: null };
  }
  
  /**
   * Exécuter un while
   */
  private async executeWhile(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    while (true) {
      const test = await this.executeExpression(statement.test as Expression, context, executionId);
      
      if (!this.isTruthy(test)) {
        break;
      }
      
      try {
        await this.executeStatement(statement.body as Statement, context, executionId);
      } catch (error) {
        if (error instanceof BreakError) {
          break;
        }
        if (error instanceof ContinueError) {
          // Continuer
        } else {
          throw error;
        }
      }
    }
    
    return { type: 'null', value: null };
  }
  
  /**
   * Exécuter un do-while
   */
  private async executeDoWhile(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    do {
      try {
        await this.executeStatement(statement.body as Statement, context, executionId);
      } catch (error) {
        if (error instanceof BreakError) {
          break;
        }
        if (error instanceof ContinueError) {
          // Continuer
        } else {
          throw error;
        }
      }
    } while (this.isTruthy(await this.executeExpression(statement.test as Expression, context, executionId)));
    
    return { type: 'null', value: null };
  }
  
  /**
   * Exécuter un try
   */
  private async executeTry(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    try {
      return await this.executeBlock((statement as Statement).block?.children as Statement[] || [], context, executionId);
    } catch (error) {
      if (statement.handler) {
        const catchContext = { ...context };
        
        if (statement.handler.param) {
          catchContext.locals[statement.handler.param.name] = {
            type: 'error',
            value: error,
          };
        }
        
        return this.executeBlock(statement.handler.body, catchContext, executionId);
      }
      
      throw error;
    } finally {
      if (statement.finalizer) {
        await this.executeStatement(statement.finalizer, context, executionId);
      }
    }
  }
  
  /**
   * Exécuter une déclaration de variable
   */
  private async executeVariableDeclaration(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const declarations = (statement as Statement).declarations as VariableDeclaration[];
    
    for (const declaration of declarations) {
      let value: MSLValue = { type: 'null', value: null };
      
      if (declaration.init) {
        value = await this.executeExpression(declaration.init, context, executionId);
      }
      
      this.setVariable(declaration.name, value, context, declaration.kind);
    }
    
    return { type: 'null', value: null };
  }
  
  /**
   * Exécuter une déclaration de fonction
   */
  private async executeFunctionDeclaration(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const name = statement.name as string;
    const params = (statement as Statement).params as Parameter[];
    const body = (statement as Statement).body as Statement[];
    const isAsync = (statement as Statement).async as boolean;
    
    const func: MSLFunction = {
      name,
      type: 'function',
      parameters: params,
      body,
      async: isAsync,
      generator: false,
    };
    
    context.functions[name] = func;
    context.globals[name] = { type: 'function', value: func };
    
    return { type: 'null', value: null };
  }
  
  /**
   * Exécuter une déclaration de classe
   */
  private async executeClassDeclaration(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    // À implémenter
    return { type: 'null', value: null };
  }
  
  /**
   * Exécuter une déclaration d'import
   */
  private async executeImportDeclaration(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    // À implémenter
    return { type: 'null', value: null };
  }
  
  /**
   * Exécuter une déclaration d'export
   */
  private async executeExportDeclaration(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    // À implémenter
    return { type: 'null', value: null };
  }
  
  /**
   * Exécuter un with
   */
  private async executeWith(
    statement: Statement,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    // À implémenter
    return { type: 'null', value: null };
  }
  
  /**
   * Exécuter une expression binaire
   */
  private async executeBinaryExpression(
    expression: Expression,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const left = await this.executeExpression(expression.left as Expression, context, executionId);
    const right = await this.executeExpression(expression.right as Expression, context, executionId);
    const operator = expression.operator as BinaryOperator;
    
    switch (operator) {
      case '+':
        return { type: 'number', value: (left.value as number) + (right.value as number) };
      case '-':
        return { type: 'number', value: (left.value as number) - (right.value as number) };
      case '*':
        return { type: 'number', value: (left.value as number) * (right.value as number) };
      case '/':
        return { type: 'number', value: (left.value as number) / (right.value as number) };
      case '%':
        return { type: 'number', value: (left.value as number) % (right.value as number) };
      case '**':
        return { type: 'number', value: Math.pow(left.value as number, right.value as number) };
      case '//':
        return { type: 'number', value: Math.floor((left.value as number) / (right.value as number)) };
      default:
        throw new Error(`Unknown binary operator: ${operator}`);
    }
  }
  
  /**
   * Exécuter une expression unaire
   */
  private async executeUnaryExpression(
    expression: Expression,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const argument = await this.executeExpression(expression.argument as Expression, context, executionId);
    const operator = expression.operator as UnaryOperator;
    
    switch (operator) {
      case '+':
        return argument;
      case '-':
        return { type: 'number', value: -(argument.value as number) };
      case '!':
        return { type: 'boolean', value: !this.isTruthy(argument) };
      case '~':
        return { type: 'number', value: ~(argument.value as number) };
      case 'typeof':
        return { type: 'string', value: argument.type };
      case 'void':
        return { type: 'null', value: null };
      case 'delete':
        // À implémenter
        return { type: 'boolean', value: false };
      case 'await':
        // À implémenter
        return argument;
      case 'yield':
        // À implémenter
        return argument;
      default:
        throw new Error(`Unknown unary operator: ${operator}`);
    }
  }
  
  /**
   * Exécuter un appel de fonction
   */
  private async executeCallExpression(
    expression: Expression,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const callee = await this.executeExpression(expression.callee as Expression, context, executionId);
    const args = expression.arguments as Expression[];
    
    // Exécuter les arguments
    const evaluatedArgs = await Promise.all(
      args.map(arg => this.executeExpression(arg, context, executionId))
    );
    
    // Si c'est une fonction MorphOS
    if (callee.type === 'object' && typeof callee.value === 'object') {
      const obj = callee.value as Record<string, unknown>;
      
      // Vérifier si c'est une fonction MorphOS
      if (typeof obj === 'function') {
        return { type: 'null', value: await (obj as (...args: unknown[]) => Promise<unknown>)(...evaluatedArgs.map(a => a.value)) };
      }
    }
    
    // Si c'est une fonction MSL
    if (callee.type === 'function') {
      const func = callee.value as MSLFunction;
      
      // Créer un nouveau contexte pour la fonction
      const funcContext: ExecutionContext = {
        ...context,
        locals: {},
      };
      
      // Assigner les paramètres
      for (let i = 0; i < func.parameters.length; i++) {
        const param = func.parameters[i];
        const arg = evaluatedArgs[i] || { type: 'null', value: null };
        
        if (param.rest) {
          // Paramètre rest
          funcContext.locals[param.name] = {
            type: 'array',
            value: evaluatedArgs.slice(i).map(a => a.value),
          };
          break;
        }
        
        funcContext.locals[param.name] = arg;
      }
      
      // Exécuter le corps de la fonction
      if (func.async) {
        return this.executeAsyncFunction(func, funcContext, executionId);
      }
      
      return this.executeSyncFunction(func, funcContext, executionId);
    }
    
    // Si c'est une fonction built-in
    if (callee.type === 'function' && typeof callee.value === 'object') {
      const func = callee.value as MSLFunction;
      
      if (func.implementation) {
        if (func.async) {
          return func.implementation(...evaluatedArgs) as Promise<MSLValue>;
        }
        return func.implementation(...evaluatedArgs) as MSLValue;
      }
    }
    
    throw new Error(`Cannot call: ${callee.type}`);
  }
  
  /**
   * Exécuter une fonction synchrone
   */
  private async executeSyncFunction(
    func: MSLFunction,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    let result: MSLValue = { type: 'null', value: null };
    
    for (const statement of func.body) {
      result = await this.executeStatement(statement, context, executionId);
    }
    
    return result;
  }
  
  /**
   * Exécuter une fonction asynchrone
   */
  private async executeAsyncFunction(
    func: MSLFunction,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    return this.executeSyncFunction(func, context, executionId);
  }
  
  /**
   * Exécuter un accès à un membre
   */
  private async executeMemberExpression(
    expression: Expression,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const object = await this.executeExpression(expression.object as Expression, context, executionId);
    const property = expression.property as Expression;
    
    if (property.type === 'identifier') {
      const propName = property.identifierName as string;
      
      if (object.type === 'object') {
        const obj = object.value as Record<string, unknown>;
        return { type: this.getValueType(obj[propName]), value: obj[propName] };
      }
      
      if (object.type === 'module') {
        const mod = object.value as MSLModule;
        if (mod.exports[propName]) {
          return { type: this.getValueType(mod.exports[propName]), value: mod.exports[propName] };
        }
      }
    }
    
    throw new Error(`Cannot access member: ${property.type}`);
  }
  
  /**
   * Exécuter un accès par index
   */
  private async executeIndexExpression(
    expression: Expression,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const object = await this.executeExpression(expression.object as Expression, context, executionId);
    const index = await this.executeExpression(expression.index as Expression, context, executionId);
    
    if (object.type === 'array') {
      const arr = object.value as unknown[];
      const idx = index.value as number;
      return { type: this.getValueType(arr[idx]), value: arr[idx] };
    }
    
    if (object.type === 'object') {
      const obj = object.value as Record<string, unknown>;
      const key = String(index.value);
      return { type: this.getValueType(obj[key]), value: obj[key] };
    }
    
    throw new Error(`Cannot index: ${object.type}`);
  }
  
  /**
   * Exécuter une expression conditionnelle (ternaire)
   */
  private async executeConditionalExpression(
    expression: Expression,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const test = await this.executeExpression(expression.test as Expression, context, executionId);
    
    if (this.isTruthy(test)) {
      return this.executeExpression(expression.consequent as Expression, context, executionId);
    }
    
    return this.executeExpression(expression.alternate as Expression, context, executionId);
  }
  
  /**
   * Exécuter une expression logique
   */
  private async executeLogicalExpression(
    expression: Expression,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const left = await this.executeExpression(expression.left as Expression, context, executionId);
    const right = await this.executeExpression(expression.right as Expression, context, executionId);
    const operator = expression.operator as '&&' | '||';
    
    switch (operator) {
      case '&&':
        return { type: 'boolean', value: this.isTruthy(left) && this.isTruthy(right) };
      case '||':
        return { type: 'boolean', value: this.isTruthy(left) || this.isTruthy(right) };
      default:
        throw new Error(`Unknown logical operator: ${operator}`);
    }
  }
  
  /**
   * Exécuter une expression de comparaison
   */
  private async executeComparisonExpression(
    expression: Expression,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const left = await this.executeExpression(expression.left as Expression, context, executionId);
    const right = await this.executeExpression(expression.right as Expression, context, executionId);
    const operator = expression.operator as '==' | '!=' | '===' | '!==' | '<' | '>' | '<=' | '>=';
    
    switch (operator) {
      case '==':
        return { type: 'boolean', value: this.isEqual(left, right) };
      case '!=':
        return { type: 'boolean', value: !this.isEqual(left, right) };
      case '===':
        return { type: 'boolean', value: left.value === right.value && left.type === right.type };
      case '!==':
        return { type: 'boolean', value: !(left.value === right.value && left.type === right.type) };
      case '<':
        return { type: 'boolean', value: (left.value as number) < (right.value as number) };
      case '>':
        return { type: 'boolean', value: (left.value as number) > (right.value as number) };
      case '<=':
        return { type: 'boolean', value: (left.value as number) <= (right.value as number) };
      case '>=':
        return { type: 'boolean', value: (left.value as number) >= (right.value as number) };
      default:
        throw new Error(`Unknown comparison operator: ${operator}`);
    }
  }
  
  /**
   * Exécuter une expression arithmétique
   */
  private async executeArithmeticExpression(
    expression: Expression,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const left = await this.executeExpression(expression.left as Expression, context, executionId);
    const right = await this.executeExpression(expression.right as Expression, context, executionId);
    const operator = expression.operator as '+' | '-' | '*' | '/' | '%' | '**' | '//';
    
    switch (operator) {
      case '+':
        return { type: 'number', value: (left.value as number) + (right.value as number) };
      case '-':
        return { type: 'number', value: (left.value as number) - (right.value as number) };
      case '*':
        return { type: 'number', value: (left.value as number) * (right.value as number) };
      case '/':
        return { type: 'number', value: (left.value as number) / (right.value as number) };
      case '%':
        return { type: 'number', value: (left.value as number) % (right.value as number) };
      case '**':
        return { type: 'number', value: Math.pow(left.value as number, right.value as number) };
      case '//':
        return { type: 'number', value: Math.floor((left.value as number) / (right.value as number)) };
      default:
        throw new Error(`Unknown arithmetic operator: ${operator}`);
    }
  }
  
  /**
   * Exécuter une expression bitwise
   */
  private async executeBitwiseExpression(
    expression: Expression,
    context: ExecutionContext,
    executionId: string
  ): Promise<MSLValue> {
    const left = await this.executeExpression(expression.left as Expression, context, executionId);
    const right = await this.executeExpression(expression.right as Expression, context, executionId);
    const operator = expression.operator as '&' | '|' | '^' | '<<' | '>>' | '>>>';
    
    switch (operator) {
      case '&':
        return { type: 'number', value: (left.value as number) & (right.value as number) };
      case '|':
        return { type: 'number', value: (left.value as number) | (right.value as number) };
      case '^':
        return { type: 'number', value: (left.value as number) ^ (right.value as number) };
      case '<<':
        return { type: 'number', value: (left.value as number) << (right.value as number) };
      case '>>':
        return { type: 'number', value: (left.value as number) >> (right.value as number) };
      case '>>>':
        return { type: 'number', value: (left.value as number) >>> (right.value as number) };
      default:
        throw new Error(`Unknown bitwise operator: ${operator}`);
    }
  }
  
  /**
   * Vérifier les conditions d'exécution
   */
  private checkConditions(conditions: ExecutionCondition, context?: Partial<ExecutionContext>): boolean {
    // À implémenter
    return true;
  }
  
  /**
   * Arrêter un script
   */
  public stopScript(id: ScriptId): boolean {
    const script = this.scripts.get(id);
    if (script && script.status === 'running') {
      script.status = 'stopped';
      this.scripts.set(id, script);
      return true;
    }
    return false;
  }
  
  /**
   * Mettre en pause un script
   */
  public pauseScript(id: ScriptId): boolean {
    const script = this.scripts.get(id);
    if (script && script.status === 'running') {
      script.status = 'paused';
      this.scripts.set(id, script);
      return true;
    }
    return false;
  }
  
  /**
   * Reprendre un script
   */
  public resumeScript(id: ScriptId): boolean {
    const script = this.scripts.get(id);
    if (script && script.status === 'paused') {
      script.status = 'running';
      this.scripts.set(id, script);
      // Re-exécuter le script
      this.executeScript(id);
      return true;
    }
    return false;
  }
  
  /**
   * Émettre un événement
   */
  private emit(event: ExecutionEvent): void {
    const listeners = this.eventListeners.get(event.scriptId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in execution event callback:', error);
        }
      });
    }
    
    // Émettre à tous les listeners
    for (const [, callbackSet] of this.eventListeners) {
      if (callbackSet !== listeners) {
        callbackSet.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error('Error in execution event callback:', error);
          }
        });
      }
    }
  }
  
  /**
   * Écouter les événements
   */
  public onExecutionEvent(scriptId: ScriptId, callback: (event: ExecutionEvent) => void): void {
    if (!this.eventListeners.has(scriptId)) {
      this.eventListeners.set(scriptId, new Set());
    }
    this.eventListeners.get(scriptId)!.add(callback);
  }
  
  /**
   * Arrêter d'écouter les événements
   */
  public offExecutionEvent(scriptId: ScriptId, callback: (event: ExecutionEvent) => void): void {
    const listeners = this.eventListeners.get(scriptId);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  /**
   * Nettoyer
   */
  public cleanup(): void {
    this.scripts.clear();
    this.runningScripts.clear();
    this.eventListeners.clear();
    this.globalFunctions.clear();
    this.globalModules.clear();
  }
}

// ============ ERROR CLASSES ============

/**
 * Erreur de break
 */
class BreakError extends Error {
  constructor(public label?: string) {
    super(`Break${label ? ` ${label}` : ''}`);
  }
}

/**
 * Erreur de continue
 */
class ContinueError extends Error {
  constructor(public label?: string) {
    super(`Continue${label ? ` ${label}` : ''}`);
  }
}

/**
 * Erreur de return
 */
class ReturnError extends Error {
  constructor(public value: MSLValue) {
    super('Return');
  }
}

// ============ INSTANCE ============

/**
 * Instance singleton du gestionnaire de scripts
 */
export const mslScriptManager = new MSLScriptManager();

// ============ UTILITY FUNCTIONS ============

/**
 * Créer un script simple
 */
export function createSimpleScript(
  name: string,
  source: string,
  type: ScriptType = 'action'
): MSLScript {
  const id = `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    name,
    description: '',
    type,
    version: '1.0.0',
    category: 'custom',
    tags: [],
    source,
    executionMode: 'sync',
    globals: {},
    parameters: [],
    exports: [],
    status: 'loaded',
    enabled: true,
    priority: 5,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Exécuter un script simple
 */
export async function executeSimpleScript(
  source: string,
  context?: Partial<ExecutionContext>,
  params?: Record<string, MSLValue>
): Promise<ExecutionResult> {
  const script = createSimpleScript('unnamed', source);
  mslScriptManager.addScript(script);
  
  return mslScriptManager.executeScript(script.id, context, params);
}

/**
 * Valider et exécuter un script
 */
export async function validateAndExecute(
  source: string,
  context?: Partial<ExecutionContext>,
  params?: Record<string, MSLValue>
): Promise<ExecutionResult> {
  if (!validateMSL(source)) {
    return {
      success: false,
      error: 'Invalid script',
      duration: 0,
      stepsExecuted: 0,
      stepsFailed: 0,
      finalGlobals: {},
      timestamp: Date.now(),
    };
  }
  
  return executeSimpleScript(source, context, params);
}

// ============ EXPORT ============

export const mslEngineExports = {
  MSLScriptManager,
  mslScriptManager,
  createExecutionContext,
  createSimpleScript,
  executeSimpleScript,
  validateAndExecute,
  BreakError,
  ContinueError,
  ReturnError,
};
