// MorphOS API battery: mock providers + assertions against a running server.
// Usage: start MorphOS (`npm run start` or `npm run dev` on :3000), then:
//   npm run test:api        (or: BASE=http://localhost:3000 node scripts/test-api.mjs)
// Exit code 0 = all green, 1 = failure. No external network needed.

import http from "node:http";

const BASE = process.env.BASE || "http://localhost:3000";
let passed = 0;
let failed = 0;
const failures = [];

function ok(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, json, text };
}

// ---------- Mock NVIDIA NIM (OpenAI-compatible) ----------
function startMockNim() {
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const auth = req.headers.authorization || "";
      const send = (code, obj) => {
        res.writeHead(code, { "Content-Type": "application/json" });
        res.end(JSON.stringify(obj));
      };
      if (!auth.startsWith("Bearer nvapi-")) return send(401, { detail: "Invalid API key" });
      if (req.url === "/v1/models") {
        return send(200, { data: [{ id: "moonshotai/kimi-k2.5" }, { id: "nvidia/llama-3.1-nemotron-70b-instruct" }] });
      }
      if (req.url === "/v1/chat/completions") {
        const { model, messages } = JSON.parse(body || "{}");
        if (model === "moonshotai/kimi-k2.5") {
          const last = (messages || []).map((m) => m.content).join(" ").slice(-80);
          if (last.includes("Return ONLY")) {
            return send(200, { choices: [{ message: { content: '{"moduleType":"chat","title":"Chat","prompt":"hi"}' } }] });
          }
          return send(200, { choices: [{ message: { content: "2+2 = 4" } }] });
        }
        return send(404, { detail: `model '${model}' not found` });
      }
      send(404, { detail: "not found" });
    });
  });
  return new Promise((resolve) => server.listen(3999, () => resolve(server)));
}

// ---------- Mock Anthropic ----------
function startMockClaude() {
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const send = (code, obj) => {
        res.writeHead(code, { "Content-Type": "application/json" });
        res.end(JSON.stringify(obj));
      };
      if (req.headers["x-api-key"] !== "sk-ant-good") return send(401, { error: { message: "invalid x-api-key" } });
      if (req.url === "/messages") return send(200, { content: [{ text: '{"moduleType":"clock","title":"Clock"}' }] });
      send(404, { error: { message: "not found" } });
    });
  });
  return new Promise((resolve) => server.listen(3998, () => resolve(server)));
}

const NIM = "http://localhost:3999/v1";
const CLAUDE = "http://localhost:3998";

console.log(`\nMorphOS API battery — BASE=${BASE}\n`);

const nim = await startMockNim();
const claude = await startMockClaude();
try {
  // 1. Home serves
  {
    const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(15000) });
    ok("home 200", res.status === 200, `got ${res.status}`);
  }
  // 2. Test: good key + good model
  {
    const r = await post("/api/test-provider", { providerId: "nvidia", apiKey: "nvapi-GOOD", baseUrl: NIM, model: "moonshotai/kimi-k2.5" });
    ok("test ok:true + keyOk + modelUsed + models[]",
      r.json?.ok === true && r.json?.keyOk === true && r.json?.modelUsed === "moonshotai/kimi-k2.5" && Array.isArray(r.json?.models) && r.json.models.length === 2,
      JSON.stringify(r.json).slice(0, 160));
  }
  // 3. Test: stale model → keyOk + available models
  {
    const r = await post("/api/test-provider", { providerId: "nvidia", apiKey: "nvapi-GOOD", baseUrl: NIM, model: "meta/llama3-70b-instruct" });
    ok("test stale model → keyOk + Available models",
      r.json?.ok === false && r.json?.keyOk === true && Array.isArray(r.json?.models) && /Available models/.test(r.json?.error || ""),
      JSON.stringify(r.json).slice(0, 160));
  }
  // 4. Test: bad key → 401 parsed
  {
    const r = await post("/api/test-provider", { providerId: "nvidia", apiKey: "nonsense", baseUrl: NIM, model: "moonshotai/kimi-k2.5" });
    ok("test bad key → 401 Invalid API key",
      r.json?.ok === false && /401/.test(r.json?.error || "") && /Invalid API key/.test(r.json?.error || ""),
      JSON.stringify(r.json).slice(0, 160));
  }
  // 5. Test: unknown provider → 400
  {
    const r = await post("/api/test-provider", { providerId: "nope", apiKey: "x", baseUrl: NIM, model: "m" });
    ok("test unknown provider → 400", r.status === 400, `got ${r.status}`);
  }
  // 6. Test: missing key (requiresKey) → 400
  {
    const r = await post("/api/test-provider", { providerId: "nvidia", apiKey: "", baseUrl: NIM, model: "moonshotai/kimi-k2.5" });
    ok("test missing key → 400", r.status === 400, `got ${r.status}`);
  }
  // 7. Test: unreachable host → friendly network error (never raw fetch failed)
  {
    const r = await post("/api/test-provider", { providerId: "custom", apiKey: "", baseUrl: "http://127.0.0.1:9/v1", model: "m" });
    ok("test dead host → Network error friendly",
      r.json?.ok === false && /Network error: cannot reach 127\.0\.0\.1/.test(r.json?.error || ""),
      JSON.stringify(r.json).slice(0, 160));
  }
  // 8. Test: anthropic-style via shared helper
  {
    const r = await post("/api/test-provider", { providerId: "anthropic", apiKey: "sk-ant-good", baseUrl: CLAUDE, model: "claude-x" });
    ok("test anthropic ok", r.json?.ok === true && r.json?.keyOk === true, JSON.stringify(r.json).slice(0, 160));
  }
  // 9. Interpret: missing prompt → 400
  {
    const r = await post("/api/interpret", { prompt: "", provider: { providerId: "custom", apiKey: "", baseUrl: NIM, model: "m" } });
    ok("interpret missing prompt → 400", r.status === 400, `got ${r.status}`);
  }
  // 10. Interpret: LLM JSON parsed (mock)
  {
    const r = await post("/api/interpret", { prompt: "blah Return ONLY json", provider: { providerId: "nvidia", apiKey: "nvapi-GOOD", baseUrl: NIM, model: "moonshotai/kimi-k2.5" } });
    ok("interpret mock → moduleType chat", r.json?.moduleType === "chat", JSON.stringify(r.json).slice(0, 160));
  }
  // 11. Interpret: dead provider → JSON error (chat shows ⚠️)
  {
    const r = await post("/api/interpret", { prompt: "open chat", provider: { providerId: "custom", apiKey: "", baseUrl: "http://127.0.0.1:9/v1", model: "m" } });
    ok("interpret dead provider → error JSON", typeof r.json?.error === "string" && /cannot reach/.test(r.json.error), JSON.stringify(r.json).slice(0, 160));
  }
  // 12. Interpret: keyword fallback still works (no provider key needed for zai-less path? uses fallback only on parse fail)
  {
    const r = await post("/api/interpret", { prompt: "start a pomodoro timer please", provider: { providerId: "nvidia", apiKey: "nvapi-GOOD", baseUrl: NIM, model: "moonshotai/kimi-k2.5" } });
    // mock returns non-JSON "2+2 = 4" → parse fails → keyword fallback → pomodoro
    ok("interpret keyword fallback → pomodoro", r.json?.moduleType === "pomodoro", JSON.stringify(r.json).slice(0, 160));
  }
  // 13. generate-module: missing prompt → 400
  {
    const r = await post("/api/generate-module", { prompt: "", provider: { providerId: "custom" } });
    ok("generate-module missing prompt → 400", r.status === 400, `got ${r.status}`);
  }
  // 14. generate-module: LLM fail → fallback code (never empty)
  {
    const r = await post("/api/generate-module", { prompt: "a cat counter", provider: { providerId: "custom", apiKey: "", baseUrl: "http://127.0.0.1:9/v1", model: "m" } });
    ok("generate-module fallback code", typeof r.json?.code === "string" && r.json.code.includes("CustomModule"), (r.json?.code || "").slice(0, 80));
  }
  // 15. generate-image: missing prompt → 400
  {
    const r = await post("/api/generate-image", { prompt: "" });
    ok("generate-image missing prompt → 400", r.status === 400, `got ${r.status}`);
  }
  // 16. generate-image: unknown provider → 400
  {
    const r = await post("/api/generate-image", { prompt: "a cat", provider: { providerId: "nope" } });
    ok("generate-image unknown provider → 400", r.status === 400, `got ${r.status}`);
  }
} finally {
  nim.close();
  claude.close();
}

console.log(`\n${passed} passed, ${failed} failed.`);
if (failed > 0) {
  console.log("Failures:", failures.join(" | "));
  process.exit(1);
}
console.log("ALL GREEN ✓");
