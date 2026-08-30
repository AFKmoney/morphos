"use client";

import { registerPlugin } from "@/lib/plugins/plugin-registry";
import type { MorphOSPlugin } from "@/lib/plugins/plugin-types";
import { Sparkles } from "lucide-react";
import { useState } from "react";

/**
 * Plugin d'exemple "Hello World"
 * 
 * Ce plugin démontre les bases de la création d'un plugin MorphOS.
 * Il affiche un message personnalisable et montre comment utiliser
 * les permissions et les settings.
 */

// Composant principal du plugin
function HelloWorldPlugin({ windowId }: { windowId?: string }) {
  const [message, setMessage] = useState("Hello from Example Plugin!");
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-4">
      <div className="flex flex-col items-center gap-2">
        <Sparkles className="w-8 h-8 text-cyan-400" />
        <h2 className="text-xl font-semibold text-white">Example Plugin</h2>
        <p className="text-sm text-white/60 text-center">
          This is a demonstration plugin for MorphOS
        </p>
      </div>

      <div className="bg-white/5 rounded-lg p-4 w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-white/40 text-sm">Message:</span>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-cyan-400"
            placeholder="Type a message..."
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCount(c => c - 1)}
            className="px-4 py-1.5 rounded bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
          >
            -
          </button>
          <span className="text-white font-mono">{count}</span>
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-4 py-1.5 rounded bg-cyan-500 text-black text-sm hover:bg-cyan-400 transition-colors font-medium"
          >
            +
          </button>
        </div>
      </div>

      <div className="text-[10px] text-white/40 mt-4 text-center">
        Plugin ID: @morphos/example-plugin | v1.0.0
      </div>
    </div>
  );
}

// Composant de configuration du plugin
function HelloWorldSettings({
  onSave,
  currentSettings
}: {
  onSave: (settings: Record<string, unknown>) => void;
  currentSettings: Record<string, unknown>;
}) {
  const [settings, setSettings] = useState<Record<string, unknown>>(currentSettings);

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold text-white">Example Plugin Settings</h3>

      <div className="space-y-2">
        <label className="text-sm text-white/60">Default Message</label>
        <input
          type="text"
          value={(settings.defaultMessage as string) || ''}
          onChange={(e) => setSettings({ ...settings, defaultMessage: e.target.value })}
          className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-400"
          placeholder="Default message..."
        />
      </div>

      <button
        onClick={() => onSave(settings)}
        className="px-4 py-2 rounded bg-cyan-500 text-black text-sm hover:bg-cyan-400 transition-colors font-medium"
      >
        Save Settings
      </button>
    </div>
  );
}

// Manifest du plugin
const examplePluginManifest = {
  id: "@morphos/example-plugin",
  name: "Example Plugin",
  description: "A demonstration plugin showing the basics of MorphOS plugin development",
  version: "1.0.0",
  author: "MorphOS Team",
  repository: "https://github.com/AFKmoney/morphos",
  icon: Sparkles,
  category: "utility",
  permissions: [
    'ui.toast',
    'storage.local',
  ],
  tags: ["example", "demo", "hello-world", "tutorial"],
};

// Runtime du plugin
const examplePluginRuntime = {
  component: HelloWorldPlugin,
  settingsComponent: HelloWorldSettings,

  onLoad: (context) => {
    console.log(`[ExamplePlugin] Loaded! Plugin ID: ${context.pluginId}`);
    console.log(`[ExamplePlugin] Settings:`, context.settings);

    // Exemple d'utilisation de l'API MorphOS
    context.morphos.ui.notify({
      title: "Example Plugin",
      message: "Plugin loaded successfully!",
      type: "success",
      duration: 3000,
    });
  },

  onUnload: () => {
    console.log(`[ExamplePlugin] Unloaded!`);
  },

  onSettingsChange: (newSettings) => {
    console.log(`[ExamplePlugin] Settings changed:`, newSettings);
  },

  // API exposée par le plugin
  api: {
    getGreeting: () => "Hello from Example Plugin API!",
    getVersion: () => "1.0.0",
  },
};

// Plugin complet
const examplePlugin: MorphOSPlugin = {
  ...examplePluginManifest,
  ...examplePluginRuntime,
};

// Enregistrer le plugin au chargement
// Note: Dans une vraie implémentation, on chargerait les plugins
// dynamiquement depuis un dossier ou un registry.
// Pour l'instant, on les enregistre manuellement.

// Fonction pour enregistrer le plugin (à appeler depuis l'app)
export function registerExamplePlugin() {
  return registerPlugin(examplePlugin, {
    type: 'builtin',
  });
}

// Exporter le plugin pour usage direct
export { examplePlugin, HelloWorldPlugin, HelloWorldSettings };
