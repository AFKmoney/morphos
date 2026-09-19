"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/lib/window-store";
import { MODULE_REGISTRY, getModuleMeta, getDefaultModuleSize as getDefaultSize } from "./module-registry";
import { Hexagon, Grid3x3, X, Plus, Activity, Settings, Globe, Cpu, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/use-t";
import { useSettings } from "@/lib/settings-store";
import { PROVIDERS } from "@/lib/providers";


export function TopBar({ onOpenWorkspaces }: { onOpenWorkspaces: () => void }) {
  const t = useT();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Listen for context menu "open palette" event
  useEffect(() => {
    function onOpenPalette() { setPaletteOpen(true); }
    window.addEventListener("morphos-open-palette", onOpenPalette);
    return () => window.removeEventListener("morphos-open-palette", onOpenPalette);
  }, []);

  const windows = useWindowStore((s) => s.windows);
  const spawnWindow = useWindowStore((s) => s.spawnWindow);
  const closeAll = useWindowStore((s) => s.closeAll);
  const isInterpreting = useWindowStore((s) => s.isInterpreting);

  const providerId = useSettings((s) => s.providerId);
  const language = useSettings((s) => s.language);
  const toggleLanguage = useSettings((s) => s.toggleLanguage);
  const openSettings = useSettings((s) => s.openSettings);
  const providerCfg = PROVIDERS[providerId];

  function quickSpawn(type: keyof typeof MODULE_REGISTRY) {
    const meta = getModuleMeta(type);
    const def = getDefaultSize(type);
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
      subtitle: t(`module.${type}.desc`) !== `module.${type}.desc` ? t(`module.${type}.desc`) : meta.description,
      x: Math.max(20, Math.min(vw - def.width - 20, baseX)),
      y: Math.max(56, Math.min(vh - def.height - 100, baseY)),
      width: def.width,
      height: def.height,
    });
    setPaletteOpen(false);
  }

  const moduleLabel = windows.length === 1
    ? t("topbar.moduleCount", { count: windows.length })
    : t("topbar.moduleCountPlural", { count: windows.length });

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
              Morph<span className="text-cyan-400">OS</span>
            </div>
            <div className="text-[9px] text-white/40 leading-none mt-0.5 font-mono">
              {t("app.subtitle")}
            </div>
          </div>
        </div>

        {/* Provider badge */}
        <button
          onClick={openSettings}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/30 border border-white/8 hover:border-white/20 transition group"
          title={`${providerCfg.label} · click to change`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full badge-pulse"
            style={{ background: providerCfg.accent, boxShadow: `0 0 6px ${providerCfg.accent}` }}
          />
          <span className="text-[10px] text-white/70 font-mono hidden sm:inline">{providerCfg.label}</span>
          <Cpu className="w-2.5 h-2.5 text-white/40 group-hover:text-white/70" />
        </button>

        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-[10px] text-white/40 font-mono">{moduleLabel}</span>
          {isInterpreting && (
            <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
              <Activity className="w-2.5 h-2.5 animate-pulse" />
              {t("topbar.writing")}
            </span>
          )}
        </div>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-white/60 hover:text-white hover:bg-white/5 transition"
          title={t("topbar.language")}
        >
          <Globe className="w-3 h-3" />
          <span className="text-[10px] font-mono uppercase">{language}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPaletteOpen(true)}
            className="text-[11px] px-2.5 py-1.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/25 flex items-center gap-1.5"
          >
            <Grid3x3 className="w-3 h-3" />
            <span className="hidden sm:inline">{t("topbar.modules")}</span>
          </button>
          <button
            onClick={onOpenWorkspaces}
            className="text-[11px] px-2 py-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-1"
            title="Workspaces (⌘⇧S)"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={openSettings}
            className="text-[11px] px-2 py-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-1"
            title={t("topbar.settings")}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          {windows.length > 0 && (
            <button
              onClick={closeAll}
              className="text-[11px] px-2.5 py-1.5 rounded-md text-white/50 hover:text-rose-400 hover:bg-rose-500/10 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span className="hidden sm:inline">{t("topbar.closeAll")}</span>
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
                  <div className="text-base font-semibold text-white">{t("palette.title")}</div>
                  <div className="text-[11px] text-white/50">{t("palette.subtitle")}</div>
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
                      onClick={() => quickSpawn(m.type as keyof typeof MODULE_REGISTRY)}
                      className="group bg-black/30 hover:bg-black/50 border border-white/8 hover:border-white/20 rounded-lg p-3 text-left transition flex flex-col gap-2"
                    >
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center"
                        style={{ background: `${m.accent}20`, border: `1px solid ${m.accent}40` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: m.accent }} />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white">
                          {t(`module.${m.type}`) !== `module.${m.type}` ? t(`module.${m.type}`) : m.label}
                        </div>
                        <div className="text-[10px] text-white/40 leading-tight mt-0.5">
                          {t(`module.${m.type}.desc`) !== `module.${m.type}.desc` ? t(`module.${m.type}.desc`) : m.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[10px] text-white/40">
                <Plus className="w-2.5 h-2.5" />
                {t("palette.hint")}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
