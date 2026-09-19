"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings-store";

/** Keep <html lang> in sync with the interface language (screen readers, hyphenation). */
export function LangSync() {
  const language = useSettings((s) => s.language);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return null;
}
