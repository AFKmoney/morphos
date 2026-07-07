"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, Wind, Droplets, MapPin } from "lucide-react";

const CITIES = [
  { name: "Paris", temp: 18, cond: "Nuageux", icon: Cloud, color: "#94a3b8" },
  { name: "Tokyo", temp: 26, cond: "Ensoleillé", icon: Sun, color: "#fbbf24" },
  { name: "Reykjavik", temp: 4, cond: "Pluie", icon: CloudRain, color: "#22d3ee" },
  { name: "Dubaï", temp: 38, cond: "Ensoleillé", icon: Sun, color: "#f97316" },
];

export function WeatherModule() {
  const [active, setActive] = useState(0);
  const [hour, setHour] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setHour(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const city = CITIES[active];
  const Icon = city.icon;

  const forecast = Array.from({ length: 6 }, (_, i) => ({
    h: (hour.getHours() + i * 3) % 24,
    t: city.temp + Math.round((Math.random() - 0.5) * 6),
  }));

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex gap-1 flex-wrap">
        {CITIES.map((c, i) => (
          <button
            key={c.name}
            onClick={() => setActive(i)}
            className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${
              i === active ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "text-white/50 hover:text-white/80"
            }`}
          >
            <MapPin className="w-2.5 h-2.5" />
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <Icon className="w-16 h-16 mb-2 float-slow" style={{ color: city.color }} />
        <div className="text-5xl font-thin text-white">{city.temp}°</div>
        <div className="text-sm text-white/60 mt-1">{city.cond}</div>
        <div className="text-[10px] text-white/40 mt-1">{city.name} · {hour.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="bg-black/30 border border-white/8 rounded p-2 text-center">
          <Wind className="w-3 h-3 mx-auto text-cyan-400 mb-1" />
          <div className="text-white/80">{10 + Math.floor(Math.random() * 20)} km/h</div>
          <div className="text-white/40">Vent</div>
        </div>
        <div className="bg-black/30 border border-white/8 rounded p-2 text-center">
          <Droplets className="w-3 h-3 mx-auto text-cyan-400 mb-1" />
          <div className="text-white/80">{40 + Math.floor(Math.random() * 40)}%</div>
          <div className="text-white/40">Humidité</div>
        </div>
        <div className="bg-black/30 border border-white/8 rounded p-2 text-center">
          <Sun className="w-3 h-3 mx-auto text-amber-400 mb-1" />
          <div className="text-white/80">{city.temp + 3}°</div>
          <div className="text-white/40">Ressenti</div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1 text-center">
        {forecast.map((f, i) => (
          <div key={i} className="bg-black/20 rounded p-1">
            <div className="text-[9px] text-white/40">{String(f.h).padStart(2, "0")}h</div>
            <div className="text-[10px] text-white/80 font-mono">{f.t}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}
