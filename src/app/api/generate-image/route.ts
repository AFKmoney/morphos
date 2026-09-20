import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { PROVIDERS, type ProviderId } from "@/lib/providers";
import { extractErrorMessage, llmFetch, LLM_CHAT_TIMEOUT_MS } from "@/lib/llm";

interface ProviderPayload {
  providerId: ProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = (body.prompt ?? "").toString().trim();
    const rawProvider: ProviderPayload = body.provider ?? { providerId: "zai", apiKey: "", baseUrl: "", model: "" };
    const provider: ProviderPayload = {
      providerId: rawProvider.providerId,
      apiKey: (rawProvider.apiKey ?? "").trim(),
      baseUrl: (rawProvider.baseUrl ?? "").trim(),
      model: (rawProvider.model ?? "").trim(),
    };
    const size: string = body.size ?? "1024x1024";

    if (!prompt) {
      return NextResponse.json({ error: "missing prompt" }, { status: 400 });
    }

    let imageUrl = "";
    let base64 = "";

    if (provider.providerId === "zai") {
      // Use Z.ai SDK for image generation
      try {
        const zai = await ZAI.create();
        const result = await (zai as any).images.generations.create({
          prompt,
          size: size as any,
        });
        if (result?.data?.[0]?.base64) {
          base64 = result.data[0].base64;
        } else if (result?.data?.[0]?.url) {
          imageUrl = result.data[0].url;
        }
      } catch (e) {
        console.error("[generate-image] Z.ai error:", e);
        return NextResponse.json({ error: `Image generation failed: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 });
      }
    } else {
      // OpenAI DALL-E style
      const cfg = PROVIDERS[provider.providerId];
      if (!cfg) {
        return NextResponse.json({ error: "unknown provider" }, { status: 400 });
      }
      const baseUrl = provider.baseUrl || cfg.baseUrl || "https://api.openai.com/v1";
      const model = provider.model || "dall-e-3";
      const apiKey = provider.apiKey;
      if (!apiKey) {
        return NextResponse.json({ error: "API key required for image generation" }, { status: 400 });
      }
      try {
        const res = await llmFetch(
          `${baseUrl.replace(/\/+$/, "")}/images/generations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, prompt, size, n: 1, response_format: "url" }),
          },
          baseUrl,
          LLM_CHAT_TIMEOUT_MS
        );
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          return NextResponse.json({ error: extractErrorMessage(res.status, text) }, { status: 502 });
        }
        const data = await res.json().catch(() => ({}));
        imageUrl = data?.data?.[0]?.url ?? "";
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : String(e) },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      imageUrl,
      base64,
      prompt,
    });
  } catch (e) {
    console.error("[generate-image] fatal:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
