// Global type declarations for MorphOS

import type { PluginPermission } from "@/lib/plugins/plugin-types";

// Déclarer les permissions globales pour les plugins
declare global {
  interface Window {
    // MorphOS Plugin API (à étendre)
    __MORPHOS_PLUGINS__?: {
      permissions: PluginPermission[];
      grantedPermissions: Set<PluginPermission>;
    };
  }
}

// Déclarer les modules pour les imports dynamiques
declare module "*.module.css" {
  const content: { [key: string]: string };
  export default content;
}

declare module "*.module.scss" {
  const content: { [key: string]: string };
  export default content;
}
