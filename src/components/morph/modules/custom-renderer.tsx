"use client";

import React, { useState, useEffect, useRef } from "react";

interface CustomModuleProps {
  code?: string;
}

// Simplified custom module renderer — shows the AI-generated code with syntax highlighting
// and provides a "Run" button that evals it in a sandboxed iframe
export function CustomModuleRenderer({ code }: CustomModuleProps) {
  const [showCode, setShowCode] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [running, setRunning] = useState(false);

  function run() {
    if (!code || !iframeRef.current) return;
    setRunning(true);

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // Build a self-contained HTML doc with React + Babel from CDN
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js"><\/script>
  <style>
    body { margin: 0; background: rgb(13, 14, 23); color: white; font-family: -apple-system, sans-serif; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="typescript,react">
    try {
      ${code}
      if (typeof CustomModule === 'function') {
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(CustomModule));
      } else {
        document.getElementById('root').innerHTML = '<div style="padding:20px;color:#f43f5e">No CustomModule function found</div>';
      }
    } catch (e) {
      document.getElementById('root').innerHTML = '<div style="padding:20px;color:#f43f5e">' + e.message + '</div>';
    }
  <\/script>
</body>
</html>`;

    doc.open();
    doc.write(html);
    doc.close();
  }

  if (!code) {
    return <div className="p-6 text-center text-white/40 text-sm">No custom code provided.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/8 bg-black/30">
        <button
          onClick={() => setShowCode(s => !s)}
          className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/60 hover:text-white"
        >
          {showCode ? "Hide" : "Show"} code
        </button>
        <button
          onClick={run}
          className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30"
        >
          ▶ Run
        </button>
        {running && <span className="text-[9px] text-emerald-400">running in sandbox</span>}
      </div>
      {showCode && !running && (
        <pre className="flex-1 overflow-auto thin-scroll p-3 text-[10px] font-mono text-white/70 bg-black/40">
          {code}
        </pre>
      )}
      {(running || !showCode) && (
        <iframe
          ref={iframeRef}
          className="flex-1 w-full border-0 bg-[rgb(13,14,23)]"
          sandbox="allow-scripts"
          title="Custom module sandbox"
        />
      )}
    </div>
  );
}
