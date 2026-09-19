import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import type { ProviderId, ApiStyle } from "@/lib/providers";
import { PROVIDERS } from "@/lib/providers";
import { ALLOWED_MODULES, buildCodePreview, fallbackInterpret } from "@/lib/fallback-interpret";
import { anthropicChat, cohereChat, openaiChat } from "@/lib/llm";

export type ModuleType =
  | "chat" | "monitor" | "dashboard" | "terminal" | "kanban"
  | "notes" | "code" | "weather" | "clock" | "music"
  | "calculator" | "stock" | "camera" | "metrics"
  | "pomodoro" | "paint" | "regex" | "json" | "colorpicker"
  | "qr" | "devtools" | "files" | "browser" | "calendar"
  | "whiteboard" | "custom" | "imagegen";

export interface InterpretResult {
  moduleType: ModuleType;
  title: string;
  subtitle?: string;
  aiMessage: string;
  codePreview: string[];
  config?: Record<string, unknown>;
  /** For custom modules: the prompt to pass to the code generator */
  prompt?: string;
}

interface ProviderPayload {
  providerId: ProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
}

// System prompt — bilingual
function buildSystemPrompt(lang: "en" | "fr") {
  if (lang === "fr") {
    return `Tu es MorphOS, un moteur d'interface qui se réécrit lui-même en temps réel.
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
- camera : vision caméra (webcam)
- metrics : métriques temps réel type grafana
- pomodoro : minuteur de focus avec pauses
- paint : canvas de dessin avec pinceau/gomme
- regex : testeur de regex
- json : formateur / minifieur JSON
- colorpicker : sélecteur de couleur avec harmonies
- qr : générateur de QR code
- devtools : outils base64/URL/hash/UUID/binary/hex/ROT13
- files : explorateur de fichiers virtuel
- browser : navigateur web (iframe)
- calendar : calendrier vue mois avec événements
- whiteboard : tableau blanc libre SVG
- custom : module custom généré par IA (utilise-le pour TOUTE requête qui ne correspond pas aux modules ci-dessus)

Réponds STRICTEMENT en JSON avec ce schéma :
{
  "moduleType": "<un des types ci-dessus>",
  "title": "<titre court en français, max 40 caractères>",
  "subtitle": "<sous-titre optionnel en français>",
  "aiMessage": "<message en français que l'assistant affiche dans le chat, 1-2 phrases, naturelle et sympa, qui annonce ce que tu fais>",
  "prompt": "<si moduleType est 'custom', le prompt en langage naturel à passer au générateur de code ; sinon omit>",
  "config": { /* optionnel */ }
}

Règles :
- Si la demande est ambiguë ou conversationnelle sans besoin de module, choisis "chat".
- Si l'utilisateur demande quelque chose qui ne correspond à aucun module intégré (ex: "un jeu de morpion", "un tracker d'habitudes", "un lanceur de dés"), choisis "custom" et fournis un prompt clair décrivant ce qu'il faut construire.
- Réponds UNIQUEMENT le JSON, aucun texte autour.`;
  }
  return `You are MorphOS, an interface engine that rewrites itself in real-time.
The user speaks to you in natural language and you decide which module to spawn.

Available modules (ONLY these):
- chat: conversation / general assistant
- monitor: system monitor (CPU, RAM, network)
- dashboard: analytics dashboard (sales/traffic charts)
- terminal: interactive terminal
- kanban: kanban board / todolist
- notes: markdown notes editor
- code: code editor with syntax highlighting
- weather: weather widget
- clock: world clock
- music: audio player (mock)
- calculator: functional calculator
- stock: live stock ticker (mock)
- camera: camera vision (webcam)
- metrics: real-time metrics (Grafana-style)
- pomodoro: focus timer with break cycles
- paint: drawing canvas with brush/eraser
- regex: regex pattern tester
- json: JSON formatter / minifier
- colorpicker: color picker with harmonies
- qr: QR code generator
- devtools: base64/URL/hash/UUID/binary/hex/ROT13 tools
- files: virtual file explorer
- browser: web browser (iframe)
- calendar: month view calendar with events
- whiteboard: freehand drawing SVG
- custom: AI-generated custom module (use this for ANY request that doesn't fit the above — describe what the user wants)

Respond STRICTLY in JSON with this schema:
{
  "moduleType": "<one of the above types>",
  "title": "<short title in English, max 40 chars>",
  "subtitle": "<optional subtitle in English>",
  "aiMessage": "<message the assistant displays in the chat, 1-2 sentences, natural and friendly, announcing what you're doing>",
  "prompt": "<if moduleType is 'custom', the natural language prompt to pass to the code generator; otherwise omit>",
  "config": { /* optional */ }
}

Rules:
- If the request is ambiguous or conversational with no module need, choose "chat".
- If the user asks for something that doesn't match any built-in module (e.g. "a tic-tac-toe game", "a habit tracker", "a dice roller"), choose "custom" and provide a clear prompt describing what to build.
- Respond ONLY the JSON, no surrounding text.`;
}

// ============ Provider dispatchers ============

async function callOpenAIStyle(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  return openaiChat({ baseUrl, apiKey, model, messages, temperature, maxTokens });
}

async function callAnthropicStyle(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  systemPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  return anthropicChat({ baseUrl, apiKey, model, messages, systemPrompt, temperature, maxTokens });
}

async function callCohereStyle(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  return cohereChat({ baseUrl, apiKey, model, messages, temperature, maxTokens });
}

// ============ Main handler ============

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = (body.prompt ?? "").toString().trim().slice(0, 4000);
    const history: { role: string; content: string }[] = Array.isArray(body.history) ? body.history : [];
    const lang: "en" | "fr" = body.language === "fr" ? "fr" : "en";
    const provider: ProviderPayload = body.provider ?? { providerId: "zai", apiKey: "", baseUrl: "", model: "" };
    const context: { activeWindows?: { type: string; title: string }[]; totalWindows?: number } = body.context ?? {};

    if (!prompt) {
      return NextResponse.json({ error: "missing prompt" }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(lang);

    // Build context injection — tells the LLM what's currently on screen
    const contextStr = context.activeWindows && context.activeWindows.length > 0
      ? `\n\n--- CURRENT STATE ---\nActive windows on screen (${context.activeWindows.length}):\n${context.activeWindows.map((w, i) => `  ${i + 1}. ${w.title} (${w.type})`).join("\n")}\n\nThe user can see these windows. When they say "this", "that", "it", they may be referring to one of these. If they ask to modify or replace something, check if it matches an active window.`
      : `\n\n--- CURRENT STATE ---\nNo windows currently open. This is a fresh session.`;

    // Inject AI memory (persistent user preferences/facts)
    const memoryStr = body.memory
      ? `\n\n${body.memory}`
      : "";

    const fullSystemPrompt = systemPrompt + contextStr + memoryStr;
    
    const messages = [
      { role: "system", content: fullSystemPrompt },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: prompt },
    ];

    let raw = "";

    if (provider.providerId === "zai") {
      // If user provided a custom Z.ai API key, use direct fetch
      if (provider.apiKey) {
        try {
          const baseUrl = provider.baseUrl || "https://api.z.ai/api/paas/v4";
          const model = provider.model || "glm-4.6";
          raw = await openaiChat({ baseUrl, apiKey: provider.apiKey, model, messages, temperature: 0.4, maxTokens: 400 });
        } catch (e) {
          console.error("[interpret] Z.ai custom key error:", e);
          raw = "";
        }
      } else {
        // Built-in Z.ai via SDK
        try {
          const zai = await ZAI.create();
          const completion = await zai.chat.completions.create({
            messages: messages as any,
            temperature: 0.4,
            max_tokens: 400,
          });
          raw = completion.choices?.[0]?.message?.content ?? "";
        } catch (e) {
          console.error("[interpret] Z.ai SDK error:", e);
          raw = "";
        }
      }
    } else {
      const cfg = PROVIDERS[provider.providerId];
      if (!cfg) {
        return NextResponse.json({ error: "unknown provider" }, { status: 400 });
      }
      const baseUrl = provider.baseUrl || cfg.baseUrl;
      const model = provider.model || cfg.defaultModel;
      const apiKey = provider.apiKey || "";

      if (cfg.requiresKey && !apiKey) {
        return NextResponse.json({
          error: `API key required for ${cfg.label}. Open Settings (top-right) to configure.`,
        }, { status: 400 });
      }

      try {
        if (cfg.apiStyle === "openai") {
          raw = await callOpenAIStyle(baseUrl, apiKey, model, messages, 0.4, 400);
        } else if (cfg.apiStyle === "anthropic") {
          raw = await callAnthropicStyle(baseUrl, apiKey, model, messages, systemPrompt, 0.4, 400);
        } else if (cfg.apiStyle === "cohere") {
          raw = await callCohereStyle(baseUrl, apiKey, model, messages, 0.4, 400);
        }
      } catch (e) {
        console.error(`[interpret] ${cfg.label} error:`, e);
        return NextResponse.json({
          error: `${cfg.label} call failed: ${e instanceof Error ? e.message : String(e)}`,
        }, { status: 502 });
      }
    }

    let parsed: InterpretResult | null = null;

    if (raw) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const obj = JSON.parse(match[0]);
          const allowed: ModuleType[] = ALLOWED_MODULES as ModuleType[];
          // All built-in types are supported by the module registry — no redirect.
          const moduleType = (allowed.includes(obj.moduleType) ? obj.moduleType : "chat") as ModuleType;

          const title = (obj.title ?? "Module").toString().slice(0, 60);
          const aiMessage = (obj.aiMessage ?? `Spawning ${title}.`).toString();
          const customPrompt = moduleType === "custom" && obj.prompt ? String(obj.prompt).slice(0, 500) : undefined;
          parsed = {
            moduleType,
            title,
            subtitle: obj.subtitle ? String(obj.subtitle).slice(0, 80) : undefined,
            aiMessage,
            codePreview: buildCodePreview(moduleType, title),
            config: obj.config && typeof obj.config === "object" ? obj.config : undefined,
            prompt: customPrompt,
          };
        } catch (e) {
          console.error("[interpret] JSON parse failed:", e);
        }
      }
    }

    if (!parsed) {
      parsed = fallbackInterpret(prompt, lang);
    }

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("[interpret] fatal:", e);
    const fb = fallbackInterpret("", "en");
    return NextResponse.json(fb);
  }
}
