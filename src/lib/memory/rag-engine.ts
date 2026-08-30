"use client";

/**
 * RAG Engine (Retrieval-Augmented Generation)
 * 
 * Ce module implémente le système RAG pour MorphOS:
 * - Indexation des documents
 * - Recherche de contexte pertinent
 * - Génération augmentée avec le contexte
 * 
 * Utilise VectorDB pour le stockage et la recherche.
 */

import { getVectorDB, type DocumentId, type VectorDocument, type SearchResult, type SearchOptions } from "./vector-db";

// ============ TYPES ============

/** Type de source de connaissances */
export type KnowledgeSourceType = 
  | 'chat'       // Messages de chat
  | 'file'       // Fichiers
  | 'note'       // Notes
  | 'code'       // Code
  | 'web'        // Pages web
  | 'custom'     // Personnalisé
  | 'module';    // Données de module

/** Source de connaissances */
export interface KnowledgeSource {
  id: string;
  type: KnowledgeSourceType;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number; // 0 = haute priorité, 10 = basse priorité
  lastIndexed: number;
  documentCount: number;
}

/** Contexte pour la génération */
export interface RAGContext {
  /** Texte de la requête */
  query: string;
  
  /** Résultats de recherche */
  results: SearchResult[];
  
  /** Contexte formaté pour le prompt */
  formattedContext: string;
  
  /** Score de confiance moyen */
  confidenceScore: number;
  
  /** Sources utilisées */
  sources: KnowledgeSource[];
  
  /** Métadonnées */
  metadata: {
    searchTime: number;
    retrievalTime: number;
    totalTokens: number;
    [key: string]: unknown;
  };
}

/** Options de génération RAG */
export interface RAGOptions {
  /** Nombre de résultats à récupérer */
  topK?: number;
  
  /** Seuil de similarité minimum */
  minScore?: number;
  
  /** Types de sources à inclure */
  includeTypes?: KnowledgeSourceType[];
  
  /** Types de sources à exclure */
  excludeTypes?: KnowledgeSourceType[];
  
  /** Filtrer par source spécifique */
  sourceId?: string;
  
  /** Longueur maximale du contexte */
  maxContextLength?: number;
  
  /** Inclure les métadonnées dans le contexte */
  includeMetadata?: boolean;
  
  /** Modèle d'embedding à utiliser */
  embeddingModel?: string;
  
  /** Modèle de génération à utiliser */
  generationModel?: string;
}

/** Résultat de génération RAG */
export interface RAGResult {
  /** Réponse générée */
  response: string;
  
  /** Contexte utilisé */
  context: RAGContext;
  
  /** Succès */
  success: boolean;
  
  /** Erreur */
  error?: string;
  
  /** Métadonnées */
  metadata: {
    generationTime: number;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    [key: string]: unknown;
  };
}

// ============ RAG ENGINE ============

/**
 * Moteur RAG principal
 */
export class RAGEngine {
  private vectorDB = getVectorDB();
  private knowledgeSources: Map<string, KnowledgeSource> = new Map();
  private isInitialized = false;
  
  /**
   * Initialiser le moteur RAG
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    await this.vectorDB.init();
    
    // Charger les sources de connaissances par défaut
    this.loadDefaultSources();
    
    this.isInitialized = true;
  }
  
  /**
   * Charger les sources de connaissances par défaut
   */
  private loadDefaultSources(): void {
    const defaultSources: KnowledgeSource[] = [
      {
        id: 'chat-history',
        type: 'chat',
        name: 'Chat History',
        description: 'All chat messages from MorphOS',
        enabled: true,
        priority: 0,
        lastIndexed: Date.now(),
        documentCount: 0,
      },
      {
        id: 'files',
        type: 'file',
        name: 'Files',
        description: 'All files from the virtual file system',
        enabled: true,
        priority: 1,
        lastIndexed: Date.now(),
        documentCount: 0,
      },
      {
        id: 'notes',
        type: 'note',
        name: 'Notes',
        description: 'All user notes',
        enabled: true,
        priority: 2,
        lastIndexed: Date.now(),
        documentCount: 0,
      },
      {
        id: 'code',
        type: 'code',
        name: 'Code',
        description: 'All code snippets',
        enabled: true,
        priority: 3,
        lastIndexed: Date.now(),
        documentCount: 0,
      },
    ];
    
    for (const source of defaultSources) {
      this.knowledgeSources.set(source.id, source);
    }
  }
  
  /**
   * Ajouter une source de connaissances
   */
  addKnowledgeSource(source: Omit<KnowledgeSource, 'lastIndexed' | 'documentCount'>): string {
    const id = `ks-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const knowledgeSource: KnowledgeSource = {
      ...source,
      id,
      lastIndexed: Date.now(),
      documentCount: 0,
    };
    
    this.knowledgeSources.set(id, knowledgeSource);
    return id;
  }
  
  /**
   * Supprimer une source de connaissances
   */
  removeKnowledgeSource(id: string): boolean {
    return this.knowledgeSources.delete(id);
  }
  
  /**
   * Activer/désactiver une source
   */
  toggleKnowledgeSource(id: string, enabled: boolean): boolean {
    const source = this.knowledgeSources.get(id);
    if (!source) return false;
    
    source.enabled = enabled;
    this.knowledgeSources.set(id, source);
    return true;
  }
  
  /**
   * Obtenir une source
   */
  getKnowledgeSource(id: string): KnowledgeSource | undefined {
    return this.knowledgeSources.get(id);
  }
  
  /**
   * Obtenir toutes les sources
   */
  getAllKnowledgeSources(): KnowledgeSource[] {
    return Array.from(this.knowledgeSources.values());
  }
  
  /**
   * Obtenir les sources activées
   */
  getEnabledKnowledgeSources(): KnowledgeSource[] {
    return Array.from(this.knowledgeSources.values())
      .filter(s => s.enabled)
      .sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Indexer une source de connaissances
   */
  async indexKnowledgeSource(sourceId: string, documents: VectorDocument[]): Promise<boolean> {
    const source = this.knowledgeSources.get(sourceId);
    if (!source) return false;
    
    let indexedCount = 0;
    
    for (const doc of documents) {
      // Ajouter le document avec le type de la source
      const docWithType = { ...doc, type: source.type };
      const docId = await this.vectorDB.addDocument(docWithType);
      
      // Indexer le document (générer les embeddings)
      await this.vectorDB.indexDocument(docId);
      indexedCount++;
    }
    
    // Mettre à jour la source
    source.lastIndexed = Date.now();
    source.documentCount += indexedCount;
    this.knowledgeSources.set(sourceId, source);
    
    return true;
  }
  
  /**
   * Rechercher dans les connaissances
   */
  async retrieve(query: string, options?: RAGOptions): Promise<RAGContext> {
    const startTime = Date.now();
    
    // Préparer les options de recherche
    const searchOptions: SearchOptions = {
      limit: options?.topK || 10,
      minScore: options?.minScore || 0.3,
      type: options?.includeTypes?.[0], // Pour l'instant, on ne supporte qu'un type
    };
    
    // Effectuer la recherche
    const results = await this.vectorDB.search(query, searchOptions);
    
    // Formater le contexte
    const formattedContext = this.formatContext(results, options);
    
    // Calculer le score de confiance
    const confidenceScore = this.calculateConfidenceScore(results);
    
    // Obtenir les sources utilisées
    const sources = this.getSourcesFromResults(results);
    
    const retrievalTime = Date.now() - startTime;
    
    return {
      query,
      results,
      formattedContext,
      confidenceScore,
      sources,
      metadata: {
        searchTime: retrievalTime,
        retrievalTime,
        totalTokens: results.reduce((sum, r) => sum + (r.chunk.metadata.tokens || 0), 0),
      },
    };
  }
  
  /**
   * Formater le contexte pour le prompt
   */
  private formatContext(results: SearchResult[], options?: RAGOptions): string {
    const maxLength = options?.maxContextLength || 4000;
    let context = '';
    let currentLength = 0;
    
    for (const result of results) {
      const chunkText = result.chunk.text;
      const metadataText = options?.includeMetadata 
        ? ` [Source: ${result.document.type}, Score: ${result.score.toFixed(2)}]`
        : '';
      
      const formattedChunk = `[Chunk ${result.rank}]${metadataText}\n${chunkText}\n\n`;
      
      if (currentLength + formattedChunk.length <= maxLength) {
        context += formattedChunk;
        currentLength += formattedChunk.length;
      } else {
        // Tronquer le dernier chunk si nécessaire
        const remainingSpace = maxLength - currentLength;
        if (remainingSpace > 0) {
          context += formattedChunk.slice(0, remainingSpace);
        }
        break;
      }
    }
    
    return context.trim();
  }
  
  /**
   * Calculer le score de confiance
   */
  private calculateConfidenceScore(results: SearchResult[]): number {
    if (results.length === 0) return 0;
    
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    // Score de confiance basé sur le score moyen et le nombre de résultats
    return Math.min(1, avgScore * Math.min(1, results.length / 5));
  }
  
  /**
   * Obtenir les sources à partir des résultats
   */
  private getSourcesFromResults(results: SearchResult[]): KnowledgeSource[] {
    const sourceIds = new Set<string>();
    
    for (const result of results) {
      const source = this.knowledgeSources.get(result.document.id);
      if (source) {
        sourceIds.add(source.id);
      }
    }
    
    return Array.from(sourceIds.values())
      .map(id => this.knowledgeSources.get(id))
      .filter(Boolean) as KnowledgeSource[];
  }
  
  /**
   * Générer une réponse avec RAG
   */
  async generate(query: string, options?: RAGOptions): Promise<RAGResult> {
    const startTime = Date.now();
    
    try {
      // Récupérer le contexte
      const context = await this.retrieve(query, options);
      
      // Si pas de contexte, générer sans RAG
      if (context.results.length === 0) {
        return {
          response: '',
          context,
          success: false,
          error: 'No relevant context found',
          metadata: {
            generationTime: 0,
            totalTokens: 0,
            promptTokens: 0,
            completionTokens: 0,
          },
        };
      }
      
      // Construire le prompt
      const prompt = this.buildPrompt(query, context);
      
      // Appeler l'API IA (simulée pour l'instant)
      const response = await this.callAI(prompt, options);
      
      const generationTime = Date.now() - startTime;
      
      return {
        response,
        context,
        success: true,
        metadata: {
          generationTime,
          totalTokens: prompt.length / 4 + response.length / 4,
          promptTokens: prompt.length / 4,
          completionTokens: response.length / 4,
        },
      };
    } catch (error) {
      return {
        response: '',
        context: {
          query,
          results: [],
          formattedContext: '',
          confidenceScore: 0,
          sources: [],
          metadata: { searchTime: 0, retrievalTime: 0, totalTokens: 0 },
        },
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          generationTime: Date.now() - startTime,
          totalTokens: 0,
          promptTokens: 0,
          completionTokens: 0,
        },
      };
    }
  }
  
  /**
   * Construire le prompt pour l'AI
   */
  private buildPrompt(query: string, context: RAGContext): string {
    // Prompt système
    const systemPrompt = `You are a helpful AI assistant with access to additional context from MorphOS.
Use the provided context to answer the user's question as accurately as possible.
If the context doesn't contain relevant information, just answer based on your knowledge.
Always respond in the same language as the user's question.`;
    
    // Prompt utilisateur
    const userPrompt = `Context:
${context.formattedContext}

Question: ${query}

Please provide a detailed answer based on the context above.`;
    
    return `${systemPrompt}\n\n${userPrompt}`;
  }
  
  /**
   * Appeler l'API IA (simulée)
   */
  private async callAI(prompt: string, options?: RAGOptions): Promise<string> {
    // Dans une vraie implémentation, on appellerait l'API IA de MorphOS
    // Pour l'instant, on simule une réponse
    
    // Simuler un délai
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Générer une réponse simulée
    return `Based on the retrieved context, here is an answer to your question: "${prompt.slice(0, 100)}..."`;
  }
  
  /**
   * Ajouter un document à la base de connaissances
   */
  async addDocument(
    content: string,
    sourceId: string,
    metadata?: Record<string, unknown>
  ): Promise<DocumentId | null> {
    const source = this.knowledgeSources.get(sourceId);
    if (!source) return null;
    
    const vectorDocument: VectorDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `Document from ${source.name}`,
      content,
      type: source.type,
      source: sourceId,
      chunks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: metadata || {},
    };
    
    const docId = await this.vectorDB.addDocument(vectorDocument);
    await this.vectorDB.indexDocument(docId);
    
    // Mettre à jour le compteur de la source
    source.documentCount++;
    source.lastIndexed = Date.now();
    this.knowledgeSources.set(sourceId, source);
    
    return docId;
  }
  
  /**
   * Supprimer un document
   */
  async removeDocument(documentId: DocumentId): Promise<boolean> {
    return this.vectorDB.deleteDocument(documentId);
  }
  
  /**
   * Re-indexer toutes les sources
   */
  async reindexAll(): Promise<void> {
    const sources = this.getEnabledKnowledgeSources();
    
    for (const source of sources) {
      // Dans une vraie implémentation, on rechargerait les documents de la source
      // et on les ré-indexerait
      source.lastIndexed = Date.now();
      this.knowledgeSources.set(source.id, source);
    }
  }
  
  /**
   * Effacer toutes les données
   */
  async clear(): Promise<void> {
    await this.vectorDB.clear();
    this.knowledgeSources.clear();
    this.loadDefaultSources();
  }
  
  /**
   * Obtenir les statistiques
   */
  getStats(): {
    totalDocuments: number;
    totalChunks: number;
    totalSources: number;
    enabledSources: number;
    totalTokens: number;
    lastIndexed: number;
  } {
    const vectorStats = this.vectorDB.getStats();
    const sources = this.getAllKnowledgeSources();
    
    return {
      totalDocuments: vectorStats.totalDocuments,
      totalChunks: vectorStats.totalChunks,
      totalSources: sources.length,
      enabledSources: sources.filter(s => s.enabled).length,
      totalTokens: vectorStats.totalTokens,
      lastIndexed: Math.max(...sources.map(s => s.lastIndexed), 0),
    };
  }
}

// ============ SINGLETON ============

let ragEngineInstance: RAGEngine | null = null;

/**
 * Obtenir l'instance unique de RAGEngine
 */
export function getRAGEngine(): RAGEngine {
  if (ragEngineInstance) {
    return ragEngineInstance;
  }
  
  ragEngineInstance = new RAGEngine();
  return ragEngineInstance;
}

// ============ REACT HOOK ============

import { useEffect, useState } from "react";

/**
 * Hook pour utiliser RAGEngine dans les composants
 */
export function useRAGEngine() {
  const [engine, setEngine] = useState<RAGEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const ragEngine = getRAGEngine();
    ragEngine.init().then(() => {
      setEngine(ragEngine);
      setIsReady(true);
    });
  }, []);
  
  return { engine, isReady };
}

// ============ UTILITY FUNCTIONS ============

/**
 * Rechercher dans les connaissances
 */
export async function searchKnowledge(query: string, options?: RAGOptions): Promise<RAGContext> {
  const engine = getRAGEngine();
  await engine.init();
  return engine.retrieve(query, options);
}

/**
 * Générer une réponse avec RAG
 */
export async function generateWithRAG(query: string, options?: RAGOptions): Promise<RAGResult> {
  const engine = getRAGEngine();
  await engine.init();
  return engine.generate(query, options);
}

/**
 * Ajouter un document à la base de connaissances
 */
export async function addKnowledgeDocument(
  content: string,
  sourceId: string,
  metadata?: Record<string, unknown>
): Promise<DocumentId | null> {
  const engine = getRAGEngine();
  await engine.init();
  return engine.addDocument(content, sourceId, metadata);
}

// ============ EXPORTS ============

export type {
  KnowledgeSourceType,
  KnowledgeSource,
  RAGContext,
  RAGOptions,
  RAGResult,
};
