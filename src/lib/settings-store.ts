"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeLocalStorage } from "./safe-storage";
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
  testedAt: Partial<Record<ProviderId, number>>;

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
  setTested: (provider: ProviderId) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: AccentTheme) => void;
  toggleLanguage: () => void;
  setSound: (v: boolean) => void;
  setBoot: (v: boolean) => void;
  markBootSeen: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  resetAll: () => void;
  factoryReset: () => void; // Clears everything EXCEPT apiKeys, baseUrls, models
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      providerId: "zai",
      apiKeys: {},
      baseUrls: {},
      models: {},
      testedAt: {},
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
      setTested: (provider) =>
        set((s) => ({ testedAt: { ...s.testedAt, [provider]: Date.now() } })),
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
          testedAt: {},
          language: "en",
          theme: "cyan",
          enableSound: false,
          enableBoot: true,
          hasSeenBoot: false,
          settingsOpen: false,
        }),
      factoryReset: () => {
        // Clear everything in settings EXCEPT apiKeys, baseUrls, models
        set((s) => ({
          providerId: "zai",
          apiKeys: s.apiKeys, // KEEP
          baseUrls: s.baseUrls, // KEEP
          models: s.models, // KEEP
          testedAt: s.testedAt, // KEEP
          language: "en",
          theme: "cyan",
          enableSound: false,
          enableBoot: true,
          hasSeenBoot: false,
          settingsOpen: false,
        }));
        // Also clear window store and module states
        if (typeof window !== "undefined") {
          localStorage.removeItem("morphos-window-store");
          localStorage.removeItem("morphos-module-states");
          // Reload to apply
          window.location.reload();
        }
      },
    }),
    {
      name: "morphos-settings",
      storage: createJSONStorage(() => safeLocalStorage),
      // Don't persist settingsOpen
      partialize: (s) => ({
        providerId: s.providerId,
        apiKeys: s.apiKeys,
        baseUrls: s.baseUrls,
        models: s.models,
        testedAt: s.testedAt,
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
    // Trim: pasted keys/URLs often carry trailing whitespace that breaks auth
    apiKey: (s.apiKeys[s.providerId] ?? "").trim(),
    baseUrl: (s.baseUrls[s.providerId] ?? "").trim(),
    model: (s.models[s.providerId] ?? "").trim(),
  };
}
