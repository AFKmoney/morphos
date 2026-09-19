import { NextRequest } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import type { ProviderId } from "@/lib/providers";
import { PROVIDERS } from "@/lib/providers";
import { ALLOWED_MODULES, buildCodePreview, fallbackInterpret, type FallbackModuleType } from "@/lib/fallback-interpret";

export const dynamic = "force-dynamic";

interface ProviderPayload {
  providerId: ProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
}

function buildSystemPrompt(lang: "en" | "fr") {
  if (lang === "fr") {
    return `Tu es MorphOS, un moteur d'interface qui se réécrit lui-même en temps réel.
L'utilisateur te parle en langage naturel et tu dois décider quel module faire apparaître.

Modules disponibles :
- chat, monitor, dashboard, terminal, kanban, notes, code, weather, clock, music, calculator, stock, camera, metrics
- pomodoro, paint, regex, json, colorpicker, qr, devtools, files, browser, calendar, whiteboard, imagegen
- custom : module généré par IA (pour TOUTE requête qui ne correspond pas aux modules ci-dessus)

Réponds STRICTEMENT en JSON : {"moduleType":"...","title":"...","aiMessage":"...","prompt":"(si custom)"}`;
  }
  return `You are MorphOS, an interface engine that rewrites itself in real-time.
The user speaks to you in natural language and you decide which module to spawn.

Available modules: chat, monitor, dashboard, terminal, kanban, notes, code, weather, clock, music, calculator, stock, camera, metrics, pomodoro, paint, regex, json, colorpicker, qr, devtools, files, browser, calendar, whiteboard, imagegen, custom

Respond STRICTLY in JSON: {"moduleType":"...","title":"...","aiMessage":"...","prompt":"(if custom)"}`;
}

function sseMessage(payload: unknown): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      controller.close();
    },
  });
}

function sseError(message: string): Response {
  return new Response(sseMessage({ type: "error", error: message }), {
    headers: { "Content-Type": "text/event-stream" },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt: string = (body.prompt ?? "").toString().trim();
  const history: { role: string; content: string }[] = Array.isArray(body.history) ? body.history : [];
  const lang: "en" | "fr" = body.language === "fr" ? "fr" : "en";
  const provider: ProviderPayload = body.provider ?? { providerId: "zai", apiKey: "", baseUrl: "", model: "" };
  const context = body.context ?? {};
  const memory = body.memory ?? "";

  if (!prompt) {
    return new Response(JSON.stringify({ error: "missing prompt" }), { status: 400 });
  }

  // ---- Config errors → hard error (user must fix settings) ----
  if (provider.providerId !== "zai") {
    const cfg = PROVIDERS[provider.providerId];
    if (!cfg) return sseError("unknown provider");
    if (cfg.requiresKey && !provider.apiKey) return sseError(`API key required for ${cfg.label}. Open Settings to configure.`);
    if (cfg.apiStyle !== "openai" && cfg.apiStyle !== "anthropic") return sseError("Provider not supported");
  }

  const systemPrompt = buildSystemPrompt(lang);
  const contextStr = context.activeWindows?.length > 0
    ? `\n\nActive windows: ${context.activeWindows.map((w: { title: string; type: string }) => `${w.title} (${w.type})`).join(", ")}`
    : "";
  const memoryStr = memory ? `\n\n${memory}` : "";
  const fullSystemPrompt = systemPrompt + contextStr + memoryStr;

  const messages = [
    { role: "system", content: fullSystemPrompt },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: prompt },
  ];

  // ---- LLM call — any failure falls back to keyword matching ----
  let rawText = "";

  try {
    if (provider.providerId === "zai") {
      if (provider.apiKey) {
        const baseUrl = provider.baseUrl || "https://api.z.ai/api/paas/v4";
        const model = provider.model || "glm-4.6";
        const url = baseUrl.endsWith("/") ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 400, stream: true }),
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const json = JSON.parse(data);
                  rawText += json.choices?.[0]?.delta?.content ?? "";
                } catch { /* partial chunk */ }
              }
            }
          }
        } else {
          const res2 = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${provider.apiKey}`,
            },
            body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 400 }),
          });
          if (!res2.ok) throw new Error(`HTTP ${res2.status}`);
          const data = await res2.json();
          rawText = data?.choices?.[0]?.message?.content ?? "";
        }
      } else {
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: messages as never,
          temperature: 0.4,
          max_tokens: 400,
        });
        rawText = completion.choices?.[0]?.message?.content ?? "";
      }
    } else {
      const cfg = PROVIDERS[provider.providerId];
      const baseUrl = provider.baseUrl || cfg.baseUrl;
      const model = provider.model || cfg.defaultModel;
      const apiKey = provider.apiKey || "";

      if (cfg.apiStyle === "openai") {
        const url = baseUrl.endsWith("/") ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 400 }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        rawText = data?.choices?.[0]?.message?.content ?? "";
      } else {
        const url = baseUrl.endsWith("/") ? `${baseUrl}messages` : `${baseUrl}/messages`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({ model, system: fullSystemPrompt, messages: messages.map(m => ({ role: m.role === "system" ? "user" : m.role, content: m.content })), temperature: 0.4, max_tokens: 400 }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        rawText = data?.content?.[0]?.text ?? "";
      }
    }
  } catch (e) {
    console.error("[interpret-stream] LLM error, using keyword fallback:", e);
    rawText = "";
  }

  // ---- Parse the result ----
  let parsed: {
    moduleType: FallbackModuleType;
    title: string;
    subtitle?: string;
    aiMessage: string;
    prompt?: string;
    config?: Record<string, unknown>;
    codePreview: string[];
  } | null = null;

  const match = rawText.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const obj = JSON.parse(match[0]);
      const moduleType = (ALLOWED_MODULES.includes(obj.moduleType) ? obj.moduleType : "chat") as FallbackModuleType;
      const title = (obj.title ?? "Module").toString().slice(0, 60);
      parsed = {
        moduleType,
        title,
        subtitle: obj.subtitle ? String(obj.subtitle).slice(0, 80) : undefined,
        aiMessage: (obj.aiMessage ?? `Spawning ${title}.`).toString(),
        prompt: moduleType === "custom" && obj.prompt ? String(obj.prompt).slice(0, 500) : undefined,
        config: obj.config && typeof obj.config === "object" ? obj.config : undefined,
        codePreview: buildCodePreview(moduleType, title),
      };
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    if (rawText.trim()) {
      // LLM answered but not JSON — show it as a chat reply
      parsed = {
        moduleType: "chat",
        title: lang === "fr" ? "Réponse" : "Response",
        aiMessage: rawText.slice(0, 500),
        codePreview: buildCodePreview("chat", "Response"),
      };
    } else {
      // Offline / no key — keyword fallback so the dock still spawns
      parsed = fallbackInterpret(prompt, lang);
    }
  }

  return new Response(sseMessage({ type: "done", result: parsed }), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
