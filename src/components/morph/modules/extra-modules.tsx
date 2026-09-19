"use client";

// All extra modules in one file to reduce Turbopack memory pressure
import { useState, useEffect, useRef } from "react";
import { useModulePersist } from "@/lib/module-state-store";
import QRCode from "qrcode";
import { useT } from "@/lib/use-t";
import { Play, Pause, RotateCcw, Coffee, Brain, Brush, Eraser, Trash2, Download, Undo2, Check, AlertCircle, Copy, ArrowRightLeft, ChevronLeft, ChevronRight, Lock, Globe, ExternalLink } from "lucide-react";

// ============ POMODORO ============
function beep(freq = 880) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.start();
    o.stop(ctx.currentTime + 0.45);
  } catch {
    /* audio unavailable */
  }
}

export function PomodoroModule() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          beep(mode === "work" ? 880 : 660);
          const nextMode = mode === "work" ? "break" : "work";
          setMode(nextMode);
          if (mode === "work") setSessions((n) => n + 1);
          return nextMode === "work" ? 25 * 60 : 5 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, mode]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const total = mode === "work" ? 25 * 60 : 5 * 60;
  const progress = (total - seconds) / total;
  const color = mode === "work" ? "#22d3ee" : "#34d399";
  const Icon = mode === "work" ? Brain : Coffee;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-4">
      <div className="flex gap-1">
        <button onClick={() => { setMode("work"); setSeconds(25*60); setRunning(false); }} className={`text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 ${mode === "work" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "text-white/50"}`}><Brain className="w-2.5 h-2.5" /> Focus 25</button>
        <button onClick={() => { setMode("break"); setSeconds(5*60); setRunning(false); }} className={`text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 ${mode === "break" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "text-white/50"}`}><Coffee className="w-2.5 h-2.5" /> Break 5</button>
      </div>
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2*Math.PI*44}`} strokeDashoffset={`${2*Math.PI*44*(1-progress)}`} style={{ transition: "stroke-dashoffset 1s linear", filter: `drop-shadow(0 0 6px ${color})` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 mb-1" style={{ color }} />
          <div className="text-3xl font-mono font-light text-white tabular-nums">{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</div>
          <div className="text-[9px] text-white/40 uppercase tracking-wider mt-1">{mode}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setRunning(r => !r)} className="px-4 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5" style={{ background: color, color: "#000" }}>{running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}{running ? "Pause" : "Start"}</button>
        <button onClick={() => { setRunning(false); setSeconds(mode === "work" ? 25*60 : 5*60); }} className="px-3 py-1.5 rounded-md text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 flex items-center gap-1.5"><RotateCcw className="w-3 h-3" /> Reset</button>
      </div>
      <div className="text-[10px] text-white/40">Sessions: <span className="text-cyan-300 font-mono">{sessions}</span></div>
    </div>
  );
}

// ============ PAINT ============
const PAINT_COLORS = ["#22d3ee", "#34d399", "#f472b6", "#fbbf24", "#c084fc", "#ffffff", "#000000", "#f97316"];
export function PaintModule() {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [color, setColor] = useState(PAINT_COLORS[0]);
  const [size, setSize] = useState(4);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [history, setHistory] = useState<ImageData[]>([]);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.scale(dpr, dpr); ctx.fillStyle = "#0a0a14"; ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctxRef.current = ctx;
  }, []);

  function getPos(e: React.MouseEvent) { const rect = canvasRef.current!.getBoundingClientRect(); return { x: e.clientX - rect.left, y: e.clientY - rect.top }; }
  function start(e: React.MouseEvent) { drawing.current = true; lastPos.current = getPos(e); const ctx = ctxRef.current, canvas = canvasRef.current; if (ctx && canvas) setHistory(h => [...h.slice(-9), ctx.getImageData(0,0,canvas.width,canvas.height)]); }
  function draw(e: React.MouseEvent) { if (!drawing.current || !ctxRef.current || !lastPos.current) return; const pos = getPos(e); const ctx = ctxRef.current; ctx.strokeStyle = tool === "eraser" ? "#0a0a14" : color; ctx.lineWidth = tool === "eraser" ? size*3 : size; ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke(); lastPos.current = pos; }
  function stop() { drawing.current = false; lastPos.current = null; }
  function clear() { const ctx = ctxRef.current, canvas = canvasRef.current; if (!ctx || !canvas) return; ctx.fillStyle = "#0a0a14"; ctx.fillRect(0,0,canvas.width,canvas.height); }
  function undo() { const last = history[history.length-1]; if (!last) return; ctxRef.current?.putImageData(last,0,0); setHistory(h => h.slice(0,-1)); }
  function download() { const canvas = canvasRef.current; if (!canvas) return; const link = document.createElement("a"); link.download = `morphos-paint-${Date.now()}.png`; link.href = canvas.toDataURL(); link.click(); }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-black/30 flex-wrap">
        <div className="flex gap-1">{PAINT_COLORS.map(c => <button key={c} onClick={() => { setColor(c); setTool("brush"); }} className={`w-5 h-5 rounded-full border-2 ${color===c&&tool==="brush"?"border-white":"border-white/20"}`} style={{ background: c }} />)}</div>
        <div className="flex items-center gap-1"><button onClick={() => setTool("brush")} className={`p-1 rounded ${tool==="brush"?"bg-cyan-500/20 text-cyan-300":"text-white/50 hover:text-white"}`}><Brush className="w-3 h-3" /></button><button onClick={() => setTool("eraser")} className={`p-1 rounded ${tool==="eraser"?"bg-cyan-500/20 text-cyan-300":"text-white/50 hover:text-white"}`}><Eraser className="w-3 h-3" /></button></div>
        <input type="range" min={1} max={20} value={size} onChange={e => setSize(Number(e.target.value))} className="w-16 accent-cyan-400" /><span className="text-[10px] text-white/50 font-mono">{size}px</span>
        <div className="flex gap-1 ml-auto"><button onClick={undo} title={t("common.undo")} className="p-1 rounded text-white/50 hover:text-white hover:bg-white/5"><Undo2 className="w-3 h-3" /></button><button onClick={download} title={t("common.download")} className="p-1 rounded text-white/50 hover:text-white hover:bg-white/5"><Download className="w-3 h-3" /></button><button onClick={clear} title={t("common.clear")} className="p-1 rounded text-white/50 hover:text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-3 h-3" /></button></div>
      </div>
      <div className="flex-1 relative"><canvas ref={canvasRef} onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop} className="absolute inset-0 w-full h-full cursor-crosshair" /></div>
    </div>
  );
}

// ============ REGEX ============
interface MatchInfo { match: string; index: number; groups: string[]; }
export function RegexModule() {
  const [pattern, setPattern] = useState("\\b(\\w+)@(\\w+\\.\\w+)\\b");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("Contact us at hello@morphos.io or support@z.ai.");
  let matches: MatchInfo[] = []; let error: string | null = null;
  try { const re = new RegExp(pattern, flags); const gr = flags.includes("g") ? re : new RegExp(pattern, flags+"g"); let m; while ((m = gr.exec(text)) !== null) { matches.push({match:m[0],index:m.index,groups:m.slice(1)}); if (m.index===gr.lastIndex) gr.lastIndex++; } } catch(e) { error = e instanceof Error ? e.message : String(e); }
  interface Seg { text: string; isMatch: boolean; key: string; }
  const segs: Seg[] = [];
  if (!error && matches.length > 0) { let li = 0; for (const mt of matches) { if (mt.index > li) segs.push({text:text.slice(li,mt.index),isMatch:false,key:`t-${li}`}); segs.push({text:mt.match,isMatch:true,key:`m-${mt.index}`}); li = mt.index+mt.match.length; } if (li < text.length) segs.push({text:text.slice(li),isMatch:false,key:"t-end"}); }
  return (
    <div className="flex flex-col h-full p-3 gap-2 thin-scroll overflow-y-auto">
      <div className="flex items-center gap-2"><span className="text-cyan-400 font-mono text-sm">/</span><input value={pattern} onChange={e=>setPattern(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono text-cyan-200 outline-none focus:border-cyan-400/50" /><span className="text-cyan-400 font-mono text-sm">/</span><input value={flags} onChange={e=>setFlags(e.target.value)} className="w-12 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono text-cyan-200 outline-none focus:border-cyan-400/50" /></div>
      {error ? <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded px-2 py-1.5 flex items-center gap-1.5"><AlertCircle className="w-3 h-3 shrink-0" /><span className="font-mono truncate">{error}</span></div> : <div className="text-[10px] text-emerald-400 flex items-center gap-1"><Check className="w-2.5 h-2.5" />{matches.length} match{matches.length!==1?"es":""}</div>}
      <div><div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Test string</div><textarea value={text} onChange={e=>setText(e.target.value)} className="w-full h-24 bg-black/40 border border-white/10 rounded p-2 text-xs font-mono text-white/90 outline-none focus:border-cyan-400/50 resize-none thin-scroll" spellCheck={false} /></div>
      <div><div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Highlighted</div><div className="bg-black/40 border border-white/10 rounded p-2 text-xs font-mono text-white/70 whitespace-pre-wrap min-h-[60px]">{error ? text : segs.length > 0 ? segs.map(s => s.isMatch ? <mark key={s.key} className="bg-cyan-500/30 text-cyan-100 rounded px-0.5">{s.text}</mark> : <span key={s.key}>{s.text}</span>) : text}</div></div>
      {matches.length > 0 && <div><div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Matches</div><div className="space-y-1 max-h-32 overflow-y-auto thin-scroll">{matches.map((m,i) => <div key={i} className="bg-black/30 border border-white/5 rounded px-2 py-1 text-[10px] font-mono"><span className="text-white/40">[{m.index}]</span> <span className="text-cyan-300">{m.match}</span>{m.groups.length>0 && <span className="text-white/40"> → ({m.groups.join(", ")})</span>}</div>)}</div></div>}
    </div>
  );
}

// ============ JSON ============
export function JsonModule() {
  const [input, setInput] = useState(`{"name":"MorphOS","v":"0.9.7"}`);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  function format() { try { setOutput(JSON.stringify(JSON.parse(input), null, 2)); setError(null); } catch(e) { setError(e instanceof Error ? e.message : String(e)); setOutput(""); } }
  function minify() { try { setOutput(JSON.stringify(JSON.parse(input))); setError(null); } catch(e) { setError(e instanceof Error ? e.message : String(e)); setOutput(""); } }
  return (
    <div className="flex flex-col h-full p-3 gap-2">
      <div className="flex gap-1"><button onClick={format} className="text-[11px] px-2.5 py-1 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30">Beautify</button><button onClick={minify} className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 hover:bg-white/10">Minify</button><button onClick={() => { navigator.clipboard?.writeText(output); setCopied(true); setTimeout(()=>setCopied(false),1200); }} disabled={!output} className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-30 flex items-center gap-1">{copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}Copy</button></div>
      {error && <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded px-2 py-1.5 flex items-center gap-1.5"><AlertCircle className="w-3 h-3 shrink-0" /><span className="font-mono truncate">{error}</span></div>}
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0"><div className="flex flex-col"><div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Input</div><textarea value={input} onChange={e=>setInput(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-[11px] font-mono text-white/90 outline-none focus:border-cyan-400/50 resize-none thin-scroll" spellCheck={false} /></div><div className="flex flex-col"><div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Output</div><pre className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-[11px] font-mono text-emerald-200/90 overflow-auto thin-scroll whitespace-pre-wrap break-all">{output || <span className="text-white/40">— click Beautify —</span>}</pre></div></div>
    </div>
  );
}

// ============ COLOR PICKER ============
function ColorRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return <button onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(()=>setCopied(false),1000); }} className="flex items-center gap-2 bg-black/30 border border-white/8 rounded px-2 py-1.5 text-left hover:bg-black/50 transition w-full"><span className="text-[10px] uppercase text-white/40 w-12">{label}</span><span className="flex-1 text-[11px] font-mono text-white/90 truncate">{value}</span>{copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-white/30" />}</button>;
}
export function ColorPickerModule() {
  const [color, setColor] = useState("#22d3ee");
  function hexToRgb(hex: string) { return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) }; }
  function rgbToHsl(r: number, g: number, b: number) { r/=255; g/=255; b/=255; const max=Math.max(r,g,b),min=Math.min(r,g,b); let h=0,s=0; const l=(max+min)/2; if(max!==min){const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min); switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break;}} return {h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)}; }
  const rgb = hexToRgb(color); const hsl = rgbToHsl(rgb.r,rgb.g,rgb.b);
  const variations = Array.from({length:11},(_,i)=>`hsl(${hsl.h}, ${hsl.s}%, ${i*10}%)`);
  return (
    <div className="flex flex-col h-full p-3 gap-3 thin-scroll overflow-y-auto">
      <div className="flex items-center gap-3"><input type="color" value={color} onChange={e=>setColor(e.target.value)} className="w-16 h-16 rounded-lg border-2 border-white/10 cursor-pointer bg-transparent" style={{padding:0}} /><div className="flex-1"><div className="w-full h-16 rounded-lg border border-white/10" style={{background:color,boxShadow:`0 0 30px ${color}80`}} /></div></div>
      <div className="space-y-1.5"><ColorRow label="HEX" value={color.toUpperCase()} /><ColorRow label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} /><ColorRow label="HSL" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} /></div>
      <div><div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Shades</div><div className="flex h-8 rounded-md overflow-hidden border border-white/8">{variations.map((v,i)=><button key={i} onClick={()=>navigator.clipboard?.writeText(v)} className="flex-1 hover:scale-110 transition-transform" style={{background:v}} title={v} />)}</div></div>
    </div>
  );
}

// ============ QR ============
type QrECLevel = "L" | "M" | "Q" | "H";
const QR_EC_LEVELS: QrECLevel[] = ["L", "M", "Q", "H"];
export function QrModule() {
  const [text, setText] = useState("https://github.com/morphos");
  const [ecLevel, setEcLevel] = useState<QrECLevel>("M");
  const [dataUrl, setDataUrl] = useState("");
  const [qrError, setQrError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(text || " ", { width: 360, margin: 2, errorCorrectionLevel: ecLevel, color: { dark: "#000000", light: "#ffffff" } })
      .then((url) => { if (live) { setDataUrl(url); setQrError(null); } })
      .catch((e) => { if (live) { setDataUrl(""); setQrError(e instanceof Error ? e.message : String(e)); } });
    return () => { live = false; };
  }, [text, ecLevel]);
  function download() { if (!dataUrl) return; const link = document.createElement("a"); link.download = `morphos-qr-${Date.now()}.png`; link.href = dataUrl; link.click(); }
  return (
    <div className="flex flex-col h-full p-3 gap-3 thin-scroll overflow-y-auto">
      <div><div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Text / URL</div><input value={text} onChange={e=>setText(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50" /></div>
      <div className="flex items-center justify-center bg-white rounded-lg p-4 mx-auto min-w-[212px] min-h-[212px]">{dataUrl ? <img src={dataUrl} alt="QR code" width={180} height={180} /> : <span className="text-[11px] text-black/50">{qrError ?? "Generating…"}</span>}</div>
      {qrError && <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded px-2 py-1.5">{qrError}</div>}
      <div className="flex items-center gap-2"><span className="text-[10px] text-white/40">Correction</span><div className="flex gap-1">{QR_EC_LEVELS.map(l=><button key={l} onClick={()=>setEcLevel(l)} className={`text-[10px] px-2 py-0.5 rounded font-mono ${ecLevel===l?"bg-cyan-500/20 text-cyan-300 border border-cyan-400/30":"text-white/50 bg-white/5 hover:text-white"}`}>{l}</button>)}</div><span className="text-[9px] text-white/40 ml-auto">scannable</span></div>
      <button onClick={download} disabled={!dataUrl} className="text-[11px] px-3 py-1.5 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-30 flex items-center justify-center gap-1.5"><Download className="w-3 h-3" /> Download PNG</button>
    </div>
  );
}

// ============ DEVTOOLS ============
type Tool = "base64" | "url" | "hash" | "uuid" | "binary" | "hex" | "rot13";
const TOOLS: {id:Tool;label:string}[] = [{id:"base64",label:"Base64"},{id:"url",label:"URL"},{id:"hash",label:"Hash"},{id:"uuid",label:"UUID"},{id:"binary",label:"Binary"},{id:"hex",label:"Hex"},{id:"rot13",label:"ROT13"}];
export function DevtoolsModule() {
  const t = useT();
  const [tool, setTool] = useState<Tool>("base64");
  const [input, setInput] = useState("Hello MorphOS");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode"|"decode">("encode");
  const [copied, setCopied] = useState(false);
  async function compute() { let r=""; try { switch(tool){case "base64": r=mode==="encode"?btoa(unescape(encodeURIComponent(input))):decodeURIComponent(escape(atob(input)));break;case "url": r=mode==="encode"?encodeURIComponent(input):decodeURIComponent(input);break;case "hash": const enc=new TextEncoder().encode(input);const buf=await crypto.subtle.digest("SHA-256",enc);r=Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");break;case "uuid": r=crypto.randomUUID();break;case "binary": r=mode==="encode"?input.split("").map(c=>c.charCodeAt(0).toString(2).padStart(8,"0")).join(" "):input.split(/\s+/).map(b=>String.fromCharCode(parseInt(b,2))).join("");break;case "hex": r=mode==="encode"?input.split("").map(c=>c.charCodeAt(0).toString(16).padStart(2,"0")).join(" "):input.split(/\s+/).map(h=>String.fromCharCode(parseInt(h,16))).join("");break;case "rot13": r=input.replace(/[a-zA-Z]/g,c=>{const code=c.charCodeAt(0);const base=code>=65&&code<=90?65:97;return String.fromCharCode(((code-base+13)%26)+base);});break;} setOutput(r);} catch(e){ setOutput(`Error: ${e instanceof Error?e.message:String(e)}`);} }
  const canSwap = ["base64","url","binary","hex"].includes(tool);
  return (
    <div className="flex flex-col h-full p-3 gap-2">
      <div className="flex flex-wrap gap-1">{TOOLS.map(t=><button key={t.id} onClick={()=>{setTool(t.id);setOutput("");}} className={`text-[10px] px-2 py-1 rounded-md ${tool===t.id?"bg-cyan-500/20 text-cyan-300 border border-cyan-400/30":"text-white/50 hover:text-white bg-white/5"}`}>{t.label}</button>)}</div>
      {canSwap && <div className="flex gap-1"><button onClick={()=>setMode("encode")} className={`text-[10px] px-2 py-0.5 rounded ${mode==="encode"?"bg-emerald-500/20 text-emerald-300":"text-white/50"}`}>Encode</button><button onClick={()=>setMode("decode")} className={`text-[10px] px-2 py-0.5 rounded ${mode==="decode"?"bg-emerald-500/20 text-emerald-300":"text-white/50"}`}>Decode</button></div>}
      <div className="flex flex-col flex-1 gap-1 min-h-0"><div className="text-[10px] uppercase tracking-wider text-white/40">Input</div><textarea value={input} onChange={e=>setInput(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-[11px] font-mono text-white/90 outline-none focus:border-cyan-400/50 resize-none thin-scroll min-h-[60px]" spellCheck={false} /></div>
      <div className="flex gap-1"><button onClick={compute} className="flex-1 text-[11px] px-3 py-1.5 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30">{tool==="uuid"?"Generate":tool==="hash"?"Hash":"Convert"}</button>{canSwap && <button onClick={()=>{setInput(output);setOutput(input);}} title={t("common.swap")} className="text-[11px] px-2 py-1.5 rounded-md bg-white/5 border border-white/10 text-white/60 hover:text-white"><ArrowRightLeft className="w-3 h-3" /></button>}<button onClick={()=>{navigator.clipboard?.writeText(output);setCopied(true);setTimeout(()=>setCopied(false),1200);}} disabled={!output} title={t("common.copy")} className="text-[11px] px-2 py-1.5 rounded-md bg-white/5 border border-white/10 text-white/60 hover:text-white disabled:opacity-30">{copied?<Check className="w-3 h-3 text-emerald-400" />:<Copy className="w-3 h-3" />}</button></div>
      <div className="flex flex-col flex-1 gap-1 min-h-0"><div className="text-[10px] uppercase tracking-wider text-white/40">Output</div><pre className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-[11px] font-mono text-emerald-200/90 overflow-auto thin-scroll whitespace-pre-wrap break-all min-h-[60px]">{output || <span className="text-white/40">— click {tool==="uuid"?"Generate":"Convert"} —</span>}</pre></div>
    </div>
  );
}

// ============ BROWSER ============
const SUGGESTED = [{name:"Wikipedia",url:"https://en.wikipedia.org/wiki/MorphOS"},{name:"MDN",url:"https://developer.mozilla.org"},{name:"Z.ai",url:"https://z.ai"}];
export function BrowserModule() {
  const [url, setUrl] = useState("https://en.wikipedia.org/wiki/MorphOS");
  const [inputUrl, setInputUrl] = useState(url);
  function navigate(to:string){let n=to.trim();if(!n)return;if(!n.startsWith("http"))n="https://"+n;setUrl(n);setInputUrl(n);}
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/8 bg-black/30"><div className="flex-1 flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-md px-2 py-1"><Lock className="w-2.5 h-2.5 text-emerald-400" /><input value={inputUrl} onChange={e=>setInputUrl(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")navigate(inputUrl);}} className="flex-1 bg-transparent text-[11px] text-white/80 outline-none font-mono" placeholder="Search or enter URL" /></div><a href={url} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-white/60 hover:text-white"><ExternalLink className="w-3 h-3" /></a></div>
      <div className="flex gap-1 px-2 py-1 border-b border-white/8 bg-black/20 overflow-x-auto thin-scroll">{SUGGESTED.map(s=><button key={s.url} onClick={()=>navigate(s.url)} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/60 hover:text-white hover:bg-white/10 whitespace-nowrap flex items-center gap-1"><Globe className="w-2.5 h-2.5" />{s.name}</button>)}</div>
      <div className="flex-1 relative bg-white"><iframe key={url} src={url} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin allow-forms" referrerPolicy="no-referrer" title="Browser" /></div>
    </div>
  );
}

// ============ CALENDAR ============
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
interface Ev { date: string; title: string; color: string; }
export function CalendarModule() {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today.toISOString().slice(0,10));
  const [events, setEvents] = useModulePersist<Ev[]>("calendar:events",[{date:today.toISOString().slice(0,10),title:"MorphOS session",color:"#22d3ee"},{date:new Date(Date.now()+86400000*2).toISOString().slice(0,10),title:"Ship v1.0",color:"#34d399"}]);
  const year = view.getFullYear(), month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const eventsByDate = events.reduce((acc,e)=>{if(!acc[e.date])acc[e.date]=[];acc[e.date].push(e);return acc;},{} as Record<string,Ev[]>);
  const cells: React.ReactNode[] = [];
  for(let i=0;i<firstDay;i++) cells.push(<div key={`e-${i}`} className="h-9" />);
  for(let d=1;d<=daysInMonth;d++){const ds=new Date(year,month,d).toISOString().slice(0,10);const isT=ds===today.toISOString().slice(0,10);const isS=ds===selected;const de=eventsByDate[ds]??[];cells.push(<button key={d} onClick={()=>setSelected(ds)} className={`h-9 rounded-md flex flex-col items-center justify-center text-[11px] relative transition ${isS?"bg-cyan-500/30 text-cyan-100 border border-cyan-400/50":isT?"bg-white/10 text-white":"text-white/70 hover:bg-white/5"}`}>{d}{de.length>0&&<div className="absolute bottom-0.5 flex gap-0.5">{de.slice(0,3).map((e,i)=><div key={i} className="w-1 h-1 rounded-full" style={{background:e.color}} />)}</div>}</button>);}
  const se = eventsByDate[selected] ?? [];
  return (
    <div className="flex flex-col h-full p-3 gap-2 thin-scroll overflow-y-auto">
      <div className="flex items-center gap-2"><button onClick={()=>setView(new Date(year,month-1,1))} className="p-1 rounded text-white/60 hover:text-white hover:bg-white/5"><ChevronLeft className="w-3.5 h-3.5" /></button><div className="flex-1 text-center text-sm font-medium text-white">{MONTHS[month]} {year}</div><button onClick={()=>setView(new Date(year,month+1,1))} className="p-1 rounded text-white/60 hover:text-white hover:bg-white/5"><ChevronRight className="w-3.5 h-3.5" /></button></div>
      <div className="grid grid-cols-7 gap-1 text-center">{DAYS.map(d=><div key={d} className="text-[10px] uppercase text-white/40 py-1">{d}</div>)}{cells}</div>
      <div className="border-t border-white/8 pt-2 mt-2"><div className="flex items-center justify-between mb-2"><div className="text-[11px] text-white/70">{new Date(selected).toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric"})}</div><button onClick={()=>{const t=prompt("Event title?");if(t)setEvents([...events,{date:selected,title:t,color:["#22d3ee","#34d399","#f472b6","#fbbf24"][Math.floor(Math.random()*4)]}]);}} className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30">+ Event</button></div><div className="space-y-1">{se.length===0?<div className="text-[11px] text-white/40 text-center py-3">No events</div>:se.map((e,i)=><div key={i} className="flex items-center gap-2 bg-black/30 border border-white/5 rounded px-2 py-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{background:e.color}} /><span className="text-[11px] text-white/80">{e.title}</span><button onClick={()=>setEvents(events.filter((_,j)=>j!==events.indexOf(e)))} className="ml-auto text-white/30 hover:text-rose-400 text-[10px]">✕</button></div>)}</div></div>
    </div>
  );
}

// ============ WHITEBOARD ============
interface Stroke { points: {x:number;y:number}[]; color: string; width: number; }
const WB_COLORS = ["#22d3ee","#34d399","#f472b6","#fbbf24","#c084fc","#ffffff"];
export function WhiteboardModule() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [color, setColor] = useState(WB_COLORS[0]);
  const [width, setWidth] = useState(2);
  const drawing = useRef(false);
  function getPos(e:React.MouseEvent){const svg=svgRef.current!;const rect=svg.getBoundingClientRect();return{x:e.clientX-rect.left,y:e.clientY-rect.top};}
  function start(e:React.MouseEvent){e.preventDefault();drawing.current=true;setCurrent({points:[getPos(e)],color,width});}
  function move(e:React.MouseEvent){if(!drawing.current||!current)return;e.preventDefault();setCurrent({...current,points:[...current.points,getPos(e)]});}
  function stop(){if(current && current.points.length>1)setStrokes([...strokes,current]);setCurrent(null);drawing.current=false;}
  function pathFrom(s:Stroke){return s.points.length?s.points.reduce((a,p,i)=>a+(i===0?`M ${p.x} ${p.y}`:` L ${p.x} ${p.y}`),""):"";}
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-black/30 flex-wrap">
        <div className="flex gap-1">{WB_COLORS.map(c=><button key={c} onClick={()=>setColor(c)} className={`w-5 h-5 rounded-full border-2 ${color===c?"border-white":"border-white/20"}`} style={{background:c}} />)}</div>
        <input type="range" min={1} max={10} value={width} onChange={e=>setWidth(Number(e.target.value))} className="w-14 accent-cyan-400" /><span className="text-[10px] text-white/50 font-mono">{width}px</span>
        <div className="flex gap-1 ml-auto"><button onClick={()=>{const svg=svgRef.current;if(svg){const s=new XMLSerializer().serializeToString(svg);const b=new Blob([s],{type:"image/svg+xml"});const u=URL.createObjectURL(b);const l=document.createElement("a");l.download=`wb-${Date.now()}.svg`;l.href=u;l.click();URL.revokeObjectURL(u);}}} className="p-1 rounded text-white/50 hover:text-white hover:bg-white/5"><Download className="w-3 h-3" /></button><button onClick={()=>setStrokes([])} className="p-1 rounded text-white/50 hover:text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-3 h-3" /></button></div>
      </div>
      <div className="flex-1 relative bg-black/20"><svg ref={svgRef} onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} className="absolute inset-0 w-full h-full cursor-crosshair touch-none"><defs><pattern id="wbg" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#wbg)" />{strokes.map((s,i)=><path key={i} d={pathFrom(s)} fill="none" stroke={s.color} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" />)}{current&&<path d={pathFrom(current)} fill="none" stroke={current.color} strokeWidth={current.width} strokeLinecap="round" strokeLinejoin="round" />}</svg></div>
    </div>
  );
}
