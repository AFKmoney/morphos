// Plugin System exports
// Ce fichier exporte tout ce qui est nécessaire pour travailler avec les plugins MorphOS

export type {
  MorphOSPlugin,
  PluginManifest,
  PluginRuntime,
  PluginPermission,
  PluginCategory,
  PluginStatus,
  InstalledPlugin,
  PluginSource,
  PluginEvent,
  PluginLoadOptions,
} from "./plugin-types";

export {
  pluginRegistry,
  usePluginRegistry,
  registerPlugin,
  unregisterPlugin,
  getPluginRegistry,
} from "./plugin-registry";
