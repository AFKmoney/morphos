"use client";

import { useEffect, useState, useRef } from "react";
import { Play, Pause, SkipForward, SkipBack, Heart, Volume2, Music4, Loader2, Plus, X } from "lucide-react";
import { useModulePersist } from "@/lib/module-state-store";
import { useSettings } from "@/lib/settings-store";
import { useT } from "@/lib/use-t";

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

const CUSTOM_COLORS = ["#22d3ee", "#f472b6", "#34d399", "#fbbf24", "#c084fc"];

export function MusicModule() {
  const t = useT();
  const fr = useSettings((s) => s.language) === "fr";
  const [idx, setIdx] = useModulePersist<number>("music:idx", 0);
  const [custom, setCustom] = useModulePersist<Track[]>("music:custom", []);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useModulePersist<number>("music:volume", 0.7);
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useModulePersist<Record<number, boolean>>("music:liked", {});
  const [audioError, setAudioError] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>([0, 0, 0, 0, 0]);
  const analyserRef = useRef<{ ctx: AudioContext; analyser: AnalyserNode; data: Uint8Array<ArrayBuffer> } | null>(null);
  const rafRef = useRef(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlist = [...TRACKS, ...custom];
  const track = playlist[idx % playlist.length] ?? TRACKS[0];

  useEffect(() => {
    if (!audioRef.current) {
      const el = new Audio();
      el.crossOrigin = "anonymous"; // allows the real analyser tap when the host sends CORS
      audioRef.current = el;
    }
    const audio = audioRef.current;
    queueMicrotask(() => setAudioError(null));
    audio.src = track.url;
    audio.volume = volume;

    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setLoading(false);
    };
    const onTime = () => setPos(audio.currentTime);
    const onEnded = () => {
      setIdx((i) => (i + 1) % playlist.length);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      const a = audioRef.current;
      if (a && a.crossOrigin === "anonymous") {
        // Host without CORS headers: retry plain (keeps sound, analyser tap off)
        a.crossOrigin = null;
        a.src = track.url;
        a.load();
        return;
      }
      setLoading(false);
      setAudioError(fr ? "Flux illisible — vérifie l'URL." : "Unreadable stream — check the URL.");
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", () => setLoading(true));
    audio.addEventListener("canplay", () => setLoading(false));
    audio.addEventListener("error", onError);

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
      audio.removeEventListener("error", onError);
      audio.pause();
    };
  }, [idx]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function ensureAnalyser() {
    const audio = audioRef.current;
    if (!audio || analyserRef.current || audio.crossOrigin !== "anonymous") return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32;
      analyser.smoothingTimeConstant = 0.75;
      src.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = { ctx, analyser, data: new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount)) };
    } catch {
      /* tap unavailable: bars stay flat, sound untouched */
    }
  }

  useEffect(() => {
    if (!playing) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const a = analyserRef.current;
      if (a) {
        a.analyser.getByteFrequencyData(a.data);
        const n = Math.max(1, a.data.length);
        setLevels([0, 1, 2, 3, 4].map((i) => (a.data[Math.floor((i * n) / 5)] ?? 0) / 255));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      analyserRef.current?.ctx.close().catch(() => {});
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      setAudioError(null);
      ensureAnalyser();
      analyserRef.current?.ctx.resume().catch(() => {});
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

  function addStream() {
    const url = newUrl.trim();
    if (!/^https?:\/\/.+/i.test(url)) return;
    let title = "Custom stream";
    try {
      const seg = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
      const clean = decodeURIComponent(seg).replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();
      if (clean) title = clean.slice(0, 40);
    } catch {}
    const entry: Track = { title, artist: fr ? "Flux perso" : "Custom", url, color: CUSTOM_COLORS[custom.length % CUSTOM_COLORS.length] };
    setCustom((c) => [...c, entry]);
    setIdx(TRACKS.length + custom.length);
    setNewUrl("");
    setShowAdd(false);
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
                    height: `${5 + (levels[i] ?? 0) * 19}px`,
                    boxShadow: `0 0 6px ${track.color}`,
                  }} />
              ))}
            </div>
          )}
        </div>
        <div className="relative text-center">
          <div className="text-base font-semibold text-white">{track.title}</div>
          <div className="text-xs text-white/50">{track.artist}</div>
          {audioError && <div className="text-[10px] text-rose-300 mt-1">{audioError}</div>}
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
          title={t("common.like")}
          className={liked[idx] ? "text-pink-400" : "text-white/40 hover:text-white/80"}>
          <Heart className="w-4 h-4" fill={liked[idx] ? "currentColor" : "none"} />
        </button>
        <button onClick={() => setIdx((i) => (i - 1 + playlist.length) % playlist.length)} title={t("common.previous")} className="text-white/60 hover:text-white">
          <SkipBack className="w-4 h-4" />
        </button>
        <button onClick={togglePlay}
          title={playing ? t("common.pause") : t("common.play")}
          className="w-9 h-9 rounded-full flex items-center justify-center text-black"
          style={{ background: track.color }}>
          {playing ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
        </button>
        <button onClick={() => setIdx((i) => (i + 1) % playlist.length)} title={t("common.next")} className="text-white/60 hover:text-white">
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {showAdd ? (
        <div className="flex items-center gap-1.5 px-4 pb-2">
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addStream(); if (e.key === "Escape") setShowAdd(false); }}
            placeholder={fr ? "Colle un URL MP3… (Entrée pour ajouter)" : "Paste an MP3 URL… (Enter to add)"}
            spellCheck={false}
            autoFocus
            className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-white/90 outline-none focus:border-cyan-400/40"
          />
          <button onClick={addStream} title={t("common.add")} className="text-[10px] px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30">
            {t("common.add")}
          </button>
          <button onClick={() => setShowAdd(false)} title={t("common.cancel")} className="text-white/40 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="mx-auto mb-1 flex items-center gap-1 text-[10px] text-white/35 hover:text-cyan-300 transition">
          <Plus className="w-3 h-3" /> {fr ? "Ajouter un flux MP3" : "Add MP3 stream"}
        </button>
      )}

      <div className="flex items-center gap-2 px-4 pb-3 text-white/40">
        <Volume2 className="w-3 h-3" />
        <input type="range" min={0} max={1} step={0.05} value={volume}
          onChange={(e) => setVolume(Number(e.target.value))} className="flex-1 accent-cyan-400 h-1" />
        <span className="text-[9px] font-mono w-6">{Math.round(volume * 100)}</span>
      </div>
    </div>
  );
}
