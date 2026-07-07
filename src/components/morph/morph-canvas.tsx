"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useWindowStore } from "@/lib/window-store";
import { useSettings } from "@/lib/settings-store";
import { useKeyboardShortcuts } from "./keyboard-shortcuts";

// Lazy load everything to keep initial bundle minimal
const MorphWindowView = dynamic(() => import("./morph-window").then(m => ({ default: m.MorphWindowView })), { ssr: false });
const SpawnOverlay = dynamic(() => import("./spawn-overlay").then(m => ({ default: m.SpawnOverlay })), { ssr: false });
const CommandDock = dynamic(() => import("./command-dock").then(m => ({ default: m.CommandDock })), { ssr: false });
const TopBar = dynamic(() => import("./top-bar").then(m => ({ default: m.TopBar })), { ssr: false });
const SettingsPanel = dynamic(() => import("./settings-panel").then(m => ({ default: m.SettingsPanel })), { ssr: false });
const BootSequence = dynamic(() => import("./boot-sequence").then(m => ({ default: m.BootSequence })), { ssr: false });
const CommandPalette = dynamic(() => import("./command-palette").then(m => ({ default: m.CommandPalette })), { ssr: false });
const WorkspaceManager = dynamic(() => import("./workspace-manager").then(m => ({ default: m.WorkspaceManager })), { ssr: false });

export function MorphCanvas() {
  const windows = useWindowStore((s) => s.windows);
  const spawnWindow = useWindowStore((s) => s.spawnWindow);
  const enableBoot = useSettings((s) => s.enableBoot);
  const hasSeenBoot = useSettings((s) => s.hasSeenBoot);
  const markBootSeen = useSettings((s) => s.markBootSeen);
  const [booting, setBooting] = useState(enableBoot && !hasSeenBoot);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [workspacesOpen, setWorkspacesOpen] = useState(false);

  useKeyboardShortcuts({
    onOpenPalette: () => setPaletteOpen((v) => !v),
    onOpenWorkspaces: () => setWorkspacesOpen((v) => !v),
  });

  // Spawn default chat window on first mount
  useEffect(() => {
    if (booting) return;
    if (windows.length === 0) {
      // Lazy load the chat meta
      import("./module-registry").then(({ getModuleMeta }) => {
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

      <div className="morph-grid-bg overflow-hidden" style={{ position: "fixed", inset: 0 }}>
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--morph-accent) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, #f472b6 0%, transparent 70%)", filter: "blur(60px)" }} />

        <TopBar onOpenWorkspaces={() => setWorkspacesOpen(true)} />

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
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <WorkspaceManager open={workspacesOpen} onClose={() => setWorkspacesOpen(false)} />

        <div className="fixed bottom-4 right-4 z-30 text-[9px] text-white/30 font-mono hidden lg:block">
          <div>⌘K palette · ⌘⇧S workspaces</div>
          <div>⌘, settings · ⌘⇧L language</div>
        </div>
      </div>
    </>
  );
}
