"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/lib/window-store";
import { getModuleMeta } from "./module-registry";
import { Sparkles, Send, X, Layers, Zap, Hexagon, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/use-t";
import { useSettings, buildProviderPayload } from "@/lib/settings-store";

const MODULE_SIZES: Record<string, { width: number; height: number }> = {
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
  pomodoro: { width: 320, height: 420 },
  paint: { width: 580, height: 480 },
  regex: { width: 540, height: 520 },
  json: { width: 560, height: 440 },
  colorpicker: { width: 380, height: 540 },
  qr: { width: 360, height: 480 },
  devtools: { width: 480, height: 540 },
  files: { width: 580, height: 460 },
  browser: { width: 720, height: 560 },
  calendar: { width: 380, height: 480 },
  whiteboard: { width: 580, height: 480 },
  custom: { width: 460, height: 420 },
};

function getDefaultSize(type: string) {
  return MODULE_SIZES[type] ?? { width: 480, height: 400 };
}

// Top bar height — windows can't go above this
export const TOP_BAR_HEIGHT = 48;

export function CommandDock() {
  const t = useT();
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
  const language = useSettings((s) => s.language);

  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Hover-to-reveal state
  const [dockVisible, setDockVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Track mouse position to reveal dock when hovering at the bottom
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const vh = window.innerHeight;
      const inBottomZone = e.clientY > vh - 60;
      const overDock = dockRef.current?.matches(":hover") ?? false;

      if (inBottomZone || overDock) {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        setDockVisible(true);
      } else if (!isFocused && !isInterpreting && !showPanel) {
        // Delay hiding to allow moving mouse into the dock
        if (!hideTimerRef.current) {
          hideTimerRef.current = setTimeout(() => {
            setDockVisible(false);
            hideTimerRef.current = null;
          }, 400);
        }
      }
    }
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isFocused, isInterpreting, showPanel]);

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
        body: JSON.stringify({
          prompt: text,
          history,
          language,
          provider: buildProviderPayload(),
          context: {
            activeWindows: windows.filter(w => !w.minimized).map(w => ({ type: w.type, title: w.title })),
            totalWindows: windows.length,
          },
        }),
      });
      const data = await res.json();

      if (data.error) {
        addChatMessage({ role: "assistant", content: `⚠️ ${data.error}` });
        setInterpreting(false);
        return;
      }

      let customCode: string | undefined;
      let displayTitle = data.title;
      if (data.moduleType === "custom" && data.prompt) {
        showSpawnPreview({
          code: [
            `// MorphOS — AI generating custom module`,
            `// Prompt: ${data.prompt}`,
            ``,
            `import { forge } from "@morphos/forge";`,
            ``,
            `export const customModule = forge({`,
            `  prompt: "${data.prompt.slice(0, 60)}",`,
            `  live: true,`,
            `  selfWriting: true,`,
            `});`,
            ``,
            `// → asking LLM to write the component…`,
          ],
          title: data.title,
          moduleType: data.moduleType,
        });
        await new Promise((r) => setTimeout(r, 1600));

        try {
          const genRes = await fetch("/api/generate-module", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: data.prompt, provider: buildProviderPayload() }),
          });
          const genData = await genRes.json();
          if (genData.code) {
            customCode = genData.code;
            displayTitle = genData.title || data.title;
          }
        } catch (e) {
          addChatMessage({ role: "assistant", content: t("chat.fail") });
          hideSpawnPreview();
          setInterpreting(false);
          return;
        }

        addChatMessage({ role: "assistant", content: data.aiMessage });
        showSpawnPreview({
          code: (customCode || "").split("\n").slice(0, 30),
          title: displayTitle,
          moduleType: data.moduleType,
        });
        await new Promise((r) => setTimeout(r, 1200));
      } else {
        showSpawnPreview({ code: data.codePreview, title: data.title, moduleType: data.moduleType });
        await new Promise((r) => setTimeout(r, 1600));
        addChatMessage({ role: "assistant", content: data.aiMessage });
      }

      const def = getDefaultSize(data.moduleType);
      const offset = windows.length;
      const col = offset % 3;
      const row = Math.floor(offset / 3) % 2;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const colWidth = Math.min(420, Math.max(280, Math.floor((vw - 80) / 3)));
      const baseX = 60 + col * (colWidth + 30);
      const baseY = TOP_BAR_HEIGHT + 20 + row * 220;
      spawnWindow({
        type: data.moduleType,
        title: displayTitle,
        subtitle: data.subtitle,
        x: Math.max(20, Math.min(vw - def.width - 20, baseX)),
        y: Math.max(TOP_BAR_HEIGHT + 8, Math.min(vh - def.height - 100, baseY)),
        width: def.width,
        height: def.height,
        config: data.config,
        code: customCode,
        prompt: data.prompt,
      });
      hideSpawnPreview();
    } catch (e) {
      addChatMessage({ role: "assistant", content: t("chat.fail") });
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

  // Dock is visible when: hovering bottom zone, focused, interpreting, or panel open
  const showDock = dockVisible || isFocused || isInterpreting || showPanel;

  return (
    <>
      {/* Minimized windows strip — always visible */}
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

      {/* Chat history panel */}
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
              <span className="text-xs font-mono text-cyan-300">{t("app.title")} console</span>
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

      {/* Hover hint indicator (always visible, subtle) */}
      <AnimatePresence>
        {!showDock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-1 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center gap-0.5"
          >
            <ChevronUp className="w-3 h-3 text-cyan-400/40 animate-bounce" />
            <span className="text-[8px] text-white/20 font-mono tracking-wider uppercase">hover to chat</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main command bar — slides up on hover */}
      <AnimatePresence>
        {showDock && (
          <motion.div
            ref={dockRef}
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-[640px] max-w-[94vw]"
          >
            <div className="glass-panel-strong rounded-full pl-3 pr-1 py-1 flex items-center gap-2 w-full shadow-2xl">
              <button
                onClick={() => setShowPanel((v) => !v)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition",
                  showPanel ? "bg-cyan-500/30 text-cyan-300" : "bg-white/5 text-white/60 hover:text-white"
                )}
                title={t("dock.history")}
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
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={isInterpreting ? t("dock.placeholderInterpreting") : t("dock.placeholder")}
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
                {t("dock.hotreload")}
              </span>
              <span>·</span>
              <span>
                {visible.length} module{visible.length > 1 ? "s" : ""} {visible.length > 1 ? t("dock.activePlural") : t("dock.active")}
              </span>
              <span>·</span>
              <span className="font-mono text-white/40">{t("dock.hint")}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChatHistory() {
  const chatMessages = useWindowStore((s) => s.chatMessages);
  const isInterpreting = useWindowStore((s) => s.isInterpreting);
  const t = useT();
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
          <span className="shimmer-text">{t("dock.interpreting")}</span>
        </div>
      )}
    </div>
  );
}
