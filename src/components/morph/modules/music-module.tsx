"use client";

import { useEffect, useState } from "react";
import { Play, Pause, SkipForward, SkipBack, Heart, Shuffle, Repeat, Volume2 } from "lucide-react";

const TRACKS = [
  { title: "Neon Cascade", artist: "MorphOS Synth", dur: 214, color: "#22d3ee" },
  { title: "Liquid Memory", artist: "Z.ai Collective", dur: 188, color: "#f472b6" },
  { title: "Adaptive Drift", artist: "Self-Writing", dur: 246, color: "#34d399" },
  { title: "Hot Reload Dreams", artist: "MorphOS Synth", dur: 172, color: "#fbbf24" },
];

export function MusicModule() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [pos, setPos] = useState(0);
  const [liked, setLiked] = useState<Record<number, boolean>>({ 1: true });

  const track = TRACKS[idx];

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPos((p) => {
        if (p >= track.dur) {
          setIdx((i) => (i + 1) % TRACKS.length);
          return 0;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing, track.dur]);

  useEffect(() => { setPos(0); }, [idx]);

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: `radial-gradient(circle at 50% 40%, ${track.color}40, transparent 70%)` }}
        />
        <div
          className={`relative w-32 h-32 rounded-2xl mb-4 flex items-center justify-center ${playing ? "float-slow" : ""}`}
          style={{
            background: `linear-gradient(135deg, ${track.color}30, ${track.color}10)`,
            border: `1px solid ${track.color}40`,
            boxShadow: `0 0 40px ${track.color}30`,
          }}
        >
          <div className="flex gap-1 items-end h-12">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1 rounded-full"
                style={{
                  background: track.color,
                  height: playing ? `${20 + Math.abs(Math.sin(Date.now() / 200 + i)) * 30}px` : "8px",
                  transition: "height 0.15s",
                  animation: playing ? `live-pulse ${0.6 + i * 0.1}s ease-in-out infinite` : "none",
                }}
              />
            ))}
          </div>
        </div>
        <div className="relative text-center">
          <div className="text-base font-semibold text-white">{track.title}</div>
          <div className="text-xs text-white/50">{track.artist}</div>
        </div>
      </div>

      <div className="px-4 pb-1">
        <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
          <span>{fmt(pos)}</span>
          <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(pos / track.dur) * 100}%`,
                background: `linear-gradient(90deg, ${track.color}80, ${track.color})`,
              }}
            />
          </div>
          <span>{fmt(track.dur)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 p-3">
        <button
          onClick={() => setLiked((l) => ({ ...l, [idx]: !l[idx] }))}
          className={liked[idx] ? "text-pink-400" : "text-white/40 hover:text-white/80"}
        >
          <Heart className="w-4 h-4" fill={liked[idx] ? "currentColor" : "none"} />
        </button>
        <button onClick={() => setIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length)} className="text-white/60 hover:text-white">
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-black"
          style={{ background: track.color }}
        >
          {playing ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
        </button>
        <button onClick={() => setIdx((i) => (i + 1) % TRACKS.length)} className="text-white/60 hover:text-white">
          <SkipForward className="w-4 h-4" />
        </button>
        <button className="text-white/40 hover:text-white/80">
          <Shuffle className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 pb-3 text-white/40">
        <Volume2 className="w-3 h-3" />
        <div className="flex-1 h-1 bg-white/8 rounded-full">
          <div className="h-full w-2/3 rounded-full bg-white/30" />
        </div>
        <Repeat className="w-3 h-3" />
      </div>
    </div>
  );
}
