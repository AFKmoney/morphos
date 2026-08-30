// Memory System exports
// Ce fichier exporte tout ce qui est nécessaire pour le système Advanced Memory (RAG)

export type {
  DocumentId,
  ChunkId,
  DocumentType,
  TextChunk,
  VectorDocument,
  SearchResult,
  SearchOptions,
} from "./vector-db";

export {
  getVectorDB,
  useVectorDB,
  VectorDB,
} from "./vector-db";

export type {
  KnowledgeSourceType,
  KnowledgeSource,
  RAGContext,
  RAGOptions,
  RAGResult,
} from "./rag-engine";

export {
  getRAGEngine,
  useRAGEngine,
  searchKnowledge,
  generateWithRAG,
  addKnowledgeDocument,
  RAGEngine,
} from "./rag-engine";

export {
  useMemoryStore,
  initMemoryStore,
  addMemoryDocument,
  searchMemory,
  generateWithMemory,
  getMemoryStats,
} from "./memory-store";
