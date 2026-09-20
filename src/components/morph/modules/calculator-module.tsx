"use client";

import { useEffect, useRef, useState } from "react";
import { History, Trash2 } from "lucide-react";
import { useModulePersist } from "@/lib/module-state-store";

interface BtnProps {
  label: string;
  onClick: () => void;
  variant?: "op" | "fn" | "eq";
}

function Btn({ label, onClick, variant }: BtnProps) {
  const cls =
    variant === "op"
      ? "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-400/20"
      : variant === "fn"
      ? "bg-white/8 text-white/70 hover:bg-white/15"
      : variant === "eq"
      ? "bg-gradient-to-br from-cyan-400 to-emerald-400 text-black font-bold hover:brightness-110"
      : "bg-black/30 text-white hover:bg-black/50 border border-white/5";
  return (
    <button onClick={onClick} className={`rounded-lg text-base font-medium transition active:scale-95 ${cls}`}>
      {label}
    </button>
  );
}

interface CalcState {
  display: string;
  prev: number | null;
  op: string | null;
  overwrite: boolean;
}

const FRESH: CalcState = { display: "0", prev: null, op: null, overwrite: true };

export function CalculatorModule() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    rootRef.current?.focus();
  }, []);
  const [st, setSt] = useModulePersist<CalcState>("calc:state", FRESH);
  const [history, setHistory] = useModulePersist<string[]>("calc:history", []);
  const [showHist, setShowHist] = useState(false);
  const { display, prev, op, overwrite } = st;

  function inputDigit(d: string) {
    if (overwrite) {
      setSt({ ...st, display: d, overwrite: false });
    } else {
      setSt({ ...st, display: display === "0" ? d : display + d });
    }
  }

  function inputDot() {
    if (overwrite) {
      setSt({ ...st, display: "0.", overwrite: false });
    } else if (!display.includes(".")) {
      setSt({ ...st, display: display + "." });
    }
  }

  function clearAll() {
    setSt(FRESH);
  }

  function toggleSign() {
    setSt({ ...st, display: display.startsWith("-") ? display.slice(1) : display === "0" ? display : "-" + display });
  }

  function percent() {
    setSt({ ...st, display: String(parseFloat(display) / 100) });
  }

  function compute(a: number, b: number, op: string): number {
    switch (op) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function chooseOp(nextOp: string) {
    const cur = parseFloat(display);
    if (prev === null) {
      setSt({ ...st, prev: cur, op: nextOp, overwrite: true });
    } else if (op && !overwrite) {
      const r = compute(prev, cur, op);
      setSt({ ...st, prev: r, display: String(r), op: nextOp, overwrite: true });
    } else {
      setSt({ ...st, op: nextOp, overwrite: true });
    }
  }

  function equals() {
    if (op === null || prev === null) return;
    const cur = parseFloat(display);
    const r = compute(prev, cur, op);
    if (!Number.isNaN(r)) {
      setHistory((h) => [`${prev} ${op} ${cur} = ${r}`, ...h].slice(0, 20));
    }
    setSt({ display: Number.isNaN(r) ? "Error" : String(r), prev: null, op: null, overwrite: true });
  }

  function reuse(entry: string) {
    const parts = entry.split(" = ");
    const result = parts[parts.length - 1];
    if (result !== undefined) {
      setSt({ display: result, prev: null, op: null, overwrite: true });
      setShowHist(false);
      rootRef.current?.focus();
    }
  }

  function onKey(e: React.KeyboardEvent) {
    const k = e.key;
    if (/^[0-9]$/.test(k)) inputDigit(k);
    else if (k === "." || k === ",") inputDot();
    else if (k === "+") chooseOp("+");
    else if (k === "-") chooseOp("−");
    else if (k === "*") chooseOp("×");
    else if (k === "/") { e.preventDefault(); chooseOp("÷"); }
    else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); }
    else if (k === "Escape" || k.toLowerCase() === "c") clearAll();
    else if (k === "%") percent();
    else if (k === "Backspace") setSt({ ...st, display: display.length <= 1 ? "0" : display.slice(0, -1) });
    else return;
  }

  return (
    <div ref={rootRef} tabIndex={0} onKeyDown={onKey} onClick={(e) => e.currentTarget.focus()} className="flex flex-col h-full p-3 gap-2 outline-none">
      <div className="bg-black/30 rounded-lg p-3 flex flex-col items-end justify-end border border-white/8 shrink-0">
        <div className="h-4 w-full flex items-center justify-between">
          <span className="text-[10px] text-white/40 font-mono">
            {prev !== null && op ? `${prev} ${op}` : ""}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setShowHist((v) => !v); }}
            title="History"
            className={`p-0.5 rounded ${showHist ? "text-cyan-300 bg-cyan-500/15" : "text-white/35 hover:text-white/70"}`}
          >
            <History className="w-3 h-3" />
          </button>
        </div>
        <div className="text-3xl font-mono text-white truncate w-full text-right tabular-nums" title={display}>
          {display}
        </div>
      </div>
      {showHist && (
        <div className="shrink-0 max-h-28 overflow-y-auto thin-scroll bg-black/30 border border-white/8 rounded-lg p-1.5 space-y-0.5">
          {history.length === 0 ? (
            <div className="text-[10px] text-white/35 text-center py-2">No history yet</div>
          ) : (
            history.map((h, i) => (
              <button
                key={`${h}-${i}`}
                onClick={() => reuse(h)}
                title="Reuse result"
                className="w-full text-right text-[11px] font-mono text-white/60 hover:text-cyan-300 hover:bg-white/5 rounded px-2 py-0.5 truncate"
              >
                {h}
              </button>
            ))
          )}
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="w-full flex items-center justify-center gap-1 text-[9px] text-white/30 hover:text-rose-400 py-1"
            >
              <Trash2 className="w-2.5 h-2.5" /> Clear
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-4 gap-1.5 flex-1 min-h-0">
        <Btn label="AC" onClick={clearAll} variant="fn" />
        <Btn label="±" onClick={toggleSign} variant="fn" />
        <Btn label="%" onClick={percent} variant="fn" />
        <Btn label="÷" onClick={() => chooseOp("÷")} variant="op" />
        <Btn label="7" onClick={() => inputDigit("7")} />
        <Btn label="8" onClick={() => inputDigit("8")} />
        <Btn label="9" onClick={() => inputDigit("9")} />
        <Btn label="×" onClick={() => chooseOp("×")} variant="op" />
        <Btn label="4" onClick={() => inputDigit("4")} />
        <Btn label="5" onClick={() => inputDigit("5")} />
        <Btn label="6" onClick={() => inputDigit("6")} />
        <Btn label="−" onClick={() => chooseOp("−")} variant="op" />
        <Btn label="1" onClick={() => inputDigit("1")} />
        <Btn label="2" onClick={() => inputDigit("2")} />
        <Btn label="3" onClick={() => inputDigit("3")} />
        <Btn label="+" onClick={() => chooseOp("+")} variant="op" />
        <Btn label="0" onClick={() => inputDigit("0")} />
        <Btn label="." onClick={inputDot} />
        <Btn label="=" onClick={equals} variant="eq" />
        <div />
      </div>
    </div>
  );
}
