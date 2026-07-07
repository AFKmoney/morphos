"use client";

import { useEffect } from "react";
import { useWindowStore } from "@/lib/window-store";
import { useSettings } from "@/lib/settings-store";

interface KeyboardShortcutsProps {
  onOpenPalette: () => void;
  onOpenWorkspaces: () => void;
}

export function useKeyboardShortcuts({ onOpenPalette, onOpenWorkspaces }: KeyboardShortcutsProps) {
  const windows = useWindowStore((s) => s.windows);
  const activeId = useWindowStore((s) => s.activeId);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const closeAll = useWindowStore((s) => s.closeAll);
  const snapWindow = useWindowStore((s) => s.snapWindow);
  const openSettings = useSettings((s) => s.openSettings);
  const toggleLanguage = useSettings((s) => s.toggleLanguage);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const cmd = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (cmd && e.key.toLowerCase() === "k") { e.preventDefault(); onOpenPalette(); return; }
      if (cmd && e.shiftKey && e.key.toLowerCase() === "s") { e.preventDefault(); onOpenWorkspaces(); return; }
      if (cmd && e.key === ",") { e.preventDefault(); openSettings(); return; }
      if (cmd && e.shiftKey && e.key.toLowerCase() === "l") { e.preventDefault(); toggleLanguage(); return; }
      if (cmd && e.shiftKey && e.key.toLowerCase() === "w") { e.preventDefault(); closeAll(); return; }

      if (isTyping) return;
      if (!activeId) return;

      if (cmd && e.key.toLowerCase() === "w" && !e.shiftKey) { e.preventDefault(); closeWindow(activeId); return; }
      if (cmd && e.key.toLowerCase() === "m") { e.preventDefault(); minimizeWindow(activeId); return; }
      if (cmd && e.key === "Enter") { e.preventDefault(); toggleMaximize(activeId); return; }

      if (cmd) {
        if (e.key === "ArrowLeft") { e.preventDefault(); snapWindow(activeId, e.shiftKey ? "tl" : "left"); }
        else if (e.key === "ArrowRight") { e.preventDefault(); snapWindow(activeId, e.shiftKey ? "tr" : "right"); }
        else if (e.key === "ArrowUp") { e.preventDefault(); snapWindow(activeId, "top"); }
        else if (e.key === "ArrowDown") { e.preventDefault(); snapWindow(activeId, e.shiftKey ? "br" : "bottom"); }
      }

      if (cmd && e.key === "Tab") {
        e.preventDefault();
        if (windows.length < 2) return;
        const sorted = [...windows].sort((a, b) => b.z - a.z);
        const currentIdx = sorted.findIndex((w) => w.id === activeId);
        const nextIdx = (currentIdx + 1) % sorted.length;
        focusWindow(sorted[nextIdx].id);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [windows, activeId, focusWindow, closeWindow, minimizeWindow, toggleMaximize, closeAll, snapWindow, openSettings, toggleLanguage, onOpenPalette, onOpenWorkspaces]);
}
