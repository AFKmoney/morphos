"use client";

import { useState } from "react";
import { Sparkles, Download, Loader2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { useSettings, buildProviderPayload } from "@/lib/settings-store";
import { fetchJson } from "@/lib/utils";
import { useT } from "@/lib/use-t";

const SIZES = [
  { label: "Square", value: "1024x1024" },
  { label: "Portrait", value: "768x1344" },
  { label: "Landscape", value: "1344x768" },
];

const SUGGESTIONS = [
  "A futuristic neon city at night, cyberpunk style",
  "A serene mountain landscape with aurora borealis",
  "An abstract digital art piece with cyan and pink gradients",
  "A cute robot mascot for MorphOS, minimalist design",
];

export function ImageGenModule() {
  const t = useT();
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [base64, setBase64] = useState<string>("");
  const [history, setHistory] = useState<{ prompt: string; url: string; base64?: string }[]>([]);

  async function generate() {
    const p = prompt.trim();
    if (!p || loading) return;
    setLoading(true);
    setError(null);
    setImageUrl("");
    setBase64("");

    try {
      const data = await fetchJson("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: p,
          size,
          provider: buildProviderPayload(),
        }),
      });

      if (data.error) {
        setError(data.error);
      } else {
        if (data.base64) {
          setBase64(data.base64);
          setHistory(prev => [{ prompt: p, url: "", base64: data.base64 }, ...prev].slice(0, 6));
        } else if (data.imageUrl) {
          setImageUrl(data.imageUrl);
          setHistory(prev => [{ prompt: p, url: data.imageUrl }, ...prev].slice(0, 6));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function download() {
    const src = base64 ? `data:image/png;base64,${base64}` : imageUrl;
    if (!src) return;
    const link = document.createElement("a");
    link.download = `morphos-img-${Date.now()}.png`;
    link.href = src;
    link.click();
  }

  const displaySrc = base64 ? `data:image/png;base64,${base64}` : imageUrl;

  return (
    <div className="flex flex-col h-full p-3 gap-3 thin-scroll overflow-y-auto">
      <div className="text-[10px] uppercase tracking-wider text-white/40 flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        AI Image Generation
      </div>

      <div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
          placeholder="Describe the image you want to generate…"
          className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none focus:border-cyan-400/50 resize-none thin-scroll"
          rows={2}
          spellCheck={false}
        />
      </div>

      <div className="flex gap-1">
        {SIZES.map(s => (
          <button
            key={s.value}
            onClick={() => setSize(s.value)}
            className={`text-[10px] px-2 py-1 rounded-md ${size === s.value ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "text-white/50 bg-white/5 hover:text-white"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <button
        onClick={generate}
        disabled={!prompt.trim() || loading}
        className="text-xs px-3 py-2 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-30 flex items-center justify-center gap-1.5"
      >
        {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</> : <><Sparkles className="w-3.5 h-3.5" /> Generate</>}
      </button>

      {error && (
        <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded px-2 py-1.5 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span className="font-mono break-words whitespace-pre-wrap max-h-24 overflow-y-auto thin-scroll">{error}</span>
        </div>
      )}

      {displaySrc && !loading && (
        <div className="relative rounded-lg overflow-hidden border border-white/10 group">
          <img loading="lazy" decoding="async" src={displaySrc} alt={prompt} className="w-full" />
          <button
            onClick={download}
            title={t("common.download")}
            className="absolute top-2 right-2 w-7 h-7 rounded-md bg-black/60 backdrop-blur text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {loading && (
        <div className="aspect-square rounded-lg border border-white/8 bg-black/30 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <div className="text-[10px] text-white/40">Creating image…</div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">History</div>
          <div className="grid grid-cols-3 gap-1.5">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  if (h.base64) { setBase64(h.base64); setImageUrl(""); }
                  else { setImageUrl(h.url); setBase64(""); }
                }}
                className="aspect-square rounded-md overflow-hidden border border-white/8 hover:border-cyan-400/30 transition"
              >
                {h.base64 ? (
                  <img loading="lazy" decoding="async" src={`data:image/png;base64,${h.base64}`} alt={h.prompt} className="w-full h-full object-cover" />
                ) : (
                  <img loading="lazy" decoding="async" src={h.url} alt={h.prompt} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => setPrompt(s)}
            className="text-[9px] px-2 py-1 rounded bg-white/5 text-white/50 hover:text-white hover:bg-white/10 flex items-center gap-1"
          >
            <ImageIcon className="w-2.5 h-2.5" />
            {s.slice(0, 30)}…
          </button>
        ))}
      </div>
    </div>
  );
}
