"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProviderId } from "./providers";
import type { Language } from "./i18n";

export type AccentTheme = "cyan" | "emerald" | "pink" | "amber" | "violet";

export const ACCENT_COLORS: Record<AccentTheme, { primary: string; secondary: string; rgb: string }> = {
  cyan: { primary: "#22d3ee", secondary: "#34d399", rgb: "34, 211, 238" },
  emerald: { primary: "#34d399", secondary: "#22d3ee", rgb: "52, 211, 153" },
  pink: { primary: "#f472b6", secondary: "#c084fc", rgb: "244, 114, 182" },
  amber: { primary: "#fbbf24", secondary: "#f97316", rgb: "251, 191, 36" },
  violet: { primary: "#c084fc", secondary: "#818cf8", rgb: "192, 132, 252" },
};

interface SettingsState {
  // Provider config
  providerId: ProviderId;
  apiKeys: Partial<Record<ProviderId, string>>;
  baseUrls: Partial<Record<ProviderId, string>>;
  models: Partial<Record<ProviderId, string>>;

  // UI prefs
  language: Language;
  theme: AccentTheme;
  enableSound: boolean;
  enableBoot: boolean;

  // Internal
  hasSeenBoot: boolean;
  settingsOpen: boolean;

  // Actions
  setProvider: (id: ProviderId) => void;
  setApiKey: (provider: ProviderId, key: string) => void;
  setBaseUrl: (provider: ProviderId, url: string) => void;
  setModel: (provider: ProviderId, model: string) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: AccentTheme) => void;
  toggleLanguage: () => void;
  setSound: (v: boolean) => void;
  setBoot: (v: boolean) => void;
  markBootSeen: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  resetAll: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      providerId: "zai",
      apiKeys: {},
      baseUrls: {},
      models: {},
      language: "en",
      theme: "cyan",
      enableSound: false,
      enableBoot: true,
      hasSeenBoot: false,
      settingsOpen: false,

      setProvider: (id) => set({ providerId: id }),
      setApiKey: (provider, key) =>
        set((s) => ({ apiKeys: { ...s.apiKeys, [provider]: key } })),
      setBaseUrl: (provider, url) =>
        set((s) => ({ baseUrls: { ...s.baseUrls, [provider]: url } })),
      setModel: (provider, model) =>
        set((s) => ({ models: { ...s.models, [provider]: model } })),
      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),
      toggleLanguage: () => set((s) => ({ language: s.language === "en" ? "fr" : "en" })),
      setSound: (v) => set({ enableSound: v }),
      setBoot: (v) => set({ enableBoot: v }),
      markBootSeen: () => set({ hasSeenBoot: true }),
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
      resetAll: () =>
        set({
          providerId: "zai",
          apiKeys: {},
          baseUrls: {},
          models: {},
          language: "en",
          theme: "cyan",
          enableSound: false,
          enableBoot: true,
          hasSeenBoot: false,
          settingsOpen: false,
        }),
    }),
    {
      name: "morphos-settings",
      storage: createJSONStorage(() => localStorage),
      // Don't persist settingsOpen
      partialize: (s) => ({
        providerId: s.providerId,
        apiKeys: s.apiKeys,
        baseUrls: s.baseUrls,
        models: s.models,
        language: s.language,
        theme: s.theme,
        enableSound: s.enableSound,
        enableBoot: s.enableBoot,
        hasSeenBoot: s.hasSeenBoot,
      }),
    }
  )
);

// Helper: build the provider request payload for the /api/interpret call
export function buildProviderPayload() {
  const s = useSettings.getState();
  return {
    providerId: s.providerId,
    apiKey: s.apiKeys[s.providerId] ?? "",
    baseUrl: s.baseUrls[s.providerId] ?? "",
    model: s.models[s.providerId] ?? "",
  };
}
