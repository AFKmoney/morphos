/**
 * MorphOS Scripting Language (MSL) - Types
 * 
 * Définition complète des types pour le langage de script MSL
 */

// ============ CORE TYPES ============

/** Identifiant unique d'un script */
export type ScriptId = string;

/** Type de script */
export type ScriptType = 
  | 'action'      // Script d'action simple
  | 'workflow'    // Script de workflow
  | 'function'    // Script de fonction réutilisable
  | 'event'       // Script déclenché par un événement
  | 'schedule'    // Script planifié
  | 'condition'   // Script conditionnel
  | 'loop'        // Script de boucle
  | 'module';     // Script de module

/** Statut d'un script */
export type ScriptStatus = 
  | 'idle'        // Inactif
  | 'loading'     // Chargement en cours
  | 'loaded'      // Chargé
  | 'running'     // En cours d'exécution
  | 'paused'      // En pause
  | 'stopped'     // Arrêté
  | 'error'       // Erreur
  | 'completed'   // Terminé
  | 'cancelled';  // Annulé

/** Mode d'exécution */
export type ExecutionMode = 
  | 'sync'        // Synchrone
  | 'async'       // Asynchrone
  | 'parallel'    // Parallèle
  | 'sequence'    // Séquentiel
  | 'background';  // En arrière-plan

// ============ SCRIPT STRUCTURE ============

/** Position dans le code source */
export interface SourceLocation {
  /** Ligne */
  line: number;
  
  /** Colonne */
  column: number;
  
  /** Offset */
  offset: number;
}

/** Nœud AST de base */
export interface ASTNode {
  /** Type de nœud */
  type: string;
  
  /** Valeur */
  value?: unknown;
  
  /** Enfants */
  children?: ASTNode[];
  
  /** Localisation */
  loc?: SourceLocation;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

/** Type de token */
export type TokenType = 
  | 'identifier'   // Identifiant
  | 'keyword'      // Mot-clé
  | 'string'       // Chaîne de caractères
  | 'number'       // Nombre
  | 'boolean'      // Booléen
  | 'null'         // Null
  | 'operator'     // Opérateur
  | 'punctuation'  // Ponctuation
  | 'comment'      // Commentaire
  | 'whitespace'   // Espace blanc
  | 'eof';         // Fin de fichier

/** Token */
export interface Token {
  /** Type */
  type: TokenType;
  
  /** Valeur */
  value: string;
  
  /** Localisation */
  loc: SourceLocation;
}

/** Type de valeur MSL */
export type MSLValueType = 
  | 'null'
  | 'undefined'
  | 'boolean'
  | 'number'
  | 'string'
  | 'array'
  | 'object'
  | 'function'
  | 'promise'
  | 'error'
  | 'module'
  | 'window';

/** Valeur MSL */
export interface MSLValue {
  /** Type */
  type: MSLValueType;
  
  /** Valeur */
  value: unknown;
  
  /** Référence (pour les objets) */
  reference?: string;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
}

// ============ EXPRESSIONS ============

/** Type d'expression */
export type ExpressionType = 
  | 'literal'          // Littéral
  | 'identifier'       // Identifiant
  | 'binary'           // Binaire
  | 'unary'            // Unaire
  | 'call'             // Appel de fonction
  | 'member'           // Accès à un membre
  | 'index'            // Accès par index
  | 'conditional'      // Conditionnel
  | 'logical'          // Logique
  | 'comparison'       // Comparaison
  | 'arithmetic'       // Arithmétique
  | 'bitwise'          // Binaire (bits)
  | 'typeof'           // Typeof
  | 'instanceof'       // Instanceof
  | 'new'              // Nouveau
  | 'delete'           // Suppression
  | 'void'             // Void
  | 'await'            // Await
  | 'yield'            // Yield
  | 'spread'           // Spread
  | 'rest'             // Rest
  | 'ternary';          // Ternaire

/** Opérateur binaire */
export type BinaryOperator = 
  | '+' | '-' | '*' | '/' | '%' | '**' | '//'
  | '==' | '!=' | '===' | '!=='
  | '<' | '>' | '<=' | '>='
  | '&&' | '||'
  | '<<' | '>>' | '>>>'
  | '&' | '|' | '^'
  | 'in' | 'instanceof'
  | '??' | '?.';

/** Opérateur unaire */
export type UnaryOperator = 
  | '+' | '-' | '!' | '~' | 'typeof' | 'void' | 'delete' | 'await' | 'yield';

/** Expression */
export interface Expression extends ASTNode {
  type: ExpressionType;
  
  // Pour les littéraux
  literalValue?: unknown;
  
  // Pour les identifiants
  identifierName?: string;
  
  // Pour les binaires
  left?: Expression;
  right?: Expression;
  operator?: BinaryOperator | UnaryOperator;
  
  // Pour les appels de fonction
  callee?: Expression;
  arguments?: Expression[];
  
  // Pour les accès aux membres
  object?: Expression;
  property?: Expression;
  computed?: boolean;
  
  // Pour les conditionnels
  test?: Expression;
  consequent?: Expression;
  alternate?: Expression;
}

// ============ STATEMENTS ============

/** Type de statement */
export type StatementType = 
  | 'expression'      // Expression
  | 'block'          // Bloc
  | 'if'             // Si
  | 'else'           // Sinon
  | 'else if'        // Sinon si
  | 'switch'         // Switch
  | 'case'           // Case
  | 'default'        // Default
  | 'for'            // Pour
  | 'while'          // Tant que
  | 'do while'       // Faire tant que
  | 'for in'         // Pour dans
  | 'for of'         // Pour de
  | 'break'          // Break
  | 'continue'       // Continue
  | 'return'         // Retour
  | 'throw'          // Lancer
  | 'try'            // Essayer
  | 'catch'          // Attraper
  | 'finally'        // Finalement
  | 'function'       // Fonction
  | 'arrow function' // Fonction fléchée
  | 'class'          // Classe
  | 'const'          // Constante
  | 'let'            // Variable
  | 'var'            // Variable (obsolète)
  | 'import'         // Import
  | 'export'         // Export
  | 'with'           // Avec (obsolète)
  | 'debugger';      // Debugger

/** Statement */
export interface Statement extends ASTNode {
  type: StatementType;
  
  // Pour les expressions
  expression?: Expression;
  
  // Pour les blocs
  body?: Statement[];
  
  // Pour les conditionnels
  test?: Expression;
  consequent?: Statement;
  alternate?: Statement;
  
  // Pour les boucles
  init?: Expression;
  condition?: Expression;
  update?: Expression;
  left?: Expression;
  right?: Expression;
  
  // Pour les déclarations de variables
  declarations?: VariableDeclaration[];
  
  // Pour les fonctions
  name?: string;
  params?: Parameter[];
  async?: boolean;
  generator?: boolean;
  
  // Pour les classes
  superClass?: Expression;
  properties?: ClassProperty[];
  
  // Pour les imports/exports
  specifiers?: ImportExportSpecifier[];
  source?: string;
  
  // Pour try/catch/finally
  handler?: CatchClause;
  finalizer?: Statement;
  
  // Pour throw
  argument?: Expression;
  
  // Pour return
  returnValue?: Expression;
}

/** Déclaration de variable */
export interface VariableDeclaration {
  /** Nom */
  name: string;
  
  /** Type (const, let, var) */
  kind: 'const' | 'let' | 'var';
  
  /** Valeur initiale */
  init?: Expression;
  
  /** Localisation */
  loc?: SourceLocation;
}

/** Paramètre */
export interface Parameter {
  /** Nom */
  name: string;
  
  /** Type */
  type?: string;
  
  /** Valeur par défaut */
  default?: Expression;
  
  /** Déstructuration */
  destructured?: boolean;
  
  /** Rest parameter */
  rest?: boolean;
  
  /** Localisation */
  loc?: SourceLocation;
}

/** Propriété de classe */
export interface ClassProperty {
  /** Nom */
  name: string;
  
  /** Type */
  type: 'method' | 'property' | 'getter' | 'setter';
  
  /** Valeur */
  value?: Expression | Statement[];
  
  /** Statique */
  static?: boolean;
  
  /** Privé */
  private?: boolean;
  
  /** Protégé */
  protected?: boolean;
  
  /** Localisation */
  loc?: SourceLocation;
}

/** Spécificateur d'import/export */
export interface ImportExportSpecifier {
  /** Nom local */
  local: string;
  
  /** Nom exporté */
  exported?: string;
  
  /** Type */
  type: 'default' | 'named' | 'namespace';
}

/** Clause catch */
export interface CatchClause {
  /** Paramètre */
  param?: Parameter;
  
  /** Corps */
  body: Statement[];
  
  /** Localisation */
  loc?: SourceLocation;
}

// ============ SCRIPT DEFINITION ============

/** Déclencheur de script */
export interface ScriptTrigger {
  /** Type de déclencheur */
  type: 'manual' | 'event' | 'schedule' | 'hotkey' | 'voice' | 'module' | 'window' | 'ai';
  
  /** Événement (pour type = event) */
  event?: string;
  
  /** Expression cron (pour type = schedule) */
  cron?: string;
  
  /** Date/heure (pour type = schedule) */
  datetime?: string | Date;
  
  /** Raccourci clavier (pour type = hotkey) */
  hotkey?: string;
  
  /** Commande vocale (pour type = voice) */
  voiceCommand?: string;
  
  /** Module (pour type = module) */
  module?: string;
  
  /** Fenêtre (pour type = window) */
  window?: string;
  
  /** Condition */
  condition?: Expression;
}

/** Condition d'exécution */
export interface ExecutionCondition {
  /** Module requis */
  requiredModule?: string;
  
  /** Fenêtre requise */
  requiredWindow?: string;
  
  /** Variables requises */
  requiredVariables?: string[];
  
  /** Heure requise */
  requiredTime?: string;
  
  /** Expression conditionnelle */
  expression?: string;
  
  /** Nécessite une confirmation */
  requireConfirmation?: boolean;
}

/** Dépendance de script */
export interface ScriptDependency {
  /** Nom */
  name: string;
  
  /** Version */
  version?: string;
  
  /** Type */
  type: 'module' | 'library' | 'script' | 'api';
  
  /** URL */
  url?: string;
  
  /** Obligatoire */
  required: boolean;
}

/** Script MSL */
export interface MSLScript {
  /** ID unique */
  id: ScriptId;
  
  /** Nom */
  name: string;
  
  /** Description */
  description: string;
  
  /** Type */
  type: ScriptType;
  
  /** Version */
  version: string;
  
  /** Auteur */
  author?: string;
  
  /** Catégorie */
  category?: string;
  
  /** Tags */
  tags?: string[];
  
  /** Code source */
  source: string;
  
  /** AST parsé */
  ast?: ASTNode;
  
  /** Tokens */
  tokens?: Token[];
  
  /** Déclencheurs */
  triggers?: ScriptTrigger[];
  
  /** Conditions d'exécution */
  conditions?: ExecutionCondition;
  
  /** Dépendances */
  dependencies?: ScriptDependency[];
  
  /** Mode d'exécution */
  executionMode: ExecutionMode;
  
  /** Variables globales */
  globals?: Record<string, MSLValue>;
  
  /** Paramètres */
  parameters?: Parameter[];
  
  /** Fonctions exportées */
  exports?: string[];
  
  /** Statut */
  status: ScriptStatus;
  
  /** Actif */
  enabled: boolean;
  
  /** Priorité */
  priority: number;
  
  /** Métadonnées */
  metadata?: Record<string, unknown>;
  
  /** Date de création */
  createdAt: number;
  
  /** Date de mise à jour */
  updatedAt: number;
  
  /** Date de dernière exécution */
  lastExecutedAt?: number;
  
  /** Durée de la dernière exécution */
  lastExecutionDuration?: number;
  
  /** Erreur de la dernière exécution */
  lastExecutionError?: string;
}

/** Script avec son contexte d'exécution */
export interface MSLScriptWithContext extends MSLScript {
  /** Contexte d'exécution */
  context: ExecutionContext;
}

// ============ EXECUTION ============

/** Contexte d'exécution */
export interface ExecutionContext {
  /** ID de l'exécution */
  executionId: string;
  
  /** ID du script */
  scriptId: ScriptId;
  
  /** Variables globales */
  globals: Record<string, MSLValue>;
  
  /** Variables locales */
  locals: Record<string, MSLValue>;
  
  /** Fonctions disponibles */
  functions: Record<string, MSLFunction>;
  
  /** Modules disponibles */
  modules: Record<string, MSLModule>;
  
  /** Fenêtre actuelle */
  currentWindow?: string;
  
  /** Module actuel */
  currentModule?: string;
  
  /** Utilisateur actuel */
  currentUser?: string;
  
  /** Fonctions MorphOS */
  morphos: MorphOSFunctions;
  
  /** Fonctions utilitaires */
  utils: UtilityFunctions;
}

/** Fonction MSL */
export interface MSLFunction {
  /** Nom */
  name: string;
  
  /** Type */
  type: 'function' | 'arrow' | 'method' | 'constructor';
  
  /** Paramètres */
  parameters: Parameter[];
  
  /** Corps */
  body: Statement[];
  
  /** Asynchrone */
  async: boolean;
  
  /** Générateur */
  generator: boolean;
  
  /** Contexte */
  context?: ExecutionContext;
}

/** Module MSL */
export interface MSLModule {
  /** Nom */
  name: string;
  
  /** Exports */
  exports: Record<string, MSLValue | MSLFunction>;
  
  /** Imports */
  imports: Record<string, string>;
  
  /** Chemin */
  path?: string;
}

/** Fonctions MorphOS disponibles */
export interface MorphOSFunctions {
  /** Gestion des fenêtres */
  windows: {
    create: (options: Record<string, unknown>) => Promise<string>;
    close: (windowId: string) => Promise<void>;
    get: (windowId: string) => Promise<Record<string, unknown>>;
    list: () => Promise<Record<string, unknown>[]>;
    focus: (windowId: string) => Promise<void>;
    minimize: (windowId: string) => Promise<void>;
    maximize: (windowId: string) => Promise<void>;
    restore: (windowId: string) => Promise<void>;
  };
  
  /** Gestion des modules */
  modules: {
    create: (moduleId: string, options: Record<string, unknown>) => Promise<string>;
    close: (moduleId: string) => Promise<void>;
    get: (moduleId: string) => Promise<Record<string, unknown>>;
    list: () => Promise<Record<string, unknown>[]>;
    action: (moduleId: string, action: string, params: Record<string, unknown>) => Promise<unknown>;
  };
  
  /** Gestion des workspaces */
  workspaces: {
    create: (name: string) => Promise<string>;
    save: (workspaceId: string) => Promise<void>;
    load: (workspaceId: string) => Promise<void>;
    delete: (workspaceId: string) => Promise<void>;
    list: () => Promise<string[]>;
  };
  
  /** Gestion des fichiers */
  files: {
    read: (path: string) => Promise<string>;
    write: (path: string, content: string) => Promise<void>;
    delete: (path: string) => Promise<void>;
    list: (path: string) => Promise<string[]>;
    exists: (path: string) => Promise<boolean>;
    mkdir: (path: string) => Promise<void>;
    rmdir: (path: string) => Promise<void>;
  };
  
  /** Appels IA */
  ai: {
    chat: (prompt: string, options?: Record<string, unknown>) => Promise<string>;
    generate: (prompt: string, options?: Record<string, unknown>) => Promise<string>;
    embed: (text: string, options?: Record<string, unknown>) => Promise<number[]>;
    analyze: (text: string, options?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  
  /** Notifications */
  notifications: {
    show: (options: { title: string; message: string; type?: string }) => void;
    toast: (message: string, options?: Record<string, unknown>) => void;
    alert: (message: string) => Promise<void>;
    confirm: (message: string) => Promise<boolean>;
  };
  
  /** Commandes vocales */
  voice: {
    speak: (text: string, options?: Record<string, unknown>) => Promise<void>;
    listen: (options?: Record<string, unknown>) => Promise<string>;
    stopListening: () => Promise<void>;
    isListening: () => boolean;
  };
  
  /** Intégrations externes */
  integrations: {
    call: (integrationId: string, action: string, params: Record<string, unknown>) => Promise<unknown>;
    trigger: (integrationId: string, event: string, data: unknown) => Promise<void>;
  };
  
  /** Système */
  system: {
    exit: () => Promise<void>;
    restart: () => Promise<void>;
    info: () => Promise<Record<string, unknown>>;
    config: () => Promise<Record<string, unknown>>;
  };
}

/** Fonctions utilitaires */
export interface UtilityFunctions {
  /** Log */
  log: (message: string, data?: unknown) => void;
  
  /** Erreur */
  error: (message: string, error?: Error) => void;
  
  /** Avertissement */
  warn: (message: string) => void;
  
  /** Attendre */
  wait: (ms: number) => Promise<void>;
  
  /** Délai */
  delay: (ms: number) => Promise<void>;
  
  /** Date actuelle */
  now: () => number;
  
  /** Générer un ID unique */
  uuid: () => string;
  
  /** Copier */
  copy: (value: unknown) => unknown;
  
  /** Cloner */
  clone: (value: unknown) => unknown;
  
  /** Fusionner */
  merge: (target: Record<string, unknown>, ...sources: Record<string, unknown>[]) => Record<string, unknown>;
  
  /** Tester */
  test: (condition: boolean, message?: string) => void;
  
  /** Assert */
  assert: (condition: boolean, message?: string) => void;
}

/** Résultat d'exécution */
export interface ExecutionResult {
  /** Succès */
  success: boolean;
  
  /** Résultat */
  result?: MSLValue;
  
  /** Erreur */
  error?: string;
  
  /** Durée (en ms) */
  duration: number;
  
  /** Steps exécutés */
  stepsExecuted: number;
  
  /** Steps échoués */
  stepsFailed: number;
  
  /** Variables finales */
  finalGlobals: Record<string, MSLValue>;
  
  /** Timestamp */
  timestamp: number;
}

/** Événement d'exécution */
export interface ExecutionEvent {
  /** Type */
  type: 'start' | 'step' | 'error' | 'warning' | 'log' | 'complete' | 'cancel';
  
  /** ID de l'exécution */
  executionId: string;
  
  /** ID du script */
  scriptId: ScriptId;
  
  /** Données */
  data?: unknown;
  
  /** Erreur */
  error?: string;
  
  /** Timestamp */
  timestamp: number;
}

// ============ PARSER ============

/** Options du parser */
export interface ParserOptions {
  /** Mode strict */
  strict?: boolean;
  
  /** Autoriser les expressions non standard */
  allowNonStandard?: boolean;
  
  /** Autoriser les imports dynamiques */
  allowDynamicImports?: boolean;
  
  /** Autoriser les exports dynamiques */
  allowDynamicExports?: boolean;
  
  /** Conserver les commentaires */
  preserveComments?: boolean;
  
  /** Conserver les espaces blancs */
  preserveWhitespace?: boolean;
}

/** Résultat du parsing */
export interface ParseResult {
  /** Succès */
  success: boolean;
  
  /** AST */
  ast?: ASTNode;
  
  /** Tokens */
  tokens?: Token[];
  
  /** Erreurs */
  errors: ParseError[];
  
  /** Avertissements */
  warnings: ParseWarning[];
  
  /** Durée (en ms) */
  duration: number;
}

/** Erreur de parsing */
export interface ParseError {
  /** Message */
  message: string;
  
  /** Localisation */
  loc: SourceLocation;
  
  /** Code */
  code?: string;
  
  /** Severity */
  severity: 'error' | 'warning';
}

/** Avertissement de parsing */
export interface ParseWarning {
  /** Message */
  message: string;
  
  /** Localisation */
  loc: SourceLocation;
  
  /** Code */
  code?: string;
}

// ============ COMPILER ============

/** Options du compilateur */
export interface CompilerOptions {
  /** Mode de compilation */
  mode: 'development' | 'production';
  
  /** Optimisation */
  optimize?: boolean;
  
  /** Minification */
  minify?: boolean;
  
  /** Source maps */
  sourceMaps?: boolean;
  
  /** Cible */
  target?: 'es5' | 'es6' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022';
  
  /** Modules */
  modules?: 'commonjs' | 'esm' | 'amd' | 'umd';
  
  /** Format de sortie */
  format?: 'iife' | 'cjs' | 'esm';
  
  /** Nom du bundle */
  bundleName?: string;
  
  /** Externals */
  externals?: string[];
}

/** Résultat de la compilation */
export interface CompileResult {
  /** Succès */
  success: boolean;
  
  /** Code compilé */
  code?: string;
  
  /** Source map */
  sourceMap?: string;
  
  /** Erreurs */
  errors: CompileError[];
  
  /** Avertissements */
  warnings: CompileWarning[];
  
  /** Durée (en ms) */
  duration: number;
}

/** Erreur de compilation */
export interface CompileError {
  /** Message */
  message: string;
  
  /** Localisation */
  loc?: SourceLocation;
  
  /** Code */
  code?: string;
  
  /** Severity */
  severity: 'error' | 'warning';
}

/** Avertissement de compilation */
export interface CompileWarning {
  /** Message */
  message: string;
  
  /** Localisation */
  loc?: SourceLocation;
  
  /** Code */
  code?: string;
}

// ============ BUILT-IN FUNCTIONS ============

/** Fonction built-in */
export interface BuiltInFunction {
  /** Nom */
  name: string;
  
  /** Description */
  description: string;
  
  /** Paramètres */
  parameters: Parameter[];
  
  /** Implémentation */
  implementation: (...args: MSLValue[]) => MSLValue | Promise<MSLValue>;
  
  /** Asynchrone */
  async: boolean;
}

/** Fonctions built-in par défaut */
export const BUILT_IN_FUNCTIONS: BuiltInFunction[] = [
  {
    name: 'log',
    description: 'Log a message to the console',
    parameters: [{ name: 'message', type: 'string' }, { name: 'data', type: 'any', default: { type: 'null', value: null } }],
    implementation: (message, data) => {
      console.log(message?.value, data?.value);
      return { type: 'null', value: null };
    },
    async: false,
  },
  {
    name: 'error',
    description: 'Log an error message to the console',
    parameters: [{ name: 'message', type: 'string' }],
    implementation: (message) => {
      console.error(message?.value);
      return { type: 'null', value: null };
    },
    async: false,
  },
  {
    name: 'warn',
    description: 'Log a warning message to the console',
    parameters: [{ name: 'message', type: 'string' }],
    implementation: (message) => {
      console.warn(message?.value);
      return { type: 'null', value: null };
    },
    async: false,
  },
  {
    name: 'wait',
    description: 'Wait for a specified time',
    parameters: [{ name: 'ms', type: 'number' }],
    implementation: async (ms) => {
      await new Promise(resolve => setTimeout(resolve, ms?.value as number || 0));
      return { type: 'null', value: null };
    },
    async: true,
  },
  {
    name: 'now',
    description: 'Get the current timestamp',
    parameters: [],
    implementation: () => {
      return { type: 'number', value: Date.now() };
    },
    async: false,
  },
  {
    name: 'uuid',
    description: 'Generate a unique ID',
    parameters: [],
    implementation: () => {
      return { type: 'string', value: `uuid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    },
    async: false,
  },
  {
    name: 'copy',
    description: 'Copy a value',
    parameters: [{ name: 'value', type: 'any' }],
    implementation: (value) => {
      return { ...value };
    },
    async: false,
  },
  {
    name: 'clone',
    description: 'Deep clone a value',
    parameters: [{ name: 'value', type: 'any' }],
    implementation: (value) => {
      return { type: value?.type || 'null', value: JSON.parse(JSON.stringify(value?.value)) };
    },
    async: false,
  },
  {
    name: 'merge',
    description: 'Merge multiple objects',
    parameters: [{ name: 'target', type: 'object' }, { name: 'sources', type: 'array', rest: true }],
    implementation: (target, ...sources) => {
      const result = { ...(target?.value as Record<string, unknown>) };
      for (const source of sources) {
        Object.assign(result, source?.value as Record<string, unknown>);
      }
      return { type: 'object', value: result };
    },
    async: false,
  },
];

// ============ EXPORT ============

export const MSLExports = {
  // Core Types
  ScriptId,
  ScriptType,
  ScriptStatus,
  ExecutionMode,
  
  // AST Types
  SourceLocation,
  ASTNode,
  TokenType,
  Token,
  MSLValueType,
  MSLValue,
  
  // Expression Types
  ExpressionType,
  BinaryOperator,
  UnaryOperator,
  Expression,
  
  // Statement Types
  StatementType,
  Statement,
  VariableDeclaration,
  Parameter,
  ClassProperty,
  ImportExportSpecifier,
  CatchClause,
  
  // Script Types
  ScriptTrigger,
  ExecutionCondition,
  ScriptDependency,
  MSLScript,
  MSLScriptWithContext,
  
  // Execution Types
  ExecutionContext,
  MSLFunction,
  MSLModule,
  MorphOSFunctions,
  UtilityFunctions,
  ExecutionResult,
  ExecutionEvent,
  
  // Parser Types
  ParserOptions,
  ParseResult,
  ParseError,
  ParseWarning,
  
  // Compiler Types
  CompilerOptions,
  CompileResult,
  CompileError,
  CompileWarning,
  
  // Built-in
  BuiltInFunction,
  BUILT_IN_FUNCTIONS,
};
