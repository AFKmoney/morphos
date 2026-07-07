"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, Wind, Droplets, MapPin, Snowflake, CloudDrizzle, Loader2, AlertCircle } from "lucide-react";

const CITIES = [
  { name: "Paris", lat: 48.85, lon: 2.35 },
  { name: "Tokyo", lat: 35.68, lon: 139.69 },
  { name: "New York", lat: 40.71, lon: -74.01 },
  { name: "Sydney", lat: -33.87, lon: 151.21 },
  { name: "Dubai", lat: 25.20, lon: 55.27 },
  { name: "London", lat: 51.51, lon: -0.13 },
];

interface WeatherData {
  temp: number;
  windSpeed: number;
  humidity: number;
  apparentTemp: number;
  weatherCode: number;
  hourly: { time: string; temp: number }[];
}

function codeToInfo(code: number): { icon: React.ElementType; label: string; color: string } {
  if (code === 0) return { icon: Sun, label: "Clear", color: "#fbbf24" };
  if (code <= 3) return { icon: Cloud, label: "Cloudy", color: "#94a3b8" };
  if (code <= 48) return { icon: Cloud, label: "Fog", color: "#64748b" };
  if (code <= 57) return { icon: CloudDrizzle, label: "Drizzle", color: "#22d3ee" };
  if (code <= 67) return { icon: CloudRain, label: "Rain", color: "#3b82f6" };
  if (code <= 77) return { icon: Snowflake, label: "Snow", color: "#e0f2fe" };
  if (code <= 82) return { icon: CloudRain, label: "Showers", color: "#22d3ee" };
  if (code <= 86) return { icon: Snowflake, label: "Snow", color: "#e0f2fe" };
  if (code >= 95) return { icon: CloudRain, label: "Thunderstorm", color: "#a78bfa" };
  return { icon: Cloud, label: "Unknown", color: "#94a3b8" };
}

export function WeatherModule() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const city = CITIES[activeIdx];

    async function load() {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,apparent_temperature,weather_code&hourly=temperature_2m&forecast_hours=6&timezone=auto`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        if (cancelled) return;
        setData({
          temp: Math.round(d.current.temperature_2m),
          windSpeed: Math.round(d.current.wind_speed_10m),
          humidity: d.current.relative_humidity_2m,
          apparentTemp: Math.round(d.current.apparent_temperature),
          weatherCode: d.current.weather_code,
          hourly: d.hourly.time.slice(0, 6).map((t: string, i: number) => ({
            time: t,
            temp: Math.round(d.hourly.temperature_2m[i]),
          })),
        });
        setError(null);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    }

    setLoading(true);
    load();
    return () => { cancelled = true; };
  }, [activeIdx]);

  const city = CITIES[activeIdx];
  const info = data ? codeToInfo(data.weatherCode) : { icon: Cloud, label: "", color: "#94a3b8" };
  const Icon = info.icon;

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex gap-1 flex-wrap">
        {CITIES.map((c, i) => (
          <button
            key={c.name}
            onClick={() => setActiveIdx(i)}
            className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 ${
              i === active ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "text-white/50 hover:text-white/80"
            }`}
          >
            <MapPin className="w-2.5 h-2.5" />
            {c.name}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex-1 flex flex-col items-center justify-center text-rose-300 text-xs gap-2">
          <AlertCircle className="w-6 h-6" />
          <div>Failed to load weather</div>
          <div className="text-[9px] text-white/40">{error}</div>
        </div>
      )}

      {data && !loading && !error && (
        <>
          <div className="flex-1 flex flex-col items-center justify-center">
            <Icon className="w-16 h-16 mb-2 float-slow" style={{ color: info.color }} />
            <div className="text-5xl font-thin text-white">{data.temp}°</div>
            <div className="text-sm text-white/60 mt-1">{info.label}</div>
            <div className="text-[10px] text-white/40 mt-1">{city.name} · {new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="bg-black/30 border border-white/8 rounded p-2 text-center">
              <Wind className="w-3 h-3 mx-auto text-cyan-400 mb-1" />
              <div className="text-white/80">{data.windSpeed} km/h</div>
              <div className="text-white/40">Wind</div>
            </div>
            <div className="bg-black/30 border border-white/8 rounded p-2 text-center">
              <Droplets className="w-3 h-3 mx-auto text-cyan-400 mb-1" />
              <div className="text-white/80">{data.humidity}%</div>
              <div className="text-white/40">Humidity</div>
            </div>
            <div className="bg-black/30 border border-white/8 rounded p-2 text-center">
              <Sun className="w-3 h-3 mx-auto text-amber-400 mb-1" />
              <div className="text-white/80">{data.apparentTemp}°</div>
              <div className="text-white/40">Feels</div>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-1 text-center">
            {data.hourly.map((h, i) => {
              const dt = new Date(h.time);
              return (
                <div key={i} className="bg-black/20 rounded p-1">
                  <div className="text-[9px] text-white/40">{String(dt.getHours()).padStart(2, "0")}h</div>
                  <div className="text-[10px] text-white/80 font-mono">{h.temp}°</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
