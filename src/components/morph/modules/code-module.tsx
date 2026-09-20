"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Copy, Check, Square, Pencil } from "lucide-react";
import { useT } from "@/lib/use-t";
import { useModulePersist } from "@/lib/module-state-store";
import { CustomModuleRenderer, transformCodeAsync } from "./custom-module";

const DEFAULT_CODE = `// MorphOS — module live example
import { useState, useEffect } from "react";

export function Counter({ initial = 0 }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-4 text-cyan-300">
      <h2>Live counter</h2>
      <p className="text-3xl font-mono">{count}</p>
      <button onClick={() => setCount(0)}>
        Reset
      </button>
    </div>
  );
}`;

// Simple syntax highlighter for TSX
function highlight(code: string): string {
  let out = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Comments
  out = out.replace(/(\/\/.*$)/gm, '<span style="color:#64748b">$1</span>');
  // Strings
  out = out.replace(/(['"`])([^'"`\n]*?)\1/g, '<span style="color:#fbbf24">$1$2$1</span>');
  // Keywords
  out = out.replace(
    /\b(import|from|export|function|return|const|let|var|if|else|for|while|useEffect|useState|interface|type|extends|new|class|async|await)\b/g,
    '<span style="color:#22d3ee">$1</span>'
  );
  // JSX tags
  out = out.replace(/(&lt;\/?)([A-Za-z][A-Za-z0-9]*)/g, '$1<span style="color:#f472b6">$2</span>');
  // Numbers
  out = out.replace(/\b(\d+)\b/g, '<span style="color:#34d399">$1</span>');
  // Function calls
  out = out.replace(/([A-Za-z_][A-Za-z0-9_]*)\(/g, '<span style="color:#a78bfa">$1</span>(');
  return out;
}

// Convert editor code into the runnable module format:
// imports are provided by the runtime (React + hooks), `export` is stripped,
// and the first component becomes CustomModule.
function toRunnable(src: string): string {
  let s = src
    .replace(/^import[^\n]*\n?/gm, "")
    .replace(/^export\s+default\s+/gm, "")
    .replace(/^export\s+/gm, "");
  if (!/function\s+CustomModule\s*\(/.test(s)) {
    if (/function\s+[A-Za-z_$][\w$]*\s*\(/.test(s)) {
      s = s.replace(/function\s+[A-Za-z_$][\w$]*\s*\(/, "function CustomModule(");
    } else {
      s += "\nfunction CustomModule(){ return null; }";
    }
  }
  return s;
}

type CompileState = { status: "idle" | "compiling" | "ok" | "error"; error: string | null };

export function CodeModule() {
  const t = useT();
  const [code, setCode] = useModulePersist<string>("code:src", DEFAULT_CODE);
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [compile, setCompile] = useState<CompileState>({ status: "idle", error: null });
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  // Real compile check (debounced) through the actual Babel pipeline
  const compileSeq = useRef(0);
  useEffect(() => {
    const id = setTimeout(() => {
      const my = ++compileSeq.current;
      setCompile((c) => (c.status === "compiling" ? c : { status: "compiling", error: null }));
      transformCodeAsync(toRunnable(code)).then(({ error }) => {
        if (my !== compileSeq.current) return;
        setCompile(error ? { status: "error", error } : { status: "ok", error: null });
      });
    }, 600);
    return () => clearTimeout(id);
  }, [code]);

  // The highlight <pre> and the line-number gutter are static layers:
  // keep them in sync with the textarea's own scrolling.
  function syncScroll() {
    const ta = taRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  }

  function copy() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const errShort = compile.error ? compile.error.split("\n")[0].slice(0, 60) : "";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/8 bg-black/20">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400/70" />
          <span className="w-2 h-2 rounded-full bg-amber-400/70" />
          <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
        </div>
        <span className="text-[10px] text-white/40 flex-1 text-center font-mono">
          counter.tsx · {running ? "running" : "live"}
        </span>
        <button
          onClick={() => setRunning((r) => !r)}
          title={running ? t("common.edit") : "Run"}
          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 mr-1"
        >
          {running ? <Pencil className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {running ? t("common.edit") : "Run"}
        </button>
        <button onClick={copy} title={t("common.copy")} className="text-white/50 hover:text-cyan-300">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      {running ? (
        <div className="flex-1 min-h-0 overflow-y-auto thin-scroll">
          <CustomModuleRenderer code={toRunnable(code)} />
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 flex">
            <div ref={gutterRef} className="px-2 py-3 text-right text-[10px] font-mono text-white/30 select-none bg-black/20 border-r border-white/5 overflow-hidden">
              {code.split("\n").map((_, i) => (
                <div key={i} className="leading-5">{i + 1}</div>
              ))}
            </div>
            <div className="flex-1 relative">
              <pre
                ref={preRef}
                className="absolute inset-0 p-3 text-xs font-mono leading-5 pointer-events-none overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-white/90"
                dangerouslySetInnerHTML={{ __html: highlight(code) }}
              />
              <textarea
                ref={taRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={syncScroll}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const ta = e.currentTarget;
                    const start = ta.selectionStart ?? code.length;
                    const end = ta.selectionEnd ?? code.length;
                    const next = code.slice(0, start) + "  " + code.slice(end);
                    setCode(next);
                    queueMicrotask(() => {
                      ta.selectionStart = ta.selectionEnd = start + 2;
                    });
                  }
                }}
                spellCheck={false}
                className="absolute inset-0 w-full h-full p-3 bg-transparent text-transparent caret-cyan-400 text-xs font-mono leading-5 outline-none resize-none thin-scroll"
              />
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-white/8 bg-black/20 text-[10px] text-white/40">
        {running
          ? <Square className="w-2.5 h-2.5 text-amber-400" />
          : <Play className="w-2.5 h-2.5 text-emerald-400" />}
        <span>hot-reload · {code.split("\n").length} lignes · TSX</span>
        <span
          className={`ml-auto font-mono ${
            compile.status === "ok" ? "text-emerald-400"
            : compile.status === "error" ? "text-rose-400"
            : "text-white/40"
          }`}
          title={compile.error ?? undefined}
        >
          {compile.status === "compiling" || compile.status === "idle"
            ? "… compiling"
            : compile.status === "ok"
            ? "✓ compiled"
            : `✗ ${errShort}`}
        </span>
      </div>
    </div>
  );
}
