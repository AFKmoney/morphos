"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CornerDownLeft, ArrowUp, ArrowDown, LayoutGrid, Layers } from "lucide-react";
import { useWindowStore, type ModuleType } from "@/lib/window-store";
import { MODULE_REGISTRY, getModuleMeta, getDefaultModuleSize } from "./module-registry";
import { useSettings } from "@/lib/settings-store";
import { useT } from "@/lib/use-t";
import { useAIContext } from "@/lib/ai-context-store";
import { cn } from "@/lib/utils";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ElementType;
  accent: string;
  action: () => void;
  group: "spawn" | "system";
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const spawnWindow = useWindowStore((s) => s.spawnWindow);
  const windows = useWindowStore((s) => s.windows);
  const closeAll = useWindowStore((s) => s.closeAll);
  const updateGeometry = useWindowStore((s) => s.updateGeometry);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const openSettings = useSettings((s) => s.openSettings);
  const toggleLanguage = useSettings((s) => s.toggleLanguage);
  const fr = useSettings((s) => s.language) === "fr";
  const recentModules = useAIContext((s) => s.recentModules);
  const addRecentModule = useAIContext((s) => s.addRecentModule);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  function quickSpawn(type: ModuleType) {
    const meta = getModuleMeta(type);
    const def = getDefaultModuleSize(type);
    const offset = windows.length;
    const col = offset % 3;
    const row = Math.floor(offset / 3) % 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const colWidth = Math.min(420, Math.max(280, Math.floor((vw - 80) / 3)));
    const baseX = 60 + col * (colWidth + 30);
    const baseY = 56 + row * 220;
    spawnWindow({
      type,
      title: t(`module.${type}`) !== `module.${type}` ? t(`module.${type}`) : meta.label,
      subtitle: meta.description,
      x: Math.max(20, Math.min(vw - def.width - 20, baseX)),
      y: Math.max(56, Math.min(vh - def.height - 100, baseY)),
      width: def.width,
      height: def.height,
    });
    addRecentModule(type);
    onClose();
  }

  function tileWindows() {
    const wins = windows.filter((w) => !w.minimized);
    if (wins.length === 0) return;
    const cols = Math.ceil(Math.sqrt(wins.length));
    const rows = Math.ceil(wins.length / cols);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const top = 48;
    const cw = Math.floor((vw - 16) / cols);
    const ch = Math.floor((vh - top - 16) / rows);
    wins.forEach((w, i) => {
      if (w.maximized) toggleMaximize(w.id);
      updateGeometry(w.id, {
        x: 8 + (i % cols) * cw,
        y: top + 8 + Math.floor(i / cols) * ch,
        width: Math.max(280, cw - 8),
        height: Math.max(200, ch - 8),
      });
    });
    onClose();
  }

  function cascadeWindows() {
    const wins = windows.filter((w) => !w.minimized);
    if (wins.length === 0) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    wins.forEach((w, i) => {
      if (w.maximized) toggleMaximize(w.id);
      const k = i % 10;
      updateGeometry(w.id, {
        x: Math.max(8, Math.min(vw - 300, 60 + k * 36)),
        y: Math.max(56, Math.min(vh - 220, 56 + k * 36)),
      });
    });
    onClose();
  }

  const commands: Command[] = [
    ...Object.values(MODULE_REGISTRY)
      .filter((m) => m.type !== "custom")
      .map((m) => ({
        id: `spawn-${m.type}`,
        label: t(`module.${m.type}`) !== `module.${m.type}` ? t(`module.${m.type}`) : m.label,
        hint: m.description,
        icon: m.icon,
        accent: m.accent,
        action: () => quickSpawn(m.type),
        group: "spawn" as const,
      })),
    { id: "settings", label: t("settings.title"), hint: t("settings.subtitle"), icon: Settings2, accent: "#22d3ee", action: () => { openSettings(); onClose(); }, group: "system" },
    { id: "lang", label: "Toggle language (EN/FR)", hint: "Switch interface language", icon: Globe, accent: "#34d399", action: () => { toggleLanguage(); onClose(); }, group: "system" },
    { id: "close-all", label: t("topbar.closeAll"), hint: "Close every window", icon: XCircle, accent: "#f43f5e", action: () => { closeAll(); onClose(); }, group: "system" },
    { id: "tile", label: "Tile windows", hint: "Arrange all windows in a grid", icon: LayoutGrid, accent: "#22d3ee", action: tileWindows, group: "system" },
    { id: "cascade", label: "Cascade windows", hint: "Stack all windows diagonally", icon: Layers, accent: "#a78bfa", action: cascadeWindows, group: "system" },
  ];

  const searched = query
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q) || c.id.includes(q);
      })
    : commands;
  // Real usage first: recently spawned modules float to the top when no query
  const recentCmds: Command[] = !query
    ? recentModules
        .map((rt) => commands.find((c) => c.id === `spawn-${rt}`))
        .filter((c): c is Command => !!c)
    : [];
  const recentIds = new Set(recentCmds.map((c) => c.id));
  const filtered = [...recentCmds, ...searched.filter((c) => !recentIds.has(c.id))];

  const safeSelected = Math.min(selected, Math.max(0, filtered.length - 1));

  // Keep the keyboard-selected item visible while navigating.
  useEffect(() => {
    itemRefs.current[safeSelected]?.scrollIntoView({ block: "nearest" });
  }, [safeSelected, open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const cmd = filtered[safeSelected]; if (cmd) cmd.action(); }
    else if (e.key === "Escape") onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed top-[10%] sm:top-[16%] left-1/2 -translate-x-1/2 z-[1101] glass-panel-strong rounded-2xl overflow-hidden w-[600px] max-w-[94vw]"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <Search className="w-4 h-4 text-cyan-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search commands, modules, settings…"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
              />
              <kbd className="text-[10px] text-white/40 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            <div className="max-h-[min(420px,58vh)] overflow-y-auto thin-scroll p-2">
              {filtered.length === 0 ? (
                <div className="text-center text-white/40 text-sm py-8">No results for "{query}"</div>
              ) : (
                filtered.map((cmd, i) => {
                  const Icon = cmd.icon;
                  const isSelected = i === safeSelected;
                  const showRecentHd = !query && recentCmds.length > 0 && i === 0;
                  const showAllHd = !query && recentCmds.length > 0 && i === recentCmds.length;
                  return (
                    <div key={cmd.id}>
                    {(showRecentHd || showAllHd) && (
                      <div className="text-[9px] uppercase tracking-widest text-white/35 font-mono px-3 pt-2 pb-0.5">
                        {showRecentHd ? (fr ? "Récents" : "Recent") : (fr ? "Tous les modules" : "All modules")}
                      </div>
                    )}
                    <button
                      ref={(el) => {
                        itemRefs.current[i] = el;
                      }}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelected(i)}
                      className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition", isSelected ? "bg-cyan-500/15" : "hover:bg-white/5")}
                    >
                      <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: `${cmd.accent}20`, border: `1px solid ${cmd.accent}40` }}>
                        <Icon className="w-4 h-4" style={{ color: cmd.accent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{cmd.label}</div>
                        {cmd.hint && <div className="text-[10px] text-white/40 truncate">{cmd.hint}</div>}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-white/50">{cmd.group}</span>
                      {isSelected && <CornerDownLeft className="w-3 h-3 text-cyan-400" />}
                    </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-3 px-4 py-2 border-t border-white/10 text-[10px] text-white/40">
              <span className="flex items-center gap-1"><ArrowUp className="w-2.5 h-2.5" /><ArrowDown className="w-2.5 h-2.5" /> navigate</span>
              <span className="flex items-center gap-1"><CornerDownLeft className="w-2.5 h-2.5" /> select</span>
              <span className="ml-auto">{filtered.length} commands</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Settings2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function Globe(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
      <path d="M2 12h20"/>
    </svg>
  );
}
function XCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <path d="m15 9-6 6"/><path d="m9 9 6 6"/>
    </svg>
  );
}
