"use client";

import { useEffect, useRef, useState } from "react";

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

export function CalculatorModule() {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    rootRef.current?.focus();
  }, []);
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(true);

  function inputDigit(d: string) {
    if (overwrite) {
      setDisplay(d);
      setOverwrite(false);
    } else {
      setDisplay(display === "0" ? d : display + d);
    }
  }

  function inputDot() {
    if (overwrite) {
      setDisplay("0.");
      setOverwrite(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }

  function clearAll() {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setOverwrite(true);
  }

  function toggleSign() {
    setDisplay((d) => (d.startsWith("-") ? d.slice(1) : d === "0" ? d : "-" + d));
  }

  function percent() {
    setDisplay((d) => String(parseFloat(d) / 100));
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
      setPrev(cur);
    } else if (op && !overwrite) {
      const r = compute(prev, cur, op);
      setPrev(r);
      setDisplay(String(r));
    }
    setOp(nextOp);
    setOverwrite(true);
  }

  function equals() {
    if (op === null || prev === null) return;
    const cur = parseFloat(display);
    const r = compute(prev, cur, op);
    setDisplay(Number.isNaN(r) ? "Error" : String(r));
    setPrev(null);
    setOp(null);
    setOverwrite(true);
  }

  function onKey(e: React.KeyboardEvent) {
    const k = e.key;
    if (/^[0-9]$/.test(k)) inputDigit(k);
    else if (k === "." || k === ",") inputDot();
    else if (k === "+") chooseOp("+");
    else if (k === "-") chooseOp("\u2212");
    else if (k === "*") chooseOp("\u00d7");
    else if (k === "/") { e.preventDefault(); chooseOp("\u00f7"); }
    else if (k === "Enter" || k === "=") { e.preventDefault(); equals(); }
    else if (k === "Escape" || k.toLowerCase() === "c") clearAll();
    else if (k === "%") percent();
    else if (k === "Backspace") setDisplay((d) => (d.length <= 1 ? "0" : d.slice(0, -1)));
    else return;
  }

  return (
    <div ref={rootRef} tabIndex={0} onKeyDown={onKey} onClick={(e) => e.currentTarget.focus()} className="flex flex-col h-full p-3 gap-2 outline-none">
      <div className="flex-1 bg-black/30 rounded-lg p-3 flex flex-col items-end justify-end border border-white/8">
        <div className="text-[10px] text-white/40 h-4 font-mono">
          {prev !== null && op ? `${prev} ${op}` : ""}
        </div>
        <div className="text-3xl font-mono text-white truncate w-full text-right">
          {display}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 flex-1">
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
