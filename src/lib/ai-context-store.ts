"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeLocalStorage } from "./safe-storage";

interface AIMemory {
  id: string;
  type: "preference" | "fact" | "instruction" | "context";
  content: string;
  ts: number;
}

interface AIContextStore {
  memories: AIMemory[];
  recentModules: string[]; // recently spawned module types
  sessionStart: number;

  addMemory: (type: AIMemory["type"], content: string) => void;
  removeMemory: (id: string) => void;
  clearMemories: () => void;

  addRecentModule: (type: string) => void;

  getSystemContext: () => string;
}

export const useAIContext = create<AIContextStore>()(
  persist(
    (set, get) => ({
      memories: [],
      recentModules: [],
      sessionStart: Date.now(),

      addMemory: (type, content) =>
        set((s) => ({
          memories: [
            ...s.memories.slice(-19), // keep last 20
            { id: `mem-${Date.now()}`, type, content, ts: Date.now() },
          ],
        })),

      removeMemory: (id) =>
        set((s) => ({
          memories: s.memories.filter(m => m.id !== id),
        })),

      clearMemories: () => set({ memories: [] }),

      addRecentModule: (type) =>
        set((s) => ({
          recentModules: [type, ...s.recentModules.filter(t => t !== type)].slice(0, 10),
        })),

      getSystemContext: () => {
        const s = get();
        const parts: string[] = [];

        if (s.memories.length > 0) {
          parts.push("--- USER MEMORY (persistent across sessions) ---");
          for (const m of s.memories) {
            parts.push(`[${m.type}] ${m.content}`);
          }
        }

        if (s.recentModules.length > 0) {
          parts.push(`\n--- RECENTLY USED MODULES ---`);
          parts.push(s.recentModules.slice(0, 5).join(", "));
        }

        return parts.length > 0 ? parts.join("\n") : "";
      },
    }),
    {
      name: "morphos-ai-memory",
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
