"use client";

import React, { useState, useEffect } from "react";

interface CustomModuleProps {
  code?: string;
}

let babelLoadPromise: Promise<any> | null = null;

function loadBabelFromCDN(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as any;
  if (w.Babel) return Promise.resolve(w.Babel);
  if (babelLoadPromise) return babelLoadPromise;
  babelLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js";
    script.async = true;
    script.onload = () => {
      const bw = window as any;
      if (bw.Babel) resolve(bw.Babel);
      else reject(new Error("Babel failed to load"));
    };
    script.onerror = () => reject(new Error("Failed to load Babel from CDN"));
    document.head.appendChild(script);
  });
  return babelLoadPromise;
}

export async function transformCodeAsync(code: string): Promise<{ js: string; error: string | null }> {
  try {
    const Babel = await loadBabelFromCDN();
    const result = Babel.transform(code, {
      presets: ["typescript", "react"],
      filename: "custom.tsx",
      compact: false,
    });
    return { js: result.code || "", error: null };
  } catch (e) {
    return { js: "", error: e instanceof Error ? e.message : String(e) };
  }
}

function evalComponent(js: string): { Comp: React.ComponentType | null; error: string | null } {
  try {
    const factory = new Function(
      "React", "useState", "useEffect", "useRef", "useMemo", "useCallback", "useReducer",
      `"use strict";
      try {
        ${js}
        if (typeof CustomModule !== 'function') throw new Error('No CustomModule function defined');
        return CustomModule;
      } catch (e) {
        return { __error: e instanceof Error ? e.message : String(e) };
      }`
    );
    const result = factory(React, useState, useEffect, React.useRef, React.useMemo, React.useCallback, React.useReducer);
    if (result && typeof result === "object" && "__error" in result) {
      return { Comp: null, error: result.__error as string };
    }
    return { Comp: result as unknown as React.ComponentType, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[CustomModule] compile error:", msg);
    return { Comp: null, error: msg };
  }
}

export function CustomModuleRenderer({ code }: CustomModuleProps) {
  const [state, setState] = useState<{ Comp: React.ComponentType | null; error: string | null; loading: boolean }>({
    Comp: null, error: null, loading: !!code,
  });

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    transformCodeAsync(code).then(({ js, error }) => {
      if (cancelled) return;
      if (error) { setState({ Comp: null, error: `Transform: ${error}`, loading: false }); return; }
      const result = evalComponent(js);
      setState({ ...result, loading: false });
    });
    return () => { cancelled = true; };
  }, [code]);

  if (!code) return <div className="p-6 text-center text-white/40 text-sm">No custom code provided.</div>;

  if (state.loading) {
    return (
      <div className="p-6 text-center text-cyan-300 text-sm flex items-center justify-center gap-2">
        <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
        Compiling generated module…
      </div>
    );
  }

  if (!state.Comp) {
    return (
      <div className="p-6 text-center text-rose-300 text-sm">
        <div className="mb-2">⚠️ Compile error</div>
        <pre className="text-[10px] text-white/40 font-mono text-left mt-3 overflow-auto max-h-40 thin-scroll">
          {state.error || "Unknown error"}
        </pre>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <state.Comp />
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: string }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error: error.message }; }
  componentDidCatch(error: Error) { console.error("[CustomModule] runtime error:", error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-rose-300 text-sm">
          <div className="mb-2">⚠️ Runtime error in generated module</div>
          <pre className="text-[10px] text-white/40 font-mono text-left mt-3 overflow-auto max-h-40 thin-scroll">
            {this.state.error}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
