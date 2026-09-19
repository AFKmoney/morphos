"use client";

import { useEffect, useState, useRef } from "react";
import { Play, Pause, SkipForward, SkipBack, Heart, Volume2, Music4, Loader2 } from "lucide-react";
import { useModulePersist } from "@/lib/module-state-store";

interface Track {
  title: string;
  artist: string;
  url: string;
  color: string;
}

// Royalty-free music URLs (SoundHelix - free demo tracks)
const TRACKS: Track[] = [
  { title: "Midnight Drive", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", color: "#22d3ee" },
  { title: "Neon Dreams", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", color: "#f472b6" },
  { title: "Electric Pulse", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", color: "#34d399" },
  { title: "Crystal Waves", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", color: "#fbbf24" },
  { title: "Deep Focus", artist: "SoundHelix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", color: "#c084fc" },
];

export function MusicModule() {
  const [idx, setIdx] = useModulePersist<number>("music:idx", 0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useModulePersist<number>("music:volume", 0.7);
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useModulePersist<Record<number, boolean>>("music:liked", {});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const track = TRACKS[idx];

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    audio.src = track.url;
    audio.volume = volume;

    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setLoading(false);
    };
    const onTime = () => setPos(audio.currentTime);
    const onEnded = () => {
      setIdx((i) => (i + 1) % TRACKS.length);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", () => setLoading(true));
    audio.addEventListener("canplay", () => setLoading(false));

    queueMicrotask(() => {
      setLoading(true);
      audio.load();
    });

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
    };
  }, [idx]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
  }

  function fmt(s: number) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30"
          style={{ background: `radial-gradient(circle at 50% 40%, ${track.color}40, transparent 70%)` }} />
        <div className={`relative w-32 h-32 rounded-2xl mb-4 flex items-center justify-center ${playing ? "float-slow" : ""}`}
          style={{
            background: `linear-gradient(135deg, ${track.color}30, ${track.color}10)`,
            border: `1px solid ${track.color}40`,
            boxShadow: `0 0 40px ${track.color}30`,
          }}>
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: track.color }} />
          ) : (
            <Music4 className="w-10 h-10" style={{ color: track.color }} />
          )}
          {playing && !loading && (
            <div className="absolute bottom-3 flex gap-1 items-end h-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-1 rounded-full"
                  style={{
                    background: track.color,
                    height: `${8 + Math.abs(Math.sin(Date.now() / 200 + i)) * 16}px`,
                    animation: `live-pulse ${0.6 + i * 0.1}s ease-in-out infinite`,
                  }} />
              ))}
            </div>
          )}
        </div>
        <div className="relative text-center">
          <div className="text-base font-semibold text-white">{track.title}</div>
          <div className="text-xs text-white/50">{track.artist}</div>
        </div>
      </div>

      <div className="px-4 pb-1">
        <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
          <span>{fmt(pos)}</span>
          <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden cursor-pointer" onClick={seek}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${duration ? (pos / duration) * 100 : 0}%`, background: `linear-gradient(90deg, ${track.color}80, ${track.color})` }} />
          </div>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 p-3">
        <button onClick={() => setLiked((l) => ({ ...l, [idx]: !l[idx] }))}
          className={liked[idx] ? "text-pink-400" : "text-white/40 hover:text-white/80"}>
          <Heart className="w-4 h-4" fill={liked[idx] ? "currentColor" : "none"} />
        </button>
        <button onClick={() => setIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length)} className="text-white/60 hover:text-white">
          <SkipBack className="w-4 h-4" />
        </button>
        <button onClick={togglePlay}
          className="w-9 h-9 rounded-full flex items-center justify-center text-black"
          style={{ background: track.color }}>
          {playing ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
        </button>
        <button onClick={() => setIdx((i) => (i + 1) % TRACKS.length)} className="text-white/60 hover:text-white">
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 pb-3 text-white/40">
        <Volume2 className="w-3 h-3" />
        <input type="range" min={0} max={1} step={0.05} value={volume}
          onChange={(e) => setVolume(Number(e.target.value))} className="flex-1 accent-cyan-400 h-1" />
        <span className="text-[9px] font-mono w-6">{Math.round(volume * 100)}</span>
      </div>
    </div>
  );
}
