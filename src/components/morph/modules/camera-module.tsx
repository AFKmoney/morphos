"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Scan, Aperture, Crosshair, ImageDown, Square } from "lucide-react";
import { useSettings } from "@/lib/settings-store";

interface Shot { id: number; url: string; w: number; h: number; }
interface TrackInfo { w: number; h: number; label: string; facing: string; }

export function CameraModule() {
  const fr = useSettings((s) => s.language) === "fr";
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<TrackInfo | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);

  function explain(e: unknown): string {
    const name = e instanceof DOMException ? e.name : "";
    if (name === "NotAllowedError" || name === "SecurityError")
      return fr ? "Permission refusée — autorise la caméra dans le navigateur." : "Permission denied — allow camera access in the browser.";
    if (name === "NotFoundError" || name === "OverconstrainedError")
      return fr ? "Aucune caméra détectée sur cet appareil." : "No camera detected on this device.";
    if (name === "NotReadableError" || name === "AbortError")
      return fr ? "Caméra occupée par une autre application." : "Camera is busy in another application.";
    return fr
      ? `Caméra inaccessible (${e instanceof Error ? e.message : String(e)})`
      : `Camera unavailable (${e instanceof Error ? e.message : String(e)})`;
  }

  async function start() {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(fr ? "API caméra non supportée" : "Camera API not supported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const track = stream.getVideoTracks()[0];
      const st = track?.getSettings() ?? {};
      setInfo({
        w: st.width ?? videoRef.current?.videoWidth ?? 0,
        h: st.height ?? videoRef.current?.videoHeight ?? 0,
        label: track?.label || "CAM",
        facing: st.facingMode ?? "",
      });
      setStreaming(true);
    } catch (e) {
      setError(explain(e));
      setStreaming(false);
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    setInfo(null);
  }

  function snapshot() {
    const v = videoRef.current;
    if (!v || !streaming || v.videoWidth === 0) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const url = c.toDataURL("image/png");
    setShots((s) => [...s.slice(-5), { id: Date.now(), url, w: c.width, h: c.height }]);
  }

  function downloadShot(sh: Shot) {
    const a = document.createElement("a");
    a.href = sh.url;
    a.download = `morphos-cam-${sh.id}.png`;
    a.click();
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col h-full p-3 gap-2">
      <div className="relative flex-1 min-h-0 bg-black rounded-lg overflow-hidden border border-white/10">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${streaming ? "" : "hidden"}`}
          muted
          playsInline
        />
        {!streaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className="absolute inset-0 opacity-30"
              style={{ background: "radial-gradient(circle at 30% 30%, #22d3ee40, transparent 60%), radial-gradient(circle at 70% 70%, #f472b640, transparent 60%)" }}
            />
            <Camera className="w-12 h-12 text-cyan-400/60 mb-3" />
            <p className="text-xs text-white/60 mb-3 max-w-[280px]">
              {error ?? (fr ? "Caméra inactive — clique pour démarrer" : "Camera idle — click to start")}
            </p>
            <button
              onClick={start}
              className="text-xs px-3 py-1.5 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30"
            >
              {fr ? "Activer la caméra" : "Enable camera"}
            </button>
          </div>
        )}

        {/* HUD overlay — all values real (track settings) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 text-emerald-400">
              <span className={`w-1 h-1 rounded-full ${streaming ? "bg-emerald-400 live-dot" : "bg-white/30"}`} />
              {streaming ? "REC" : "STBY"}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 text-white/60">
              {info && info.w > 0 ? `${info.w}×${info.h}` : "—"}
              {info?.facing ? ` · ${info.facing}` : ""}
            </span>
          </div>
          <div className="absolute inset-6 border border-cyan-400/20 rounded">
            <Crosshair className="absolute -top-2 -left-2 w-4 h-4 text-cyan-400/60" />
            <Crosshair className="absolute -top-2 -right-2 w-4 h-4 text-cyan-400/60" />
            <Crosshair className="absolute -bottom-2 -left-2 w-4 h-4 text-cyan-400/60" />
            <Crosshair className="absolute -bottom-2 -right-2 w-4 h-4 text-cyan-400/60" />
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-around text-[10px] text-white/50">
            <Scan className="w-3 h-3" />
            <Aperture className="w-3 h-3 text-cyan-400/60" />
            <span className="font-mono truncate max-w-[140px]">{info?.label ?? "CAM"}</span>
          </div>
        </div>

        {streaming && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            <button
              onClick={snapshot}
              title={fr ? "Capturer (PNG)" : "Snapshot (PNG)"}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-black/60 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/20"
            >
              <ImageDown className="w-3 h-3" /> PNG
            </button>
            <button
              onClick={stop}
              title={fr ? "Arrêter" : "Stop"}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-black/60 border border-rose-400/40 text-rose-300 hover:bg-rose-500/20"
            >
              <Square className="w-3 h-3" fill="currentColor" />
            </button>
          </div>
        )}
      </div>

      {shots.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto thin-scroll py-0.5 shrink-0">
          {shots.map((sh) => (
            <button
              key={sh.id}
              onClick={() => downloadShot(sh)}
              title={`${sh.w}×${sh.h} · ${fr ? "cliquer pour télécharger" : "click to download"}`}
              className="shrink-0 w-16 h-12 rounded overflow-hidden border border-white/10 hover:border-cyan-400/40 transition"
            >
              <img src={sh.url} alt="snapshot" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
