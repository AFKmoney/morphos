"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Minus, Square, Copy as Restore, Layers, Grid3x3,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  Settings, Trash2, Edit3, Sparkles, Wand2,
} from "lucide-react";
import { useWindowStore, type MorphWindow } from "@/lib/window-store";
import { getModuleInfo } from "./module-registry";
import { useSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  target: "window" | "canvas" | "taskbar-item";
  windowId?: string;
}

interface MenuItem {
  label: string;
  icon?: React.ElementType;
  action: () => void;
  separator?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

export function ContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    target: "canvas",
  });

  const windows = useWindowStore((s) => s.windows);
  const activeId = useWindowStore((s) => s.activeId);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const snapWindow = useWindowStore((s) => s.snapWindow);
  const closeAll = useWindowStore((s) => s.closeAll);
  const openSettings = useSettings((s) => s.openSettings);

  useEffect(() => {
    function onContextMenu(e: MouseEvent) {
      // Find if we right-clicked on a window
      const target = e.target as HTMLElement;
      const windowEl = target.closest("[data-window-id]") as HTMLElement | null;

      if (windowEl) {
        e.preventDefault();
        const winId = windowEl.dataset.windowId!;
        setMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          target: "window",
          windowId: winId,
        });
      } else {
        // Check if on taskbar item (bottom)
        if (e.clientY > window.innerHeight - 100) return; // don't interfere with dock

        // Canvas context menu
        e.preventDefault();
        setMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          target: "canvas",
        });
      }
    }

    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);

  function close() {
    setMenu(m => ({ ...m, visible: false }));
  }

  useEffect(() => {
    function onClick() { close(); }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
    if (menu.visible) {
      document.addEventListener("click", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu.visible]);

  const win = menu.windowId ? windows.find(w => w.id === menu.windowId) : null;

  let items: MenuItem[] = [];

  if (menu.target === "window" && win) {
    const info = getModuleInfo(win.type);
    items = [
      { label: `Focus · ${info.label}`, icon: Sparkles, action: () => focusWindow(win.id) },
      { label: "Minimize", icon: Minus, action: () => minimizeWindow(win.id) },
      { label: win.maximized ? "Restore" : "Maximize", icon: win.maximized ? Restore : Square, action: () => toggleMaximize(win.id) },
      { label: "Snap Left", icon: ArrowLeft, action: () => snapWindow(win.id, "left") },
      { label: "Snap Right", icon: ArrowRight, action: () => snapWindow(win.id, "right") },
      { label: "Snap Top", icon: ArrowUp, action: () => snapWindow(win.id, "top") },
      { label: "Snap Bottom", icon: ArrowDown, action: () => snapWindow(win.id, "bottom") },
      { label: "Close", icon: X, action: () => closeWindow(win.id), danger: true, separator: true },
    ];
  } else if (menu.target === "canvas") {
    items = [
      { label: "Open Module Palette", icon: Grid3x3, action: () => {
        // Trigger the top bar palette via custom event
        window.dispatchEvent(new CustomEvent("morphos-open-palette"));
      }},
      { label: "Open Settings", icon: Settings, action: () => openSettings() },
      { label: `Windows: ${windows.length}`, icon: Layers, action: () => {}, disabled: true, separator: true },
    ];
    if (windows.length > 0) {
      items.push({ label: "Close All Windows", icon: Trash2, action: () => closeAll(), danger: true });
    }
  }

  // Adjust position if menu would go off screen
  const adjustedX = Math.min(menu.x, window.innerWidth - 220);
  const adjustedY = Math.min(menu.y, window.innerHeight - items.length * 32 - 20);

  return (
    <AnimatePresence>
      {menu.visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -5 }}
          transition={{ duration: 0.12 }}
          className="fixed z-[2000] glass-panel-strong rounded-lg overflow-y-auto thin-scroll py-1 min-w-[200px] max-h-[70vh] shadow-2xl"
          style={{ left: adjustedX, top: adjustedY }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) => (
            <div key={i}>
              {item.separator && <div className="h-px bg-white/8 my-1" />}
              <button
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    item.action();
                    close();
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition",
                  item.disabled
                    ? "text-white/30 cursor-default"
                    : item.danger
                    ? "text-rose-300 hover:bg-rose-500/15"
                    : "text-white/80 hover:bg-cyan-500/15 hover:text-white"
                )}
              >
                {item.icon && <item.icon className="w-3 h-3 shrink-0" />}
                <span className="flex-1">{item.label}</span>
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
