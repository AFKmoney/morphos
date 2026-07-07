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
- pomodoro, paint, regex, json, colorpicker, qr, devtools, files, browser, calendar, whiteboard
- custom : module généré par IA (pour TOUTE requête qui ne correspond pas aux modules ci-dessus)

Réponds STRICTEMENT en JSON : {"moduleType":"...","title":"...","aiMessage":"...","prompt":"(si custom)"}`;
  }
  return `You are MorphOS, an interface engine that rewrites itself in real-time.
The user speaks to you in natural language and you decide which module to spawn.

Available modules: chat, monitor, dashboard, terminal, kanban, notes, code, weather, clock, music, calculator, stock, camera, metrics, pomodoro, paint, regex, json, colorpicker, qr, devtools, files, browser, calendar, whiteboard, custom

Respond STRICTLY in JSON: {"moduleType":"...","title":"...","aiMessage":"...","prompt":"(if custom)"}`;
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

    // Stream function — tries streaming, falls back to non-stream
    async function streamFromProvider(): Promise<ReadableStream> {
      let responseStream: ReadableStream<Uint8Array>;

      if (provider.providerId === "zai") {
        // Z.ai — use SDK or direct fetch
        const baseUrl = provider.apiKey
          ? (provider.baseUrl || "https://api.z.ai/api/paas/v4")
          : "";
        const model = provider.model || "glm-4.6";

        if (provider.apiKey) {
          // Direct fetch with streaming
          const url = baseUrl.endsWith("/") ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${provider.apiKey}`,
            },
            body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 400, stream: true }),
          });

          if (!res.ok || !res.body) {
            throw new Error(`HTTP ${res.status}`);
          }

          responseStream = res.body;
        } else {
          // SDK — no streaming, simulate it
          const zai = await ZAI.create();
          const completion = await zai.chat.completions.create({
            messages: messages as any,
            temperature: 0.4,
            max_tokens: 400,
          });
          const text = completion.choices?.[0]?.message?.content ?? "";

          responseStream = new ReadableStream({
            async start(controller) {
              // Simulate streaming by sending chunks
              const words = text.split(/(\s+)/);
              for (const word of words) {
                controller.enqueue(encoder.encode(word));
                await new Promise(r => setTimeout(r, 15));
              }
              controller.close();
            },
          });
        }
      } else {
        // Other providers — direct fetch with streaming
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
            body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 400, stream: true }),
          });
          if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
          responseStream = res.body;
        } else {
          // Anthropic/Cohere — no streaming, simulate
          throw new Error("Streaming not supported for this provider, use /api/interpret");
        }
      }

      return responseStream;
    }

    // Create SSE stream
    const sseStream = new ReadableStream({
      async start(controller) {
        try {
          const rawStream = await streamFromProvider();
          const reader = rawStream.getReader();
          const decoder = new TextDecoder();
          let fullText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // Parse SSE data lines
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const json = JSON.parse(data);
                  const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? "";
                  if (delta) {
                    fullText += delta;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`));
                  }
                } catch {
                  // Might be partial JSON, accumulate
                  fullText += chunk;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", content: chunk })}\n\n`));
                }
              }
            }
          }

          // Try to parse the full text as JSON
          const match = fullText.match(/\{[\s\S]*\}/);
          let parsed: any = null;
          if (match) {
            try { parsed = JSON.parse(match[0]); } catch {}
          }

          if (parsed) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", result: parsed })}\n\n`));
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", result: { moduleType: "chat", title: "Response", aiMessage: fullText.slice(0, 200) } })}\n\n`));
          }
        } catch (e) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: e instanceof Error ? e.message : String(e) })}\n\n`));
        }
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
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
}
