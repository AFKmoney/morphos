import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export type ModuleType =
  | "chat" | "monitor" | "dashboard" | "terminal" | "kanban"
  | "notes" | "code" | "weather" | "clock" | "music"
  | "calculator" | "stock" | "camera" | "metrics";

export interface InterpretResult {
  moduleType: ModuleType;
  title: string;
  subtitle?: string;
  aiMessage: string;
  codePreview: string[];
  config?: Record<string, unknown>;
}

const FALLBACK_RULES: { keywords: string[]; type: ModuleType; title: string; config?: Record<string, unknown> }[] = [
  { keywords: ["moniteur", "system", "cpu", "ram", "memoire", "performance", "monitor"], type: "monitor", title: "Moniteur Système" },
  { keywords: ["dashboard", "analytics", "vente", "sales", "trafic", "kpi"], type: "dashboard", title: "Dashboard Analytics" },
  { keywords: ["terminal", "shell", "console", "command", "bash"], type: "terminal", title: "Terminal Live" },
  { keywords: ["kanban", "tache", "task", "todo", "projet", "ticket", "board"], type: "kanban", title: "Kanban Opérations" },
  { keywords: ["note", "markdown", "document", "rédige", "redige", "texte"], type: "notes", title: "Notes Markdown" },
  { keywords: ["code", "éditeur", "editeur", "snippet", "fonction", "script"], type: "code", title: "Éditeur de Code" },
  { keywords: ["météo", "meteo", "weather", "température", "temperature", "climat"], type: "weather", title: "Météo" },
  { keywords: ["horloge", "clock", "heure", "time", "monde"], type: "clock", title: "Horloge Mondiale" },
  { keywords: ["musique", "music", "audio", "player", "son", "playlist"], type: "music", title: "Lecteur Audio" },
  { keywords: ["calculatrice", "calculator", "calcul", "math"], type: "calculator", title: "Calculatrice" },
  { keywords: ["stock", "action", "market", "bourse", "finance", "trading"], type: "stock", title: "Markets Live" },
  { keywords: ["caméra", "camera", "webcam", "vision", "flux"], type: "camera", title: "Vision Caméra" },
  { keywords: ["métriques", "metriques", "metrics", "grafana", "influx", "prometheus"], type: "metrics", title: "Métriques Temps Réel" },
  { keywords: ["chat", "discussion", "message", "parle", "assistant"], type: "chat", title: "Console MorphOS" },
];

function fallbackInterpret(prompt: string): InterpretResult {
  const p = prompt.toLowerCase();
  const rule = FALLBACK_RULES.find((r) => r.keywords.some((k) => p.includes(k)));
  const moduleType = rule?.type ?? "chat";
  const title = rule?.title ?? "Console MorphOS";
  return {
    moduleType,
    title,
    aiMessage: `Je génère le module « ${title} ». Hot-reload en cours…`,
    codePreview: buildCodePreview(moduleType, title),
    config: rule?.config,
  };
}

function buildCodePreview(type: ModuleType, title: string): string[] {
  const lines: string[] = [];
  lines.push(`// MorphOS — generating module: ${type}`);
  lines.push(`import { createModule } from "@morphos/core";`);
  lines.push(``);
  lines.push(`export const ${type}Module = createModule({`);
  lines.push(`  type: "${type}",`);
  lines.push(`  title: "${title}",`);
  lines.push(`  live: true,`);
  lines.push(`  hotSwap: true,`);
  lines.push(`  render: () => <${capitalize(type)}View />`);
  lines.push(`});`);
  lines.push(``);
  lines.push(`// → mounting into window registry…`);
  return lines;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = (body.prompt ?? "").toString().trim();
    const history: { role: string; content: string }[] = Array.isArray(body.history) ? body.history : [];

    if (!prompt) {
      return NextResponse.json({ error: "missing prompt" }, { status: 400 });
    }

    const systemPrompt = `Tu es MorphOS, un moteur d'interface qui se réécrit lui-même en temps réel.
L'utilisateur te parle en langage naturel et tu dois décider quel module faire apparaître.

Modules disponibles (et ONLY ceux-là) :
- chat : discussion / assistant général
- monitor : moniteur système (CPU, RAM, réseau)
- dashboard : dashboard analytics (graphiques de ventes/trafic)
- terminal : terminal interactif
- kanban : tableau kanban / todolist
- notes : éditeur de notes markdown
- code : éditeur de code avec syntax highlighting
- weather : widget météo
- clock : horloge mondiale
- music : lecteur audio (mock)
- calculator : calculatrice fonctionnelle
- stock : ticker boursier temps réel (mock)
- camera : vision caméra (mock / webcam)
- metrics : métriques temps réel type grafana

Réponds STRICTEMENT en JSON avec ce schéma :
{
  "moduleType": "<un des types ci-dessus>",
  "title": "<titre court en français, max 40 caractères>",
  "subtitle": "<sous-titre optionnel en français>",
  "aiMessage": "<message en français que l'assistant affiche dans le chat, 1-2 phrases, naturelle et sympa, qui annonce ce que tu fais>",
  "config": { /* optionnel : config spécifique au module */ }
}

Règles :
- Si la demande est ambiguë ou conversationnelle sans besoin de module, choisis "chat".
- Si l'utilisateur demande plusieurs choses, choisis le module le plus pertinent.
- Réponds UNIQUEMENT le JSON, aucun texte autour.`;

    let parsed: InterpretResult | null = null;

    try {
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          ...history.slice(-6).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 400,
      });

      const raw = completion.choices?.[0]?.message?.content ?? "";
      // Extract first {...} block
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const obj = JSON.parse(match[0]);
        const allowed: ModuleType[] = [
          "chat","monitor","dashboard","terminal","kanban","notes","code",
          "weather","clock","music","calculator","stock","camera","metrics"
        ];
        const moduleType = (allowed.includes(obj.moduleType) ? obj.moduleType : "chat") as ModuleType;
        const title = (obj.title ?? "Module").toString().slice(0, 60);
        const aiMessage = (obj.aiMessage ?? `Je crée le module ${title}.`).toString();
        parsed = {
          moduleType,
          title,
          subtitle: obj.subtitle ? String(obj.subtitle).slice(0, 80) : undefined,
          aiMessage,
          codePreview: buildCodePreview(moduleType, title),
          config: obj.config && typeof obj.config === "object" ? obj.config : undefined,
        };
      }
    } catch (e) {
      console.error("[interpret] LLM error, using fallback:", e);
    }

    if (!parsed) {
      parsed = fallbackInterpret(prompt);
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("[interpret] fatal:", e);
    const fb = fallbackInterpret("");
    return NextResponse.json(fb);
  }
}
