"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Scan, Aperture, Crosshair } from "lucide-react";

export function CameraModule() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch (e) {
      setError("Caméra inaccessible. Mode mock activé.");
      setStreaming(false);
    }
  }

  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v?.srcObject) {
        const s = v.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full p-3 gap-2">
      <div className="relative flex-1 bg-black rounded-lg overflow-hidden border border-white/10">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${streaming ? "" : "hidden"}`}
          muted
          playsInline
        />
        {!streaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="absolute inset-0 opacity-30"
              style={{ background: "radial-gradient(circle at 30% 30%, #22d3ee40, transparent 60%), radial-gradient(circle at 70% 70%, #f472b640, transparent 60%)" }}
            />
            <Camera className="w-12 h-12 text-cyan-400/60 mb-3" />
            <p className="text-xs text-white/60 mb-3">
              {error ?? "Caméra inactive — clique pour démarrer"}
            </p>
            <button
              onClick={start}
              className="text-xs px-3 py-1.5 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30"
            >
              Activer la caméra
            </button>
          </div>
        )}

        {/* HUD overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 text-emerald-400">
              <span className="w-1 h-1 rounded-full bg-emerald-400 live-dot" />
              {streaming ? "REC" : "STBY"}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 text-white/60">
              f/2.0 · ISO 400
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
            <span className="font-mono">CAM_01</span>
          </div>
        </div>
      </div>
    </div>
  );
}
