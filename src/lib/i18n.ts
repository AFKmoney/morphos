// i18n system — English (default) + French

export type Language = "en" | "fr";

export type TranslationKey = keyof typeof translations.en;

export const translations = {
  en: {
    // App
    "app.title": "MorphOS",
    "app.subtitle": "self-writing interface · v0.9.5",
    "app.tagline": "The interface that rewrites itself",
    "app.description": "A modular interface that morphs in real-time. The AI rewrites the UI on the fly — hot reload, hot swap, multi-window adaptive.",

    // Boot sequence
    "boot.init": "Initializing morph-engine",
    "boot.registry": "Loading module registry",
    "boot.windows": "Spawning window manager",
    "boot.hotreload": "Activating hot-reload",
    "boot.hotswap": "Activating hot-swap",
    "boot.ipc": "Connecting IPC bus",
    "boot.ready": "MorphOS ready",
    "boot.tapToEnter": "Tap anywhere to enter",

    // Top bar
    "topbar.modules": "Modules",
    "topbar.closeAll": "Close all",
    "topbar.settings": "Settings",
    "topbar.language": "Language",
    "topbar.moduleCount": "{count} module mounted",
    "topbar.moduleCountPlural": "{count} modules mounted",
    "topbar.writing": "writing in progress",
    "topbar.mounted": "mounted",

    // Command dock
    "dock.placeholder": "Tell MorphOS what you need… (e.g. « become a system monitor »)",
    "dock.placeholderInterpreting": "MorphOS is writing…",
    "dock.placeholderFallback": "Tell MorphOS what you need…",
    "dock.history": "Chat history",
    "dock.send": "Send",
    "dock.hotreload": "hot-reload",
    "dock.active": "active",
    "dock.activePlural": "active",
    "dock.hint": "⏎ to spawn a module",
    "dock.interpreting": "interpreting…",

    // Chat
    "chat.title": "Chat",
    "chat.subtitle": "Conversational console",
    "chat.welcome": "Hey. I'm MorphOS — an interface that rewrites itself. Tell me what you need and I'll spawn the right module. Try: \"become a system monitor\", \"add a sales dashboard\", \"open a terminal\", \"create a kanban for my project\".",
    "chat.placeholder": "Tell MorphOS what you need…",
    "chat.interpreting": "MorphOS is interpreting…",
    "chat.hint": "Hot-swap active · Enter to send · ⇧+Enter for newline",
    "chat.fail": "Hot-reload failed. Try again.",

    // Window controls
    "window.minimize": "Minimize",
    "window.maximize": "Maximize",
    "window.restore": "Restore",
    "window.close": "Close",

    // Module names
    "module.chat": "Chat",
    "module.chat.desc": "Conversational console",
    "module.monitor": "System Monitor",
    "module.monitor.desc": "CPU · RAM · Network live",
    "module.dashboard": "Dashboard",
    "module.dashboard.desc": "Analytics & KPIs",
    "module.terminal": "Terminal",
    "module.terminal.desc": "Interactive shell",
    "module.kanban": "Kanban",
    "module.kanban.desc": "Task board",
    "module.notes": "Notes",
    "module.notes.desc": "Markdown editor",
    "module.code": "Code",
    "module.code.desc": "Editor with highlight",
    "module.weather": "Weather",
    "module.weather.desc": "Multi-city forecast",
    "module.clock": "Clock",
    "module.clock.desc": "Analog + world",
    "module.music": "Music",
    "module.music.desc": "Audio player mock",
    "module.calculator": "Calculator",
    "module.calculator.desc": "Functional calculator",
    "module.stock": "Stock",
    "module.stock.desc": "Live ticker (mock)",
    "module.camera": "Camera",
    "module.camera.desc": "Webcam + HUD",
    "module.metrics": "Metrics",
    "module.metrics.desc": "Real-time Grafana-style",

    // Palette
    "palette.title": "Module registry",
    "palette.subtitle": "Manual spawn · hot-swap ready",
    "palette.hint": "Tip: prefer the chat (bottom) for natural-language spawning — the AI picks the module itself.",
    "palette.close": "Close",

    // Settings panel
    "settings.title": "Settings",
    "settings.subtitle": "Configure your AI provider & preferences",
    "settings.tab.provider": "AI Provider",
    "settings.tab.appearance": "Appearance",
    "settings.tab.about": "About",
    "settings.provider": "Provider",
    "settings.provider.select": "Select a provider",
    "settings.apiKey": "API key",
    "settings.apiKey.placeholder": "Paste your API key",
    "settings.apiKey.optional": "API key (optional)",
    "settings.apiKey.set": "✓ Key set",
    "settings.apiKey.unset": "Not set",
    "settings.apiKey.test": "Test",
    "settings.apiKey.testing": "Testing…",
    "settings.apiKey.ok": "Connection OK",
    "settings.apiKey.fail": "Connection failed",
    "settings.baseUrl": "Base URL",
    "settings.model": "Model",
    "settings.model.custom": "Custom model name",
    "settings.docs": "Get an API key →",
    "settings.save": "Save",
    "settings.saved": "Saved",
    "settings.close": "Close",
    "settings.language": "Language",
    "settings.language.en": "English",
    "settings.language.fr": "Français",
    "settings.theme": "Accent color",
    "settings.theme.cyan": "Cyan",
    "settings.theme.emerald": "Emerald",
    "settings.theme.pink": "Pink",
    "settings.theme.amber": "Amber",
    "settings.theme.violet": "Violet",
    "settings.sound": "Sound effects",
    "settings.boot": "Boot sequence",
    "settings.reset": "Reset to defaults",
    "settings.reset.confirm": "Reset all settings?",
    "settings.about.desc": "MorphOS is an experimental self-writing interface. The AI rewrites the UI in real-time based on your natural language requests. Built with Next.js 16, Framer Motion, and a unified LLM gateway supporting 12+ providers.",
    "settings.about.tech": "Built with",
    "settings.about.disclaimer": "API keys are stored in your browser's localStorage and sent directly to the chosen provider. Never to our servers.",
    "settings.about.gtm": "Made with ⚡ by the MorphOS project",

    // Spawn overlay
    "spawn.engine": "morph-engine",
    "spawn.writing": "self-writing module:",
    "spawn.hotreload": "hot-reload",
    "spawn.writingFile": "writing",
    "spawn.mounting": "→ mounting {title}…",
    "spawn.rec": "REC",
    "spawn.stby": "STBY",

    // Terminal
    "terminal.welcome": "MorphOS shell v0.9.5 — type 'help' for commands",
    "terminal.hotreload": "hot-reload active · hot-swap ready",
    "terminal.prompt": "operator@morphos:~$",
    "terminal.notfound": "command not found: {cmd} — try 'help'",
    "terminal.spawnHint": "→ use the chat bar (bottom) for natural language spawn",

    // Monitor
    "monitor.cpu": "CPU",
    "monitor.memory": "Memory",
    "monitor.network": "Network",
    "monitor.disk": "Disk I/O",
    "monitor.combined": "Combined load",
    "monitor.live": "live",
    "monitor.uptime": "uptime",

    // Dashboard
    "dashboard.sales": "Sales",
    "dashboard.visitors": "Visitors",
    "dashboard.conversion": "Conversion",
    "dashboard.avgCart": "Avg. cart",
    "dashboard.salesVsVisits": "Sales vs Visits · 7d",
    "dashboard.channels": "Acquisition channels",
    "dashboard.realtime": "Real-time traffic",
    "dashboard.samples": "{count} samples",

    // Kanban
    "kanban.backlog": "Backlog",
    "kanban.doing": "In progress",
    "kanban.review": "Review",
    "kanban.done": "Done",
    "kanban.empty": "empty",
    "kanban.add": "Add",
    "kanban.cancel": "Cancel",
    "kanban.titlePlaceholder": "Title…",

    // Notes
    "notes.file": "notes.md",
    "notes.edit": "Edit",
    "notes.preview": "Preview",

    // Code
    "code.compiled": "compiled",
    "code.lines": "{count} lines",

    // Weather
    "weather.cloudy": "Cloudy",
    "weather.sunny": "Sunny",
    "weather.rain": "Rain",
    "weather.wind": "Wind",
    "weather.humidity": "Humidity",
    "weather.feels": "Feels like",

    // Stock
    "stock.live": "NYSE · real-time (mock)",

    // Music
    "music.like": "Like",

    // Generic
    "common.close": "Close",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.confirm": "Confirm",
    "common.loading": "Loading…",
  },

  fr: {
    // App
    "app.title": "MorphOS",
    "app.subtitle": "interface auto-réécrite · v0.9.5",
    "app.tagline": "L'interface qui se réécrit elle-même",
    "app.description": "Une interface modulaire qui mute en temps réel. L'IA réécrit l'UI à la volée — hot reload, hot swap, multi-fenêtres adaptatif.",

    // Boot sequence
    "boot.init": "Initialisation du morph-engine",
    "boot.registry": "Chargement du registre de modules",
    "boot.windows": "Démarrage du gestionnaire de fenêtres",
    "boot.hotreload": "Activation du hot-reload",
    "boot.hotswap": "Activation du hot-swap",
    "boot.ipc": "Connexion au bus IPC",
    "boot.ready": "MorphOS prêt",
    "boot.tapToEnter": "Touchez pour entrer",

    // Top bar
    "topbar.modules": "Modules",
    "topbar.closeAll": "Tout fermer",
    "topbar.settings": "Réglages",
    "topbar.language": "Langue",
    "topbar.moduleCount": "{count} module monté",
    "topbar.moduleCountPlural": "{count} modules montés",
    "topbar.writing": "écriture en cours",
    "topbar.mounted": "monté",

    // Command dock
    "dock.placeholder": "Dis à MorphOS ce dont tu as besoin… (ex : « deviens un moniteur système »)",
    "dock.placeholderInterpreting": "MorphOS écrit…",
    "dock.placeholderFallback": "Dis à MorphOS ce dont tu as besoin…",
    "dock.history": "Historique du chat",
    "dock.send": "Envoyer",
    "dock.hotreload": "hot-reload",
    "dock.active": "actif",
    "dock.activePlural": "actifs",
    "dock.hint": "⏎ pour faire apparaître un module",
    "dock.interpreting": "interprétation…",

    // Chat
    "chat.title": "Chat",
    "chat.subtitle": "Console conversationnelle",
    "chat.welcome": "Salut. Je suis MorphOS — une interface qui se réécrit elle-même. Dis-moi ce dont tu as besoin et je vais faire apparaître le module adapté. Essaie : « deviens un moniteur système », « ajoute un dashboard de ventes », « ouvre un terminal », « crée un kanban pour mon projet ».",
    "chat.placeholder": "Dis à MorphOS ce dont tu as besoin…",
    "chat.interpreting": "MorphOS interprète…",
    "chat.hint": "Hot-swap actif · Entrée pour envoyer · ⇧+Entrée pour un saut de ligne",
    "chat.fail": "Oups, le hot-reload a raté. Réessaie.",

    // Window controls
    "window.minimize": "Minimiser",
    "window.maximize": "Agrandir",
    "window.restore": "Restaurer",
    "window.close": "Fermer",

    // Module names
    "module.chat": "Chat",
    "module.chat.desc": "Console conversationnelle",
    "module.monitor": "Moniteur Système",
    "module.monitor.desc": "CPU · RAM · Réseau live",
    "module.dashboard": "Dashboard Analytics",
    "module.dashboard.desc": "Analytics & KPIs",
    "module.terminal": "Terminal Live",
    "module.terminal.desc": "Shell interactif",
    "module.kanban": "Kanban Opérations",
    "module.kanban.desc": "Board de tâches",
    "module.notes": "Notes Markdown",
    "module.notes.desc": "Éditeur markdown",
    "module.code": "Éditeur de Code",
    "module.code.desc": "Éditeur avec highlight",
    "module.weather": "Météo",
    "module.weather.desc": "Prévisions multi-villes",
    "module.clock": "Horloge Mondiale",
    "module.clock.desc": "Analogique + monde",
    "module.music": "Lecteur Audio",
    "module.music.desc": "Lecteur audio mock",
    "module.calculator": "Calculatrice",
    "module.calculator.desc": "Calculatrice fonctionnelle",
    "module.stock": "Markets Live",
    "module.stock.desc": "Ticker boursier live (mock)",
    "module.camera": "Vision Caméra",
    "module.camera.desc": "Webcam + HUD",
    "module.metrics": "Métriques Temps Réel",
    "module.metrics.desc": "Type Grafana temps réel",

    // Palette
    "palette.title": "Registre des modules",
    "palette.subtitle": "Spawn manuel · hot-swap ready",
    "palette.hint": "Astuce : préfère le chat (en bas) pour spawn en langage naturel — l'IA choisit le module tout seul.",
    "palette.close": "Fermer",

    // Settings panel
    "settings.title": "Réglages",
    "settings.subtitle": "Configure ton provider IA & préférences",
    "settings.tab.provider": "Provider IA",
    "settings.tab.appearance": "Apparence",
    "settings.tab.about": "À propos",
    "settings.provider": "Provider",
    "settings.provider.select": "Choisir un provider",
    "settings.apiKey": "Clé API",
    "settings.apiKey.placeholder": "Colle ta clé API",
    "settings.apiKey.optional": "Clé API (optionnel)",
    "settings.apiKey.set": "✓ Clé configurée",
    "settings.apiKey.unset": "Non configurée",
    "settings.apiKey.test": "Tester",
    "settings.apiKey.testing": "Test en cours…",
    "settings.apiKey.ok": "Connexion OK",
    "settings.apiKey.fail": "Connexion échouée",
    "settings.baseUrl": "URL de base",
    "settings.model": "Modèle",
    "settings.model.custom": "Nom du modèle personnalisé",
    "settings.docs": "Obtenir une clé API →",
    "settings.save": "Enregistrer",
    "settings.saved": "Enregistré",
    "settings.close": "Fermer",
    "settings.language": "Langue",
    "settings.language.en": "English",
    "settings.language.fr": "Français",
    "settings.theme": "Couleur d'accent",
    "settings.theme.cyan": "Cyan",
    "settings.theme.emerald": "Émeraude",
    "settings.theme.pink": "Rose",
    "settings.theme.amber": "Ambre",
    "settings.theme.violet": "Violet",
    "settings.sound": "Effets sonores",
    "settings.boot": "Séquence de boot",
    "settings.reset": "Réinitialiser",
    "settings.reset.confirm": "Réinitialiser tous les réglages ?",
    "settings.about.desc": "MorphOS est une interface auto-réécrite expérimentale. L'IA réécrit l'UI en temps réel selon tes requêtes en langage naturel. Construit avec Next.js 16, Framer Motion, et une passerelle LLM unifiée supportant 12+ providers.",
    "settings.about.tech": "Construit avec",
    "settings.about.disclaimer": "Les clés API sont stockées dans le localStorage de ton navigateur et envoyées directement au provider choisi. Jamais à nos serveurs.",
    "settings.about.gtm": "Fait avec ⚡ par le projet MorphOS",

    // Spawn overlay
    "spawn.engine": "morph-engine",
    "spawn.writing": "self-writing module:",
    "spawn.hotreload": "hot-reload",
    "spawn.writingFile": "écriture de",
    "spawn.mounting": "→ montage de {title}…",
    "spawn.rec": "REC",
    "spawn.stby": "STBY",

    // Terminal
    "terminal.welcome": "MorphOS shell v0.9.5 — tape 'help' pour l'aide",
    "terminal.hotreload": "hot-reload actif · hot-swap prêt",
    "terminal.prompt": "operator@morphos:~$",
    "terminal.notfound": "commande introuvable: {cmd} — essaie 'help'",
    "terminal.spawnHint": "→ utilise la barre de chat (en bas) pour spawn en langage naturel",

    // Monitor
    "monitor.cpu": "CPU",
    "monitor.memory": "Mémoire",
    "monitor.network": "Réseau",
    "monitor.disk": "Disque I/O",
    "monitor.combined": "Charge combinée",
    "monitor.live": "live",
    "monitor.uptime": "uptime",

    // Dashboard
    "dashboard.sales": "Ventes",
    "dashboard.visitors": "Visiteurs",
    "dashboard.conversion": "Conversion",
    "dashboard.avgCart": "Panier moy.",
    "dashboard.salesVsVisits": "Ventes vs Visites · 7j",
    "dashboard.channels": "Canaux acquisition",
    "dashboard.realtime": "Trafic temps réel",
    "dashboard.samples": "{count} échantillons",

    // Kanban
    "kanban.backlog": "Backlog",
    "kanban.doing": "En cours",
    "kanban.review": "Review",
    "kanban.done": "Done",
    "kanban.empty": "vide",
    "kanban.add": "Ajouter",
    "kanban.cancel": "Annuler",
    "kanban.titlePlaceholder": "Titre…",

    // Notes
    "notes.file": "notes.md",
    "notes.edit": "Éditer",
    "notes.preview": "Aperçu",

    // Code
    "code.compiled": "compilé",
    "code.lines": "{count} lignes",

    // Weather
    "weather.cloudy": "Nuageux",
    "weather.sunny": "Ensoleillé",
    "weather.rain": "Pluie",
    "weather.wind": "Vent",
    "weather.humidity": "Humidité",
    "weather.feels": "Ressenti",

    // Stock
    "stock.live": "NYSE · temps réel (mock)",

    // Music
    "music.like": "Aimer",

    // Generic
    "common.close": "Fermer",
    "common.cancel": "Annuler",
    "common.save": "Enregistrer",
    "common.confirm": "Confirmer",
    "common.loading": "Chargement…",
  },
} as const;

export function translate(lang: Language, key: string, params?: Record<string, string | number>): string {
  const dict = translations[lang] ?? translations.en;
  let value: string = (dict as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return value;
}
