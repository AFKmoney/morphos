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
export async function fetchJson(input: RequestInfo | URL, init?: RequestInit): Promise<any> {
  const res = await fetch(input, init);
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(`API server returned an empty response (HTTP ${res.status}). Is the MorphOS server running?`);
  }
  try {
    return JSON.parse(text);
  } catch {
    const head = text.trim().slice(0, 200);
    if (/^<!doctype html/i.test(text.trim()) || /^<html[\s>]/i.test(text.trim())) {
      throw new Error(
        `API server returned an HTML page (HTTP ${res.status}) instead of JSON — the MorphOS backend is down, unreachable, or outdated. Restart it with 'bun run dev' (or 'npm run dev') and retry.`
      );
    }
    throw new Error(`API server returned invalid JSON (HTTP ${res.status}): ${head}`);
  }
}
