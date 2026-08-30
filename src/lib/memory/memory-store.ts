"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  DocumentId,
  DocumentType,
  TextChunk,
  VectorDocument,
} from "./vector-db";
import type {
  KnowledgeSource,
  KnowledgeSourceType,
  RAGContext,
  RAGOptions,
  RAGResult,
} from "./rag-engine";
import { getVectorDB, getRAGEngine } from "./rag-engine";

/**
 * Memory Store
 * 
 * Store principal pour la gestion de la mémoire avancée (RAG).
 * Gère les documents, les chunks, les sources de connaissances et les requêtes RAG.
 */

interface MemoryStoreState {
  // Documents
  documents: Map<DocumentId, VectorDocument>;
  
  // Sources de connaissances
  knowledgeSources: Map<string, KnowledgeSource>;
  
  // Historique des requêtes RAG
  ragHistory: RAGContext[];
  
  // Statut
  isIndexing: boolean;
  lastIndexedAt: number | null;
  
  // Actions
  init: () => Promise<void>;
  
  // Documents
  addDocument: (doc: Partial<VectorDocument> & { content: string }) => Promise<DocumentId>;
  updateDocument: (id: DocumentId, updates: Partial<VectorDocument>) => Promise<boolean>;
  deleteDocument: (id: DocumentId) => Promise<boolean>;
  getDocument: (id: DocumentId) => VectorDocument | undefined;
  getAllDocuments: () => VectorDocument[];
  
  // Chunks
  addChunk: (chunk: Omit<TextChunk, 'id'>) => Promise<string>;
  deleteChunk: (chunkId: string) => Promise<boolean>;
  getChunk: (chunkId: string) => TextChunk | undefined;
  getAllChunks: () => TextChunk[];
  
  // Knowledge Sources
  addKnowledgeSource: (source: Omit<KnowledgeSource, 'lastIndexed' | 'documentCount'>) => string;
  removeKnowledgeSource: (id: string) => boolean;
  toggleKnowledgeSource: (id: string, enabled: boolean) => boolean;
  getKnowledgeSource: (id: string) => KnowledgeSource | undefined;
  getAllKnowledgeSources: () => KnowledgeSource[];
  getEnabledKnowledgeSources: () => KnowledgeSource[];
  
  // Indexation
  indexDocument: (documentId: DocumentId) => Promise<boolean>;
  indexAll: () => Promise<void>;
  reindexSource: (sourceId: string) => Promise<boolean>;
  
  // RAG
  retrieve: (query: string, options?: RAGOptions) => Promise<RAGContext>;
  generate: (query: string, options?: RAGOptions) => Promise<RAGResult>;
  
  // Historique
  addToHistory: (context: RAGContext) => void;
  clearHistory: () => void;
  getHistory: () => RAGContext[];
  
  // Statistiques
  getStats: () => any;
  
  // Utilitaires
  clear: () => Promise<void>;
}

const STORAGE_KEY = "morphos-memory";

export const useMemoryStore = create<MemoryStoreState>()(
  persist(
    (set, get) => ({
      documents: new Map(),
      knowledgeSources: new Map(),
      ragHistory: [],
      isIndexing: false,
      lastIndexedAt: null,
      
      init: async () => {
        const vectorDB = getVectorDB();
        await vectorDB.init();
        
        // Charger les documents depuis VectorDB
        const docs = vectorDB.getAllDocuments();
        set({ documents: new Map(docs.map(d => [d.id, d])) });
        
        // Initialiser RAG Engine
        const ragEngine = getRAGEngine();
        await ragEngine.init();
        
        // Charger les sources de connaissances
        const sources = ragEngine.getAllKnowledgeSources();
        set({ knowledgeSources: new Map(sources.map(s => [s.id, s])) });
      },
      
      // ============ DOCUMENT ACTIONS ============
      
      addDocument: async (doc: Partial<VectorDocument> & { content: string }) => {
        const vectorDB = getVectorDB();
        const docId = await vectorDB.addDocument(doc);
        
        // Mettre à jour le store
        const documents = new Map(get().documents);
        const vectorDoc = vectorDB.getDocument(docId);
        if (vectorDoc) {
          documents.set(docId, vectorDoc);
          set({ documents });
        }
        
        return docId;
      },
      
      updateDocument: async (id: DocumentId, updates: Partial<VectorDocument>) => {
        const vectorDB = getVectorDB();
        const doc = vectorDB.getDocument(id);
        if (!doc) return false;
        
        // Mettre à jour dans VectorDB (à implémenter)
        // Pour l'instant, on met juste à jour le store
        const documents = new Map(get().documents);
        documents.set(id, { ...doc, ...updates, updatedAt: Date.now() });
        set({ documents });
        
        return true;
      },
      
      deleteDocument: async (id: DocumentId) => {
        const vectorDB = getVectorDB();
        const success = await vectorDB.deleteDocument(id);
        
        if (success) {
          const documents = new Map(get().documents);
          documents.delete(id);
          set({ documents });
        }
        
        return success;
      },
      
      getDocument: (id: DocumentId) => {
        return get().documents.get(id) || getVectorDB().getDocument(id);
      },
      
      getAllDocuments: () => {
        return Array.from(get().documents.values());
      },
      
      // ============ CHUNK ACTIONS ============
      
      addChunk: async (chunk: Omit<TextChunk, 'id'>) => {
        const vectorDB = getVectorDB();
        const chunkId = await vectorDB.addChunk(chunk);
        return chunkId;
      },
      
      deleteChunk: async (chunkId: string) => {
        const vectorDB = getVectorDB();
        return vectorDB.deleteChunk(chunkId);
      },
      
      getChunk: (chunkId: string) => {
        return getVectorDB().getChunk(chunkId);
      },
      
      getAllChunks: () => {
        return getVectorDB().getAllChunks();
      },
      
      // ============ KNOWLEDGE SOURCE ACTIONS ============
      
      addKnowledgeSource: (source: Omit<KnowledgeSource, 'lastIndexed' | 'documentCount'>) => {
        const ragEngine = getRAGEngine();
        const id = ragEngine.addKnowledgeSource(source);
        
        const knowledgeSources = new Map(get().knowledgeSources);
        const newSource = ragEngine.getKnowledgeSource(id);
        if (newSource) {
          knowledgeSources.set(id, newSource);
          set({ knowledgeSources });
        }
        
        return id;
      },
      
      removeKnowledgeSource: (id: string) => {
        const ragEngine = getRAGEngine();
        const success = ragEngine.removeKnowledgeSource(id);
        
        if (success) {
          const knowledgeSources = new Map(get().knowledgeSources);
          knowledgeSources.delete(id);
          set({ knowledgeSources });
        }
        
        return success;
      },
      
      toggleKnowledgeSource: (id: string, enabled: boolean) => {
        const ragEngine = getRAGEngine();
        const success = ragEngine.toggleKnowledgeSource(id, enabled);
        
        if (success) {
          const knowledgeSources = new Map(get().knowledgeSources);
          const source = knowledgeSources.get(id);
          if (source) {
            knowledgeSources.set(id, { ...source, enabled });
            set({ knowledgeSources });
          }
        }
        
        return success;
      },
      
      getKnowledgeSource: (id: string) => {
        return get().knowledgeSources.get(id) || getRAGEngine().getKnowledgeSource(id);
      },
      
      getAllKnowledgeSources: () => {
        return Array.from(get().knowledgeSources.values());
      },
      
      getEnabledKnowledgeSources: () => {
        return Array.from(get().knowledgeSources.values())
          .filter(s => s.enabled)
          .sort((a, b) => a.priority - b.priority);
      },
      
      // ============ INDEXATION ACTIONS ============
      
      indexDocument: async (documentId: DocumentId) => {
        const vectorDB = getVectorDB();
        set({ isIndexing: true });
        
        try {
          const success = await vectorDB.indexDocument(documentId);
          if (success) {
            set({ lastIndexedAt: Date.now() });
          }
          return success;
        } finally {
          set({ isIndexing: false });
        }
      },
      
      indexAll: async () => {
        const vectorDB = getVectorDB();
        set({ isIndexing: true });
        
        try {
          await vectorDB.indexAll();
          set({ lastIndexedAt: Date.now() });
        } finally {
          set({ isIndexing: false });
        }
      },
      
      reindexSource: async (sourceId: string) => {
        const ragEngine = getRAGEngine();
        const source = ragEngine.getKnowledgeSource(sourceId);
        if (!source) return false;
        
        set({ isIndexing: true });
        
        try {
          // Dans une vraie implémentation, on rechargerait les documents
          // et on les ré-indexerait
          source.lastIndexed = Date.now();
          set({ lastIndexedAt: Date.now() });
          return true;
        } finally {
          set({ isIndexing: false });
        }
      },
      
      // ============ RAG ACTIONS ============
      
      retrieve: async (query: string, options?: RAGOptions) => {
        const ragEngine = getRAGEngine();
        const context = await ragEngine.retrieve(query, options);
        
        // Ajouter à l'historique
        get().addToHistory(context);
        
        return context;
      },
      
      generate: async (query: string, options?: RAGOptions) => {
        const ragEngine = getRAGEngine();
        const result = await ragEngine.generate(query, options);
        
        // Ajouter le contexte à l'historique
        if (result.success) {
          get().addToHistory(result.context);
        }
        
        return result;
      },
      
      // ============ HISTORY ACTIONS ============
      
      addToHistory: (context: RAGContext) => {
        const ragHistory = [...get().ragHistory];
        ragHistory.unshift(context);
        
        // Limiter à 100 entrées
        if (ragHistory.length > 100) {
          ragHistory.pop();
        }
        
        set({ ragHistory });
      },
      
      clearHistory: () => {
        set({ ragHistory: [] });
      },
      
      getHistory: () => {
        return get().ragHistory;
      },
      
      // ============ STATS ACTIONS ============
      
      getStats: () => {
        const vectorDB = getVectorDB();
        const vectorStats = vectorDB.getStats();
        const ragEngine = getRAGEngine();
        const ragStats = ragEngine.getStats();
        
        return {
          ...vectorStats,
          ...ragStats,
          historyCount: get().ragHistory.length,
        };
      },
      
      // ============ UTILITIES ============
      
      clear: async () => {
        const vectorDB = getVectorDB();
        await vectorDB.clear();
        
        set({
          documents: new Map(),
          knowledgeSources: new Map(),
          ragHistory: [],
          isIndexing: false,
          lastIndexedAt: null,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        documents: Array.from(state.documents.values()),
        knowledgeSources: Array.from(state.knowledgeSources.values()),
        ragHistory: state.ragHistory,
        lastIndexedAt: state.lastIndexedAt,
      }),
      merge: (persistedState, currentState) => {
        return {
          ...currentState,
          documents: new Map(persistedState.documents?.map((d: VectorDocument) => [d.id, d]) || []),
          knowledgeSources: new Map(persistedState.knowledgeSources?.map((s: KnowledgeSource) => [s.id, s]) || []),
          ragHistory: persistedState.ragHistory || [],
          lastIndexedAt: persistedState.lastIndexedAt || null,
        };
      },
    }
  )
);

// ============ UTILITY FUNCTIONS ============

/**
 * Initialiser le store de mémoire
 */
export async function initMemoryStore(): Promise<void> {
  return useMemoryStore.getState().init();
}

/**
 * Ajouter un document
 */
export async function addMemoryDocument(doc: Partial<VectorDocument> & { content: string }): Promise<DocumentId> {
  return useMemoryStore.getState().addDocument(doc);
}

/**
 * Rechercher dans la mémoire
 */
export async function searchMemory(query: string, options?: RAGOptions): Promise<RAGContext> {
  return useMemoryStore.getState().retrieve(query, options);
}

/**
 * Générer avec RAG
 */
export async function generateWithMemory(query: string, options?: RAGOptions): Promise<RAGResult> {
  return useMemoryStore.getState().generate(query, options);
}

/**
 * Obtenir les statistiques
 */
export function getMemoryStats() {
  return useMemoryStore.getState().getStats();
}

// ============ EXPORTS ============

export type * from "./vector-db";
export type * from "./rag-engine";
export { getVectorDB, useVectorDB } from "./vector-db";
export { getRAGEngine, useRAGEngine, searchKnowledge, generateWithRAG, addKnowledgeDocument } from "./rag-engine";
