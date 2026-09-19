"use client";

import { useEffect, useState } from "react";

interface Metric {
  id: string;
  label: string;
  value: number;
  unit: string;
  color: string;
  history: number[];
}

export function MetricsModule() {
  const [metrics, setMetrics] = useState<Metric[]>([
    { id: "fps", label: "FPS", value: 60, unit: "", color: "#22d3ee", history: [] },
    { id: "mem", label: "JS Heap", value: 0, unit: "MB", color: "#34d399", history: [] },
    { id: "res", label: "Resources", value: 0, unit: "", color: "#fbbf24", history: [] },
    { id: "net", label: "Network", value: 0, unit: "KB/s", color: "#f472b6", history: [] },
  ]);
  const [events, setEvents] = useState<{ ts: number; level: string; msg: string }[]>([]);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 60;
    let lastResourceCount = 0;
    let lastTransferSize = 0;
    let rafId: number;

    function measureFPS() {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(measureFPS);
    }
    measureFPS();

    const id = setInterval(() => {
      if (document.hidden) return;
      // Real FPS
      // Real memory (Chrome only)
      const mem = (performance as any).memory;
      const memMB = mem ? Math.round(mem.usedJSHeapSize / 1048576) : 0;

      // Real resource count
      const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const resourceCount = entries.length;

      // Real network transfer (delta)
      const currentTransfer = entries.reduce((sum, e) => sum + (e.transferSize || 0), 0);
      const netDelta = Math.round((currentTransfer - lastTransferSize) / 1024);
      lastTransferSize = currentTransfer;

      // Detect new resources loaded
      if (resourceCount > lastResourceCount) {
        const newCount = resourceCount - lastResourceCount;
        setEvents(prev => [
          { ts: Date.now(), level: "info", msg: `+${newCount} resource(s) loaded` },
          ...prev.slice(0, 9),
        ]);
      }
      lastResourceCount = resourceCount;

      // Memory warnings
      if (mem && memMB > 50) {
        setEvents(prev => [
          { ts: Date.now(), level: "warn", msg: `JS heap high: ${memMB}MB` },
          ...prev.slice(0, 9),
        ]);
      }

      setMetrics(prev => prev.map(m => {
        let value = m.value;
        if (m.id === "fps") value = fps;
        else if (m.id === "mem") value = memMB;
        else if (m.id === "res") value = resourceCount;
        else if (m.id === "net") value = Math.max(0, netDelta);

        return { ...m, value, history: [...m.history.slice(-29), value] };
      }));
    }, 1000);

    return () => {
      clearInterval(id);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="flex flex-col h-full p-3 gap-2 thin-scroll overflow-y-auto">
      <div className="flex items-center justify-between text-[10px] text-white/40 px-1">
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-400 live-dot" />
          Performance API · live
        </span>
        <span className="font-mono">30s window</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div key={m.id} className="bg-black/30 border border-white/8 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/60">{m.label}</span>
              <span className="text-xs font-mono font-bold" style={{ color: m.color }}>
                {m.id === "mem" || m.id === "net" ? m.value.toFixed(0) : m.value}{m.unit}
              </span>
            </div>
            {m.history.length > 1 && (
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
              </svg>
            )}
          </div>
        ))}
      </div>
      <div className="bg-black/30 border border-white/8 rounded-lg p-2.5 mt-1">
        <div className="text-[10px] text-white/60 mb-1">Live Events</div>
        <div className="space-y-0.5 text-[10px] font-mono">
          {events.length === 0 ? (
            <div className="text-white/40">No events yet…</div>
          ) : (
            events.map((e, i) => (
              <div key={i} className="text-white/60 line-fade-in">
                <span className="text-white/40">{new Date(e.ts).toLocaleTimeString("en")}</span>{" "}
                <span className={e.level === "warn" ? "text-amber-400" : e.level === "error" ? "text-rose-400" : "text-cyan-400"}>
                  [{e.level}]
                </span>{" "}
                {e.msg}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
