"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Users, DollarSign, Eye, ShoppingCart } from "lucide-react";
import { useModulePersist } from "@/lib/module-state-store";

const DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// Generate deterministic data based on the current week seed
function generateWeekData() {
  const seed = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)); // changes weekly
  const rng = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 233280;
    return x - Math.floor(x);
  };
  return DAYS_EN.map((day, i) => ({
    name: day,
    sales: Math.round(3000 + rng(i) * 5000),
    visits: Math.round(1000 + rng(i + 7) * 4000),
  }));
}

const CHANNELS = [
  { name: "Direct", value: 4200, color: "#22d3ee" },
  { name: "Organic", value: 3100, color: "#34d399" },
  { name: "Social", value: 2200, color: "#f472b6" },
  { name: "Ads", value: 1800, color: "#fbbf24" },
];

export function DashboardModule() {
  const [salesData] = useState(generateWeekData);
  const [liveSeries, setLiveSeries] = useState(
    Array.from({ length: 20 }, (_, i) => ({ t: i, v: 50 + Math.random() * 40 }))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setLiveSeries((prev) => {
        const next = Math.max(20, Math.min(100, (prev[prev.length - 1]?.v ?? 60) + (Math.random() - 0.5) * 20));
        return [...prev.slice(1), { t: (prev[prev.length - 1]?.t ?? 0) + 1, v: next }];
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const totalSales = salesData.reduce((s, d) => s + d.sales, 0);
  const totalVisits = salesData.reduce((s, d) => s + d.visits, 0);
  const conversion = ((totalSales / (totalVisits || 1)) * 100).toFixed(2);
  const avgCart = Math.round(totalSales / (totalVisits || 1));

  return (
    <div className="flex flex-col h-full p-3 gap-3 thin-scroll overflow-y-auto">
      <div className="grid grid-cols-4 gap-2">
        <Kpi label="Sales" value={`€${(totalSales / 1000).toFixed(1)}k`} delta="+12.4%" up icon={DollarSign} color="#34d399" />
        <Kpi label="Visitors" value={totalVisits.toLocaleString()} delta="+8.2%" up icon={Users} color="#22d3ee" />
        <Kpi label="Conversion" value={`${conversion}%`} delta="-0.4%" up={false} icon={Eye} color="#fbbf24" />
        <Kpi label="Avg Cart" value={`€${avgCart}`} delta="+2.1%" up icon={ShoppingCart} color="#f472b6" />
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1 min-h-[240px]">
        <div className="bg-black/30 border border-white/8 rounded-lg p-2 flex flex-col">
          <div className="text-xs text-white/60 px-1 py-1">Ventes vs Visites · 7j</div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 6, right: 6, bottom: 0, left: -20 }}>
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
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,15,25,0.95)",
                  border: "1px solid rgba(34,211,238,0.3)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Area type="monotone" dataKey="sales" stroke="#22d3ee" strokeWidth={2} fill="url(#g1)" />
              <Area type="monotone" dataKey="visits" stroke="#f472b6" strokeWidth={2} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-black/30 border border-white/8 rounded-lg p-2 flex flex-col">
          <div className="text-xs text-white/60 px-1 py-1">Canaux acquisition</div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={CHANNELS}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                stroke="none"
              >
                {CHANNELS.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(15,15,25,0.95)",
                  border: "1px solid rgba(34,211,238,0.3)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-black/30 border border-white/8 rounded-lg p-2 h-[110px]">
        <div className="text-xs text-white/60 px-1 pb-1 flex items-center justify-between">
          <span>Trafic temps réel · {liveSeries.length} échantillons</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1 h-1 rounded-full bg-emerald-400 live-dot" />
            live
          </span>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={liveSeries}>
            <Bar dataKey="v" fill="#22d3ee" radius={[2, 2, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Kpi({ label, value, delta, up, icon: Icon, color }: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-black/30 border border-white/8 rounded-lg p-2.5">
      <div className="flex items-center justify-between">
        <Icon className="w-3 h-3" style={{ color }} />
        <div className={up ? "text-emerald-400 text-[10px] flex items-center gap-0.5" : "text-rose-400 text-[10px] flex items-center gap-0.5"}>
          {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          {delta}
        </div>
      </div>
      <div className="text-base font-bold text-white mt-1">{value}</div>
      <div className="text-[10px] text-white/40">{label}</div>
    </div>
  );
}
