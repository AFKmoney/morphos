"use client";

import { useEffect, useState } from "react";
import {
  Puzzle,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Power,
} from "lucide-react";
import { getPluginRegistry } from "@/lib/plugins/plugin-registry";
import { initializePlugins } from "@/lib/plugins/plugin-initializer";
import type { PluginManifest, PluginStatus } from "@/lib/plugins/plugin-types";

export function PluginModule() {
  const [, bump] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const store = getPluginRegistry();
    const unsub = store.subscribe(() => bump((n) => n + 1));
    initializePlugins()
      .catch(() => undefined)
      .finally(() => setReady(true));
    return unsub;
  }, []);

  const state = getPluginRegistry().getState();
  const manifests: PluginManifest[] = Array.from(state.manifests.values());
  const filtered = searchQuery
    ? manifests.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      })
    : manifests;

  async function load(id: string) {
    setBusyId(id);
    try {
      await getPluginRegistry().getState().load(id);
    } finally {
      setBusyId(null);
    }
  }

  async function unload(id: string) {
    setBusyId(id);
    try {
      await getPluginRegistry().getState().unload(id);
    } finally {
      setBusyId(null);
    }
  }

  async function reload(id: string) {
    setBusyId(id);
    try {
      await getPluginRegistry().getState().unload(id);
      await getPluginRegistry().getState().load(id, { force: true });
    } finally {
      setBusyId(null);
    }
  }

  function statusOf(id: string): PluginStatus {
    return getPluginRegistry().getState().status.get(id) || "unloaded";
  }

  function errorOf(id: string): string | undefined {
    return getPluginRegistry().getState().errors.get(id);
  }

  return (
    <div className="h-full flex flex-col bg-black/20 text-white">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
        <Puzzle className="w-4 h-4 text-violet-300 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">Plugins</div>
          <div className="text-[10px] text-white/40">
            {manifests.length} registered · {Array.from(state.loaded.keys()).length} loaded
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
          <Search className="w-3 h-3 text-white/40" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plugins"
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 thin-scroll">
        {!ready && (
          <div className="flex items-center justify-center h-24 text-xs text-white/50 gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading registry…
          </div>
        )}

        {ready && filtered.length === 0 && (
          <div className="text-center py-10 px-4">
            <Puzzle className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/60">No plugins registered</p>
            <p className="text-[11px] text-white/35 mt-1">
              Built-in example should load automatically. Pull latest and reopen this window.
            </p>
          </div>
        )}

        {filtered.map((plugin) => {
          const status = statusOf(plugin.id);
          const error = errorOf(plugin.id);
          const busy = busyId === plugin.id;
          const loaded = status === "loaded";
          const Icon = plugin.icon;
          const open = selectedId === plugin.id;

          return (
            <div
              key={plugin.id}
              className={`rounded-lg border p-3 transition ${
                open ? "border-violet-400/50 bg-violet-500/10" : "border-white/10 hover:border-white/20 bg-white/[0.02]"
              } ${status === "error" ? "border-rose-400/40" : ""}`}
            >
              <button
                type="button"
                onClick={() => setSelectedId(open ? null : plugin.id)}
                className="w-full text-left flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-md bg-violet-500/15 flex items-center justify-center shrink-0">
                  {typeof Icon === "string" ? (
                    <img src={Icon} alt="" className="w-5 h-5 rounded" />
                  ) : (
                    <Icon className="w-4 h-4 text-violet-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm truncate">{plugin.name}</span>
                    <span className="text-[10px] text-white/35">v{plugin.version}</span>
                  </div>
                  <p className="text-[11px] text-white/45 line-clamp-2">{plugin.description}</p>
                </div>
                {busy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50" />
                ) : loaded ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : status === "error" ? (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Power className="w-3.5 h-3.5 text-white/30" />
                )}
              </button>

              {open && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">{plugin.category}</span>
                    {(plugin.tags ?? []).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-white/40">
                    Status: <span className="font-mono text-white/70">{status}</span>
                    {plugin.author ? ` · ${plugin.author}` : ""}
                  </div>
                  {error && <div className="text-[11px] text-rose-400 bg-rose-500/10 rounded px-2 py-1">{error}</div>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => (loaded ? unload(plugin.id) : load(plugin.id))}
                      className="flex-1 text-[11px] py-1.5 rounded bg-white/8 hover:bg-white/12 disabled:opacity-40"
                    >
                      {loaded ? "Unload" : "Load"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => reload(plugin.id)}
                      className="px-3 py-1.5 rounded bg-white/8 hover:bg-white/12 disabled:opacity-40"
                      title="Reload"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
