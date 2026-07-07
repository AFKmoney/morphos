"use client";

import type { ModuleType } from "@/lib/window-store";
import dynamic from "next/dynamic";
import {
  MessageSquare, Activity, BarChart3, TerminalSquare, KanbanSquare,
  FileText, Code2, CloudSun, Clock, Music4, Calculator, TrendingUp,
  Camera, Gauge, Sparkles,
} from "lucide-react";

const loadingFallback = () => (
  <div className="flex items-center justify-center h-full text-cyan-300 text-xs">
    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse mr-2" />
    Loading…
  </div>
);

// Core 14 modules + custom AI module = 15 total
const ChatModule = dynamic(() => import("./modules/chat-module").then(m => ({ default: m.ChatModule })), { loading: loadingFallback });
const MonitorModule = dynamic(() => import("./modules/monitor-module").then(m => ({ default: m.MonitorModule })), { loading: loadingFallback });
const DashboardModule = dynamic(() => import("./modules/dashboard-module").then(m => ({ default: m.DashboardModule })), { loading: loadingFallback });
const TerminalModule = dynamic(() => import("./modules/terminal-module").then(m => ({ default: m.TerminalModule })), { loading: loadingFallback });
const KanbanModule = dynamic(() => import("./modules/kanban-module").then(m => ({ default: m.KanbanModule })), { loading: loadingFallback });
const NotesModule = dynamic(() => import("./modules/notes-module").then(m => ({ default: m.NotesModule })), { loading: loadingFallback });
const CodeModule = dynamic(() => import("./modules/code-module").then(m => ({ default: m.CodeModule })), { loading: loadingFallback });
const WeatherModule = dynamic(() => import("./modules/weather-module").then(m => ({ default: m.WeatherModule })), { loading: loadingFallback });
const ClockModule = dynamic(() => import("./modules/clock-module").then(m => ({ default: m.ClockModule })), { loading: loadingFallback });
const MusicModule = dynamic(() => import("./modules/music-module").then(m => ({ default: m.MusicModule })), { loading: loadingFallback });
const CalculatorModule = dynamic(() => import("./modules/calculator-module").then(m => ({ default: m.CalculatorModule })), { loading: loadingFallback });
const StockModule = dynamic(() => import("./modules/stock-module").then(m => ({ default: m.StockModule })), { loading: loadingFallback });
const CameraModule = dynamic(() => import("./modules/camera-module").then(m => ({ default: m.CameraModule })), { loading: loadingFallback });
const MetricsModule = dynamic(() => import("./modules/metrics-module").then(m => ({ default: m.MetricsModule })), { loading: loadingFallback });

// Custom AI module — uses Babel from CDN to compile AI-generated React code at runtime
const CustomModuleRenderer = dynamic(() => import("./modules/custom-renderer").then(m => ({ default: m.CustomModuleRenderer })), { loading: loadingFallback });

export interface ModuleMeta {
  type: ModuleType;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  component: React.ComponentType<{ windowId?: string; code?: string }>;
  custom?: boolean;
}

const COMPONENT_MAP: Partial<Record<ModuleType, React.ComponentType<{ windowId?: string; code?: string }>>> = {
  chat: ChatModule,
  monitor: MonitorModule,
  dashboard: DashboardModule,
  terminal: TerminalModule,
  kanban: KanbanModule,
  notes: NotesModule,
  code: CodeModule,
  weather: WeatherModule,
  clock: ClockModule,
  music: MusicModule,
  calculator: CalculatorModule,
  stock: StockModule,
  camera: CameraModule,
  metrics: MetricsModule,
  custom: CustomModuleRenderer,
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
  // These types are redirected to "custom" at the API level (AI generates them on the fly)
  pomodoro: { type: "pomodoro", label: "Pomodoro", description: "Focus timer (AI-generated)", icon: Sparkles, accent: "#22d3ee" },
  paint: { type: "paint", label: "Paint", description: "Drawing canvas (AI-generated)", icon: Sparkles, accent: "#f472b6" },
  regex: { type: "regex", label: "Regex", description: "Pattern tester (AI-generated)", icon: Sparkles, accent: "#c084fc" },
  json: { type: "json", label: "JSON", description: "Formatter (AI-generated)", icon: Sparkles, accent: "#34d399" },
  colorpicker: { type: "colorpicker", label: "Color Picker", description: "HEX/RGB/HSL (AI-generated)", icon: Sparkles, accent: "#f472b6" },
  qr: { type: "qr", label: "QR Code", description: "Generator (AI-generated)", icon: Sparkles, accent: "#22d3ee" },
  devtools: { type: "devtools", label: "Dev Tools", description: "Base64 · Hash · UUID (AI-generated)", icon: Sparkles, accent: "#fbbf24" },
  files: { type: "files", label: "Files", description: "File explorer (AI-generated)", icon: Sparkles, accent: "#34d399" },
  browser: { type: "browser", label: "Browser", description: "Web viewer (AI-generated)", icon: Sparkles, accent: "#22d3ee" },
  calendar: { type: "calendar", label: "Calendar", description: "Month view (AI-generated)", icon: Sparkles, accent: "#f472b6" },
  whiteboard: { type: "whiteboard", label: "Whiteboard", description: "Drawing SVG (AI-generated)", icon: Sparkles, accent: "#c084fc" },
  custom: { type: "custom", label: "Custom AI", description: "AI-generated module", icon: Sparkles, accent: "#22d3ee", custom: true },
};

export function getModuleMeta(type: ModuleType): ModuleMeta {
  const info = INFO_MAP[type] ?? INFO_MAP.chat;
  return {
    ...info,
    component: COMPONENT_MAP[type] ?? COMPONENT_MAP.chat!,
  };
}

export function getModuleInfo(type: ModuleType): Omit<ModuleMeta, "component"> {
  return INFO_MAP[type] ?? INFO_MAP.chat;
}

export const MODULE_LIST: Omit<ModuleMeta, "component">[] = Object.values(INFO_MAP);

export const MODULE_REGISTRY: Record<ModuleType, ModuleMeta> = Object.fromEntries(
  Object.entries(INFO_MAP).map(([type, info]) => [
    type,
    { ...info, component: COMPONENT_MAP[type as ModuleType] ?? COMPONENT_MAP.chat! },
  ])
) as Record<ModuleType, ModuleMeta>;
