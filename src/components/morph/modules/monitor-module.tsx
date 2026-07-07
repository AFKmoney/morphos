"use client";

import { useEffect, useRef, useState } from "react";
import { Cpu, MemoryStick, Network, HardDrive, Activity } from "lucide-react";

interface Series { t: number; v: number; }

function useLiveSeries(initial = 30, intervalMs = 800, gen: (prev: number) => number) {
  const [series, setSeries] = useState<Series[]>(() =>
    Array.from({ length: initial }, (_, i) => ({ t: i, v: gen(0.5) }))
  );
  useEffect(() => {
    const id = setInterval(() => {
      setSeries((prev) => {
        const last = prev[prev.length - 1]?.v ?? 0.5;
        const next = Math.max(0.05, Math.min(0.98, gen(last)));
        return [...prev.slice(1), { t: (prev[prev.length - 1]?.t ?? 0) + 1, v: next }];
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, gen]);
  return series;
}

function Sparkline({ data, color }: { data: Series[]; color: string }) {
  const w = 220;
  const h = 48;
  const max = 1;
  const step = w / (data.length - 1);
  const points = data
    .map((d, i) => `${i * step},${h - (d.v / max) * h}`)
    .join(" ");
  const area = `0,${h} ${points} ${w},${h}`;
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#grad-${color})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Gauge({ label, value, color, icon: Icon, series }: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
  series: Series[];
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="bg-black/30 border border-white/8 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <Icon className="w-3 h-3" style={{ color }} />
          {label}
        </div>
        <div className="text-sm font-mono font-bold" style={{ color }}>
          {pct}%
        </div>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
      </div>
      <Sparkline data={series} color={color} />
    </div>
  );
}

export function MonitorModule() {
  const cpuSeries = useLiveSeries(40, 800, (prev) => {
    const target = 0.3 + Math.random() * 0.5;
    return prev + (target - prev) * 0.3 + (Math.random() - 0.5) * 0.1;
  });
  const ramSeries = useLiveSeries(40, 1000, (prev) => {
    const target = 0.55 + Math.sin(Date.now() / 5000) * 0.15;
    return prev + (target - prev) * 0.15;
  });
  const netSeries = useLiveSeries(40, 600, (prev) => {
    const target = 0.2 + Math.random() * 0.7;
    return prev + (target - prev) * 0.5;
  });
  const diskSeries = useLiveSeries(40, 1500, (prev) => {
    const target = 0.4 + Math.random() * 0.2;
    return prev + (target - prev) * 0.1;
  });

  const cpu = cpuSeries[cpuSeries.length - 1]?.v ?? 0;
  const ram = ramSeries[ramSeries.length - 1]?.v ?? 0;
  const net = netSeries[netSeries.length - 1]?.v ?? 0;
  const disk = diskSeries[diskSeries.length - 1]?.v ?? 0;

  const [uptime, setUptime] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setUptime(Date.now() - start), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full p-3 gap-2 thin-scroll overflow-y-auto">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
          <span>live · {cpuSeries[cpuSeries.length - 1]?.t ?? 0} ticks</span>
        </div>
        <div className="text-xs text-white/60 font-mono">uptime {fmtTime(uptime)}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Gauge label="CPU" value={cpu} color="#22d3ee" icon={Cpu} series={cpuSeries} />
        <Gauge label="Mémoire" value={ram} color="#34d399" icon={MemoryStick} series={ramSeries} />
        <Gauge label="Réseau" value={net} color="#f472b6" icon={Network} series={netSeries} />
        <Gauge label="Disque I/O" value={disk} color="#fbbf24" icon={HardDrive} series={diskSeries} />
      </div>
      <div className="bg-black/30 border border-white/8 rounded-lg p-3 mt-1">
        <div className="flex items-center gap-1.5 text-xs text-white/70 mb-2">
          <Activity className="w-3 h-3 text-cyan-400" />
          Charge combinée
        </div>
        <Sparkline
          data={cpuSeries.map((s, i) => ({ t: i, v: (cpuSeries[i].v + ramSeries[i]?.v + netSeries[i]?.v) / 3 }))}
          color="#22d3ee"
        />
        <div className="grid grid-cols-4 gap-2 mt-2 text-[10px] text-white/50 font-mono">
          <div>core 0: {Math.round(cpu * 100)}%</div>
          <div>core 1: {Math.round((cpu + 0.1) % 1 * 100)}%</div>
          <div>core 2: {Math.round((cpu - 0.1) * 100)}%</div>
          <div>core 3: {Math.round((cpu + 0.2) % 1 * 100)}%</div>
        </div>
      </div>
    </div>
  );
}
