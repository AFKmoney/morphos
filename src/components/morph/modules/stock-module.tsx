"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react";
import { useT } from "@/lib/use-t";
import { useModulePersist } from "@/lib/module-state-store";

// Real crypto symbols via CoinGecko (free, no API key)
const SYMBOLS = [
  { id: "bitcoin", sym: "BTC", name: "Bitcoin" },
  { id: "ethereum", sym: "ETH", name: "Ethereum" },
  { id: "solana", sym: "SOL", name: "Solana" },
  { id: "cardano", sym: "ADA", name: "Cardano" },
  { id: "chainlink", sym: "LINK", name: "Chainlink" },
  { id: "polkadot", sym: "DOT", name: "Polkadot" },
];

interface Quote {
  sym: string;
  name: string;
  price: number;
  change24h: number;
  history: number[];
}

export function StockModule() {
  const t = useT();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [histStore, setHistStore] = useModulePersist<Record<string, number[]>>("stock:history", {});
  const historyRef = useRef<Record<string, number[]>>(histStore);

  useEffect(() => {
    let active = true;

    async function fetchPrices() {
      try {
        const ids = SYMBOLS.map(s => s.id).join(",");
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const newQuotes: Quote[] = SYMBOLS.map(s => {
          const d = data[s.id];
          const price = d?.usd ?? 0;
          const change = d?.usd_24h_change ?? 0;
          const hist = historyRef.current[s.sym] ?? [];
          hist.push(price);
          if (hist.length > 20) hist.shift();
          historyRef.current[s.sym] = hist;
          return { sym: s.sym, name: s.name, price, change24h: change, history: [...hist] };
        });

        if (active) {
          setQuotes(newQuotes);
          setHistStore({ ...historyRef.current });
          setFetchedAt(Date.now());
          setLoading(false);
          setError(null);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    }

    fetchPrices();
    const id = setInterval(() => { if (!document.hidden) fetchPrices(); }, 15000);
    return () => { active = false; clearInterval(id); };
  }, [retryTick]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error && quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-rose-300 text-xs gap-2">
        <AlertCircle className="w-6 h-6" />
        <div>Failed to load prices</div>
        <div className="text-[9px] text-white/40">{error}</div>
        <button
          onClick={() => { setError(null); setLoading(true); setRetryTick((n) => n + 1); }}
          className="text-[11px] px-3 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
        >
          ↻ {t("common.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-3 gap-2">
      <div className="flex items-center justify-between text-[10px] text-white/40 px-1">
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-emerald-400 live-dot" />
          CoinGecko · live
        </span>
        <span className="font-mono" title={fetchedAt ? new Date(fetchedAt).toLocaleString([]) : undefined}>{fetchedAt ? new Date(fetchedAt).toLocaleTimeString([]) : "—"}</span>
      </div>
      {error && <div className="text-[9px] text-amber-400/60">Reconnecting…</div>}
      <div className="flex-1 min-h-0 space-y-1 overflow-y-auto thin-scroll">
        {quotes.map((q) => {
          const up = q.change24h >= 0;
          return (
            <div key={q.sym} className="flex items-center gap-3 bg-black/30 border border-white/5 rounded-lg px-3 py-2">
              <div className="w-16">
                <div className="font-mono text-sm text-white">{q.sym}</div>
                <div className="text-[9px] text-white/40 truncate">{q.name}</div>
              </div>
              <div className="flex-1 h-7">
                <MiniChart history={q.history} up={up} />
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-white tabular-nums">
                  ${q.price < 1 ? q.price.toFixed(4) : q.price.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-[10px] flex items-center justify-end gap-0.5 ${up ? "text-emerald-400" : "text-rose-400"}`}>
                  {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {up ? "+" : ""}{q.change24h.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniChart({ history, up }: { history: number[]; up: boolean }) {
  const color = up ? "#34d399" : "#f43f5e";
  const w = 100;
  const h = 28;

  if (history.length < 2) return <svg width="100%" height={h} />;

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const step = w / (history.length - 1);
  const pts = history.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(" ");

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
