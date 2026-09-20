"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Eye, Edit3, FileText } from "lucide-react";
import { useModulePersist } from "@/lib/module-state-store";

const DEFAULT_MD = `# Notes — projet MorphOS

## Concept
Une interface qui **se réécrit elle-même** en temps réel. L'utilisateur parle →
l'IA interprète → le module apparaît avec animation de *code-writing*.

## Principes
- **Hot reload** : les modules se montent à la volée
- **Hot swap** : remplacer un module sans perdre l'état
- **Multi-fenêtre adaptatif** : drag, resize, z-order
- **Self-writing** : l'IA "écrit" le JSX avant de le monter

## Todo
- [x] Zustand store
- [x] Window manager
- [x] Animation spawn
- [ ] Persistance des fenêtres
- [ ] Layouts nommés (présets)

> Citation : *"The interface is the message."* — adapté de McLuhan

\`\`\`ts
const morph = createMorph({
  live: true,
  hotSwap: true,
});
\`\`\`
`;

export function NotesModule() {
  const [md, setMd] = useModulePersist<string>("notes:content", DEFAULT_MD);
  const [mode, setMode] = useState<"edit" | "preview">("preview");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  function onEdit(v: string) {
    setMd(v);
    setSavedAt(Date.now());
  }

  const rendered = useMemo(() => md, [md]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/8">
        <FileText className="w-3 h-3 text-cyan-400" />
        <span className="text-[10px] text-white/40 flex-1">
          notes.md
          <span className="text-white/30 ml-1.5 font-mono">
            {md.trim() ? md.trim().split(/\s+/).length : 0} mots
          </span>
          {savedAt && (
            <span className="text-emerald-400/70 ml-1.5">
              ✓ {new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </span>
        <button
          onClick={() => setMode("edit")}
          className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${
            mode === "edit" ? "bg-cyan-500/20 text-cyan-300" : "text-white/50 hover:text-white/80"
          }`}
        >
          <Edit3 className="w-2.5 h-2.5" /> Éditer
        </button>
        <button
          onClick={() => setMode("preview")}
          className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${
            mode === "preview" ? "bg-cyan-500/20 text-cyan-300" : "text-white/50 hover:text-white/80"
          }`}
        >
          <Eye className="w-2.5 h-2.5" /> Aperçu
        </button>
      </div>
      {mode === "edit" ? (
        <textarea
          value={md}
          onChange={(e) => onEdit(e.target.value)}
          className="flex-1 min-h-0 bg-transparent p-3 text-xs font-mono text-white/90 outline-none resize-none thin-scroll"
          spellCheck={false}
        />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 thin-scroll prose prose-invert prose-sm max-w-none
          prose-headings:text-white prose-p:text-white/80 prose-li:text-white/80
          prose-strong:text-cyan-200 prose-code:text-pink-300 prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
          prose-blockquote:border-cyan-400/50 prose-blockquote:text-white/60
          prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10
          prose-a:text-cyan-300">
          <ReactMarkdown>{rendered}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
