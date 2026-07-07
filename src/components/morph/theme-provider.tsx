"use client";

import { useEffect } from "react";
import { useSettings, ACCENT_COLORS } from "@/lib/settings-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettings((s) => s.theme);
  const accent = ACCENT_COLORS[theme];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--morph-accent", accent.primary);
    root.style.setProperty("--morph-accent-2", accent.secondary);
    root.style.setProperty("--morph-accent-rgb", accent.rgb);
  }, [accent]);

  return <>{children}</>;
}
