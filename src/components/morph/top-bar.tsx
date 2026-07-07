"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/lib/window-store";
import { MODULE_REGISTRY, getModuleMeta } from "./module-registry";
import { Hexagon, Grid3x3, X, Plus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopBar() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const windows = useWindowStore((s) => s.windows);
  const spawnWindow = useWindowStore((s) => s.spawnWindow);
  const closeAll = useWindowStore((s) => s.closeAll);
  const isInterpreting = useWindowStore((s) => s.isInterpreting);

  function quickSpawn(type: keyof typeof MODULE_REGISTRY) {
    const meta = getModuleMeta(type);
    const def = getDefaultSize(type);
    const offset = windows.length;
    const col = offset % 3;
    const row = Math.floor(offset / 3) % 2;
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const colWidth = Math.min(420, Math.max(280, Math.floor((vw - 80) / 3)));
    const baseX = 60 + col * (colWidth + 30);
    const baseY = 80 + row * 220;
    spawnWindow({
      type,
      title: meta.label,
      subtitle: meta.description,
      x: Math.max(20, Math.min(vw - def.width - 20, baseX)),
      y: Math.max(60, Math.min(vh - def.height - 100, baseY)),
      width: def.width,
      height: def.height,
    });
    setPaletteOpen(false);
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 h-12 glass-panel border-b border-white/8 flex items-center px-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Hexagon className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 live-dot" />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-white tracking-tight leading-none">
              MorphOS
            </div>
            <div className="text-[9px] text-white/40 leading-none mt-0.5">
              self-writing interface · v0.9.4
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-[10px] text-white/40 font-mono">
            {windows.length} module{windows.length > 1 ? "s" : ""} monté{windows.length > 1 ? "s" : ""}
          </span>
          {isInterpreting && (
            <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
              <Activity className="w-2.5 h-2.5 animate-pulse" />
              écriture en cours
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPaletteOpen(true)}
            className="text-[11px] px-2.5 py-1.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/25 flex items-center gap-1.5"
          >
            <Grid3x3 className="w-3 h-3" />
            Modules
          </button>
          {windows.length > 0 && (
            <button
              onClick={closeAll}
              className="text-[11px] px-2.5 py-1.5 rounded-md text-white/50 hover:text-rose-400 hover:bg-rose-500/10 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Tout fermer
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {paletteOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setPaletteOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 glass-panel-strong rounded-2xl p-5 w-[680px] max-w-[94vw] max-h-[80vh] overflow-y-auto thin-scroll"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-base font-semibold text-white">Registre des modules</div>
                  <div className="text-[11px] text-white/50">Spawn manuel · hot-swap ready</div>
                </div>
                <button
                  onClick={() => setPaletteOpen(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(MODULE_REGISTRY).map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.type}
                      onClick={() => quickSpawn(m.type)}
                      className={cn(
                        "group bg-black/30 hover:bg-black/50 border border-white/8 hover:border-white/20 rounded-lg p-3 text-left transition flex flex-col gap-2"
                      )}
                      style={{ ["--accent" as string]: m.accent }}
                    >
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center"
                        style={{ background: `${m.accent}20`, border: `1px solid ${m.accent}40` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: m.accent }} />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white">{m.label}</div>
                        <div className="text-[10px] text-white/40 leading-tight mt-0.5">{m.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[10px] text-white/40">
                <Plus className="w-2.5 h-2.5" />
                Astuce : préfère le chat (en bas) pour spawn en langage naturel — l'IA choisit le module tout seul.
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function getDefaultSize(type: string) {
  const map: Record<string, { width: number; height: number }> = {
    chat: { width: 460, height: 560 },
    monitor: { width: 540, height: 420 },
    dashboard: { width: 720, height: 480 },
    terminal: { width: 600, height: 380 },
    kanban: { width: 680, height: 460 },
    notes: { width: 480, height: 460 },
    code: { width: 680, height: 480 },
    weather: { width: 380, height: 460 },
    clock: { width: 360, height: 240 },
    music: { width: 420, height: 480 },
    calculator: { width: 320, height: 440 },
    stock: { width: 540, height: 380 },
    camera: { width: 480, height: 420 },
    metrics: { width: 560, height: 380 },
  };
  return map[type] ?? { width: 480, height: 400 };
}
