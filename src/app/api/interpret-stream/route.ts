import { NextRequest } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import type { ProviderId } from "@/lib/providers";
import { PROVIDERS } from "@/lib/providers";

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

Respond STRICTELY in JSON: {"moduleType":"...","title":"...","aiMessage":"...","prompt":"(if custom)"}`;
}

export async function POST(req: NextRequest) {
  try {
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

    const systemPrompt = buildSystemPrompt(lang);
    const contextStr = context.activeWindows?.length > 0
      ? `\n\nActive windows: ${context.activeWindows.map((w: any) => `${w.title} (${w.type})`).join(", ")}`
      : "";
    const memoryStr = memory ? `\n\n${memory}` : "";
    const fullSystemPrompt = systemPrompt + contextStr + memoryStr;

    const messages = [
      { role: "system", content: fullSystemPrompt },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: prompt },
    ];

    const encoder = new TextEncoder();

    // Get raw text from the LLM
    let rawText = "";
    let useStreaming = false;

    if (provider.providerId === "zai") {
      if (provider.apiKey) {
        // Direct fetch with streaming
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
          useStreaming = true;
          const reader = res.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const json = JSON.parse(data);
                  const delta = json.choices?.[0]?.delta?.content ?? "";
                  if (delta) {
                    rawText += delta;
                    // Send delta to client
                  }
                } catch {}
              }
            }
          }
        } else {
          // Fallback to non-streaming
          const res2 = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${provider.apiKey}`,
            },
            body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 400 }),
          });
          const data = await res2.json();
          rawText = data?.choices?.[0]?.message?.content ?? "";
        }
      } else {
        // Z.ai SDK — no streaming, just get the response
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: messages as any,
          temperature: 0.4,
          max_tokens: 400,
        });
        rawText = completion.choices?.[0]?.message?.content ?? "";
      }
    } else {
      // Other providers
      const cfg = PROVIDERS[provider.providerId];
      if (!cfg) throw new Error("unknown provider");
      const baseUrl = provider.baseUrl || cfg.baseUrl;
      const model = provider.model || cfg.defaultModel;
      const apiKey = provider.apiKey || "";
      if (cfg.requiresKey && !apiKey) throw new Error(`API key required for ${cfg.label}`);

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
      } else if (cfg.apiStyle === "anthropic") {
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
      } else {
        throw new Error("Provider not supported");
      }
    }

    // Parse the result
    const match = rawText.match(/\{[\s\S]*\}/);
    let parsed: any = null;
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch {}
    }

    if (!parsed) {
      parsed = {
        moduleType: "chat",
        title: "Response",
        aiMessage: rawText.slice(0, 200) || "I didn't understand that. Try again.",
      };
    }

    // Send the final result
    const sseStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", result: parsed })}\n\n`));
        controller.close();
      },
    });

    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    const encoder = new TextEncoder();
    const sseStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: e instanceof Error ? e.message : String(e) })}\n\n`));
        controller.close();
      },
    });
    return new Response(sseStream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }
}
