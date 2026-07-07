"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const SYMBOLS = [
  { sym: "MORPH", name: "MorphOS", price: 184.32, base: 184.32 },
  { sym: "ZAI", name: "Z.ai Holdings", price: 412.85, base: 412.85 },
  { sym: "HOTSWP", name: "HotSwap Inc.", price: 67.41, base: 67.41 },
  { sym: "NLDRX", name: "NeuralX", price: 234.18, base: 234.18 },
  { sym: "SYNC", name: "SyncForge", price: 89.05, base: 89.05 },
  { sym: "DRIFT", name: "Drift Labs", price: 156.72, base: 156.72 },
];

export function StockModule() {
  const [quotes, setQuotes] = useState(SYMBOLS);

  useEffect(() => {
    const id = setInterval(() => {
      setQuotes((prev) =>
        prev.map((q) => {
          const vol = 0.008;
          const change = (Math.random() - 0.5) * vol * q.base;
          const next = Math.max(1, q.price + change);
          return { ...q, price: next };
        })
      );
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col h-full p-3 gap-2">
      <div className="flex items-center justify-between text-[10px] text-white/40 px-1">
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-400 live-dot" />
          NYSE · temps réel (mock)
        </span>
        <span className="font-mono">{new Date().toLocaleTimeString("fr-FR")}</span>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto thin-scroll">
        {quotes.map((q) => {
          const delta = q.price - q.base;
          const pct = (delta / q.base) * 100;
          const up = delta >= 0;
          return (
            <div
              key={q.sym}
              className="flex items-center gap-3 bg-black/30 border border-white/5 rounded-lg px-3 py-2"
            >
              <div className="w-16">
                <div className="font-mono text-sm text-white">{q.sym}</div>
                <div className="text-[9px] text-white/40 truncate">{q.name}</div>
              </div>
              <div className="flex-1 h-7">
                <MiniChart up={up} />
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-white tabular-nums">
                  ${q.price.toFixed(2)}
                </div>
                <div className={`text-[10px] flex items-center justify-end gap-0.5 ${up ? "text-emerald-400" : "text-rose-400"}`}>
                  {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {up ? "+" : ""}{pct.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniChart({ up }: { up: boolean }) {
  const [bars, setBars] = useState<number[]>(
    Array.from({ length: 20 }, () => 0.4 + Math.random() * 0.6)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) => [...prev.slice(1), 0.3 + Math.random() * 0.7]);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const color = up ? "#34d399" : "#f43f5e";
  const w = 100;
  const h = 28;
  const step = w / (bars.length - 1);
  const pts = bars.map((b, i) => `${i * step},${h - b * h}`).join(" ");

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
