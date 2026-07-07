"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/use-t";
import { useSettings } from "@/lib/settings-store";
import { useModulePersist } from "@/lib/module-state-store";

interface Line { kind: "in" | "out" | "sys"; text: string; }

export function TerminalModule() {
  const t = useT();
  const language = useSettings((s) => s.language);
  const [lines, setLines] = useModulePersist<Line[]>("terminal:lines", [
    { kind: "sys", text: t("terminal.welcome") },
    { kind: "sys", text: t("terminal.hotreload") },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useModulePersist<string[]>("terminal:history", []);
  const [hIdx, setHIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // No effect needed — welcome lines are set at first render via useState initializer


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function push(...newLines: Line[]) {
    setLines((prev) => [...prev, ...newLines]);
  }

  const HELP_EN = `Available commands:
  help              this help
  ls                list mounted modules
  spawn <module>    spawn a module (chat, monitor, dashboard…)
  ps                active processes
  whoami            identity
  date              date and time
  echo <text>       echo text
  morph --status    morph-engine status
  clear             clear screen`;

  const HELP_FR = `Commandes disponibles:
  help              cette aide
  ls                liste les modules montés
  spawn <module>    fait apparaître un module (chat, monitor, dashboard…)
  ps                processus actifs
  whoami            identité
  date              date et heure
  echo <texte>      affiche le texte
  morph --status    état du moteur MorphOS
  clear             efface l'écran`;

  const FAKE_FS = ["chat.tsx", "monitor.tsx", "dashboard.tsx", "terminal.tsx", "kanban.tsx", "notes.tsx", "code.tsx", "weather.tsx", "clock.tsx", "music.tsx", "calculator.tsx", "stock.tsx", "camera.tsx", "metrics.tsx"];

  function exec(cmd: string) {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    push({ kind: "in", text: trimmed });
    setHistory((h) => [...h, trimmed]);
    setHIdx(-1);

    const [name, ...args] = trimmed.split(/\s+/);
    const langCode = language;
    switch (name) {
      case "help":
        push({ kind: "out", text: langCode === "fr" ? HELP_FR : HELP_EN });
        break;
      case "ls":
        push({ kind: "out", text: FAKE_FS.join("  ") });
        break;
      case "ps":
        push({ kind: "out", text:
`PID   TYPE        STATUS
1     kernel      running
42    chat        mounted
87    morph-engine hot-reload
128   ipc-bus     listening` });
        break;
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
          push({ kind: "out", text:
`MorphOS engine status:
  state         = OPERATIONAL
  modules       = 14 registered
  hot-reload    = ENABLED (latency 18ms)
  hot-swap      = ENABLED
  ipc-bus       = healthy
  self-write    = READY` });
        } else {
          push({ kind: "out", text: "usage: morph --status" });
        }
        break;
      case "clear":
        setLines([]);
        return;
      case "spawn":
        if (args[0]) {
          push({ kind: "sys", text: `→ requesting morph-engine to spawn: ${args[0]}` });
          push({ kind: "sys", text: t("terminal.spawnHint") });
        } else {
          push({ kind: "out", text: "usage: spawn <module>" });
        }
        break;
      default:
        push({ kind: "out", text: t("terminal.notfound", { cmd: name }) });
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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
      <div ref={bottomRef} />
    </div>
  );
}
