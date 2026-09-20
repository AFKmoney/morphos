// Offline keyword fallback for /api/interpret and /api/interpret-stream.
// Single source of truth — order matters: specific modules first,
// generic ones (code, chat...) last, to avoid substring collisions
// (e.g. "timer" contains "time", "json" contains "son", "qr code" contains "code").

export type FallbackModuleType =
  | "chat" | "monitor" | "dashboard" | "terminal" | "kanban"
  | "notes" | "code" | "weather" | "clock" | "music"
  | "calculator" | "stock" | "camera" | "metrics"
  | "pomodoro" | "paint" | "regex" | "json" | "colorpicker"
  | "qr" | "devtools" | "files" | "browser" | "calendar"
  | "whiteboard" | "custom" | "imagegen";

export const ALLOWED_MODULES: FallbackModuleType[] = [
  "chat","monitor","dashboard","terminal","kanban","notes","code",
  "weather","clock","music","calculator","stock","camera","metrics",
  "pomodoro","paint","regex","json","colorpicker","qr","devtools",
  "files","browser","calendar","whiteboard","custom","imagegen"
];

export const FALLBACK_RULES: { keywords: string[]; type: FallbackModuleType; titleEn: string; titleFr: string }[] = [
  { keywords: ["moniteur", "monitor", "system", "cpu", "memoire", "memory", "performance"], type: "monitor", titleEn: "System Monitor", titleFr: "Moniteur Système" },
  { keywords: ["dashboard", "analytics", "vente", "sales", "trafic", "traffic", "kpi"], type: "dashboard", titleEn: "Analytics Dashboard", titleFr: "Dashboard Analytics" },
  { keywords: ["terminal", "shell", "console", "command", "bash"], type: "terminal", titleEn: "Live Terminal", titleFr: "Terminal Live" },
  { keywords: ["whiteboard", "tableau blanc"], type: "whiteboard", titleEn: "Whiteboard", titleFr: "Tableau Blanc" },
  { keywords: ["kanban", "tache", "task", "todo", "projet", "project", "ticket", "board"], type: "kanban", titleEn: "Operations Kanban", titleFr: "Kanban Opérations" },
  { keywords: ["note", "notes", "markdown", "document", "rédige", "redige", "draft", "texte", "text"], type: "notes", titleEn: "Markdown Notes", titleFr: "Notes Markdown" },
  { keywords: ["qr"], type: "qr", titleEn: "QR Code", titleFr: "QR Code" },
  { keywords: ["json"], type: "json", titleEn: "JSON Formatter", titleFr: "Formateur JSON" },
  { keywords: ["regex", "regexp"], type: "regex", titleEn: "Regex Tester", titleFr: "Testeur Regex" },
  { keywords: ["devtools", "base64", "uuid", "rot13", "encode", "decode"], type: "devtools", titleEn: "Dev Tools", titleFr: "Outils Dev" },
  { keywords: ["color", "colour", "couleur", "picker", "hex", "palette"], type: "colorpicker", titleEn: "Color Picker", titleFr: "Sélecteur Couleur" },
  { keywords: ["code", "éditeur", "editor", "snippet", "fonction", "function", "script"], type: "code", titleEn: "Code Editor", titleFr: "Éditeur de Code" },
  { keywords: ["météo", "meteo", "weather", "température", "temperature", "quel temps", "climat", "climate", "pluie", "rain", "soleil", "sunny", "nuage", "cloudy", "forecast", "prévision", "prevision"], type: "weather", titleEn: "Weather", titleFr: "Météo" },
  { keywords: ["pomodoro", "minuteur", "timer", "focus"], type: "pomodoro", titleEn: "Pomodoro Timer", titleFr: "Minuteur Pomodoro" },
  { keywords: ["paint", "dessin", "draw"], type: "paint", titleEn: "Paint", titleFr: "Dessin" },
  { keywords: ["horloge", "clock", "heure", "time", "fuseau", "timezone"], type: "clock", titleEn: "World Clock", titleFr: "Horloge Mondiale" },
  { keywords: ["musique", "music", "audio", "player", "playlist", "sound", "spotify"], type: "music", titleEn: "Audio Player", titleFr: "Lecteur Audio" },
  { keywords: ["calculatrice", "calculator", "calcul", "calculate", "math"], type: "calculator", titleEn: "Calculator", titleFr: "Calculatrice" },
  { keywords: ["stock", "share", "market", "bourse", "finance", "trading", "crypto", "bitcoin", "btc", "eth"], type: "stock", titleEn: "Live Markets", titleFr: "Markets Live" },
  { keywords: ["caméra", "camera", "webcam", "vision", "flux"], type: "camera", titleEn: "Camera Vision", titleFr: "Vision Caméra" },
  { keywords: ["métriques", "metriques", "metrics", "grafana", "influx", "prometheus"], type: "metrics", titleEn: "Real-time Metrics", titleFr: "Métriques Temps Réel" },
  { keywords: ["file", "fichier", "explorer", "dossier", "folder"], type: "files", titleEn: "Files", titleFr: "Fichiers" },
  { keywords: ["browser", "navigateur", "website", "site web"], type: "browser", titleEn: "Browser", titleFr: "Navigateur" },
  { keywords: ["calendar", "calendrier", "event", "événement", "evenement", "rendez-vous", "rdv"], type: "calendar", titleEn: "Calendar", titleFr: "Calendrier" },
  { keywords: ["image", "picture", "photo", "generate an image", "génère une image"], type: "imagegen", titleEn: "Image Gen", titleFr: "Générateur d'Images" },
  { keywords: ["chat", "discussion", "message", "parle", "talk", "assistant", "bonjour", "hello", "salut"], type: "chat", titleEn: "MorphOS Console", titleFr: "Console MorphOS" },
];

export function buildCodePreview(type: string, title: string): string[] {
  const cap = type.charAt(0).toUpperCase() + type.slice(1);
  return [
    `// MorphOS — generating module: ${type}`,
    `import { createModule } from "@morphos/core";`,
    ``,
    `export const ${type}Module = createModule({`,
    `  type: "${type}",`,
    `  title: "${title}",`,
    `  live: true,`,
    `  hotSwap: true,`,
    `  render: () => <${cap}View />`,
    `});`,
    ``,
    `// → mounting into window registry…`,
  ];
}

export function fallbackInterpret(prompt: string, lang: "en" | "fr") {
  const p = prompt.toLowerCase();
  const rule = FALLBACK_RULES.find((r) => r.keywords.some((k) => p.includes(k)));
  const moduleType = rule?.type ?? "chat";
  const title = lang === "fr" ? (rule?.titleFr ?? "Console MorphOS") : (rule?.titleEn ?? "MorphOS Console");
  const aiMessage = lang === "fr"
    ? `Je génère le module « ${title} ». Hot-reload en cours…`
    : `Generating the "${title}" module. Hot-reload in progress…`;
  return {
    moduleType,
    title,
    aiMessage,
    codePreview: buildCodePreview(moduleType, title),
  };
}
