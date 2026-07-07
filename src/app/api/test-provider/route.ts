import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { PROVIDERS, type ProviderId } from "@/lib/providers";

interface TestPayload {
  providerId: ProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const provider: TestPayload = {
      providerId: body.providerId ?? "zai",
      apiKey: body.apiKey ?? "",
      baseUrl: body.baseUrl ?? "",
      model: body.model ?? "",
    };

    if (provider.providerId === "zai") {
      try {
        const zai = await ZAI.create();
        const c = await zai.chat.completions.create({
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5,
        });
        const txt = c.choices?.[0]?.message?.content ?? "";
        return NextResponse.json({ ok: true, reply: txt.slice(0, 80) });
      } catch (e) {
        return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
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
      let reply = "";
      if (cfg.apiStyle === "openai") {
        const url = baseUrl.endsWith("/") ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ model, messages, max_tokens: 10 }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return NextResponse.json({ ok: false, error: `HTTP ${res.status}: ${t.slice(0, 150)}` }, { status: 502 });
        }
        const data = await res.json();
        reply = data?.choices?.[0]?.message?.content ?? "";
      } else if (cfg.apiStyle === "anthropic") {
        const url = baseUrl.endsWith("/") ? `${baseUrl}messages` : `${baseUrl}/messages`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: 10,
          }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return NextResponse.json({ ok: false, error: `HTTP ${res.status}: ${t.slice(0, 150)}` }, { status: 502 });
        }
        const data = await res.json();
        reply = data?.content?.[0]?.text ?? "";
      } else if (cfg.apiStyle === "cohere") {
        const url = baseUrl.endsWith("/") ? `${baseUrl}chat` : `${baseUrl}/chat`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages, max_tokens: 10 }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          return NextResponse.json({ ok: false, error: `HTTP ${res.status}: ${t.slice(0, 150)}` }, { status: 502 });
        }
        const data = await res.json();
        reply = data?.message?.content?.[0]?.text ?? data?.text ?? "";
      }
      return NextResponse.json({ ok: true, reply: reply.slice(0, 80) });
    } catch (e) {
      return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
