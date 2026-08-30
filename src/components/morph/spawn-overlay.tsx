"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/lib/window-store";
import { getModuleMeta } from "./module-registry";
import { Sparkles, Terminal as TerminalIcon } from "lucide-react";
import { useT } from "@/lib/use-t";

export function SpawnOverlay() {
  const t = useT();
  const preview = useWindowStore((s) => s.spawnPreview);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    if (!preview) {
      queueMicrotask(() => setVisibleLines([]));
      return;
    }
    const codeLines: string[] = Array.isArray(preview.code)
      ? preview.code.map((l) => (typeof l === "string" ? l : String(l ?? "")))
      : [];
    queueMicrotask(() => setVisibleLines([]));
    let i = 0;
    const id = setInterval(() => {
      if (i >= codeLines.length) {
        clearInterval(id);
        return;
      }
      setVisibleLines((prev) => [...prev, codeLines[i]]);
      i++;
    }, 80);
    return () => clearInterval(id);
  }, [preview]);

  return (
    <AnimatePresence>
      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] glass-panel-strong rounded-xl overflow-hidden w-[560px] max-w-[94vw]"
          style={{ boxShadow: `0 0 60px -10px ${getModuleMeta(preview.moduleType).accent}40` }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-xs font-mono text-cyan-300">{t("spawn.engine")}</span>
            </div>
            <div className="text-[10px] text-white/40 ml-2">
              {t("spawn.writing")} <span className="text-white/70 font-mono">{preview.moduleType}</span>
            </div>
            <div className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1 h-1 rounded-full bg-emerald-400 live-dot" />
              {t("spawn.hotreload")}
            </div>
          </div>

          {/* Code body */}
          <div className="p-4 font-mono text-[11px] leading-5 max-h-[280px] overflow-y-auto thin-scroll bg-black/50">
            <div className="flex items-center gap-1.5 text-[10px] text-white/40 mb-2">
              <TerminalIcon className="w-3 h-3" />
              <span>{t("spawn.writingFile")} <span className="text-cyan-300">{preview.moduleType}.tsx</span></span>
            </div>
            <div className="space-y-0.5">
              {visibleLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-pre"
                  dangerouslySetInnerHTML={{ __html: highlightLine(line) }}
                />
              ))}
              {visibleLines.length < (Array.isArray(preview.code) ? preview.code.length : 0) && (
                <div className="text-cyan-400 cursor-blink inline-block">&nbsp;</div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-black/40">
            <div className="text-[10px] text-white/40">
              {t("spawn.mounting", { title: preview.title })}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-24 h-1 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ background: `linear-gradient(90deg, ${getModuleMeta(preview.moduleType).accent}, #34d399)` }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] font-mono text-cyan-300">
                {Math.min(100, Math.round((visibleLines.length / Math.max(1, Array.isArray(preview.code) ? preview.code.length : 1)) * 100))}%
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function highlightLine(line: string): string {
  if (typeof line !== "string") return "";
  let out = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  out = out.replace(/(\/\/.*$)/gm, '<span style="color:#64748b">$1</span>');
  out = out.replace(/(['"`])([^'"`\n]*?)\1/g, '<span style="color:#fbbf24">$1$2$1</span>');
  out = out.replace(
    /\b(import|from|export|function|return|const|let|var|new|class|interface|type|extends|async|await)\b/g,
    '<span style="color:#22d3ee">$1</span>'
  );
  out = out.replace(/(&lt;\/?)([A-Za-z][A-Za-z0-9]*)/g, '$1<span style="color:#f472b6">$2</span>');
  out = out.replace(/\b(\d+)\b/g, '<span style="color:#34d399">$1</span>');
  return out;
}
