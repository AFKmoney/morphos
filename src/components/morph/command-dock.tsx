"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/lib/window-store";
import { getModuleMeta } from "./module-registry";
import { Sparkles, Send, X, Plus, Layers, Zap, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommandDock() {
  const windows = useWindowStore((s) => s.windows);
  const chatMessages = useWindowStore((s) => s.chatMessages);
  const isInterpreting = useWindowStore((s) => s.isInterpreting);
  const addChatMessage = useWindowStore((s) => s.addChatMessage);
  const setInterpreting = useWindowStore((s) => s.setInterpreting);
  const showSpawnPreview = useWindowStore((s) => s.showSpawnPreview);
  const hideSpawnPreview = useWindowStore((s) => s.hideSpawnPreview);
  const spawnWindow = useWindowStore((s) => s.spawnWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const restoreWindow = useWindowStore((s) => s.restoreWindow);
  const [showPanel, setShowPanel] = useState(false);

  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || isInterpreting) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    addChatMessage({ role: "user", content: text });
    setInterpreting(true);

    try {
      const history = chatMessages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, history }),
      });
      const data = await res.json();
      showSpawnPreview({ code: data.codePreview, title: data.title, moduleType: data.moduleType });
      await new Promise((r) => setTimeout(r, 1600));
      addChatMessage({ role: "assistant", content: data.aiMessage });

      const def = getModuleDefaultSize(data.moduleType);
      const offset = windows.length;
      const col = offset % 3;
      const row = Math.floor(offset / 3) % 2;
      const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      const colWidth = Math.min(420, Math.max(280, Math.floor((vw - 80) / 3)));
      const baseX = 60 + col * (colWidth + 30);
      const baseY = 80 + row * 220;
      spawnWindow({
        type: data.moduleType,
        title: data.title,
        subtitle: data.subtitle,
        x: Math.max(20, Math.min(vw - def.width - 20, baseX)),
        y: Math.max(60, Math.min(vh - def.height - 100, baseY)),
        width: def.width,
        height: def.height,
        config: data.config,
      });
      hideSpawnPreview();
    } catch (e) {
      addChatMessage({ role: "assistant", content: "Échec du hot-reload. Réessaie." });
      hideSpawnPreview();
    } finally {
      setInterpreting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const minimized = windows.filter((w) => w.minimized);
  const visible = windows.filter((w) => !w.minimized);

  return (
    <>
      {/* Minimized windows strip (top of dock) */}
      <AnimatePresence>
        {minimized.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-[88px] left-1/2 -translate-x-1/2 z-50 flex gap-1.5"
          >
            {minimized.map((w) => {
              const meta = getModuleMeta(w.type);
              const Icon = meta.icon;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    restoreWindow(w.id);
                    focusWindow(w.id);
                  }}
                  className="glass-panel rounded-md px-2 py-1 flex items-center gap-1.5 text-[10px] text-white/70 hover:text-white"
                >
                  <Icon className="w-2.5 h-2.5" style={{ color: meta.accent }} />
                  {w.title}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating chat panel (above dock) */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="fixed bottom-[84px] left-1/2 -translate-x-1/2 z-50 glass-panel-strong rounded-xl overflow-hidden w-[440px] max-w-[94vw] h-[420px] flex flex-col"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/40">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-300">MorphOS console</span>
              <button
                onClick={() => setShowPanel(false)}
                className="ml-auto text-white/40 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <ChatHistory />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main command bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-[640px] max-w-[94vw]">
        <div className="glass-panel-strong rounded-full pl-3 pr-1 py-1 flex items-center gap-2 w-full shadow-2xl">
          <button
            onClick={() => setShowPanel((v) => !v)}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition",
              showPanel ? "bg-cyan-500/30 text-cyan-300" : "bg-white/5 text-white/60 hover:text-white"
            )}
            title="Historique du chat"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const ta = e.target;
              ta.style.height = "auto";
              ta.style.height = Math.min(ta.scrollHeight, 80) + "px";
            }}
            onKeyDown={onKeyDown}
            placeholder={isIntertingPlaceholder(isInterpreting)}
            disabled={isInterpreting}
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none resize-none py-1.5 min-h-[36px] max-h-[80px] thin-scroll"
            spellCheck={false}
          />
          <button
            onClick={send}
            disabled={!input.trim() || isInterpreting}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-black flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition"
          >
            {isInterpreting ? (
              <Hexagon className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-white/30">
          <span className="flex items-center gap-1">
            <Zap className="w-2 h-2 text-cyan-400" />
            hot-reload
          </span>
          <span>·</span>
          <span>{visible.length} module{visible.length > 1 ? "s" : ""} actif{visible.length > 1 ? "s" : ""}</span>
          <span>·</span>
          <span className="font-mono text-white/40">⏎ pour faire apparaître un module</span>
        </div>
      </div>
    </>
  );
}

function isIntertingPlaceholder(isInterpreting: boolean) {
  return isInterpreting ? "MorphOS écrit…" : "Dis-moi ce dont tu as besoin… (ex : « deviens un moniteur système »)";
}

function ChatHistory() {
  const chatMessages = useWindowStore((s) => s.chatMessages);
  const isInterpreting = useWindowStore((s) => s.isInterpreting);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages.length, isInterpreting]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 thin-scroll">
      {chatMessages.map((m) => (
        <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
          <div
            className={cn(
              "max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed",
              m.role === "user"
                ? "bg-cyan-500/15 border border-cyan-400/25 text-cyan-50"
                : "bg-white/5 border border-white/10 text-white/90"
            )}
          >
            {m.role === "assistant" && (
              <div className="text-[9px] uppercase tracking-wider text-cyan-400/70 mb-1 flex items-center gap-1">
                <Sparkles className="w-2 h-2" /> MorphOS
              </div>
            )}
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        </div>
      ))}
      {isInterpreting && (
        <div className="flex items-center gap-2 text-[10px] text-cyan-300/80">
          <Sparkles className="w-2.5 h-2.5 animate-pulse" />
          <span className="shimmer-text">écriture du module en cours…</span>
        </div>
      )}
    </div>
  );
}

function getModuleDefaultSize(type: string) {
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
