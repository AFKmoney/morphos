"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Minus, Square, Copy as Restore } from "lucide-react";
import { useWindowStore, type MorphWindow } from "@/lib/window-store";
import { getModuleMeta } from "./module-registry";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/use-t";
import { ModuleErrorBoundary } from "./error-boundary";

interface WindowProps {
  win: MorphWindow;
}

type DragMode = "move" | "e" | "w" | "s" | "n" | "se" | "sw" | "ne" | "nw";

interface DragState {
  mode: DragMode;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
}

const MIN_W = 280;
const MIN_H = 200;
const TOP_BAR_HEIGHT = 48;
const MARGIN = 4;

export function MorphWindowView({ win }: WindowProps) {
  const t = useT();
  const meta = getModuleMeta(win.type);
  const Icon = meta.icon;

  const focusWindow = useWindowStore((s) => s.focusWindow);
  const updateGeometry = useWindowStore((s) => s.updateGeometry);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const activeId = useWindowStore((s) => s.activeId);

  const dragState = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rafRef = useRef<number | null>(null);
  const winIdRef = useRef(win.id);
  useEffect(() => { winIdRef.current = win.id; }, [win.id]);
  const handlersRef = useRef<{ onMove: (e: MouseEvent) => void; onUp: () => void }>({
    onMove: () => {},
    onUp: () => {},
  });

  const isActive = activeId === win.id;

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const st = dragState.current;
      if (!st) return;
      e.preventDefault();
      const dx = e.clientX - st.startX;
      const dy = e.clientY - st.startY;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (st.mode === "move") {
          const nx = Math.max(MARGIN, Math.min(window.innerWidth - st.origW - MARGIN, st.origX + dx));
          const ny = Math.max(TOP_BAR_HEIGHT, Math.min(window.innerHeight - st.origH - MARGIN, st.origY + dy));
          updateGeometry(winIdRef.current, { x: nx, y: ny });
        } else {
          let nx = st.origX, ny = st.origY, nw = st.origW, nh = st.origH;
          const vw = window.innerWidth;
          const vh = window.innerHeight;

          if (st.mode.includes("e")) {
            nw = Math.max(MIN_W, Math.min(vw - nx - MARGIN, st.origW + dx));
          }
          if (st.mode.includes("w")) {
            nw = Math.max(MIN_W, st.origW - dx);
            nx = st.origX + (st.origW - nw);
            if (nx < MARGIN) {
              nw -= (MARGIN - nx);
              nx = MARGIN;
            }
          }
          if (st.mode.includes("s")) {
            nh = Math.max(MIN_H, Math.min(vh - ny - MARGIN, st.origH + dy));
          }
          if (st.mode.includes("n")) {
            nh = Math.max(MIN_H, st.origH - dy);
            ny = st.origY + (st.origH - nh);
            if (ny < TOP_BAR_HEIGHT) {
              nh -= (TOP_BAR_HEIGHT - ny);
              ny = TOP_BAR_HEIGHT;
            }
          }
          updateGeometry(winIdRef.current, { x: nx, y: ny, width: nw, height: nh });
        }
      });
    }

    function onUp() {
      dragState.current = null;
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    handlersRef.current = { onMove, onUp };
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [updateGeometry]);

  function startDrag(e: React.MouseEvent, mode: DragMode) {
    if (win.maximized && mode === "move") return;
    e.preventDefault();
    e.stopPropagation();
    focusWindow(win.id);
    dragState.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
      origW: win.width,
      origH: win.height,
    };
    setIsDragging(true);
    document.body.style.cursor = mode === "move" ? "grabbing" : "";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handlersRef.current.onMove);
    window.addEventListener("mouseup", handlersRef.current.onUp);
  }

  if (win.minimized) return null;

  const Component = meta.component;

  return (
    <motion.div
      data-window-id={win.id}
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 30 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn(
        "absolute glass-panel rounded-xl overflow-hidden flex flex-col",
        isActive ? "ring-1 ring-cyan-400/30" : "",
        isDragging ? "" : "transition-shadow"
      )}
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.z,
        boxShadow: isActive
          ? `0 0 0 1px ${meta.accent}30, 0 20px 60px -10px rgba(0,0,0,0.7), 0 0 80px -20px ${meta.accent}40`
          : "0 10px 40px -10px rgba(0,0,0,0.6)",
      }}
      onMouseDown={() => focusWindow(win.id)}
    >
      <div
        className="flex items-center gap-2 px-3 h-9 border-b border-white/8 bg-black/30 cursor-grab active:cursor-grabbing shrink-0"
        onMouseDown={(e) => startDrag(e, "move")}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div
            className="w-5 h-5 rounded flex items-center justify-center shrink-0"
            style={{ background: `${meta.accent}20`, border: `1px solid ${meta.accent}40` }}
          >
            <Icon className="w-3 h-3" style={{ color: meta.accent }} />
          </div>
          <div className="text-xs font-medium text-white/90 truncate">{win.title}</div>
          {win.subtitle && (
            <div className="text-[10px] text-white/40 truncate hidden sm:block">· {win.subtitle}</div>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => minimizeWindow(win.id)}
            className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/90 hover:bg-white/5"
            title={t("window.minimize")}
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={() => toggleMaximize(win.id)}
            className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/90 hover:bg-white/5"
            title={win.maximized ? t("window.restore") : t("window.maximize")}
          >
            {win.maximized ? <Restore className="w-3 h-3" /> : <Square className="w-2.5 h-2.5" />}
          </button>
          <button
            onClick={() => closeWindow(win.id)}
            className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
            title={t("window.close")}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <ModuleErrorBoundary fallbackTitle={`${win.title} crashed`}>
          <Component windowId={win.id} code={win.code} />
        </ModuleErrorBoundary>
      </div>

      {!win.maximized && (
        <>
          <div className="resize-handle resize-handle-e" onMouseDown={(e) => startDrag(e, "e")} />
          <div className="resize-handle resize-handle-w" onMouseDown={(e) => startDrag(e, "w")} />
          <div className="resize-handle resize-handle-s" onMouseDown={(e) => startDrag(e, "s")} />
          <div
            className="absolute top-0 left-0 h-1.5 w-full"
            style={{ cursor: "ns-resize" }}
            onMouseDown={(e) => startDrag(e, "n")}
          />
          <div className="resize-handle resize-handle-se" onMouseDown={(e) => startDrag(e, "se")} />
          <div className="resize-handle resize-handle-sw" onMouseDown={(e) => startDrag(e, "sw")} />
          <div
            className="absolute top-0 left-0 w-3 h-3"
            style={{ cursor: "nwse-resize" }}
            onMouseDown={(e) => startDrag(e, "nw")}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3"
            style={{ cursor: "nesw-resize" }}
            onMouseDown={(e) => startDrag(e, "ne")}
          />
        </>
      )}
    </motion.div>
  );
}
