"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, FolderOpen, Trash2, X, Layers } from "lucide-react";
import { useWindowStore } from "@/lib/window-store";

export function WorkspaceManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const workspaces = useWindowStore((s) => s.workspaces);
  const saveWorkspace = useWindowStore((s) => s.saveWorkspace);
  const loadWorkspace = useWindowStore((s) => s.loadWorkspace);
  const deleteWorkspace = useWindowStore((s) => s.deleteWorkspace);
  const windows = useWindowStore((s) => s.windows);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function save() {
    if (!name.trim() || windows.length === 0) return;
    saveWorkspace(name.trim());
    setName("");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1101] glass-panel-strong rounded-2xl overflow-hidden w-[500px] max-w-[94vw]"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Workspaces</span>
              <button onClick={onClose} title="Close" aria-label="Close" className="ml-auto text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Save current layout</div>
                <div className="flex gap-1.5">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") save(); }}
                    placeholder="Workspace name…"
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50"
                    disabled={windows.length === 0}
                  />
                  <button
                    onClick={save}
                    disabled={!name.trim() || windows.length === 0}
                    className="text-[11px] px-3 py-1.5 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-30 flex items-center gap-1.5"
                  >
                    <Save className="w-3 h-3" /> Save
                  </button>
                </div>
                <div className="text-[9px] text-white/30 mt-1">
                  {windows.length} window{windows.length !== 1 ? "s" : ""} will be saved
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Saved ({workspaces.length})</div>
                {workspaces.length === 0 ? (
                  <div className="text-center text-white/30 text-xs py-6 border border-dashed border-white/10 rounded-lg">
                    No saved workspaces yet
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto thin-scroll">
                    {workspaces.map((ws) => (
                      <div key={ws.id} className="flex items-center gap-2 bg-black/30 border border-white/8 rounded-lg px-3 py-2 hover:bg-black/50 transition">
                        <FolderOpen className="w-3 h-3 text-cyan-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-white truncate">{ws.name}</div>
                          <div className="text-[9px] text-white/40">
                            {ws.windows.length} windows · {new Date(ws.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button onClick={() => { loadWorkspace(ws.id); onClose(); }}
                          className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30">
                          Load
                        </button>
                        <button onClick={() => deleteWorkspace(ws.id)} className="text-white/40 hover:text-rose-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
