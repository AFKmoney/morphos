// Shared server-side helpers for OpenAI-compatible LLM calls.
// Used by /api/interpret, /api/interpret-stream, /api/generate-module, /api/test-provider.

export const LLM_CHAT_TIMEOUT_MS = 30_000;
export const LLM_MODELS_TIMEOUT_MS = 15_000;
const EGRESS_PROBE_TIMEOUT_MS = 5_000;

export function joinUrl(base: string, path: string): string {
  const b = (base || "").trim().replace(/\/+$/, "");
  return `${b}/${path}`;
}

function authHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const key = (apiKey || "").trim();
  if (key) headers["Authorization"] = `Bearer ${key}`;
  return headers;
}

/** Extract a human-readable message from a provider error response. */
export function extractErrorMessage(status: number, bodyText: string): string {
  const raw = (bodyText || "").trim();
  if (!raw) {
    if (status === 401) return "HTTP 401: invalid or missing API key";
    if (status === 403) return "HTTP 403: forbidden — check key permissions / billing";
    if (status === 404) return "HTTP 404: endpoint or model not found";
    if (status === 429) return "HTTP 429: rate limited — wait a bit and retry";
    return `HTTP ${status}`;
  }
  try {
    const data = JSON.parse(raw);
    // OpenAI style: { error: { message, code, type } } or { error: "..." }
    const err = data?.error ?? data;
    const msg =
      (typeof err === "string" ? err : err?.message) ||
      data?.detail || // NVIDIA / FastAPI style: { detail: "..." }
      data?.message ||
      "";
    if (msg) {
      const hint =
        status === 401 ? " (invalid API key?)"
        : status === 404 && /model/i.test(String(msg)) ? " (unknown model ID?)"
        : "";
      return `HTTP ${status}: ${String(msg).slice(0, 300)}${hint}`;
    }
  } catch {
    // Not JSON (proxy HTML page, empty body, etc.)
    if (/^</.test(raw)) return `HTTP ${status}: non-JSON response (proxy / wrong base URL?)`;
  }
  return `HTTP ${status}: ${raw.slice(0, 300)}`;
}

export class LlmError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Cached outbound-connectivity probe (60s TTL): distinguishes "this server has
// no/restricted internet egress" from "the provider host is wrong or down".
let egressProbe: { at: number; ok: boolean } | null = null;
async function egressOk(): Promise<boolean> {
  if (egressProbe && Date.now() - egressProbe.at < 60_000) return egressProbe.ok;
  let ok = false;
  try {
    // NOTE: api.github.com's TLS is MITM'd in some sandboxes (Node rejects it
    // with UNABLE_TO_VERIFY_LEAF_SIGNATURE while curl accepts it), so probe the
    // npm registry instead — small doc, reliable from Node runtimes.
    const res = await fetch("https://registry.npmjs.org/react/latest", {
      method: "GET",
      signal: AbortSignal.timeout(EGRESS_PROBE_TIMEOUT_MS),
    });
    ok = res.ok;
  } catch {
    ok = false;
  }
  egressProbe = { at: Date.now(), ok };
  return ok;
}

function hostOf(baseUrl: string): string {
  try {
    return new URL((baseUrl || "").trim()).host || baseUrl;
  } catch {
    return baseUrl || "(empty base URL)";
  }
}

/** fetch() that converts network failures into an actionable LlmError. */
export async function llmFetch(
  url: string,
  init: RequestInit,
  baseUrl: string,
  timeoutMs: number = LLM_CHAT_TIMEOUT_MS
): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: init.signal ?? AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    const host = hostOf(baseUrl);
    if (e instanceof DOMException && e.name === "TimeoutError") {
      throw new LlmError(
        0,
        `Network error: request to ${host} timed out after ${Math.round(timeoutMs / 1000)}s. The provider is slow or unreachable — retry in a moment.`
      );
    }
    const reason = e instanceof Error ? e.message : String(e);
    // If generic internet works but this host doesn't, the server's network
    // is filtering it (typical of hosted preview sandboxes) — say so clearly.
    let hint = "Check the base URL and your internet connection.";
    try {
      if (await egressOk()) {
        hint =
          `This MorphOS server can reach the internet, but outbound connections to ${host} are blocked from here ` +
          `(typical of hosted preview sandboxes with restricted egress). The provider was NOT tested. ` +
          `Run MorphOS on your own machine ('bun install && bun run dev') and retry there.`;
      }
    } catch {
      /* keep generic hint */
    }
    throw new LlmError(0, `Network error: cannot reach ${host} (${reason}). ${hint}`);
  }
}

export async function throwForStatus(res: Response): Promise<void> {
  if (res.ok) return;
  const text = await res.text().catch(() => "");
  throw new LlmError(res.status, extractErrorMessage(res.status, text));
}

export interface OpenAIChatArgs {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * POST {base}/chat/completions (OpenAI-compatible: NVIDIA NIM, OpenAI, Groq,
 * Together, DeepSeek, Ollama, LM Studio, ...).
 * Reasoning models (o1, DeepSeek-R1...) reject `temperature` → retry once without it on HTTP 400.
 */
export async function openaiChat(args: OpenAIChatArgs): Promise<string> {
  const { baseUrl, apiKey, model, messages } = args;
  const maxTokens = args.maxTokens ?? 400;
  const url = joinUrl(baseUrl, "chat/completions");
  const headers = authHeaders(apiKey);

  const attempt = async (withTemp: boolean): Promise<Response> => {
    const body: Record<string, unknown> = { model: model.trim(), messages, max_tokens: maxTokens };
    if (withTemp && args.temperature !== undefined) body.temperature = args.temperature;
    return llmFetch(url, { method: "POST", headers, body: JSON.stringify(body) }, baseUrl, LLM_CHAT_TIMEOUT_MS);
  };

  let res = await attempt(true);
  if (!res.ok && res.status === 400 && args.temperature !== undefined) {
    // Possibly a reasoning model that forbids sampling params — retry bare.
    res = await attempt(false);
  }
  await throwForStatus(res);
  const data = await res.json().catch(() => ({}));
  return data?.choices?.[0]?.message?.content ?? "";
}

/**
 * GET {base}/models — validates key + endpoint WITHOUT depending on a model ID.
 * Returns model IDs. Throws LlmError (404 = server doesn't implement it).
 */
export async function openaiModels(args: { baseUrl: string; apiKey: string }): Promise<string[]> {
  const url = joinUrl(args.baseUrl, "models");
  const res = await llmFetch(url, { method: "GET", headers: authHeaders(args.apiKey) }, args.baseUrl, LLM_MODELS_TIMEOUT_MS);
  await throwForStatus(res);
  const data = await res.json().catch(() => ({}));
  const list = Array.isArray(data?.data) ? data.data : [];
  return list
    .map((m: unknown) => (typeof m === "string" ? m : (m as { id?: string })?.id))
    .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);
}

export interface ClaudeArgs {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: { role: string; content: string }[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

/** POST {base}/messages (Anthropic API). */
export async function anthropicChat(a: ClaudeArgs): Promise<string> {
  const url = joinUrl(a.baseUrl, "messages");
  const res = await llmFetch(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": (a.apiKey || "").trim(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: a.model.trim(),
        system: a.systemPrompt ?? "",
        messages: a.messages.map((m) => ({
          role: m.role === "system" ? "user" : m.role,
          content: m.content,
        })),
        temperature: a.temperature ?? 0.4,
        max_tokens: a.maxTokens ?? 400,
      }),
    },
    a.baseUrl,
    LLM_CHAT_TIMEOUT_MS
  );
  await throwForStatus(res);
  const data = await res.json().catch(() => ({}));
  return data?.content?.[0]?.text ?? "";
}

export interface CohereArgs {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  maxTokens?: number;
}

/** POST {base}/chat (Cohere API). */
export async function cohereChat(a: CohereArgs): Promise<string> {
  const url = joinUrl(a.baseUrl, "chat");
  const res = await llmFetch(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(a.apiKey || "").trim()}`,
      },
      body: JSON.stringify({
        model: a.model.trim(),
        messages: a.messages,
        temperature: a.temperature ?? 0.4,
        max_tokens: a.maxTokens ?? 400,
      }),
    },
    a.baseUrl,
    LLM_CHAT_TIMEOUT_MS
  );
  await throwForStatus(res);
  const data = await res.json().catch(() => ({}));
  return data?.message?.content?.[0]?.text ?? data?.text ?? "";
}
