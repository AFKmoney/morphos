"use client";

import { create } from "zustand";

export type ModuleType =
  | "chat"
  | "monitor"
  | "dashboard"
  | "terminal"
  | "kanban"
  | "notes"
  | "code"
  | "weather"
  | "clock"
  | "music"
  | "calculator"
  | "stock"
  | "camera"
  | "metrics";

export interface MorphWindow {
  id: string;
  type: ModuleType;
  title: string;
  subtitle?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  // Optional previous geometry for restore from maximize
  prev?: { x: number; y: number; width: number; height: number };
  // Module-specific config (free-form)
  config?: Record<string, unknown>;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: number;
}

interface WindowStore {
  windows: MorphWindow[];
  chatMessages: ChatMessage[];
  activeId: string | null;
  zCounter: number;
  isInterpreting: boolean;
  spawnPreview: {
    visible: boolean;
    code: string[];
    title: string;
    moduleType: ModuleType;
  } | null;

  // actions
  spawnWindow: (w: Omit<MorphWindow, "id" | "z" | "createdAt" | "minimized" | "maximized">) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateGeometry: (id: string, geo: Partial<Pick<MorphWindow, "x" | "y" | "width" | "height">>) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  restoreWindow: (id: string) => void;
  updateConfig: (id: string, config: Record<string, unknown>) => void;

  addChatMessage: (m: Omit<ChatMessage, "id" | "ts">) => void;
  setInterpreting: (v: boolean) => void;

  showSpawnPreview: (data: { code: string[]; title: string; moduleType: ModuleType }) => void;
  hideSpawnPreview: () => void;

  closeAll: () => void;
}

let idCounter = 0;
const genId = () => `w-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

const DEFAULT_SIZE: Record<ModuleType, { width: number; height: number; title: string }> = {
  chat: { width: 460, height: 560, title: "Console MorphOS" },
  monitor: { width: 540, height: 420, title: "Moniteur Système" },
  dashboard: { width: 720, height: 480, title: "Dashboard Analytics" },
  terminal: { width: 600, height: 380, title: "Terminal Live" },
  kanban: { width: 680, height: 460, title: "Kanban Opérations" },
  notes: { width: 480, height: 460, title: "Notes Markdown" },
  code: { width: 680, height: 480, title: "Éditeur de Code" },
  weather: { width: 380, height: 460, title: "Météo" },
  clock: { width: 360, height: 240, title: "Horloge Mondiale" },
  music: { width: 420, height: 480, title: "Lecteur Audio" },
  calculator: { width: 320, height: 440, title: "Calculatrice" },
  stock: { width: 540, height: 380, title: "Markets Live" },
  camera: { width: 480, height: 420, title: "Vision Caméra" },
  metrics: { width: 560, height: 380, title: "Métriques Temps Réel" },
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  chatMessages: [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Salut. Je suis MorphOS — une interface qui se réécrit elle-même. Dis-moi ce dont tu as besoin et je vais faire apparaître le module adapté. Essaie : « deviens un moniteur système », « ajoute un dashboard de ventes », « ouvre un terminal », « crée un kanban pour mon projet ».",
      ts: Date.now(),
    },
  ],
  activeId: null,
  zCounter: 10,
  isInterpreting: false,
  spawnPreview: null,

  spawnWindow: (w) => {
    const id = genId();
    const z = get().zCounter + 1;
    const win: MorphWindow = {
      id,
      minimized: false,
      maximized: false,
      z,
      createdAt: Date.now(),
      ...w,
    };
    set((s) => ({
      windows: [...s.windows, win],
      zCounter: z,
      activeId: id,
    }));
    return id;
  },

  closeWindow: (id) =>
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  focusWindow: (id) =>
    set((s) => {
      const z = s.zCounter + 1;
      return {
        zCounter: z,
        activeId: id,
        windows: s.windows.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)),
      };
    }),

  updateGeometry: (id, geo) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, ...geo } : w)),
    })),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
    })),

  toggleMaximize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized && w.prev) {
          return { ...w, maximized: false, ...w.prev, prev: undefined };
        }
        return {
          ...w,
          maximized: true,
          prev: { x: w.x, y: w.y, width: w.width, height: w.height },
          x: 16,
          y: 16,
          width: window.innerWidth - 32,
          height: window.innerHeight - 140,
        };
      }),
    })),

  restoreWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: false } : w)),
    })),

  updateConfig: (id, config) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, config: { ...w.config, ...config } } : w
      ),
    })),

  addChatMessage: (m) =>
    set((s) => ({
      chatMessages: [...s.chatMessages, { ...m, id: genId(), ts: Date.now() }],
    })),

  setInterpreting: (v) => set({ isInterpreting: v }),

  showSpawnPreview: (data) =>
    set({
      spawnPreview: { visible: true, ...data },
    }),

  hideSpawnPreview: () => set({ spawnPreview: null }),

  closeAll: () => set({ windows: [], activeId: null }),
}));

export function getModuleDefaultSize(type: ModuleType) {
  return DEFAULT_SIZE[type] ?? { width: 480, height: 400, title: "Module" };
}

export function getSpawnPosition(existing: MorphWindow[]) {
  // stagger new windows
  const offset = existing.length * 28;
  const baseX = 80 + (offset % 200);
  const baseY = 80 + (offset % 160);
  return {
    x: clamp(baseX, 16, Math.max(16, window.innerWidth - 540)),
    y: clamp(baseY, 16, Math.max(16, window.innerHeight - 500)),
  };
}
