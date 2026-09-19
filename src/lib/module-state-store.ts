"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ModuleStateStore {
  // Generic key-value store for module-specific state
  // Key format: `${moduleType}:${windowId}` or `${moduleType}:global`
  states: Record<string, unknown>;
  
  // Save state for a module instance
  saveState: (key: string, state: unknown) => void;
  
  // Load state for a module instance
  loadState: <T = unknown>(key: string) => T | undefined;
  
  // Clear state for a specific key
  clearState: (key: string) => void;
  
  // Clear all module states (factory reset)
  clearAllStates: () => void;
}

export const useModuleState = create<ModuleStateStore>()(
  persist(
    (set, get) => ({
      states: {},
      
      saveState: (key, state) =>
        set((s) => ({
          states: { ...s.states, [key]: state },
        })),
      
      loadState: <T,>(key: string) => get().states[key] as T | undefined,
      
      clearState: (key) =>
        set((s) => {
          const next = { ...s.states };
          delete next[key];
          return { states: next };
        }),
      
      clearAllStates: () => set({ states: {} }),
    }),
    {
      name: "morphos-module-states",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Helper hook for modules to save/load their state
export function useModulePersist<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const states = useModuleState((s) => s.states);
  const saveState = useModuleState((s) => s.saveState);

  const value = (states[key] as T) ?? initial;

  const setValue = (v: T | ((prev: T) => T)) => {
    const next = typeof v === "function" ? (v as (prev: T) => T)(value) : v;
    saveState(key, next);
  };

  return [value, setValue];
}
