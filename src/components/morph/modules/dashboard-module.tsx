"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { AppWindow, MessagesSquare, Blocks, HardDrive } from "lucide-react";
import { useWindowStore } from "@/lib/window-store";
import { MODULE_LIST } from "@/components/morph/module-registry";
import { useSettings } from "@/lib/settings-store";

const PIE_COLORS = ["#22d3ee", "#34d399", "#f472b6", "#fbbf24", "#a78bfa", "#64748b"];

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function readStorage(): { keys: { name: string; bytes: number }[]; total: number } {
  try {
    const keys: { name: string; bytes: number }[] = [];
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const v = localStorage.getItem(k) || "";
      total += k.length + v.length;
      keys.push({ name: k.length > 26 ? "…" + k.slice(-25) : k, bytes: k.length + v.length });
    }
    keys.sort((a, b) => b.bytes - a.bytes);
    return { keys: keys.slice(0, 6), total };
  } catch {
    return { keys: [], total: 0 };
  }
}

export function DashboardModule() {
  const windows = useWindowStore((s) => s.windows);
  const chatMessages = useWindowStore((s) => s.chatMessages);
  const fr = useSettings((s) => s.language) === "fr";

  // Real chat activity: messages binned across their own time span (12 buckets)
  const activity = useMemo(() => {
    const N = 12;
    const buckets = Array.from({ length: N }, (_, i) => ({ name: `${i + 1}`, user: 0, ai: 0 }));
    if (chatMessages.length === 0) return buckets;
    const tss = chatMessages.map((m) => m.ts);
    const min = Math.min(...tss);
    const max = Math.max(Date.now(), ...tss);
    const span = Math.max(1, max - min);
    for (const m of chatMessages) {
      const b = Math.min(N - 1, Math.floor(((m.ts - min) / span) * N));
      if (m.role === "user") buckets[b].user += 1;
      else buckets[b].ai += 1;
    }
    return buckets;
  }, [chatMessages]);

  // Real window-type distribution (top 5 + other)
  const dist = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of windows) counts.set(w.type, (counts.get(w.type) ?? 0) + 1);
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 5).map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));
    const rest = sorted.slice(5).reduce((s, [, v]) => s + v, 0);
    if (rest > 0) top.push({ name: fr ? "autres" : "other", value: rest, color: PIE_COLORS[5] });
    return top;
  }, [windows, fr]);

  const storage = useMemo(() => readStorage(), [windows, chatMessages]);
  const userMsgs = chatMessages.filter((m) => m.role === "user").length;
  const aiMsgs = chatMessages.filter((m) => m.role !== "user").length;
  const minimized = windows.filter((w) => w.minimized).length;

  const tipStyle = {
    background: "rgba(15,15,25,0.95)",
    border: "1px solid rgba(34,211,238,0.3)",
    borderRadius: "8px",
    fontSize: "11px",
  } as const;

  return (
    <div className="flex flex-col h-full p-3 gap-3 thin-scroll overflow-y-auto">
      <div className="grid grid-cols-4 gap-2">
        <Kpi label={fr ? "Fenêtres" : "Windows"} value={String(windows.length)} sub={fr ? `${minimized} réduites` : `${minimized} minimized`} icon={AppWindow} color="#22d3ee" />
        <Kpi label={fr ? "Messages" : "Messages"} value={String(chatMessages.length)} sub={`${userMsgs} user · ${aiMsgs} AI`} icon={MessagesSquare} color="#34d399" />
        <Kpi label={fr ? "Modules" : "Modules"} value={String(MODULE_LIST.length)} sub={fr ? "au registre" : "registered"} icon={Blocks} color="#fbbf24" />
        <Kpi label={fr ? "Stockage" : "Storage"} value={fmtBytes(storage.total)} sub={fr ? "local réel" : "real local"} icon={HardDrive} color="#f472b6" />
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1 min-h-[240px]">
        <div className="bg-black/30 border border-white/8 rounded-lg p-2 flex flex-col">
          <div className="text-xs text-white/60 px-1 py-1">{fr ? "Activité chat réelle · session" : "Real chat activity · session"}</div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activity} margin={{ top: 6, right: 6, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f472b6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tipStyle} />
              <Area type="monotone" dataKey="user" stroke="#22d3ee" strokeWidth={2} fill="url(#g1)" />
              <Area type="monotone" dataKey="ai" stroke="#f472b6" strokeWidth={2} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-black/30 border border-white/8 rounded-lg p-2 flex flex-col">
          <div className="text-xs text-white/60 px-1 py-1">{fr ? "Fenêtres par type (réel)" : "Windows by type (real)"}</div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={dist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} stroke="none">
                {dist.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-black/30 border border-white/8 rounded-lg p-2 h-[150px]">
        <div className="text-xs text-white/60 px-1 pb-1 flex items-center justify-between">
          <span>{fr ? "Stockage réel par clé · top 6" : "Real storage by key · top 6"}</span>
          <span className="text-white/40 font-mono">{fmtBytes(storage.total)}</span>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={storage.keys} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 8 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={130} tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 9 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tipStyle} formatter={(v) => [fmtBytes(Number(v)), fr ? "taille" : "size"]} />
            <Bar dataKey="bytes" fill="#34d399" radius={[0, 3, 3, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-black/30 border border-white/8 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3" style={{ color }} />
        <div className="text-[10px] text-white/40">{label}</div>
      </div>
      <div className="text-base font-bold text-white mt-1">{value}</div>
      <div className="text-[10px] text-white/40 font-mono">{sub}</div>
    </div>
  );
}
