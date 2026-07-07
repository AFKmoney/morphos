"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/lib/window-store";
import { MorphWindowView } from "./morph-window";
import { SpawnOverlay } from "./spawn-overlay";
import { CommandDock } from "./command-dock";
import { TopBar } from "./top-bar";
import { SettingsPanel } from "./settings-panel";
import { BootSequence } from "./boot-sequence";
import { getModuleMeta } from "./module-registry";
import { useSettings } from "@/lib/settings-store";
import { useT } from "@/lib/use-t";

export function MorphCanvas() {
  const windows = useWindowStore((s) => s.windows);
  const spawnWindow = useWindowStore((s) => s.spawnWindow);
  const t = useT();
  const enableBoot = useSettings((s) => s.enableBoot);
  const hasSeenBoot = useSettings((s) => s.hasSeenBoot);
  const markBootSeen = useSettings((s) => s.markBootSeen);
  const [booting, setBooting] = useState(enableBoot && !hasSeenBoot);

  // On first mount (after boot), spawn the default Chat window as the entry point.
  useEffect(() => {
    if (booting) return;
    if (windows.length === 0) {
      const meta = getModuleMeta("chat");
      const w = window.innerWidth;
      const h = window.innerHeight;
      const width = 460;
      const height = 560;
      spawnWindow({
        type: "chat",
        title: t("module.chat"),
        subtitle: t("module.chat.desc"),
        x: Math.max(40, Math.min(w - width - 40, 80)),
        y: Math.max(60, Math.min(h - height - 80, 100)),
        width,
        height,
      });
    }
  }, [booting]);

  function handleBootDone() {
    markBootSeen();
    setBooting(false);
  }

  return (
    <>
      {booting && <BootSequence onDone={handleBootDone} />}

      <div
        className="morph-grid-bg overflow-hidden"
        style={{
          position: "fixed",
          inset: 0,
        }}
      >
        {/* Ambient orbs */}
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--morph-accent) 0%, transparent 70%)", filter: "blur(60px)" }}
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
        <SettingsPanel />
      </div>
    </>
  );
}
