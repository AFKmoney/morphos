// MorphOS static UI audit: scrollbars, i18n keys, a11y labels, timer leaks.
// Usage: npm run audit:ui   (exit 1 on any FAIL, warnings never fail)

import pathlib from "node:path";
import { readdirSync, readFileSync, statSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const fails = [];
const warns = [];
function fail(msg) { fails.push(msg); console.log(`  ✗ FAIL ${msg}`); }
function warn(msg) { warns.push(msg); console.log(`  ! warn ${msg}`); }
function pass(msg) { console.log(`  ✓ ${msg}`); }

function files(dir, exts) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = pathlib.join(dir, e);
    if (statSync(p).isDirectory()) out.push(...files(p, exts));
    else if (exts.some((x) => p.endsWith(x))) out.push(p);
  }
  return out;
}

const tsx = files(pathlib.join(ROOT, "src"), [".tsx"]);
const ts = files(pathlib.join(ROOT, "src"), [".ts"]).filter((f) => !f.includes("__tests__"));
const all = [...tsx, ...ts];
const read = (f) => readFileSync(f, "utf8");
const rel = (f) => pathlib.relative(ROOT, f);

// 1. flex-1 + overflow scroll ⇒ min-h-0 (sinon le scroll ne se déclenche pas)
{
  let bad = 0;
  for (const f of tsx) {
    if (f.includes("components/ui/")) continue;
    const s = read(f);
    for (const m of s.matchAll(/className="([^"]*)"/g)) {
      const c = m[1];
      const scrollable = /overflow-(y-|x-)?auto/.test(c) || /overflow-scroll/.test(c);
      if (scrollable && /\bflex-1\b/.test(c) && !/min-h-0|min-h-\[/.test(c) && !/max-h-/.test(c)) {
        bad++;
        fail(`${rel(f)}: flex-1 scrollable sans min-h-0/max-h → "${c.slice(0, 90)}"`);
      }
    }
  }
  if (!bad) pass("tous les conteneurs flex-1 scrollables ont min-h-0/max-h");
}

// 2. toute zone overflow-* scrollable ⇒ thin-scroll ou ScrollArea (hors ui/)
{
  let bad = 0;
  for (const f of tsx) {
    if (f.includes("components/ui/")) continue;
    const s = read(f);
    const lines = s.split("\n");
    lines.forEach((line, i) => {
      if (/scrollbar-width:none|\[&::-webkit-scrollbar\]:hidden/.test(line)) return; // intentionally invisible scrollbar
      if (/overflow-(y-|x-)?auto|overflow-scroll/.test(line) && !/overflow-hidden/.test(line)) {
        const ctx = lines.slice(Math.max(0, i - 3), i + 1).join("\n");
        if (!/thin-scroll/.test(ctx) && !/ScrollArea/.test(s.slice(0, s.indexOf(line)))) {
          bad++;
          fail(`${rel(f)}:${i + 1}: zone scrollable sans thin-scroll`);
        }
      }
    });
  }
  if (!bad) pass("toutes les zones scrollables sont stylées (thin-scroll)");
}

// 3. clés t("…") présentes en EN + FR
{
  const used = new Set();
  for (const f of all) {
    const s = read(f);
    for (const m of s.matchAll(/\bt\(\s*"([^"$`{]+)"/g)) used.add(m[1]);
    for (const m of s.matchAll(/\bt\(\s*'([^'$`{]+)'/g)) used.add(m[1]);
  }
  const i18n = read(pathlib.join(ROOT, "src/lib/i18n.ts"));
  const enStart = i18n.search(/\ben\s*:\s*\{/);
  const frStart = i18n.search(/\bfr\s*:\s*\{/);
  const enKeys = new Set([...i18n.slice(enStart, frStart).matchAll(/"([^"]+)":/g)].map((m) => m[1]));
  const frKeys = new Set([...i18n.slice(frStart).matchAll(/"([^"]+)":/g)].map((m) => m[1]));
  let bad = 0;
  for (const k of [...used].sort()) {
    if (!enKeys.has(k)) { bad++; fail(`clé i18n manquante EN: ${k}`); }
    if (!frKeys.has(k)) { bad++; fail(`clé i18n manquante FR: ${k}`); }
  }
  if (!bad) pass(`${used.size} clés i18n présentes en EN + FR`);
}

// 4. boutons icônes-only ⇒ title/aria-label (warn)
{
  let bad = 0;
  const labeled = (attrs, inner) => {
    if (/title=|aria-label/.test(attrs)) return true;
    if (/\{[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*\}/.test(inner)) return true; // {label} {s} …
    if (/\bt\(/.test(inner)) return true; // {t("…")}
    if (/>[^<>{}]*[A-Za-zÀ-ÿ][^<>{}]*</.test(inner)) return true; // direct text node
    const stripped = inner.replace(/<[^>]*>/g, "");
    if (/["'][A-Za-zÀ-ÿ].*["']/.test(stripped)) return true; // quoted text in conditional
    return stripped.replace(/\{[^}]*\}/g, "").trim().length > 0;
  };
  // Scan <button …>…</button> respecting quotes + {} () [] depth (attrs contain => etc.)
  function scanButtons(s) {
    const out = [];
    let i = 0;
    while (true) {
      const start = s.indexOf("<button", i);
      if (start === -1) break;
      const after = s[start + 7];
      if (after && /[A-Za-z0-9_-]/.test(after)) { i = start + 7; continue; } // <buttonX…: skip
      let j = start + 7;
      let depth = 0;
      let quote = null;
      let attrs = "";
      let selfClosing = false;
      while (j < s.length) {
        const ch = s[j];
        if (quote) {
          if (ch === quote) quote = null;
        } else if (ch === '"' || ch === "'" || ch === "`") {
          quote = ch;
        } else if (ch === "{" || ch === "(" || ch === "[") {
          depth++;
        } else if (ch === "}" || ch === ")" || ch === "]") {
          depth--;
        } else if (ch === ">" && depth === 0) {
          break;
        }
        j++;
      }
      attrs = s.slice(start + 7, j);
      if (s[j - 1] === "/") selfClosing = true;
      if (selfClosing) {
        out.push({ attrs, inner: "" });
        i = j + 1;
      } else {
        const end = s.indexOf("</button>", j);
        if (end === -1) break;
        out.push({ attrs, inner: s.slice(j + 1, end) });
        i = end + 9;
      }
    }
    return out;
  }
  for (const f of tsx) {
    if (f.includes("components/ui/")) continue;
    const s = read(f);
    for (const b of scanButtons(s)) {
      if (b.inner === "" && !/title=|aria-label/.test(b.attrs)) {
        bad++;
        warn(`${rel(f)}: bouton auto-fermant sans title/aria-label`);
      } else if (b.inner !== "" && !labeled(b.attrs, b.inner)) {
        bad++;
        warn(`${rel(f)}: bouton icône sans title/aria-label`);
      }
    }
  }
  if (!bad) pass("tous les boutons icônes ont un label");
}

// 5. setInterval/setTimeout avec cleanup dans useEffect (warn si suspect)
{
  for (const f of all) {
    const s = read(f);
    const nSet = (s.match(/setInterval\(/g) || []).length;
    const nClear = (s.match(/clearInterval/g) || []).length;
    if (nSet > nClear && !s.includes("DEFAULT_CODE") && !s.includes("fallbackGenerate")) {
      warn(`${rel(f)}: ${nSet} setInterval pour ${nClear} clearInterval — vérifier`);
    }
  }
  pass("audit timers terminé");
}

// 6. pas de console.log côté client (console.error/warn des boundaries OK)
{
  let bad = 0;
  for (const f of tsx) {
    if (f.includes("src/plugins/")) continue; // example plugin code
    const s = read(f);
    if (/console\.log\(/.test(s)) { bad++; fail(`${rel(f)}: console.log résiduel`); }
  }
  if (!bad) pass("aucun console.log côté client");
}

// 7. fetchJson utilisé (pas de res.json() brut sur les routes API)
{
  let bad = 0;
  for (const f of tsx) {
    if (f.includes("components/ui/")) continue;
    const s = read(f);
    const callsApi = /fetch\(\s*["'`]\/api\//.test(s);
    const bareJson = /await res\.json\(\)(?!\s*\.catch)/.test(s);
    if (callsApi && bareJson) { bad++; fail(`${rel(f)}: res.json() brut sur /api/ — utiliser fetchJson`); }
  }
  if (!bad) pass("aucun res.json() brut côté client");
}

// 9. pas de dialogues natifs bloquants (Round 3): prompt/alert/confirm
{
  let bad = 0;
  for (const f of all) {
    if (f.includes("components/ui/") || f.includes("src/plugins/") || f.includes("__tests__")) continue;
    const s = read(f);
    const lines = s.split("\n");
    lines.forEach((line, i) => {
      const loc = `${rel(f)}:${i + 1}`;
      if (/\bprompt\s*\(/.test(line)) { bad++; fail(`${loc}: prompt() natif — utiliser une saisie inline`); }
      if (/\balert\s*\(/.test(line)) { bad++; fail(`${loc}: alert() natif — utiliser un état inline`); }
      if (/\bconfirm\s*\(/.test(line)) { bad++; fail(`${loc}: confirm() natif — utiliser une confirmation inline`); }
    });
  }
  if (!bad) pass("zéro dialogue natif bloquant (prompt/alert/confirm)");
}

// 8. zéro fake/simulé (Round 2): pas de Math.random() dans les données des
// modules, pas de FAKE_/lorem, pas de locale "en" hardcodée.
{
  let bad = 0;
  for (const f of all) {
    if (f.includes("components/ui/") || f.includes("src/plugins/") || f.includes("__tests__")) continue;
    const s = read(f);
    const lines = s.split("\n");
    lines.forEach((line, i) => {
      const loc = `${rel(f)}:${i + 1}`;
      if (/Math\.random\(/.test(line) && !/Math\.floor\(Math\.random\(\)\*4\)/.test(line)) {
        bad++;
        fail(`${loc}: Math.random() — donnée simulée interdite, utiliser une vraie source`);
      }
      if (/FAKE_/.test(line)) { bad++; fail(`${loc}: identifiant FAKE_ résiduel`); }
      if (/lorem/i.test(line)) { bad++; fail(`${loc}: texte lorem résiduel`); }
      if (/toLocale(DateString|TimeString|String)\("en"/.test(line)) {
        bad++;
        fail(`${loc}: locale "en" hardcodée — utiliser la locale du navigateur`);
      }
    });
  }
  if (!bad) pass("zéro donnée simulée (Math.random/FAKE/lorem/locale en) dans les modules");
}

console.log(`\n${fails.length} FAIL, ${warns.length} warnings.`);
if (fails.length > 0) process.exit(1);
console.log("AUDIT GREEN ✓");
