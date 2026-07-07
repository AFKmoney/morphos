"use client";

import { useSettings } from "./settings-store";
import { translate, type Language } from "./i18n";
import { useCallback } from "react";

export function useT() {
  const language = useSettings((s) => s.language);
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(language as Language, key, params),
    [language]
  );
  return t;
}

export function useLanguage() {
  return useSettings((s) => s.language);
}
