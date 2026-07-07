"use client";

import type { ModuleType } from "@/lib/window-store";
import dynamic from "next/dynamic";
import {
  MessageSquare, Activity, BarChart3, TerminalSquare, KanbanSquare,
  FileText, Code2, CloudSun, Clock, Music4, Calculator, TrendingUp,
  Camera, Gauge, Timer, Brush, Regex, Braces, Palette, QrCode,
  Wrench, FolderTree, Globe, CalendarDays, PenTool, Sparkles, ImageIcon,
} from "lucide-react";

const loadingFallback = () => (
  <div className="flex items-center justify-center h-full text-cyan-300 text-xs">
    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse mr-2" />
    Loading…
  </div>
);

// Single dynamic import for ALL modules via barrel file
// This reduces Turbopack memory usage by creating one chunk instead of 26
const modulesPromise = import("./modules");

const lazyComponents: Record<string, React.LazyExoticComponent<React.ComponentType<{ windowId?: string; code?: string }>>> = {
  ChatModule: dynamic(() => modulesPromise.then(m => ({ default: m.ChatModule })), { loading: loadingFallback }),
  MonitorModule: dynamic(() => modulesPromise.then(m => ({ default: m.MonitorModule })), { loading: loadingFallback }),
  DashboardModule: dynamic(() => modulesPromise.then(m => ({ default: m.DashboardModule })), { loading: loadingFallback }),
  TerminalModule: dynamic(() => modulesPromise.then(m => ({ default: m.TerminalModule })), { loading: loadingFallback }),
  KanbanModule: dynamic(() => modulesPromise.then(m => ({ default: m.KanbanModule })), { loading: loadingFallback }),
  NotesModule: dynamic(() => modulesPromise.then(m => ({ default: m.NotesModule })), { loading: loadingFallback }),
  CodeModule: dynamic(() => modulesPromise.then(m => ({ default: m.CodeModule })), { loading: loadingFallback }),
  WeatherModule: dynamic(() => modulesPromise.then(m => ({ default: m.WeatherModule })), { loading: loadingFallback }),
  ClockModule: dynamic(() => modulesPromise.then(m => ({ default: m.ClockModule })), { loading: loadingFallback }),
  MusicModule: dynamic(() => modulesPromise.then(m => ({ default: m.MusicModule })), { loading: loadingFallback }),
  CalculatorModule: dynamic(() => modulesPromise.then(m => ({ default: m.CalculatorModule })), { loading: loadingFallback }),
  StockModule: dynamic(() => modulesPromise.then(m => ({ default: m.StockModule })), { loading: loadingFallback }),
  CameraModule: dynamic(() => modulesPromise.then(m => ({ default: m.CameraModule })), { loading: loadingFallback }),
  MetricsModule: dynamic(() => modulesPromise.then(m => ({ default: m.MetricsModule })), { loading: loadingFallback }),
  PomodoroModule: dynamic(() => modulesPromise.then(m => ({ default: m.PomodoroModule })), { loading: loadingFallback }),
  PaintModule: dynamic(() => modulesPromise.then(m => ({ default: m.PaintModule })), { loading: loadingFallback }),
  RegexModule: dynamic(() => modulesPromise.then(m => ({ default: m.RegexModule })), { loading: loadingFallback }),
  JsonModule: dynamic(() => modulesPromise.then(m => ({ default: m.JsonModule })), { loading: loadingFallback }),
  ColorPickerModule: dynamic(() => modulesPromise.then(m => ({ default: m.ColorPickerModule })), { loading: loadingFallback }),
  QrModule: dynamic(() => modulesPromise.then(m => ({ default: m.QrModule })), { loading: loadingFallback }),
  DevtoolsModule: dynamic(() => modulesPromise.then(m => ({ default: m.DevtoolsModule })), { loading: loadingFallback }),
  FilesModule: dynamic(() => modulesPromise.then(m => ({ default: m.FilesModule })), { loading: loadingFallback }),
  BrowserModule: dynamic(() => modulesPromise.then(m => ({ default: m.BrowserModule })), { loading: loadingFallback }),
  CalendarModule: dynamic(() => modulesPromise.then(m => ({ default: m.CalendarModule })), { loading: loadingFallback }),
  WhiteboardModule: dynamic(() => modulesPromise.then(m => ({ default: m.WhiteboardModule })), { loading: loadingFallback }),
  CustomModuleRenderer: dynamic(() => modulesPromise.then(m => ({ default: m.CustomModuleRenderer })), { loading: loadingFallback }),
  ImageGenModule: dynamic(() => modulesPromise.then(m => ({ default: m.ImageGenModule })), { loading: loadingFallback }),
};

export interface ModuleMeta {
  type: ModuleType;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  component: React.ComponentType<{ windowId?: string; code?: string }>;
  custom?: boolean;
}

const MODULE_KEY_MAP: Record<ModuleType, string> = {
  chat: "ChatModule",
  monitor: "MonitorModule",
  dashboard: "DashboardModule",
  terminal: "TerminalModule",
  kanban: "KanbanModule",
  notes: "NotesModule",
  code: "CodeModule",
  weather: "WeatherModule",
  clock: "ClockModule",
  music: "MusicModule",
  calculator: "CalculatorModule",
  stock: "StockModule",
  camera: "CameraModule",
  metrics: "MetricsModule",
  pomodoro: "PomodoroModule",
  paint: "PaintModule",
  regex: "RegexModule",
  json: "JsonModule",
  colorpicker: "ColorPickerModule",
  qr: "QrModule",
  devtools: "DevtoolsModule",
  files: "FilesModule",
  browser: "BrowserModule",
  calendar: "CalendarModule",
  whiteboard: "WhiteboardModule",
  custom: "CustomModuleRenderer",
  imagegen: "ImageGenModule",
};

const INFO_MAP: Record<ModuleType, Omit<ModuleMeta, "component">> = {
  chat: { type: "chat", label: "Chat", description: "Conversational console", icon: MessageSquare, accent: "#22d3ee" },
  monitor: { type: "monitor", label: "Monitor", description: "CPU · RAM · Network live", icon: Activity, accent: "#22d3ee" },
  dashboard: { type: "dashboard", label: "Dashboard", description: "Analytics & KPIs", icon: BarChart3, accent: "#34d399" },
  terminal: { type: "terminal", label: "Terminal", description: "Interactive shell", icon: TerminalSquare, accent: "#34d399" },
  kanban: { type: "kanban", label: "Kanban", description: "Task board", icon: KanbanSquare, accent: "#f472b6" },
  notes: { type: "notes", label: "Notes", description: "Markdown editor", icon: FileText, accent: "#fbbf24" },
  code: { type: "code", label: "Code", description: "Editor with highlight", icon: Code2, accent: "#c084fc" },
  weather: { type: "weather", label: "Weather", description: "Multi-city forecast", icon: CloudSun, accent: "#22d3ee" },
  clock: { type: "clock", label: "Clock", description: "Analog + world", icon: Clock, accent: "#34d399" },
  music: { type: "music", label: "Music", description: "Audio player mock", icon: Music4, accent: "#f472b6" },
  calculator: { type: "calculator", label: "Calculator", description: "Functional calculator", icon: Calculator, accent: "#fbbf24" },
  stock: { type: "stock", label: "Stock", description: "Live ticker (mock)", icon: TrendingUp, accent: "#34d399" },
  camera: { type: "camera", label: "Camera", description: "Webcam + HUD", icon: Camera, accent: "#22d3ee" },
  metrics: { type: "metrics", label: "Metrics", description: "Real-time Grafana-style", icon: Gauge, accent: "#fbbf24" },
  pomodoro: { type: "pomodoro", label: "Pomodoro", description: "Focus timer", icon: Timer, accent: "#22d3ee" },
  paint: { type: "paint", label: "Paint", description: "Drawing canvas", icon: Brush, accent: "#f472b6" },
  regex: { type: "regex", label: "Regex", description: "Pattern tester", icon: Regex, accent: "#c084fc" },
  json: { type: "json", label: "JSON", description: "Formatter & minifier", icon: Braces, accent: "#34d399" },
  colorpicker: { type: "colorpicker", label: "Color Picker", description: "HEX/RGB/HSL + harmonies", icon: Palette, accent: "#f472b6" },
  qr: { type: "qr", label: "QR Code", description: "Generator (visual)", icon: QrCode, accent: "#22d3ee" },
  devtools: { type: "devtools", label: "Dev Tools", description: "Base64 · Hash · UUID · Hex", icon: Wrench, accent: "#fbbf24" },
  files: { type: "files", label: "Files", description: "Virtual file explorer", icon: FolderTree, accent: "#34d399" },
  browser: { type: "browser", label: "Browser", description: "Web viewer (iframe)", icon: Globe, accent: "#22d3ee" },
  calendar: { type: "calendar", label: "Calendar", description: "Month view + events", icon: CalendarDays, accent: "#f472b6" },
  whiteboard: { type: "whiteboard", label: "Whiteboard", description: "Freehand drawing SVG", icon: PenTool, accent: "#c084fc" },
  custom: { type: "custom", label: "Custom AI", description: "AI-generated module", icon: Sparkles, accent: "#22d3ee", custom: true },
  imagegen: { type: "imagegen", label: "Image Gen", description: "AI image generation", icon: ImageIcon, accent: "#f472b6" },
};

export function getModuleMeta(type: ModuleType): ModuleMeta {
  const info = INFO_MAP[type] ?? INFO_MAP.chat;
  const key = MODULE_KEY_MAP[type] ?? "ChatModule";
  return {
    ...info,
    component: lazyComponents[key] ?? lazyComponents.ChatModule,
  };
}

export function getModuleInfo(type: ModuleType): Omit<ModuleMeta, "component"> {
  return INFO_MAP[type] ?? INFO_MAP.chat;
}

export const MODULE_LIST: Omit<ModuleMeta, "component">[] = Object.values(INFO_MAP);

export const MODULE_REGISTRY: Record<ModuleType, ModuleMeta> = Object.fromEntries(
  Object.entries(INFO_MAP).map(([type, info]) => [type, getModuleMeta(type as ModuleType)])
) as Record<ModuleType, ModuleMeta>;
