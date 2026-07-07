"use client";

import type { ModuleType } from "@/lib/window-store";
import { ChatModule } from "./modules/chat-module";
import { MonitorModule } from "./modules/monitor-module";
import { DashboardModule } from "./modules/dashboard-module";
import { TerminalModule } from "./modules/terminal-module";
import { KanbanModule } from "./modules/kanban-module";
import { NotesModule } from "./modules/notes-module";
import { CodeModule } from "./modules/code-module";
import { WeatherModule } from "./modules/weather-module";
import { ClockModule } from "./modules/clock-module";
import { MusicModule } from "./modules/music-module";
import { CalculatorModule } from "./modules/calculator-module";
import { StockModule } from "./modules/stock-module";
import { CameraModule } from "./modules/camera-module";
import { MetricsModule } from "./modules/metrics-module";

import {
  MessageSquare, Activity, BarChart3, TerminalSquare, KanbanSquare,
  FileText, Code2, CloudSun, Clock, Music4, Calculator, TrendingUp,
  Camera, Gauge,
} from "lucide-react";

export interface ModuleMeta {
  type: ModuleType;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  component: React.ComponentType<{ windowId?: string }>;
}

export const MODULE_REGISTRY: Record<ModuleType, ModuleMeta> = {
  chat: { type: "chat", label: "Chat", description: "Console conversationnelle", icon: MessageSquare, accent: "#22d3ee", component: ChatModule },
  monitor: { type: "monitor", label: "Moniteur", description: "CPU · RAM · Réseau live", icon: Activity, accent: "#22d3ee", component: MonitorModule },
  dashboard: { type: "dashboard", label: "Dashboard", description: "Analytics & KPIs", icon: BarChart3, accent: "#34d399", component: DashboardModule },
  terminal: { type: "terminal", label: "Terminal", description: "Shell interactif", icon: TerminalSquare, accent: "#34d399", component: TerminalModule },
  kanban: { type: "kanban", label: "Kanban", description: "Board de tâches", icon: KanbanSquare, accent: "#f472b6", component: KanbanModule },
  notes: { type: "notes", label: "Notes", description: "Éditeur markdown", icon: FileText, accent: "#fbbf24", component: NotesModule },
  code: { type: "code", label: "Code", description: "Éditeur avec highlight", icon: Code2, accent: "#c084fc", component: CodeModule },
  weather: { type: "weather", label: "Météo", description: "Prévisions multi-villes", icon: CloudSun, accent: "#22d3ee", component: WeatherModule },
  clock: { type: "clock", label: "Horloge", description: "Analogique + monde", icon: Clock, accent: "#34d399", component: ClockModule },
  music: { type: "music", label: "Musique", description: "Lecteur audio mock", icon: Music4, accent: "#f472b6", component: MusicModule },
  calculator: { type: "calculator", label: "Calculatrice", description: "Calculatrice fonctionnelle", icon: Calculator, accent: "#fbbf24", component: CalculatorModule },
  stock: { type: "stock", label: "Stock", description: "Ticker boursier live", icon: TrendingUp, accent: "#34d399", component: StockModule },
  camera: { type: "camera", label: "Caméra", description: "Vision webcam + HUD", icon: Camera, accent: "#22d3ee", component: CameraModule },
  metrics: { type: "metrics", label: "Métriques", description: "Type Grafana temps réel", icon: Gauge, accent: "#fbbf24", component: MetricsModule },
};

export function getModuleMeta(type: ModuleType): ModuleMeta {
  return MODULE_REGISTRY[type] ?? MODULE_REGISTRY.chat;
}
