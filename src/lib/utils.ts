import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * fetch() + JSON parse with a friendly error when the server answers
 * with HTML (dead backend, proxy error page, outdated server...) instead
 * of JSON. Without this the user sees a raw
 * `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.
 */
function looksLikeJson(text: string): boolean {
  const t = text.trim();
  return t.startsWith("{") || t.startsWith("[");
}

export async function fetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  let res = await fetch(input, init);
  let text = await res.text();
  let status = res.status;
  // The preview proxy (or any gateway) sometimes answers 502/503/504 HTML on a
  // transient hiccup even though the backend is healthy — retry once, but ONLY
  // when the body isn't JSON (a JSON error is a real answer, never retried, so
  // we never fire a duplicate LLM call).
  if ([502, 503, 504].includes(status) && !looksLikeJson(text)) {
    await new Promise((r) => setTimeout(r, 1200));
    res = await fetch(input, init);
    text = await res.text();
    status = res.status;
  }
  if (!text.trim()) {
    throw new Error(`API server returned an empty response (HTTP ${status}). Is the MorphOS server running?`);
  }
  try {
    return JSON.parse(text);
  } catch {
    const head = text.trim().slice(0, 200);
    if (/^<!doctype html/i.test(text.trim()) || /^<html[\s>]/i.test(text.trim())) {
      throw new Error(
        `API server returned an HTML page (HTTP ${status}) instead of JSON — the MorphOS backend is down, unreachable, or outdated. Restart it with 'bun run dev' (or 'npm run dev') and retry.`
      );
    }
    throw new Error(`API server returned invalid JSON (HTTP ${status}): ${head}`);
  }
}
