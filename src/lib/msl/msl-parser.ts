/**
 * MorphOS Scripting Language (MSL) - Parser
 * 
 * Parser pour le langage de script MSL
 * Convertit le code source en AST (Abstract Syntax Tree)
 */

import type {
  Token,
  TokenType,
  ASTNode,
  Statement,
  Expression,
  Parameter,
  VariableDeclaration,
  ImportExportSpecifier,
  CatchClause,
  ClassProperty,
  SourceLocation,
  ParseResult,
  ParseError,
  ParseWarning,
  ParserOptions,
} from './msl-types';

// ============ TOKENIZER ============

/**
 * Tokenizer pour MSL
 * Convertit le code source en tokens
 */
export class MSLTokenizer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];
  
  constructor(source: string) {
    this.source = source;
  }
  
  /**
   * Tokenizer le code source
   */
  public tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;
    
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      
      // Sauter les espaces blancs
      if (this.isWhitespace(char)) {
        this.skipWhitespace();
        continue;
      }
      
      // Commentaires
      if (char === '/' && this.source[this.position + 1] === '/') {
        this.readSingleLineComment();
        continue;
      }
      
      if (char === '/' && this.source[this.position + 1] === '*') {
        this.readMultiLineComment();
        continue;
      }
      
      // Chaînes de caractères
      if (char === '"' || char === "'" || char === '`') {
        this.readString(char);
        continue;
      }
      
      // Nombres
      if (this.isDigit(char) || (char === '.' && this.isDigit(this.source[this.position + 1]))) {
        this.readNumber();
        continue;
      }
      
      // Identifiants et mots-clés
      if (this.isIdentifierStart(char)) {
        this.readIdentifier();
        continue;
      }
      
      // Opérateurs et ponctuation
      this.readOperatorOrPunctuation();
    }
    
    // Ajouter le token EOF
    this.tokens.push({
      type: 'eof',
      value: '',
      loc: { line: this.line, column: this.column, offset: this.position },
    });
    
    return this.tokens;
  }
  
  /**
   * Vérifier si un caractère est un espace blanc
   */
  private isWhitespace(char: string): boolean {
    return [' ', '\t', '\n', '\r', '\f', '\v'].includes(char);
  }
  
  /**
   * Sauter les espaces blancs
   */
  private skipWhitespace(): void {
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      
      if (char === '\n') {
        this.line++;
        this.column = 1;
      } else if (!this.isWhitespace(char)) {
        break;
      }
      
      this.position++;
      this.column++;
    }
  }
  
  /**
   * Lire un commentaire sur une ligne
   */
  private readSingleLineComment(): void {
    const start = this.position;
    
    this.position += 2;
    this.column += 2;
    
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      
      if (char === '\n') {
        this.position++;
        this.line++;
        this.column = 1;
        break;
      }
      
      this.position++;
      this.column++;
    }
    
    const value = this.source.slice(start, this.position);
    
    this.tokens.push({
      type: 'comment',
      value,
      loc: { line: this.line, column: this.column - value.length, offset: start },
    });
  }
  
  /**
   * Lire un commentaire multi-lignes
   */
  private readMultiLineComment(): void {
    const start = this.position;
    
    this.position += 2;
    this.column += 2;
    
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      
      if (char === '*' && this.source[this.position + 1] === '/') {
        this.position += 2;
        this.column += 2;
        break;
      }
      
      if (char === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      
      this.position++;
    }
    
    const value = this.source.slice(start, this.position);
    
    this.tokens.push({
      type: 'comment',
      value,
      loc: { line: this.line, column: this.column - (this.position - start), offset: start },
    });
  }
  
  /**
   * Lire une chaîne de caractères
   */
  private readString(quote: string): void {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    
    this.position++;
    this.column++;
    
    let value = '';
    
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      
      if (char === quote) {
        this.position++;
        this.column++;
        break;
      }
      
      if (char === '\\') {
        this.position++;
        this.column++;
        
        if (this.position < this.source.length) {
          const nextChar = this.source[this.position];
          value += this.getEscapeSequence(nextChar);
          this.position++;
          this.column++;
        }
        continue;
      }
      
      if (char === '\n') {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
      
      value += char;
      this.position++;
    }
    
    this.tokens.push({
      type: 'string',
      value: quote + value + quote,
      loc: { line: startLine, column: startColumn, offset: start },
    });
  }
  
  /**
   * Obtenir la séquence d'échappement
   */
  private getEscapeSequence(char: string): string {
    const escapeMap: Record<string, string> = {
      'n': '\n',
      'r': '\r',
      't': '\t',
      'b': '\b',
      'f': '\f',
      'v': '\v',
      '\\': '\\',
      '"': '"',
      "'": "'",
      '`': '`',
    };
    
    return escapeMap[char] || char;
  }
  
  /**
   * Vérifier si un caractère est un chiffre
   */
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }
  
  /**
   * Lire un nombre
   */
  private readNumber(): void {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    
    let isFloat = false;
    let isExponential = false;
    
    // Lire la partie entière
    while (this.position < this.source.length && this.isDigit(this.source[this.position])) {
      this.position++;
      this.column++;
    }
    
    // Lire la partie décimale
    if (this.position < this.source.length && this.source[this.position] === '.') {
      isFloat = true;
      this.position++;
      this.column++;
      
      while (this.position < this.source.length && this.isDigit(this.source[this.position])) {
        this.position++;
        this.column++;
      }
    }
    
    // Lire la partie exponentielle
    if (this.position < this.source.length && (this.source[this.position] === 'e' || this.source[this.position] === 'E')) {
      isExponential = true;
      this.position++;
      this.column++;
      
      if (this.position < this.source.length && (this.source[this.position] === '+' || this.source[this.position] === '-')) {
        this.position++;
        this.column++;
      }
      
      while (this.position < this.source.length && this.isDigit(this.source[this.position])) {
        this.position++;
        this.column++;
      }
    }
    
    const value = this.source.slice(start, this.position);
    
    this.tokens.push({
      type: 'number',
      value,
      loc: { line: startLine, column: startColumn, offset: start },
    });
  }
  
  /**
   * Vérifier si un caractère peut commencer un identifiant
   */
  private isIdentifierStart(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_' || char === '$';
  }
  
  /**
   * Vérifier si un caractère peut faire partie d'un identifiant
   */
  private isIdentifierPart(char: string): boolean {
    return this.isIdentifierStart(char) || this.isDigit(char);
  }
  
  /**
   * Lire un identifiant ou un mot-clé
   */
  private readIdentifier(): void {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    
    while (this.position < this.source.length && this.isIdentifierPart(this.source[this.position])) {
      this.position++;
      this.column++;
    }
    
    const value = this.source.slice(start, this.position);
    
    // Vérifier si c'est un mot-clé
    const keywordType = this.getKeywordType(value);
    
    this.tokens.push({
      type: keywordType || 'identifier',
      value,
      loc: { line: startLine, column: startColumn, offset: start },
    });
  }
  
  /**
   * Obtenir le type de token pour un mot-clé
   */
  private getKeywordType(value: string): TokenType | null {
    const keywords: Record<string, TokenType> = {
      // Littéraux
      'true': 'boolean',
      'false': 'boolean',
      'null': 'null',
      'undefined': 'null',
      
      // Opérateurs
      'new': 'operator',
      'delete': 'operator',
      'typeof': 'operator',
      'instanceof': 'operator',
      'void': 'operator',
      'await': 'operator',
      'yield': 'operator',
      
      // Déclarations
      'const': 'keyword',
      'let': 'keyword',
      'var': 'keyword',
      'function': 'keyword',
      'class': 'keyword',
      
      // Fonctions
      'return': 'keyword',
      'throw': 'keyword',
      
      // Contrôle de flux
      'if': 'keyword',
      'else': 'keyword',
      'switch': 'keyword',
      'case': 'keyword',
      'default': 'keyword',
      'for': 'keyword',
      'while': 'keyword',
      'do': 'keyword',
      'break': 'keyword',
      'continue': 'keyword',
      
      // Try/Catch
      'try': 'keyword',
      'catch': 'keyword',
      'finally': 'keyword',
      
      // Import/Export
      'import': 'keyword',
      'export': 'keyword',
      'from': 'keyword',
      'as': 'keyword',
      
      // Autres
      'with': 'keyword',
      'debugger': 'keyword',
    };
    
    return keywords[value] || null;
  }
  
  /**
   * Lire un opérateur ou une ponctuation
   */
  private readOperatorOrPunctuation(): void {
    const start = this.position;
    const startLine = this.line;
    const startColumn = this.column;
    
    // Opérateurs multi-caractères
    const multiCharOperators = ['==', '!=', '===', '!==', '<=', '>=', '<<', '>>', '>>>', '&&', '||', '??', '?.', '**', '//', '=>', '...'];
    
    let matched = false;
    
    for (const op of multiCharOperators) {
      if (this.source.slice(this.position, this.position + op.length) === op) {
        this.position += op.length;
        this.column += op.length;
        
        this.tokens.push({
          type: 'operator',
          value: op,
          loc: { line: startLine, column: startColumn, offset: start },
        });
        
        matched = true;
        break;
      }
    }
    
    if (matched) return;
    
    // Opérateurs et ponctuation simple
    const singleCharTokens: Record<string, TokenType> = {
      '+': 'operator',
      '-': 'operator',
      '*': 'operator',
      '/': 'operator',
      '%': 'operator',
      '^': 'operator',
      '&': 'operator',
      '|': 'operator',
      '~': 'operator',
      '!': 'operator',
      '=': 'operator',
      '<': 'operator',
      '>': 'operator',
      '?': 'operator',
      ':': 'punctuation',
      ';': 'punctuation',
      ',': 'punctuation',
      '.': 'punctuation',
      '(': 'punctuation',
      ')': 'punctuation',
      '[': 'punctuation',
      ']': 'punctuation',
      '{': 'punctuation',
      '}': 'punctuation',
    };
    
    const char = this.source[this.position];
    const tokenType = singleCharTokens[char];
    
    if (tokenType) {
      this.position++;
      this.column++;
      
      this.tokens.push({
        type: tokenType,
        value: char,
        loc: { line: startLine, column: startColumn, offset: start },
      });
    } else {
      // Caractère inconnu, on le saute
      this.position++;
      this.column++;
    }
  }
  
  /**
   * Obtenir les tokens
   */
  public getTokens(): Token[] {
    return this.tokens;
  }
}

// ============ PARSER ============

/**
 * Parser pour MSL
 * Convertit les tokens en AST
 */
export class MSLParser {
  private tokens: Token[];
  private position: number = 0;
  private errors: ParseError[] = [];
  private warnings: ParseWarning[] = [];
  
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }
  
  /**
   * Parser les tokens en AST
   */
  public parse(): ASTNode {
    this.position = 0;
    this.errors = [];
    this.warnings = [];
    
    const statements: Statement[] = [];
    
    while (!this.isAtEnd()) {
      const statement = this.parseStatement();
      if (statement) {
        statements.push(statement as Statement);
      }
    }
    
    return {
      type: 'Program',
      children: statements,
      loc: this.getCurrentLocation(),
    };
  }
  
  /**
   * Vérifier si on est à la fin
   */
  private isAtEnd(): boolean {
    return this.position >= this.tokens.length || this.tokens[this.position].type === 'eof';
  }
  
  /**
   * Obtenir la position actuelle
   */
  private getCurrentLocation(): SourceLocation {
    const token = this.tokens[this.position] || this.tokens[this.tokens.length - 1];
    return token.loc || { line: 0, column: 0, offset: 0 };
  }
  
  /**
   * Obtenir le token actuel
   */
  private current(): Token {
    return this.tokens[this.position];
  }
  
  /**
   * Obtenir le token suivant
   */
  private next(): Token {
    if (this.position + 1 >= this.tokens.length) {
      return { type: 'eof', value: '', loc: { line: 0, column: 0, offset: 0 } };
    }
    return this.tokens[this.position + 1];
  }
  
  /**
   * Avancer au token suivant
   */
  private advance(): Token {
    const token = this.current();
    this.position++;
    return token;
  }
  
  /**
   * Vérifier si le token actuel correspond
   */
  private match(type: TokenType): boolean {
    return this.current().type === type;
  }
  
  /**
   * Vérifier si le token actuel correspond à une valeur
   */
  private matchValue(value: string): boolean {
    return this.current().value === value;
  }
  
  /**
   * Consommer le token actuel s'il correspond
   */
  private consume(type: TokenType): boolean {
    if (this.match(type)) {
      this.advance();
      return true;
    }
    return false;
  }
  
  /**
   * Consommer le token actuel s'il correspond à une valeur
   */
  private consumeValue(value: string): boolean {
    if (this.matchValue(value)) {
      this.advance();
      return true;
    }
    return false;
  }
  
  /**
   * Attendre un token
   */
  private expect(type: TokenType, message: string): Token {
    if (this.match(type)) {
      return this.advance();
    }
    
    this.errors.push({
      message: `Expected ${type}, got ${this.current().type}`,
      loc: this.current().loc,
      severity: 'error',
    });
    
    return this.advance();
  }
  
  /**
   * Attendre une valeur
   */
  private expectValue(value: string, message: string): Token {
    if (this.matchValue(value)) {
      return this.advance();
    }
    
    this.errors.push({
      message: `Expected '${value}', got '${this.current().value}'`,
      loc: this.current().loc,
      severity: 'error',
    });
    
    return this.advance();
  }
  
  /**
   * Parser un statement
   */
  private parseStatement(): Statement | null {
    switch (this.current().type) {
      case 'keyword':
        switch (this.current().value) {
          case 'const':
          case 'let':
          case 'var':
            return this.parseVariableDeclaration();
          case 'function':
            return this.parseFunctionDeclaration();
          case 'if':
            return this.parseIfStatement();
          case 'switch':
            return this.parseSwitchStatement();
          case 'for':
            return this.parseForStatement();
          case 'while':
            return this.parseWhileStatement();
          case 'do':
            return this.parseDoWhileStatement();
          case 'return':
            return this.parseReturnStatement();
          case 'throw':
            return this.parseThrowStatement();
          case 'try':
            return this.parseTryStatement();
          case 'break':
            return this.parseBreakStatement();
          case 'continue':
            return this.parseContinueStatement();
          case 'class':
            return this.parseClassDeclaration();
          case 'import':
            return this.parseImportDeclaration();
          case 'export':
            return this.parseExportDeclaration();
          case 'with':
            return this.parseWithStatement();
          case 'debugger':
            return this.parseDebuggerStatement();
          default:
            return this.parseExpressionStatement();
        }
      case 'identifier':
        // Vérifier si c'est une déclaration de fonction
        if (this.next().value === '(') {
          return this.parseFunctionDeclaration();
        }
        return this.parseExpressionStatement();
      case '{':
        return this.parseBlockStatement();
      case ';':
        this.advance();
        return { type: 'block', children: [], loc: this.getCurrentLocation() };
      default:
        return this.parseExpressionStatement();
    }
  }
  
  /**
   * Parser une déclaration de variable
   */
  private parseVariableDeclaration(): Statement {
    const kind = this.current().value as 'const' | 'let' | 'var';
    this.advance();
    
    const declarations: VariableDeclaration[] = [];
    
    do {
      const name = this.expect('identifier', 'Expected identifier').value;
      let init: Expression | undefined;
      
      if (this.consumeValue('=')) {
        init = this.parseExpression();
      }
      
      declarations.push({ kind, name, init, loc: this.getCurrentLocation() });
    } while (this.consumeValue(','));
    
    this.expect('punctuation', 'Expected semicolon');
    
    return {
      type: kind,
      declarations,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser une déclaration de fonction
   */
  private parseFunctionDeclaration(): Statement {
    const isAsync = this.consumeValue('async');
    const isGenerator = this.consumeValue('*');
    
    this.expectValue('function', 'Expected function keyword');
    
    const name = this.match('identifier') ? this.advance().value : '';
    
    this.expect('punctuation', 'Expected opening parenthesis');
    
    const params: Parameter[] = [];
    
    if (!this.matchValue(')')) {
      do {
        const paramName = this.expect('identifier', 'Expected parameter name').value;
        
        let type: string | undefined;
        if (this.consumeValue(':')) {
          type = this.expect('identifier', 'Expected type').value;
        }
        
        let defaultValue: Expression | undefined;
        if (this.consumeValue('=')) {
          defaultValue = this.parseExpression();
        }
        
        params.push({ name: paramName, type, default: defaultValue, loc: this.getCurrentLocation() });
      } while (this.consumeValue(','));
    }
    
    this.expectValue(')', 'Expected closing parenthesis');
    
    const body = this.parseBlockStatement();
    
    return {
      type: 'function',
      name,
      params,
      async: isAsync,
      generator: isGenerator,
      body: body.children as Statement[],
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un if statement
   */
  private parseIfStatement(): Statement {
    this.expectValue('if', 'Expected if keyword');
    
    this.expect('punctuation', 'Expected opening parenthesis');
    const test = this.parseExpression();
    this.expect('punctuation', 'Expected closing parenthesis');
    
    const consequent = this.parseStatement();
    let alternate: Statement | undefined;
    
    if (this.consumeValue('else')) {
      alternate = this.parseStatement();
    }
    
    return {
      type: 'if',
      test,
      consequent,
      alternate,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un switch statement
   */
  private parseSwitchStatement(): Statement {
    this.expectValue('switch', 'Expected switch keyword');
    
    this.expect('punctuation', 'Expected opening parenthesis');
    const discriminant = this.parseExpression();
    this.expect('punctuation', 'Expected closing parenthesis');
    
    this.expect('punctuation', 'Expected opening brace');
    
    const cases: Statement[] = [];
    
    while (!this.matchValue('}')) {
      if (this.consumeValue('case')) {
        const test = this.parseExpression();
        this.expect('punctuation', 'Expected colon');
        
        const consequent: Statement[] = [];
        while (!this.matchValue('}') && !this.matchValue('case') && !this.matchValue('default')) {
          const statement = this.parseStatement();
          if (statement) {
            consequent.push(statement);
          }
        }
        
        cases.push({
          type: 'case',
          test,
          consequent,
          loc: this.getCurrentLocation(),
        } as Statement);
      } else if (this.consumeValue('default')) {
        this.expect('punctuation', 'Expected colon');
        
        const consequent: Statement[] = [];
        while (!this.matchValue('}')) {
          const statement = this.parseStatement();
          if (statement) {
            consequent.push(statement);
          }
        }
        
        cases.push({
          type: 'default',
          consequent,
          loc: this.getCurrentLocation(),
        } as Statement);
      }
    }
    
    this.expectValue('}', 'Expected closing brace');
    
    return {
      type: 'switch',
      discriminant,
      cases,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un for statement
   */
  private parseForStatement(): Statement {
    this.expectValue('for', 'Expected for keyword');
    
    this.expect('punctuation', 'Expected opening parenthesis');
    
    let init: Statement | Expression | undefined;
    
    if (this.matchValue(';')) {
      this.advance();
    } else if (this.match('keyword') && ['const', 'let', 'var'].includes(this.current().value)) {
      init = this.parseVariableDeclaration();
    } else {
      init = this.parseExpression();
      this.expectValue(';', 'Expected semicolon');
    }
    
    let test: Expression | undefined;
    if (!this.matchValue(';')) {
      test = this.parseExpression();
      this.expectValue(';', 'Expected semicolon');
    }
    
    let update: Expression | undefined;
    if (!this.matchValue(')')) {
      update = this.parseExpression();
    }
    
    this.expectValue(')', 'Expected closing parenthesis');
    
    const body = this.parseStatement();
    
    return {
      type: 'for',
      init,
      test,
      update,
      body,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un while statement
   */
  private parseWhileStatement(): Statement {
    this.expectValue('while', 'Expected while keyword');
    
    this.expect('punctuation', 'Expected opening parenthesis');
    const test = this.parseExpression();
    this.expect('punctuation', 'Expected closing parenthesis');
    
    const body = this.parseStatement();
    
    return {
      type: 'while',
      test,
      body,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un do-while statement
   */
  private parseDoWhileStatement(): Statement {
    this.expectValue('do', 'Expected do keyword');
    
    const body = this.parseStatement();
    
    this.expectValue('while', 'Expected while keyword');
    this.expect('punctuation', 'Expected opening parenthesis');
    const test = this.parseExpression();
    this.expect('punctuation', 'Expected closing parenthesis');
    this.expectValue(';', 'Expected semicolon');
    
    return {
      type: 'do while',
      test,
      body,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un return statement
   */
  private parseReturnStatement(): Statement {
    this.expectValue('return', 'Expected return keyword');
    
    let argument: Expression | undefined;
    if (!this.matchValue(';') && !this.match('punctuation')) {
      argument = this.parseExpression();
    }
    
    if (this.match('punctuation')) {
      this.advance();
    }
    
    return {
      type: 'return',
      argument,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un throw statement
   */
  private parseThrowStatement(): Statement {
    this.expectValue('throw', 'Expected throw keyword');
    
    const argument = this.parseExpression();
    this.expectValue(';', 'Expected semicolon');
    
    return {
      type: 'throw',
      argument,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un try statement
   */
  private parseTryStatement(): Statement {
    this.expectValue('try', 'Expected try keyword');
    
    const block = this.parseBlockStatement();
    
    let handler: CatchClause | undefined;
    if (this.consumeValue('catch')) {
      this.expect('punctuation', 'Expected opening parenthesis');
      
      const paramName = this.match('identifier') ? this.advance().value : '';
      
      this.expect('punctuation', 'Expected closing parenthesis');
      
      const catchBlock = this.parseBlockStatement();
      
      handler = {
        param: { name: paramName, loc: this.getCurrentLocation() },
        body: catchBlock.children as Statement[],
        loc: this.getCurrentLocation(),
      };
    }
    
    let finalizer: Statement | undefined;
    if (this.consumeValue('finally')) {
      finalizer = this.parseBlockStatement();
    }
    
    return {
      type: 'try',
      block,
      handler,
      finalizer,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un break statement
   */
  private parseBreakStatement(): Statement {
    this.expectValue('break', 'Expected break keyword');
    
    let label: string | undefined;
    if (this.match('identifier')) {
      label = this.advance().value;
    }
    
    this.expectValue(';', 'Expected semicolon');
    
    return {
      type: 'break',
      label,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un continue statement
   */
  private parseContinueStatement(): Statement {
    this.expectValue('continue', 'Expected continue keyword');
    
    let label: string | undefined;
    if (this.match('identifier')) {
      label = this.advance().value;
    }
    
    this.expectValue(';', 'Expected semicolon');
    
    return {
      type: 'continue',
      label,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser une déclaration de classe
   */
  private parseClassDeclaration(): Statement {
    this.expectValue('class', 'Expected class keyword');
    
    const name = this.expect('identifier', 'Expected class name').value;
    
    let superClass: Expression | undefined;
    if (this.consumeValue('extends')) {
      superClass = this.parseExpression();
    }
    
    this.expect('punctuation', 'Expected opening brace');
    
    const properties: ClassProperty[] = [];
    
    while (!this.matchValue('}')) {
      const isStatic = this.consumeValue('static');
      const isPrivate = this.consumeValue('private');
      const isProtected = this.consumeValue('protected');
      
      if (this.consumeValue('get') || this.consumeValue('set')) {
        const type = this.current().value as 'getter' | 'setter';
        const name = this.expect('identifier', 'Expected property name').value;
        this.expect('punctuation', 'Expected opening parenthesis');
        this.expect('punctuation', 'Expected closing parenthesis');
        this.expect('punctuation', 'Expected opening brace');
        
        const body: Statement[] = [];
        while (!this.matchValue('}')) {
          const statement = this.parseStatement();
          if (statement) {
            body.push(statement);
          }
        }
        this.expectValue('}', 'Expected closing brace');
        
        properties.push({
          name,
          type,
          static: isStatic,
          private: isPrivate,
          protected: isProtected,
          loc: this.getCurrentLocation(),
        });
      } else if (this.match('identifier')) {
        const name = this.advance().value;
        
        if (this.consumeValue('(')) {
          // Méthode
          const params: Parameter[] = [];
          
          if (!this.matchValue(')')) {
            do {
              const paramName = this.expect('identifier', 'Expected parameter name').value;
              params.push({ name: paramName, loc: this.getCurrentLocation() });
            } while (this.consumeValue(','));
          }
          
          this.expectValue(')', 'Expected closing parenthesis');
          this.expect('punctuation', 'Expected opening brace');
          
          const body: Statement[] = [];
          while (!this.matchValue('}')) {
            const statement = this.parseStatement();
            if (statement) {
              body.push(statement);
            }
          }
          this.expectValue('}', 'Expected closing brace');
          
          properties.push({
            name,
            type: 'method',
            static: isStatic,
            private: isPrivate,
            protected: isProtected,
            value: body,
            loc: this.getCurrentLocation(),
          });
        } else {
          // Propriété
          let value: Expression | undefined;
          if (this.consumeValue('=')) {
            value = this.parseExpression();
          }
          
          this.expectValue(';', 'Expected semicolon');
          
          properties.push({
            name,
            type: 'property',
            static: isStatic,
            private: isPrivate,
            protected: isProtected,
            value,
            loc: this.getCurrentLocation(),
          });
        }
      }
    }
    
    this.expectValue('}', 'Expected closing brace');
    
    return {
      type: 'class',
      name,
      superClass,
      properties,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser une déclaration d'import
   */
  private parseImportDeclaration(): Statement {
    this.expectValue('import', 'Expected import keyword');
    
    const specifiers: ImportExportSpecifier[] = [];
    
    if (this.matchValue('{')) {
      this.advance();
      
      do {
        const local = this.expect('identifier', 'Expected identifier').value;
        
        let exported: string | undefined;
        if (this.consumeValue('as')) {
          exported = this.expect('identifier', 'Expected identifier').value;
        }
        
        specifiers.push({ local, exported, type: 'named' });
      } while (this.consumeValue(','));
      
      this.expectValue('}', 'Expected closing brace');
    } else if (this.match('identifier')) {
      const local = this.advance().value;
      
      if (this.consumeValue(',')) {
        // Import multiple
        specifiers.push({ local, type: 'namespace' });
        
        do {
          const nextLocal = this.expect('identifier', 'Expected identifier').value;
          specifiers.push({ local: nextLocal, type: 'namespace' });
        } while (this.consumeValue(','));
      } else {
        // Import default
        specifiers.push({ local, type: 'default' });
      }
    }
    
    if (this.consumeValue('from')) {
      const source = this.expect('string', 'Expected string').value;
      this.expectValue(';', 'Expected semicolon');
      
      return {
        type: 'import',
        specifiers,
        source: source.slice(1, -1), // Enlever les quotes
        loc: this.getCurrentLocation(),
      } as Statement;
    }
    
    // Import dynamique
    const source = this.expect('string', 'Expected string').value;
    this.expectValue(';', 'Expected semicolon');
    
    return {
      type: 'import',
      specifiers,
      source: source.slice(1, -1),
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser une déclaration d'export
   */
  private parseExportDeclaration(): Statement {
    this.expectValue('export', 'Expected export keyword');
    
    if (this.consumeValue('default')) {
      if (this.matchValue('function')) {
        const declaration = this.parseFunctionDeclaration();
        return {
          ...declaration,
          type: 'export',
          default: true,
          loc: this.getCurrentLocation(),
        } as Statement;
      }
      
      const expression = this.parseExpression();
      this.expectValue(';', 'Expected semicolon');
      
      return {
        type: 'export',
        expression,
        default: true,
        loc: this.getCurrentLocation(),
      } as Statement;
    }
    
    if (this.consumeValue('{')) {
      const specifiers: ImportExportSpecifier[] = [];
      
      do {
        const local = this.expect('identifier', 'Expected identifier').value;
        
        let exported: string | undefined;
        if (this.consumeValue('as')) {
          exported = this.expect('identifier', 'Expected identifier').value;
        }
        
        specifiers.push({ local, exported, type: 'named' });
      } while (this.consumeValue(','));
      
      this.expectValue('}', 'Expected closing brace');
      
      if (this.consumeValue('from')) {
        const source = this.expect('string', 'Expected string').value;
        this.expectValue(';', 'Expected semicolon');
        
        return {
          type: 'export',
          specifiers,
          source: source.slice(1, -1),
          loc: this.getCurrentLocation(),
        } as Statement;
      }
      
      this.expectValue(';', 'Expected semicolon');
      
      return {
        type: 'export',
        specifiers,
        loc: this.getCurrentLocation(),
      } as Statement;
    }
    
    // Export d'une déclaration
    const declaration = this.parseStatement();
    
    return {
      ...declaration,
      type: 'export',
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un with statement
   */
  private parseWithStatement(): Statement {
    this.expectValue('with', 'Expected with keyword');
    
    this.expect('punctuation', 'Expected opening parenthesis');
    const object = this.parseExpression();
    this.expect('punctuation', 'Expected closing parenthesis');
    
    const body = this.parseStatement();
    
    return {
      type: 'with',
      object,
      body,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un debugger statement
   */
  private parseDebuggerStatement(): Statement {
    this.expectValue('debugger', 'Expected debugger keyword');
    this.expectValue(';', 'Expected semicolon');
    
    return {
      type: 'debugger',
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser un block statement
   */
  private parseBlockStatement(): Statement {
    this.expect('punctuation', 'Expected opening brace');
    
    const body: Statement[] = [];
    
    while (!this.matchValue('}')) {
      const statement = this.parseStatement();
      if (statement) {
        body.push(statement);
      }
    }
    
    this.expectValue('}', 'Expected closing brace');
    
    return {
      type: 'block',
      children: body,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser une expression statement
   */
  private parseExpressionStatement(): Statement {
    const expression = this.parseExpression();
    
    if (this.match('punctuation')) {
      this.advance();
    }
    
    return {
      type: 'expression',
      expression,
      loc: this.getCurrentLocation(),
    } as Statement;
  }
  
  /**
   * Parser une expression
   */
  private parseExpression(): Expression {
    return this.parseTernaryExpression();
  }
  
  /**
   * Parser une expression ternaire
   */
  private parseTernaryExpression(): Expression {
    let left = this.parseLogicalOrExpression();
    
    while (this.consumeValue('?')) {
      const test = left;
      const consequent = this.parseExpression();
      this.expectValue(':', 'Expected colon');
      const alternate = this.parseExpression();
      
      left = {
        type: 'conditional',
        test,
        consequent,
        alternate,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return left;
  }
  
  /**
   * Parser une expression logique OR
   */
  private parseLogicalOrExpression(): Expression {
    let left = this.parseLogicalAndExpression();
    
    while (this.consumeValue('||')) {
      const operator = '||';
      const right = this.parseLogicalAndExpression();
      
      left = {
        type: 'logical',
        left,
        right,
        operator,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return left;
  }
  
  /**
   * Parser une expression logique AND
   */
  private parseLogicalAndExpression(): Expression {
    let left = this.parseBitwiseOrExpression();
    
    while (this.consumeValue('&&')) {
      const operator = '&&';
      const right = this.parseBitwiseOrExpression();
      
      left = {
        type: 'logical',
        left,
        right,
        operator,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return left;
  }
  
  /**
   * Parser une expression bitwise OR
   */
  private parseBitwiseOrExpression(): Expression {
    let left = this.parseBitwiseXorExpression();
    
    while (this.consumeValue('|')) {
      const operator = '|';
      const right = this.parseBitwiseXorExpression();
      
      left = {
        type: 'bitwise',
        left,
        right,
        operator,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return left;
  }
  
  /**
   * Parser une expression bitwise XOR
   */
  private parseBitwiseXorExpression(): Expression {
    let left = this.parseBitwiseAndExpression();
    
    while (this.consumeValue('^')) {
      const operator = '^';
      const right = this.parseBitwiseAndExpression();
      
      left = {
        type: 'bitwise',
        left,
        right,
        operator,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return left;
  }
  
  /**
   * Parser une expression bitwise AND
   */
  private parseBitwiseAndExpression(): Expression {
    let left = this.parseEqualityExpression();
    
    while (this.consumeValue('&')) {
      const operator = '&';
      const right = this.parseEqualityExpression();
      
      left = {
        type: 'bitwise',
        left,
        right,
        operator,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return left;
  }
  
  /**
   * Parser une expression d'égalité
   */
  private parseEqualityExpression(): Expression {
    let left = this.parseRelationalExpression();
    
    while (this.matchValue('==') || this.matchValue('!=') || this.matchValue('===') || this.matchValue('!==')) {
      const operator = this.advance().value as '==' | '!=' | '===' | '!==';
      const right = this.parseRelationalExpression();
      
      left = {
        type: 'comparison',
        left,
        right,
        operator,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return left;
  }
  
  /**
   * Parser une expression relationnelle
   */
  private parseRelationalExpression(): Expression {
    let left = this.parseShiftExpression();
    
    while (this.matchValue('<') || this.matchValue('>') || this.matchValue('<=') || this.matchValue('>=')) {
      const operator = this.advance().value as '<' | '>' | '<=' | '>=';
      const right = this.parseShiftExpression();
      
      left = {
        type: 'comparison',
        left,
        right,
        operator,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return left;
  }
  
  /**
   * Parser une expression de décalage
   */
  private parseShiftExpression(): Expression {
    let left = this.parseAdditiveExpression();
    
    while (this.matchValue('<<') || this.matchValue('>>') || this.matchValue('>>>')) {
      const operator = this.advance().value as '<<' | '>>' | '>>>';
      const right = this.parseAdditiveExpression();
      
      left = {
        type: 'bitwise',
        left,
        right,
        operator,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return left;
  }
  
  /**
   * Parser une expression additive
   */
  private parseAdditiveExpression(): Expression {
    let left = this.parseMultiplicativeExpression();
    
    while (this.matchValue('+') || this.matchValue('-')) {
      const operator = this.advance().value as '+' | '-';
      const right = this.parseMultiplicativeExpression();
      
      left = {
        type: 'binary',
        left,
        right,
        operator,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return left;
  }
  
  /**
   * Parser une expression multiplicative
   */
  private parseMultiplicativeExpression(): Expression {
    let left = this.parseExponentiationExpression();
    
    while (this.matchValue('*') || this.matchValue('/') || this.matchValue('%') || this.matchValue('//')) {
      const operator = this.advance().value as '*' | '/' | '%' | '//';
      const right = this.parseExponentiationExpression();
      
      left = {
        type: 'arithmetic',
        left,
        right,
        operator,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return left;
  }
  
  /**
   * Parser une expression d'exponentiation
   */
  private parseExponentiationExpression(): Expression {
    let left = this.parseUnaryExpression();
    
    while (this.consumeValue('**')) {
      const operator = '**';
      const right = this.parseUnaryExpression();
      
      left = {
        type: 'arithmetic',
        left,
        right,
        operator,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return left;
  }
  
  /**
   * Parser une expression unaire
   */
  private parseUnaryExpression(): Expression {
    if (this.matchValue('+') || this.matchValue('-') || this.matchValue('!') || this.matchValue('~') || this.matchValue('typeof') || this.matchValue('void') || this.matchValue('delete') || this.matchValue('await') || this.matchValue('yield')) {
      const operator = this.advance().value as UnaryOperator;
      const argument = this.parseUnaryExpression();
      
      return {
        type: 'unary',
        operator,
        argument,
        loc: this.getCurrentLocation(),
      } as Expression;
    }
    
    return this.parsePostfixExpression();
  }
  
  /**
   * Parser une expression postfixe
   */
  private parsePostfixExpression(): Expression {
    let left = this.parsePrimaryExpression();
    
    while (this.match('punctuation') && (this.current().value === '.' || this.current().value === '[' || this.current().value === '(')) {
      if (this.consumeValue('.')) {
        const property = this.expect('identifier', 'Expected property name').value;
        left = {
          type: 'member',
          object: left,
          property: { type: 'identifier', identifierName: property, loc: this.getCurrentLocation() } as Expression,
          computed: false,
          loc: this.getCurrentLocation(),
        } as Expression;
      } else if (this.consumeValue('[')) {
        const property = this.parseExpression();
        this.expectValue(']', 'Expected closing bracket');
        left = {
          type: 'index',
          object: left,
          index: property,
          loc: this.getCurrentLocation(),
        } as Expression;
      } else if (this.consumeValue('(')) {
        const args: Expression[] = [];
        
        if (!this.matchValue(')')) {
          do {
            args.push(this.parseExpression());
          } while (this.consumeValue(','));
        }
        
        this.expectValue(')', 'Expected closing parenthesis');
        
        left = {
          type: 'call',
          callee: left,
          arguments: args,
          loc: this.getCurrentLocation(),
        } as Expression;
      }
    }
    
    return left;
  }
  
  /**
   * Parser une expression primaire
   */
  private parsePrimaryExpression(): Expression {
    const token = this.current();
    
    switch (token.type) {
      case 'identifier':
        this.advance();
        return { type: 'identifier', identifierName: token.value, loc: token.loc } as Expression;
      
      case 'string':
        this.advance();
        return { type: 'literal', literalValue: token.value.slice(1, -1), loc: token.loc } as Expression;
      
      case 'number':
        this.advance();
        return { type: 'literal', literalValue: Number(token.value), loc: token.loc } as Expression;
      
      case 'boolean':
        this.advance();
        return { type: 'literal', literalValue: token.value === 'true', loc: token.loc } as Expression;
      
      case 'null':
        this.advance();
        return { type: 'literal', literalValue: null, loc: token.loc } as Expression;
      
      case 'keyword':
        if (token.value === 'this') {
          this.advance();
          return { type: 'identifier', identifierName: 'this', loc: token.loc } as Expression;
        }
        if (token.value === 'true' || token.value === 'false') {
          this.advance();
          return { type: 'literal', literalValue: token.value === 'true', loc: token.loc } as Expression;
        }
        if (token.value === 'null') {
          this.advance();
          return { type: 'literal', literalValue: null, loc: token.loc } as Expression;
        }
        // Fall through pour les autres mots-clés
      
      case 'operator':
        if (token.value === '[') {
          this.advance();
          const elements: Expression[] = [];
          
          if (!this.matchValue(']')) {
            do {
              elements.push(this.parseExpression());
            } while (this.consumeValue(','));
          }
          
          this.expectValue(']', 'Expected closing bracket');
          
          return { type: 'literal', literalValue: elements, loc: token.loc } as Expression;
        }
        if (token.value === '{') {
          this.advance();
          const properties: Record<string, Expression> = {};
          
          if (!this.matchValue('}')) {
            do {
              const key = this.expect('identifier', 'Expected property name').value;
              
              if (this.consumeValue(':')) {
                properties[key] = this.parseExpression();
              } else {
                properties[key] = { type: 'identifier', identifierName: key, loc: this.getCurrentLocation() } as Expression;
              }
            } while (this.consumeValue(','));
          }
          
          this.expectValue('}', 'Expected closing brace');
          
          return { type: 'literal', literalValue: properties, loc: token.loc } as Expression;
        }
        if (token.value === '(') {
          this.advance();
          const expression = this.parseExpression();
          this.expectValue(')', 'Expected closing parenthesis');
          return expression;
        }
        // Fall through
      
      case 'punctuation':
        if (token.value === '{') {
          this.advance();
          const properties: Record<string, Expression> = {};
          
          if (!this.matchValue('}')) {
            do {
              const key = this.expect('identifier', 'Expected property name').value;
              
              if (this.consumeValue(':')) {
                properties[key] = this.parseExpression();
              } else {
                properties[key] = { type: 'identifier', identifierName: key, loc: this.getCurrentLocation() } as Expression;
              }
            } while (this.consumeValue(','));
          }
          
          this.expectValue('}', 'Expected closing brace');
          
          return { type: 'literal', literalValue: properties, loc: token.loc } as Expression;
        }
        if (token.value === '[') {
          this.advance();
          const elements: Expression[] = [];
          
          if (!this.matchValue(']')) {
            do {
              elements.push(this.parseExpression());
            } while (this.consumeValue(','));
          }
          
          this.expectValue(']', 'Expected closing bracket');
          
          return { type: 'literal', literalValue: elements, loc: token.loc } as Expression;
        }
        // Fall through
      
      default:
        // Token inattendu, on le saute
        this.errors.push({
          message: `Unexpected token: ${token.type} (${token.value})`,
          loc: token.loc,
          severity: 'error',
        });
        this.advance();
        return { type: 'literal', literalValue: null, loc: token.loc } as Expression;
    }
  }
  
  /**
   * Obtenir les erreurs
   */
  public getErrors(): ParseError[] {
    return this.errors;
  }
  
  /**
   * Obtenir les avertissements
   */
  public getWarnings(): ParseWarning[] {
    return this.warnings;
  }
}

// ============ PARSER FUNCTIONS ============

/**
 * Parser du code MSL
 */
export function parseMSL(source: string, options?: ParserOptions): ParseResult {
  const startTime = Date.now();
  
  // Tokenizer
  const tokenizer = new MSLTokenizer(source);
  const tokens = tokenizer.tokenize();
  
  // Parser
  const parser = new MSLParser(tokens);
  const ast = parser.parse();
  
  const duration = Date.now() - startTime;
  
  return {
    success: parser.getErrors().length === 0,
    ast,
    tokens,
    errors: parser.getErrors(),
    warnings: parser.getWarnings(),
    duration,
  };
}

/**
 * Vérifier si le code est valide
 */
export function validateMSL(source: string): boolean {
  const result = parseMSL(source);
  return result.success;
}

/**
 * Obtenir les erreurs de parsing
 */
export function getParseErrors(source: string): ParseError[] {
  const result = parseMSL(source);
  return result.errors;
}

// ============ EXPORT ============

export const mslParserExports = {
  MSLTokenizer,
  MSLParser,
  parseMSL,
  validateMSL,
  getParseErrors,
};
