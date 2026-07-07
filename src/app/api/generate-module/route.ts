import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import type { ProviderId } from "@/lib/providers";
import { PROVIDERS } from "@/lib/providers";

interface ProviderPayload {
  providerId: ProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
}

const SYSTEM_PROMPT = `You are MorphOS ModuleForge — an AI that generates self-contained React components on the fly.

The user describes what they want and you generate a SINGLE React function component that does exactly that.

STRICT RULES:
1. Output ONLY a TSX React function component, no markdown fences, no explanations.
2. The component must be named "CustomModule".
3. NO imports — React hooks are provided as globals via the React object (e.g. React.useState, React.useEffect) AND also as standalone functions (useState, useEffect, useRef, useMemo, useCallback).
4. Use TypeScript sparingly — keep types simple. Avoid complex generics.
5. Use "function" declarations preferred.
6. Style with inline styles (preferred) or Tailwind CSS classes (bg-cyan-500, text-white, p-4, rounded-lg, etc.).
7. The component receives NO props. Make it self-contained.
8. For data, use mock data inside the component. Do NOT fetch external URLs.
9. The component should be INTERACTIVE and useful — not just static.
10. Keep it under 150 lines of code.
11. The component must render something visible immediately.
12. If the user wants something visual (chart, animation, etc.), implement it with SVG or CSS — no chart libraries.
13. Always export the component as: function CustomModule() { ... } — no export keyword needed.
14. Access React via the global "React" object: React.useState, React.useEffect, React.useRef, React.useMemo, React.useCallback. Or use the standalone globals: useState, useEffect, useRef, useMemo, useCallback.

Example output for "a counter that doubles on click":
function CustomModule() {
  const [count, setCount] = React.useState(1);
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h2 style={{ color: '#22d3ee', fontSize: 32 }}>{count}</h2>
      <button
        onClick={() => setCount(c => c * 2)}
        style={{ padding: '8px 16px', background: '#22d3ee', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer' }}
      >
        Double it
      </button>
    </div>
  );
}

Now generate a component for the user's request. Remember: ONLY the component code, nothing else.`;

function fallbackGenerate(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("pomodoro") || p.includes("timer")) {
    return `function CustomModule() {
  const [seconds, setSeconds] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);
  const [mode, setMode] = React.useState("work");
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          const nextMode = mode === "work" ? "break" : "work";
          setMode(nextMode);
          return nextMode === "work" ? 25 * 60 : 5 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode]);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const color = mode === "work" ? "#22d3ee" : "#34d399";
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h2 style={{ color, fontSize: 14, textTransform: "uppercase", letterSpacing: 2 }}>{mode === "work" ? "Focus" : "Break"}</h2>
      <div style={{ fontSize: 64, fontWeight: 300, color: "#fff", fontFamily: "monospace", margin: "16px 0" }}>
        {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button onClick={() => setRunning(r => !r)} style={{ padding: "8px 20px", background: color, color: "#000", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={() => { setSeconds(mode === "work" ? 25 * 60 : 5 * 60); setRunning(false); }} style={{ padding: "8px 20px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, cursor: "pointer" }}>
          Reset
        </button>
      </div>
    </div>
  );
}`;
  }
  if (p.includes("counter")) {
    return `function CustomModule() {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 48, color: "#22d3ee", fontFamily: "monospace" }}>{count}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
        <button onClick={() => setCount(c => c - 1)} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8 }}>-</button>
        <button onClick={() => setCount(0)} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8 }}>Reset</button>
        <button onClick={() => setCount(c => c + 1)} style={{ padding: "8px 16px", background: "#22d3ee", color: "#000", border: "none", borderRadius: 8 }}>+</button>
      </div>
    </div>
  );
}`;
  }
  return `function CustomModule() {
  const [clicks, setClicks] = React.useState(0);
  const colors = ["#22d3ee", "#34d399", "#f472b6", "#fbbf24", "#c084fc"];
  const color = colors[clicks % colors.length];
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h3 style={{ color: "#fff", marginBottom: 16 }}>Custom Module</h3>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 20 }}>Generated for: ${prompt.replace(/'/g, "\\'").replace(/"/g, '\\"').slice(0, 80)}</p>
      <div style={{ width: 120, height: 120, borderRadius: "50%", background: color, margin: "0 auto 20px", transition: "background 0.3s", boxShadow: "0 0 40px " + color }} />
      <button onClick={() => setClicks(c => c + 1)} style={{ padding: "8px 16px", background: color, color: "#000", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
        Clicked {clicks} times
      </button>
    </div>
  );
}`;
}

async function callLLM(provider: ProviderPayload, systemPrompt: string, userPrompt: string): Promise<string> {
  if (provider.providerId === "zai") {
    const zai = await ZAI.create();
    const c = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });
    return c.choices?.[0]?.message?.content ?? "";
  }

  const cfg = PROVIDERS[provider.providerId];
  if (!cfg) throw new Error("unknown provider");
  const baseUrl = provider.baseUrl || cfg.baseUrl;
  const model = provider.model || cfg.defaultModel;
  const apiKey = provider.apiKey || "";
  if (cfg.requiresKey && !apiKey) throw new Error(`API key required for ${cfg.label}`);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  if (cfg.apiStyle === "openai") {
    const url = baseUrl.endsWith("/") ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 2000 }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? "";
  } else if (cfg.apiStyle === "anthropic") {
    const url = baseUrl.endsWith("/") ? `${baseUrl}messages` : `${baseUrl}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, system: systemPrompt, messages: messages.map(m => ({ role: m.role === "system" ? "user" : m.role, content: m.content })), temperature: 0.3, max_tokens: 2000 }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.content?.[0]?.text ?? "";
  }
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = (body.prompt ?? "").toString().trim();
    const provider: ProviderPayload = body.provider ?? { providerId: "zai", apiKey: "", baseUrl: "", model: "" };

    if (!prompt) return NextResponse.json({ error: "missing prompt" }, { status: 400 });

    let code = "";
    try {
      code = await callLLM(provider, SYSTEM_PROMPT, prompt);
    } catch (e) {
      console.error("[generate-module] LLM error:", e);
      code = "";
    }

    // Strip markdown fences if present
    code = code.replace(/^```(tsx?|jsx?|javascript|typescript)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    if (!code || !code.includes("CustomModule")) {
      code = fallbackGenerate(prompt);
    }

    return NextResponse.json({
      code,
      title: prompt.slice(0, 40),
    });
  } catch (e) {
    console.error("[generate-module] fatal:", e);
    return NextResponse.json({
      code: fallbackGenerate(""),
      title: "Custom Module",
    });
  }
}
