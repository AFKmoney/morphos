import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { PROVIDERS, type ProviderId } from "@/lib/providers";
import { extractErrorMessage, joinUrl, LlmError, openaiChat, openaiModels } from "@/lib/llm";

interface TestPayload {
  providerId: ProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
}

const trim = (v: unknown) => (v ?? "").toString().trim();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const provider: TestPayload = {
      providerId: body.providerId ?? "zai",
      apiKey: trim(body.apiKey),
      baseUrl: trim(body.baseUrl),
      model: trim(body.model),
    };

    if (provider.providerId === "zai") {
      // If user provided a custom Z.ai API key, test with direct fetch
      if (provider.apiKey) {
        try {
          const baseUrl = provider.baseUrl || "https://api.z.ai/api/paas/v4";
          const model = provider.model || "glm-4.6";
          const txt = await openaiChat({
            baseUrl,
            apiKey: provider.apiKey,
            model,
            messages: [{ role: "user", content: "Say OK" }],
            maxTokens: 5,
          });
          return NextResponse.json({ ok: true, reply: txt.slice(0, 80) });
        } catch (e) {
          return NextResponse.json({ ok: false, error: String(e instanceof Error ? e.message : e) }, { status: 502 });
        }
      }
      // Built-in Z.ai via SDK
      try {
        const zai = await ZAI.create();
        const c = await zai.chat.completions.create({
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5,
        });
        const txt = c.choices?.[0]?.message?.content ?? "";
        return NextResponse.json({ ok: true, reply: txt.slice(0, 80) });
      } catch (e) {
        return NextResponse.json({ ok: false, error: String(e instanceof Error ? e.message : e) }, { status: 502 });
      }
    }

    const cfg = PROVIDERS[provider.providerId];
    if (!cfg) return NextResponse.json({ ok: false, error: "unknown provider" }, { status: 400 });

    const baseUrl = provider.baseUrl || cfg.baseUrl;
    const model = provider.model || cfg.defaultModel;
    const apiKey = provider.apiKey || "";

    if (cfg.requiresKey && !apiKey) {
      return NextResponse.json({ ok: false, error: "API key required" }, { status: 400 });
    }

    const messages = [{ role: "user", content: "Reply with the single word: OK" }];

    try {
      if (cfg.apiStyle === "openai") {
        // Step 1: validate key + endpoint via /v1/models (no model ID needed).
        // This tells "bad key" apart from "bad model".
        let models: string[] | null = null;
        try {
          models = await openaiModels({ baseUrl, apiKey });
        } catch (e) {
          if (e instanceof LlmError && e.status === 404) {
            models = null; // server doesn't implement /models — fall through to chat test
          } else {
            return NextResponse.json(
              { ok: false, error: e instanceof Error ? e.message : String(e) },
              { status: 502 }
            );
          }
        }

        // Step 2: verify the selected model with a tiny chat completion.
        try {
          const reply = await openaiChat({ baseUrl, apiKey, model, messages, maxTokens: 10 });
          return NextResponse.json({ ok: true, reply: reply.slice(0, 80), models: models ?? undefined });
        } catch (e) {
          const chatErr = e instanceof Error ? e.message : String(e);
          if (models) {
            const available = models.slice(0, 12).join(", ") || "(none listed)";
            return NextResponse.json(
              {
                ok: false,
                models,
                error: `Key accepted, but model "${model}" failed: ${chatErr}. Available models: ${available}`,
              },
              { status: 502 }
            );
          }
          return NextResponse.json({ ok: false, error: chatErr }, { status: 502 });
        }
      }

      let reply = "";
      if (cfg.apiStyle === "anthropic") {
        const url = joinUrl(baseUrl, "messages");
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({ model, messages, max_tokens: 10 }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return NextResponse.json({ ok: false, error: extractErrorMessage(res.status, t) }, { status: 502 });
        }
        const data = await res.json();
        reply = data?.content?.[0]?.text ?? "";
      } else if (cfg.apiStyle === "cohere") {
        const url = joinUrl(baseUrl, "chat");
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages, max_tokens: 10 }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return NextResponse.json({ ok: false, error: extractErrorMessage(res.status, t) }, { status: 502 });
        }
        const data = await res.json();
        reply = data?.message?.content?.[0]?.text ?? data?.text ?? "";
      }
      return NextResponse.json({ ok: true, reply: reply.slice(0, 80) });
    } catch (e) {
      return NextResponse.json({ ok: false, error: String(e instanceof Error ? e.message : e) }, { status: 502 });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e instanceof Error ? e.message : e) }, { status: 500 });
  }
}
