"use client";

import { useEffect, useState } from "react";

interface Metric { id: string; label: string; value: number; unit: string; color: string; history: number[]; }

const INITIAL: Metric[] = [
  { id: "req", label: "req/s", value: 1240, unit: "", color: "#22d3ee", history: [] },
  { id: "lat", label: "latence p95", value: 42, unit: "ms", color: "#34d399", history: [] },
  { id: "err", label: "erreur %", value: 0.3, unit: "%", color: "#fbbf24", history: [] },
  { id: "q", label: "queue depth", value: 18, unit: "", color: "#f472b6", history: [] },
];

export function MetricsModule() {
  const [metrics, setMetrics] = useState<Metric[]>(
    INITIAL.map((m) => ({ ...m, history: Array.from({ length: 30 }, () => m.value) }))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setMetrics((prev) =>
        prev.map((m) => {
          const drift = (Math.random() - 0.5) * m.value * 0.15;
          const next = Math.max(0, m.value + drift);
          return {
            ...m,
            value: next,
            history: [...m.history.slice(1), next],
          };
        })
      );
    }, 800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col h-full p-3 gap-2 thin-scroll overflow-y-auto">
      <div className="flex items-center justify-between text-[10px] text-white/40 px-1">
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-400 live-dot" />
          prometheus · scraping 800ms
        </span>
        <span className="font-mono">15s window</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div key={m.id} className="bg-black/30 border border-white/8 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/60">{m.label}</span>
              <span className="text-xs font-mono font-bold" style={{ color: m.color }}>
                {m.value.toFixed(m.id === "err" ? 2 : 0)}{m.unit}
              </span>
            </div>
            <svg width="100%" height="36" viewBox="0 0 100 36" preserveAspectRatio="none">
              <polyline
                points={m.history.map((v, i) => {
                  const max = Math.max(...m.history, 1);
                  const min = Math.min(...m.history, 0);
                  const range = max - min || 1;
                  const y = 36 - ((v - min) / range) * 32 - 2;
                  return `${(i / (m.history.length - 1)) * 100},${y}`;
                }).join(" ")}
                fill="none"
                stroke={m.color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={m.history.map((v, i) => {
                  const max = Math.max(...m.history, 1);
                  const min = Math.min(...m.history, 0);
                  const range = max - min || 1;
                  const y = 36 - ((v - min) / range) * 32 - 2;
                  return `${(i / (m.history.length - 1)) * 100},${y}`;
                }).join(" ")}
                fill={m.color}
                opacity="0.1"
                style={{ transform: "translateY(0)" }}
              />
            </svg>
          </div>
        ))}
      </div>
      <div className="bg-black/30 border border-white/8 rounded-lg p-2.5 mt-1">
        <div className="text-[10px] text-white/60 mb-1">events stream</div>
        <div className="space-y-0.5 text-[10px] font-mono">
          {["[info] module registered: chat", "[info] morph-engine hot-reload ok", "[warn] queue depth > 16", "[info] ipc-bus ack 0x4f2a"].map((e, i) => (
            <div key={i} className="text-white/60 line-fade-in">
              <span className="text-white/30">{new Date(Date.now() - i * 4000).toLocaleTimeString("fr-FR")}</span>{" "}
              <span className={e.includes("warn") ? "text-amber-400" : e.includes("info") ? "text-cyan-400" : "text-rose-400"}>
                {e}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
