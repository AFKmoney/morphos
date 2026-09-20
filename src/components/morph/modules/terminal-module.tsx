"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/use-t";
import { useSettings } from "@/lib/settings-store";
import { useWindowStore, type ModuleType } from "@/lib/window-store";
import { MODULE_LIST, MODULE_REGISTRY, getDefaultModuleSize } from "@/components/morph/module-registry";
import { useModulePersist } from "@/lib/module-state-store";
import { useAIContext } from "@/lib/ai-context-store";

interface Line { kind: "in" | "out" | "sys"; text: string; }

const BOOT_TIME = Date.now();
const COMMANDS = ["help", "ls", "spawn", "ps", "whoami", "date", "echo", "morph", "clear"];

function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export function TerminalModule() {
  const t = useT();
  const language = useSettings((s) => s.language);
  const providerId = useSettings((s) => s.providerId);
  const windows = useWindowStore((s) => s.windows);
  const chatMessages = useWindowStore((s) => s.chatMessages);
  const spawnWindow = useWindowStore((s) => s.spawnWindow);
  const addRecentModule = useAIContext((s) => s.addRecentModule);
  const [lines, setLines] = useModulePersist<Line[]>("terminal:lines", [
    { kind: "sys", text: t("terminal.welcome") },
    { kind: "sys", text: t("terminal.hotreload") },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useModulePersist<string[]>("terminal:history", []);
  const [hIdx, setHIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Smart autoscroll: only stick to bottom if the user was already there
  useEffect(() => {
    if (stickRef.current) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [lines]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }

  function push(...newLines: Line[]) {
    setLines((prev) => [...prev, ...newLines].slice(-500));
  }

  const HELP_EN = `Available commands (Tab = autocomplete):
  help              this help
  ls                list registered modules (real registry)
  spawn <module>    spawn a module window for real
  ps                live window list
  whoami            identity
  date              date and time
  echo <text>       echo text
  morph --status    live morph-engine status
  clear             clear screen`;

  const HELP_FR = `Commandes disponibles (Tab = autocomplétion) :
  help              cette aide
  ls                modules du vrai registre
  spawn <module>    ouvre une vraie fenêtre module
  ps                liste réelle des fenêtres
  whoami            identité
  date              date et heure
  echo <texte>      affiche le texte
  morph --status    état réel du moteur MorphOS
  clear             efface l'écran`;

  function doSpawn(raw: string, fr: boolean) {
    const type = raw.toLowerCase() as ModuleType;
    const meta = (MODULE_REGISTRY as Record<string, { label: string; description: string } | undefined>)[type];
    if (!meta || type === "custom") {
      push({ kind: "out", text: fr ? `module inconnu : ${raw} (essaie Tab pour compléter)` : `unknown module: ${raw} (try Tab to complete)` });
      return;
    }
    // Same cascade layout as the command palette
    const def = getDefaultModuleSize(type);
    const offset = windows.length;
    const col = offset % 3;
    const row = Math.floor(offset / 3) % 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const colWidth = Math.min(420, Math.max(280, Math.floor((vw - 80) / 3)));
    const id = spawnWindow({
      type,
      title: t(`module.${type}`) !== `module.${type}` ? t(`module.${type}`) : meta.label,
      subtitle: meta.description,
      x: Math.max(20, Math.min(vw - def.width - 20, 60 + col * (colWidth + 30))),
      y: Math.max(56, Math.min(vh - def.height - 100, 56 + row * 220)),
      width: def.width,
      height: def.height,
    });
    addRecentModule(type);
    push({ kind: "sys", text: `✓ spawned ${type} (${id.slice(0, 8)})` });
  }

  function exec(cmd: string) {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    push({ kind: "in", text: trimmed });
    setHistory((h) => [...h, trimmed].slice(-100));
    setHIdx(-1);
    stickRef.current = true;

    const [name, ...args] = trimmed.split(/\s+/);
    const fr = language === "fr";
    switch (name) {
      case "help":
        push({ kind: "out", text: fr ? HELP_FR : HELP_EN });
        break;
      case "ls":
        push({ kind: "out", text: MODULE_LIST.map((m) => m.type).join("  ") });
        break;
      case "ps": {
        if (windows.length === 0) {
          push({ kind: "out", text: fr ? "(aucune fenêtre)" : "(no windows)" });
          break;
        }
        const rows = windows.map((w) =>
          `${w.id.slice(0, 8)}  ${w.type.padEnd(12)} ${w.minimized ? "minimized" : w.maximized ? "maximized" : "running"}  ${w.title}`
        );
        push({ kind: "out", text: `PID       TYPE         STATUS     TITLE\n${rows.join("\n")}` });
        break;
      }
      case "whoami":
        push({ kind: "out", text: "operator@morphos" });
        break;
      case "date":
        push({ kind: "out", text: new Date().toString() });
        break;
      case "echo":
        push({ kind: "out", text: args.join(" ") });
        break;
      case "morph":
        if (args[0] === "--status") {
          let storageKeys = 0;
          try { storageKeys = window.localStorage.length; } catch { storageKeys = -1; }
          push({ kind: "out", text:
`MorphOS engine status:
  state         = OPERATIONAL
  modules       = ${MODULE_LIST.length} registered
  windows       = ${windows.length} open
  chat          = ${chatMessages.length} messages
  uptime        = ${fmtUptime(Date.now() - BOOT_TIME)}
  provider      = ${providerId}
  storage       = ${storageKeys >= 0 ? `${storageKeys} localStorage keys` : "unavailable"}` });
        } else {
          push({ kind: "out", text: "usage: morph --status" });
        }
        break;
      case "clear":
        setLines([]);
        return;
      case "spawn":
        if (args[0]) doSpawn(args[0], fr);
        else push({ kind: "out", text: "usage: spawn <module>" });
        break;
      default:
        push({ kind: "out", text: t("terminal.notfound", { cmd: name }) });
    }
  }

  function complete() {
    const parts = input.split(/\s+/);
    const last = parts[parts.length - 1] ?? "";
    const pool = parts.length <= 1 ? COMMANDS : MODULE_LIST.map((m) => m.type);
    const matches = pool.filter((c) => c.startsWith(last.toLowerCase()));
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      setInput(parts.join(" ") + (parts.length <= 1 ? " " : ""));
    } else if (matches.length > 1) {
      push({ kind: "out", text: matches.join("  ") });
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setLines([]);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      complete();
      return;
    }
    if (e.key === "Enter") {
      exec(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const next = hIdx === -1 ? history.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(next);
      setInput(history[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx === -1) return;
      const next = hIdx + 1;
      if (next >= history.length) {
        setHIdx(-1);
        setInput("");
      } else {
        setHIdx(next);
        setInput(history[next]);
      }
    }
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="h-full bg-black/60 font-mono text-xs p-3 overflow-y-auto thin-scroll cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((l, i) => (
        <div
          key={i}
          className={
            l.kind === "in"
              ? "text-cyan-300 line-fade-in"
              : l.kind === "sys"
              ? "text-emerald-400/80 italic line-fade-in"
              : "text-white/80 whitespace-pre-wrap line-fade-in"
          }
        >
          {l.kind === "in" ? <span className="text-emerald-400">▸ </span> : l.kind === "sys" ? <span className="text-white/30"># </span> : null}
          {l.text}
        </div>
      ))}
      <div className="flex items-center text-cyan-300">
        <span className="text-emerald-400">▸</span>
        <span className="text-white/40 mx-1">{t("terminal.prompt")}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          className="flex-1 bg-transparent outline-none text-cyan-200 caret-cyan-400"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
