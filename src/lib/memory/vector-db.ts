"use client";

/**
 * Vector Database for RAG (Retrieval-Augmented Generation)
 * 
 * Ce module implémente une base de données vectorielle simple pour:
 * - Stocker des embeddings de texte
 * - Rechercher des documents similaires
 * - Gérer les chunks de texte
 * 
 * Utilise une implémentation locale avec IndexedDB pour le stockage.
 * Peut être étendu pour utiliser des services externes comme Pinecone, Weaviate, etc.
 */

import { useAiContextStore } from "@/lib/ai-context-store";

// ============ TYPES ============

/** Identifiant unique d'un document */
export type DocumentId = string;

/** Identifiant unique d'un chunk */
export type ChunkId = string;

/** Type de document */
export type DocumentType = 
  | 'chat'       // Message de chat
  | 'file'       // Fichier
  | 'note'       // Note
  | 'code'       // Code
  | 'web'        // Page web
  | 'custom';    // Personnalisé

/** Chunk de texte avec son embedding */
export interface TextChunk {
  id: ChunkId;
  documentId: DocumentId;
  text: string;
  embedding?: number[]; // Vecteur d'embedding
  metadata: {
    type: DocumentType;
    source?: string;
    position: number; // Position dans le document
    timestamp: number;
    tokens: number; // Nombre de tokens
    [key: string]: unknown;
  };
}

/** Document avec ses chunks */
export interface VectorDocument {
  id: DocumentId;
  title: string;
  content: string;
  type: DocumentType;
  source?: string;
  chunks: TextChunk[];
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

/** Résultat de recherche */
export interface SearchResult {
  chunk: TextChunk;
  document: VectorDocument;
  score: number; // Score de similarité (0-1)
  rank: number; // Rang dans les résultats
}

/** Options de recherche */
export interface SearchOptions {
  /** Nombre de résultats */
  limit?: number;
  
  /** Seuil de similarité minimum */
  minScore?: number;
  
  /** Filtrer par type */
  type?: DocumentType;
  
  /** Filtrer par source */
  source?: string;
  
  /** Inclure les embeddings dans les résultats */
  includeEmbeddings?: boolean;
}

// ============ VECTOR DB IMPLEMENTATION ============

/**
 * Base de données vectorielle simple
 * Utilise IndexedDB pour le stockage local
 */
export class VectorDB {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;
  private initialized: boolean = false;
  
  // Cache en mémoire
  private documents: Map<DocumentId, VectorDocument> = new Map();
  private chunks: Map<ChunkId, TextChunk> = new Map();
  
  constructor(dbName: string = 'morphos-vector-db', storeName: string = 'chunks') {
    this.dbName = dbName;
    this.storeName = storeName;
  }
  
  /**
   * Initialiser la base de données
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => {
        console.error('[VectorDB] Error opening database:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        this.loadFromDB().then(resolve).catch(reject);
      };
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }
  
  /**
   * Charger les données depuis IndexedDB
   */
  private async loadFromDB(): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const chunks = request.result as TextChunk[];
        for (const chunk of chunks) {
          this.chunks.set(chunk.id, chunk);
          
          // Reconstruire les documents
          if (!this.documents.has(chunk.documentId)) {
            this.documents.set(chunk.documentId, {
              id: chunk.documentId,
              title: `Document ${chunk.documentId.slice(0, 8)}`,
              content: '',
              type: chunk.metadata.type || 'custom',
              source: chunk.metadata.source,
              chunks: [],
              createdAt: chunk.metadata.timestamp,
              updatedAt: chunk.metadata.timestamp,
              metadata: {},
            });
          }
          
          const doc = this.documents.get(chunk.documentId)!;
          doc.chunks.push(chunk);
          doc.updatedAt = Math.max(doc.updatedAt, chunk.metadata.timestamp);
        }
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
  
  /**
   * Sauvegarder un chunk dans IndexedDB
   */
  private async saveToDB(chunk: TextChunk): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(chunk);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Supprimer un chunk de IndexedDB
   */
  private async deleteFromDB(chunkId: ChunkId): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(chunkId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Générer un ID unique
   */
  private generateId(): string {
    return `vec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Découper du texte en chunks
   */
  splitText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    const words = text.split(/\s+/);
    let currentChunk = '';
    
    for (const word of words) {
      if (currentChunk.length + word.length + 1 <= chunkSize) {
        currentChunk += (currentChunk ? ' ' : '') + word;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = word;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    // Ajouter l'overlap
    if (overlap > 0 && chunks.length > 1) {
      const overlappedChunks: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const prevChunk = i > 0 ? chunks[i - 1] : '';
        const overlapText = prevChunk.split(' ').slice(-Math.ceil(overlap / 6)).join(' ');
        overlappedChunks.push(overlapText + ' ' + chunks[i]);
      }
      return overlappedChunks;
    }
    
    return chunks;
  }
  
  /**
   * Compter les tokens (approximation simple)
   */
  countTokens(text: string): number {
    // Approximation: 1 token ≈ 4 caractères
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Ajouter un document
   */
  async addDocument(document: Partial<VectorDocument> & { content: string }): Promise<DocumentId> {
    const id = this.generateId();
    const timestamp = Date.now();
    
    // Découper le contenu en chunks
    const textChunks = this.splitText(document.content);
    
    const chunks: TextChunk[] = textChunks.map((text, index) => ({
      id: this.generateId(),
      documentId: id,
      text,
      metadata: {
        type: document.type || 'custom',
        source: document.source,
        position: index,
        timestamp,
        tokens: this.countTokens(text),
      },
    }));
    
    const vectorDocument: VectorDocument = {
      id,
      title: document.title || `Document ${id.slice(0, 8)}`,
      content: document.content,
      type: document.type || 'custom',
      source: document.source,
      chunks,
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: document.metadata || {},
    };
    
    // Sauvegarder en mémoire
    this.documents.set(id, vectorDocument);
    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);
    }
    
    // Sauvegarder dans IndexedDB
    for (const chunk of chunks) {
      await this.saveToDB(chunk);
    }
    
    return id;
  }
  
  /**
   * Ajouter un chunk directement
   */
  async addChunk(chunk: Omit<TextChunk, 'id'>): Promise<ChunkId> {
    const id = this.generateId();
    const textChunk: TextChunk = { ...chunk, id };
    
    // Sauvegarder en mémoire
    this.chunks.set(id, textChunk);
    
    // Mettre à jour le document
    if (!this.documents.has(textChunk.documentId)) {
      this.documents.set(textChunk.documentId, {
        id: textChunk.documentId,
        title: `Document ${textChunk.documentId.slice(0, 8)}`,
        content: '',
        type: textChunk.metadata.type || 'custom',
        source: textChunk.metadata.source,
        chunks: [],
        createdAt: textChunk.metadata.timestamp,
        updatedAt: textChunk.metadata.timestamp,
        metadata: {},
      });
    }
    
    const doc = this.documents.get(textChunk.documentId)!;
    doc.chunks.push(textChunk);
    doc.updatedAt = Math.max(doc.updatedAt, textChunk.metadata.timestamp);
    
    // Sauvegarder dans IndexedDB
    await this.saveToDB(textChunk);
    
    return id;
  }
  
  /**
   * Supprimer un document
   */
  async deleteDocument(documentId: DocumentId): Promise<boolean> {
    const doc = this.documents.get(documentId);
    if (!doc) return false;
    
    // Supprimer tous les chunks
    for (const chunk of doc.chunks) {
      this.chunks.delete(chunk.id);
      await this.deleteFromDB(chunk.id);
    }
    
    // Supprimer le document
    this.documents.delete(documentId);
    
    return true;
  }
  
  /**
   * Supprimer un chunk
   */
  async deleteChunk(chunkId: ChunkId): Promise<boolean> {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) return false;
    
    // Supprimer du document
    const doc = this.documents.get(chunk.documentId);
    if (doc) {
      doc.chunks = doc.chunks.filter(c => c.id !== chunkId);
      if (doc.chunks.length === 0) {
        this.documents.delete(chunk.documentId);
      }
    }
    
    // Supprimer de la mémoire et de la DB
    this.chunks.delete(chunkId);
    await this.deleteFromDB(chunkId);
    
    return true;
  }
  
  /**
   * Obtenir un document
   */
  getDocument(documentId: DocumentId): VectorDocument | undefined {
    return this.documents.get(documentId);
  }
  
  /**
   * Obtenir un chunk
   */
  getChunk(chunkId: ChunkId): TextChunk | undefined {
    return this.chunks.get(chunkId);
  }
  
  /**
   * Obtenir tous les documents
   */
  getAllDocuments(): VectorDocument[] {
    return Array.from(this.documents.values());
  }
  
  /**
   * Obtenir tous les chunks
   */
  getAllChunks(): TextChunk[] {
    return Array.from(this.chunks.values());
  }
  
  /**
   * Rechercher des chunks similaires
   * 
   * Note: Pour l'instant, utilise une recherche textuelle simple.
   * Dans une vraie implémentation, utiliserait des embeddings et une vraie similarité cosinus.
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const limit = options?.limit || 10;
    const minScore = options?.minScore || 0.1;
    
    // Pour l'instant, recherche textuelle simple
    const queryLower = query.toLowerCase();
    const allChunks = this.getAllChunks();
    
    const results: { chunk: TextChunk; score: number }[] = allChunks
      .filter(chunk => {
        // Filtrer par type si spécifié
        if (options?.type && chunk.metadata.type !== options.type) {
          return false;
        }
        
        // Filtrer par source si spécifié
        if (options?.source && chunk.metadata.source !== options.source) {
          return false;
        }
        
        return true;
      })
      .map(chunk => {
        // Calculer un score de similarité simple (basé sur les mots communs)
        const chunkLower = chunk.text.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
        const chunkWords = chunkLower.split(/\s+/);
        
        const commonWords = queryWords.filter(word => chunkWords.includes(word));
        const score = commonWords.length / Math.max(queryWords.length, 1);
        
        return { chunk, score };
      })
      .filter(({ score }) => score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    // Ajouter les documents et les rangs
    return results.map((result, index) => {
      const doc = this.documents.get(result.chunk.documentId);
      return {
        ...result,
        document: doc || {
          id: result.chunk.documentId,
          title: 'Unknown Document',
          content: '',
          type: 'custom',
          chunks: [],
          createdAt: result.chunk.metadata.timestamp,
          updatedAt: result.chunk.metadata.timestamp,
          metadata: {},
        },
        rank: index + 1,
      };
    });
  }
  
  /**
   * Rechercher par similarité vectorielle (simulée)
   * 
   * Dans une vraie implémentation, on utiliserait une bibliothèque comme:
   * - @tensorflow/tfjs
   * - faiss-wasm
   * - ou un service externe
   */
  async vectorSearch(embedding: number[], options?: SearchOptions): Promise<SearchResult[]> {
    const limit = options?.limit || 10;
    const minScore = options?.minScore || 0.3;
    
    const allChunks = this.getAllChunks().filter(chunk => chunk.embedding);
    
    const results: { chunk: TextChunk; score: number }[] = allChunks
      .map(chunk => {
        // Calculer la similarité cosinus (simulée)
        // Dans une vraie implémentation, utiliserait dot product et magnitude
        const score = Math.random(); // Simulation
        return { chunk, score };
      })
      .filter(({ score }) => score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return results.map((result, index) => {
      const doc = this.documents.get(result.chunk.documentId);
      return {
        ...result,
        document: doc || {
          id: result.chunk.documentId,
          title: 'Unknown Document',
          content: '',
          type: 'custom',
          chunks: [],
          createdAt: result.chunk.metadata.timestamp,
          updatedAt: result.chunk.metadata.timestamp,
          metadata: {},
        },
        rank: index + 1,
      };
    });
  }
  
  /**
   * Mettre à jour les embeddings d'un chunk
   */
  async updateEmbedding(chunkId: ChunkId, embedding: number[]): Promise<boolean> {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) return false;
    
    chunk.embedding = embedding;
    this.chunks.set(chunkId, chunk);
    
    // Sauvegarder dans IndexedDB
    await this.saveToDB(chunk);
    
    return true;
  }
  
  /**
   * Générer des embeddings (simulé)
   * 
   * Dans une vraie implémentation, utiliserait:
   * - TensorFlow.js
   * - ONNX Runtime
   * - ou une API externe (OpenAI, HuggingFace, etc.)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Simulation: générer un vecteur aléatoire
    // Dans une vraie implémentation, on utiliserait un modèle d'embedding
    const embedding: number[] = [];
    for (let i = 0; i < 1536; i++) { // Taille typique d'un embedding
      embedding.push(Math.random() * 2 - 1);
    }
    return embedding;
  }
  
  /**
   * Indexer un document (générer les embeddings pour tous les chunks)
   */
  async indexDocument(documentId: DocumentId): Promise<boolean> {
    const doc = this.documents.get(documentId);
    if (!doc) return false;
    
    for (const chunk of doc.chunks) {
      const embedding = await this.generateEmbedding(chunk.text);
      await this.updateEmbedding(chunk.id, embedding);
    }
    
    return true;
  }
  
  /**
   * Indexer tous les documents
   */
  async indexAll(): Promise<void> {
    const docs = this.getAllDocuments();
    for (const doc of docs) {
      await this.indexDocument(doc.id);
    }
  }
  
  /**
   * Effacer la base de données
   */
  async clear(): Promise<void> {
    this.documents.clear();
    this.chunks.clear();
    
    if (this.db) {
      await this.deleteDB();
    }
  }
  
  /**
   * Supprimer la base de données IndexedDB
   */
  private async deleteDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  /**
   * Obtenir les statistiques
   */
  getStats(): {
    totalDocuments: number;
    totalChunks: number;
    totalTokens: number;
    chunksByType: Record<DocumentType, number>;
  } {
    const docs = this.getAllDocuments();
    const chunks = this.getAllChunks();
    
    const chunksByType: Record<DocumentType, number> = {
      chat: 0,
      file: 0,
      note: 0,
      code: 0,
      web: 0,
      custom: 0,
    };
    
    for (const chunk of chunks) {
      const type = chunk.metadata.type as DocumentType;
      if (chunksByType[type] !== undefined) {
        chunksByType[type]++;
      }
    }
    
    return {
      totalDocuments: docs.length,
      totalChunks: chunks.length,
      totalTokens: chunks.reduce((sum, chunk) => sum + (chunk.metadata.tokens || 0), 0),
      chunksByType,
    };
  }
}

// ============ SINGLETON ============

let vectorDBInstance: VectorDB | null = null;

/**
 * Obtenir l'instance unique de VectorDB
 */
export function getVectorDB(): VectorDB {
  if (vectorDBInstance) {
    return vectorDBInstance;
  }
  
  vectorDBInstance = new VectorDB();
  return vectorDBInstance;
}

// ============ REACT HOOK ============

import { useEffect, useState } from "react";

/**
 * Hook pour utiliser VectorDB dans les composants
 */
export function useVectorDB() {
  const [db, setDb] = useState<VectorDB | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const vectorDB = getVectorDB();
    vectorDB.init().then(() => {
      setDb(vectorDB);
      setIsReady(true);
    });
  }, []);
  
  return { db, isReady };
}

// ============ EXPORTS ============

export type {
  DocumentId,
  ChunkId,
  DocumentType,
  TextChunk,
  VectorDocument,
  SearchResult,
  SearchOptions,
};
