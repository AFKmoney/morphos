"use client";

import { useState } from "react";
import { Play, Copy, Check } from "lucide-react";

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

export function CodeModule() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/8 bg-black/20">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-400/70" />
          <span className="w-2 h-2 rounded-full bg-amber-400/70" />
          <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
        </div>
        <span className="text-[10px] text-white/40 flex-1 text-center font-mono">counter.tsx · live</span>
        <button onClick={copy} className="text-white/50 hover:text-cyan-300">
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex">
          <div className="px-2 py-3 text-right text-[10px] font-mono text-white/30 select-none bg-black/20 border-r border-white/5">
            {code.split("\n").map((_, i) => (
              <div key={i} className="leading-5">{i + 1}</div>
            ))}
          </div>
          <div className="flex-1 relative">
            <pre
              className="absolute inset-0 p-3 text-xs font-mono leading-5 pointer-events-none overflow-hidden text-white/90"
              dangerouslySetInnerHTML={{ __html: highlight(code) }}
            />
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="absolute inset-0 w-full h-full p-3 bg-transparent text-transparent caret-cyan-400 text-xs font-mono leading-5 outline-none resize-none thin-scroll"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-white/8 bg-black/20 text-[10px] text-white/40">
        <Play className="w-2.5 h-2.5 text-emerald-400" />
        <span>hot-reload · {code.split("\n").length} lignes · TSX</span>
        <span className="ml-auto text-emerald-400">✓ compiled</span>
      </div>
    </div>
  );
}
