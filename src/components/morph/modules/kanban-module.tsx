"use client";

import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { useModulePersist } from "@/lib/module-state-store";

interface Card { id: string; title: string; tag?: string; }
interface Column { id: string; title: string; color: string; cards: Card[]; }

const INITIAL: Column[] = [
  {
    id: "backlog", title: "Backlog", color: "#94a3b8",
    cards: [
      { id: "c1", title: "Refactor morph-engine", tag: "tech" },
      { id: "c2", title: "Spec: custom layouts", tag: "design" },
    ],
  },
  {
    id: "doing", title: "En cours", color: "#22d3ee",
    cards: [
      { id: "c3", title: "Module multi-window drag", tag: "wip" },
      { id: "c4", title: "Hot-swap API route" },
    ],
  },
  {
    id: "review", title: "Review", color: "#fbbf24",
    cards: [
      { id: "c5", title: "Code preview animation", tag: "ui" },
    ],
  },
  {
    id: "done", title: "Done", color: "#34d399",
    cards: [
      { id: "c6", title: "Zustand store", tag: "done" },
      { id: "c7", title: "Module registry" },
    ],
  },
];

export function KanbanModule() {
  const [cols, setCols] = useModulePersist<Column[]>("kanban:columns", INITIAL);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  function onDragStart(cardId: string, colId: string) {
    setDragId(cardId);
    setDragFrom(colId);
  }

  function onDropTo(colId: string) {
    if (!dragId || !dragFrom) return;
    setCols((prev) => {
      const next = prev.map((c) => ({ ...c, cards: [...c.cards] }));
      const from = next.find((c) => c.id === dragFrom);
      const to = next.find((c) => c.id === colId);
      if (!from || !to) return prev;
      const idx = from.cards.findIndex((c) => c.id === dragId);
      if (idx === -1) return prev;
      const [card] = from.cards.splice(idx, 1);
      to.cards.push(card);
      return next;
    });
    setDragId(null);
    setDragFrom(null);
  }

  function addCard(colId: string) {
    if (!newTitle.trim()) return;
    setCols((prev) =>
      prev.map((c) =>
        c.id === colId
          ? { ...c, cards: [...c.cards, { id: `c${Date.now()}`, title: newTitle.trim() }] }
          : c
      )
    );
    setNewTitle("");
    setAdding(null);
  }

  function deleteCard(cardId: string) {
    setCols((prev) =>
      prev.map((c) => ({ ...c, cards: c.cards.filter((card) => card.id !== cardId) }))
    );
  }

  return (
    <div className="h-full flex gap-2 p-3 overflow-x-auto thin-scroll">
      {cols.map((col) => (
        <div
          key={col.id}
          className="flex flex-col w-[160px] shrink-0"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDropTo(col.id)}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.color }} />
              <span className="text-xs text-white/80 font-medium">{col.title}</span>
              <span className="text-[10px] text-white/40">{col.cards.length}</span>
            </div>
            <button
              onClick={() => setAdding(adding === col.id ? null : col.id)}
              className="text-white/40 hover:text-white/80"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto thin-scroll">
            {col.cards.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={() => onDragStart(card.id, col.id)}
                className="group bg-white/5 hover:bg-white/10 border border-white/8 rounded-md p-2 cursor-grab active:cursor-grabbing transition"
              >
                <div className="flex items-start gap-1">
                  <GripVertical className="w-3 h-3 text-white/30 mt-0.5 group-hover:text-white/60" />
                  <div className="flex-1 text-xs text-white/90 leading-snug">{card.title}</div>
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {card.tag && (
                  <div className="mt-1.5 ml-4">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-400/20">
                      {card.tag}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {adding === col.id && (
              <div className="bg-black/30 border border-cyan-400/30 rounded-md p-2">
                <textarea
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addCard(col.id); }
                    if (e.key === "Escape") { setAdding(null); setNewTitle(""); }
                  }}
                  placeholder="Titre…"
                  className="w-full bg-transparent text-xs outline-none resize-none text-white/90 placeholder:text-white/30 thin-scroll"
                  rows={2}
                />
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => addCard(col.id)}
                    className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => { setAdding(null); setNewTitle(""); }}
                    className="text-[10px] px-2 py-0.5 rounded text-white/50 hover:text-white/80"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
            {!col.cards.length && adding !== col.id && (
              <div className="text-[10px] text-white/30 text-center py-4 border border-dashed border-white/10 rounded-md">
                vide
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
