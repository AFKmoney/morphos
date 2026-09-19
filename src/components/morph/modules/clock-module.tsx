"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings-store";

const ZONES = [
  { city: "Paris", tz: "Europe/Paris", color: "#22d3ee" },
  { city: "New York", tz: "America/New_York", color: "#f472b6" },
  { city: "Tokyo", tz: "Asia/Tokyo", color: "#34d399" },
  { city: "Sydney", tz: "Australia/Sydney", color: "#fbbf24" },
];

export function ClockModule() {
  const language = useSettings((s) => s.language);
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hr = now.getHours();

  return (
    <div className="flex h-full p-4 gap-4 items-center">
      {/* Analog clock */}
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="46" fill="rgba(0,0,0,0.4)" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x1 = 50 + Math.cos(angle) * 38;
            const y1 = 50 + Math.sin(angle) * 38;
            const x2 = 50 + Math.cos(angle) * 44;
            const y2 = 50 + Math.sin(angle) * 44;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            );
          })}
          {/* Hour hand */}
          <line
            x1="50" y1="50"
            x2={50 + Math.cos((hr * 30 + min * 0.5 - 90) * (Math.PI / 180)) * 24}
            y2={50 + Math.sin((hr * 30 + min * 0.5 - 90) * (Math.PI / 180)) * 24}
            stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round"
          />
          {/* Minute hand */}
          <line
            x1="50" y1="50"
            x2={50 + Math.cos((min * 6 - 90) * (Math.PI / 180)) * 36}
            y2={50 + Math.sin((min * 6 - 90) * (Math.PI / 180)) * 36}
            stroke="#34d399" strokeWidth="1.8" strokeLinecap="round"
          />
          {/* Second hand */}
          <line
            x1="50" y1="50"
            x2={50 + Math.cos((sec * 6 - 90) * (Math.PI / 180)) * 40}
            y2={50 + Math.sin((sec * 6 - 90) * (Math.PI / 180)) * 40}
            stroke="#f472b6" strokeWidth="1" strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="2.5" fill="#22d3ee" />
        </svg>
      </div>

      {/* Digital + world clocks */}
      <div className="flex-1 space-y-2">
        <div className="font-mono text-3xl text-white tabular-nums">
          {String(hr).padStart(2, "0")}:{String(min).padStart(2, "0")}
          <span className="text-cyan-400 text-lg">:{String(sec).padStart(2, "0")}</span>
        </div>
        <div className="text-[10px] text-white/40">
          {now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <div className="space-y-1 pt-1 border-t border-white/8">
          {ZONES.map((z) => (
            <div key={z.city} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full" style={{ background: z.color }} />
                <span className="text-white/60">{z.city}</span>
              </span>
              <span className="font-mono text-white/80 tabular-nums">
                {now.toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: z.tz,
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
