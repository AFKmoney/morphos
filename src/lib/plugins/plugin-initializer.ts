"use client";

import { Puzzle } from "lucide-react";
import { registerPlugin } from "./plugin-registry";
import type { MorphOSPlugin, PluginSource } from "./plugin-types";

function HelloPluginView() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-white/80 p-6 text-center">
      <Puzzle className="w-8 h-8 text-violet-300" />
      <div className="text-sm font-medium">Hello MorphOS</div>
      <p className="text-[11px] text-white/45 max-w-xs">
        Built-in example plugin. Load it from the Plugins window — this is a real registry entry, not a mock store.
      </p>
    </div>
  );
}

const HELLO_PLUGIN: MorphOSPlugin = {
  id: "@morphos/hello",
  name: "Hello MorphOS",
  description: "Example built-in plugin used to verify the registry actually loads something.",
  version: "0.1.0",
  author: "MorphOS",
  icon: Puzzle,
  category: "utility",
  permissions: ["ui.notify"],
  tags: ["example", "builtin"],
  component: HelloPluginView,
};

const BUILTIN_PLUGINS: { plugin: MorphOSPlugin; source: PluginSource }[] = [
  { plugin: HELLO_PLUGIN, source: { type: "builtin" } },
];

let initialized = false;

export function addBuiltinPlugin(plugin: MorphOSPlugin, source: PluginSource = { type: "builtin" }) {
  BUILTIN_PLUGINS.push({ plugin, source });
}

export async function initializePlugins(): Promise<void> {
  if (initialized) return;
  for (const { plugin, source } of BUILTIN_PLUGINS) {
    try {
      registerPlugin(plugin, source);
    } catch (error) {
      console.error(`[PluginInitializer] Failed to register ${plugin.id}:`, error);
    }
  }
  initialized = true;
}

export async function loadPluginFromURL(_url: string): Promise<MorphOSPlugin | null> {
  return null;
}

export async function loadPluginFromPath(_path: string): Promise<MorphOSPlugin | null> {
  return null;
}

export async function reloadPlugins(): Promise<void> {
  initialized = false;
  await initializePlugins();
}
