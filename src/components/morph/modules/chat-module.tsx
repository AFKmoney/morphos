"use client";

import { useEffect, useRef, useState } from "react";
import { useWindowStore } from "@/lib/window-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/use-t";
import { useSettings, buildProviderPayload } from "@/lib/settings-store";

interface ChatModuleProps {
  windowId: string;
}

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
};

function getDefaultSize(type: string) {
  return MODULE_SIZES[type] ?? { width: 480, height: 400 };
}

export function ChatModule({}: ChatModuleProps) {
  const t = useT();
  const chatMessages = useWindowStore((s) => s.chatMessages);
  const isInterpreting = useWindowStore((s) => s.isInterpreting);
  const addChatMessage = useWindowStore((s) => s.addChatMessage);
  const setInterpreting = useWindowStore((s) => s.setInterpreting);
  const showSpawnPreview = useWindowStore((s) => s.showSpawnPreview);
  const spawnWindow = useWindowStore((s) => s.spawnWindow);
  const windows = useWindowStore((s) => s.windows);
  const hideSpawnPreview = useWindowStore((s) => s.hideSpawnPreview);
  const language = useSettings((s) => s.language);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Seed welcome message when language changes
  const [welcomeSeeded, setWelcomeSeeded] = useState<string>("");
  useEffect(() => {
    if (language !== welcomeSeeded) {
      // Replace welcome message if it's the only one and matches old language
      setWelcomeSeeded(language);
      useWindowStore.setState((s) => {
        if (s.chatMessages.length === 1 && s.chatMessages[0].id === "welcome") {
          return {
            chatMessages: [
              { ...s.chatMessages[0], content: t("chat.welcome") },
            ],
          };
        }
        return {};
      });
    }
  }, [language, welcomeSeeded, t]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages.length, isInterpreting]);

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
        }),
      });
      const data = await res.json();

      if (data.error) {
        addChatMessage({ role: "assistant", content: `⚠️ ${data.error}` });
        setInterpreting(false);
        return;
      }

      // Show the "AI is writing code" preview
      showSpawnPreview({
        code: data.codePreview,
        title: data.title,
        moduleType: data.moduleType,
      });

      // Let the animation play for a beat
      await new Promise((r) => setTimeout(r, 1600));

      addChatMessage({ role: "assistant", content: data.aiMessage });

      // Spawn the window
      const def = getDefaultSize(data.moduleType);
      const offset = windows.length;
      const col = offset % 3;
      const row = Math.floor(offset / 3) % 2;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
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
      addChatMessage({
        role: "assistant",
        content: t("chat.fail"),
      });
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

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as never}>
        <div className="space-y-4">
          {chatMessages.map((m) => (
            <MessageBubble key={m.id} role={m.role} content={m.content} t={t} />
          ))}
          {isInterpreting && (
            <div className="flex items-center gap-2 text-xs text-cyan-300/80 px-1">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span className="shimmer-text">{t("chat.interpreting")}</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-white/10 p-3">
        <div className="relative">
          <Textarea
            ref={taRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const ta = e.target;
              ta.style.height = "auto";
              ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
            }}
            onKeyDown={onKeyDown}
            placeholder={t("chat.placeholder")}
            className="bg-black/30 border-white/10 text-sm resize-none pr-12 min-h-[44px] max-h-[120px] focus-visible:ring-cyan-400/40"
            rows={1}
            disabled={isInterpreting}
          />
          <Button
            size="icon"
            onClick={send}
            disabled={!input.trim() || isInterpreting}
            className="absolute right-1 bottom-1 h-8 w-8 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-white/40">
          <Zap className="w-2.5 h-2.5" />
          <span>{t("chat.hint")}</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ role, content, t }: { role: string; content: string; t: (k: string) => string }) {
  const isUser = role === "user";
  const isSystem = role === "system";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-cyan-500/15 border border-cyan-400/25 text-cyan-50"
            : isSystem
            ? "bg-white/5 border border-white/10 text-white/60 text-xs italic"
            : "bg-white/5 border border-white/10 text-white/90"
        )}
      >
        {!isUser && !isSystem && (
          <div className="text-[10px] uppercase tracking-wider text-cyan-400/70 mb-1 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            MorphOS
          </div>
        )}
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
