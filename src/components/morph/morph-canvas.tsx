"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/lib/window-store";
import { MorphWindowView } from "./morph-window";
import { SpawnOverlay } from "./spawn-overlay";
import { CommandDock } from "./command-dock";
import { TopBar } from "./top-bar";
import { getModuleMeta } from "./module-registry";

export function MorphCanvas() {
  const windows = useWindowStore((s) => s.windows);
  const spawnWindow = useWindowStore((s) => s.spawnWindow);

  // On first mount, spawn the default Chat window as the entry point.
  useEffect(() => {
    if (windows.length === 0) {
      const meta = getModuleMeta("chat");
      const w = window.innerWidth;
      const h = window.innerHeight;
      const width = 460;
      const height = 560;
      spawnWindow({
        type: "chat",
        title: meta.label,
        subtitle: meta.description,
        x: Math.max(40, Math.min(w - width - 40, 80)),
        y: Math.max(60, Math.min(h - height - 80, 100)),
        width,
        height,
      });
    }
  }, []);

  return (
    <div
      className="morph-grid-bg overflow-hidden"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgb(13, 14, 23)",
        backgroundImage:
          "linear-gradient(rgba(34, 211, 238, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.12) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      {/* Ambient orbs */}
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)", filter: "blur(60px)" }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #f472b6 0%, transparent 70%)", filter: "blur(60px)" }}
      />

      <TopBar />

      <div className="absolute inset-0 pt-12 pb-4">
        <AnimatePresence>
          {windows.map((w) => (
            <MorphWindowView key={w.id} win={w} />
          ))}
        </AnimatePresence>
      </div>

      <SpawnOverlay />
      <CommandDock />
    </div>
  );
}
