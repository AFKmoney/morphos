"use client";

import { create } from "zustand";

export type ModuleType =
  | "chat" | "monitor" | "dashboard" | "terminal" | "kanban"
  | "notes" | "code" | "weather" | "clock" | "music"
  | "calculator" | "stock" | "camera" | "metrics"
  | "pomodoro" | "paint" | "regex" | "json" | "colorpicker"
  | "qr" | "devtools" | "files" | "browser" | "calendar"
  | "whiteboard" | "custom";

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
  prev?: { x: number; y: number; width: number; height: number };
  config?: Record<string, unknown>;
  /** For custom AI-generated modules: the generated TSX code */
  code?: string;
  /** The natural-language prompt that created this window (if any) */
  prompt?: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: number;
}

export interface SavedWorkspace {
  id: string;
  name: string;
  windows: MorphWindow[];
  createdAt: number;
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
  workspaces: SavedWorkspace[];

  // actions
  spawnWindow: (w: Omit<MorphWindow, "id" | "z" | "createdAt" | "minimized" | "maximized">) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateGeometry: (id: string, geo: Partial<Pick<MorphWindow, "x" | "y" | "width" | "height">>) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  restoreWindow: (id: string) => void;
  updateConfig: (id: string, config: Record<string, unknown>) => void;
  snapWindow: (id: string, zone: "left" | "right" | "top" | "bottom" | "tl" | "tr" | "bl" | "br") => void;

  addChatMessage: (m: Omit<ChatMessage, "id" | "ts">) => void;
  setInterpreting: (v: boolean) => void;

  showSpawnPreview: (data: { code: string[]; title: string; moduleType: ModuleType }) => void;
  hideSpawnPreview: () => void;

  closeAll: () => void;
  saveWorkspace: (name: string) => void;
  loadWorkspace: (id: string) => void;
  deleteWorkspace: (id: string) => void;
}

let idCounter = 0;
const genId = () => `w-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  chatMessages: [
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey. I'm MorphOS — an interface that rewrites itself. Tell me what you need and I'll spawn the right module. Try: \"become a system monitor\", \"add a sales dashboard\", \"open a terminal\", \"create a pomodoro timer\", or describe anything and I'll generate a custom module on the fly.",
      ts: Date.now(),
    },
  ],
  activeId: null,
  zCounter: 10,
  isInterpreting: false,
  spawnPreview: null,
  workspaces: [],

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
          y: 56, // below top bar (48px + 8px margin)
          width: window.innerWidth - 32,
          height: window.innerHeight - 56 - 16, // top bar + bottom margin
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

  snapWindow: (id, zone) =>
    set((s) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const topBar = 48; // top bar height
      const bottomMargin = 16;
      const usableH = vh - topBar - bottomMargin;
      const halfW = (vw - 32) / 2;
      const halfH = usableH / 2;
      const baseX = 16;
      const midY = topBar + 8; // below top bar with margin

      const zones: Record<string, { x: number; y: number; width: number; height: number }> = {
        left: { x: baseX, y: midY, width: halfW, height: usableH },
        right: { x: baseX + halfW, y: midY, width: halfW, height: usableH },
        top: { x: baseX, y: midY, width: vw - 32, height: halfH },
        bottom: { x: baseX, y: midY + halfH, width: vw - 32, height: halfH },
        tl: { x: baseX, y: midY, width: halfW, height: halfH },
        tr: { x: baseX + halfW, y: midY, width: halfW, height: halfH },
        bl: { x: baseX, y: midY + halfH, width: halfW, height: halfH },
        br: { x: baseX + halfW, y: midY + halfH, width: halfW, height: halfH },
      };
      const geo = zones[zone];
      return {
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, ...geo, maximized: false, prev: undefined } : w
        ),
      };
    }),

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

  saveWorkspace: (name) =>
    set((s) => ({
      workspaces: [
        ...s.workspaces,
        {
          id: genId(),
          name,
          windows: s.windows.map((w) => ({ ...w, prev: undefined })),
          createdAt: Date.now(),
        },
      ],
    })),

  loadWorkspace: (id) =>
    set((s) => {
      const ws = s.workspaces.find((w) => w.id === id);
      if (!ws) return {};
      const zBase = s.zCounter;
      return {
        windows: ws.windows.map((w, i) => ({
          ...w,
          id: genId(),
          z: zBase + i + 1,
          minimized: false,
          maximized: false,
          prev: undefined,
          createdAt: Date.now(),
        })),
        zCounter: zBase + ws.windows.length,
        activeId: null,
      };
    }),

  deleteWorkspace: (id) =>
    set((s) => ({
      workspaces: s.workspaces.filter((w) => w.id !== id),
    })),
}));
