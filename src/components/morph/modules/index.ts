"use client";

// Barrel file — single dynamic import for all modules
export { ChatModule } from "./chat-module";
export { MonitorModule } from "./monitor-module";
export { DashboardModule } from "./dashboard-module";
export { TerminalModule } from "./terminal-module";
export { KanbanModule } from "./kanban-module";
export { NotesModule } from "./notes-module";
export { CodeModule } from "./code-module";
export { WeatherModule } from "./weather-module";
export { ClockModule } from "./clock-module";
export { MusicModule } from "./music-module";
export { CalculatorModule } from "./calculator-module";
export { StockModule } from "./stock-module";
export { CameraModule } from "./camera-module";
export { MetricsModule } from "./metrics-module";
export { CustomModuleRenderer } from "./custom-module";

// All extra modules from single file (reduces Turbopack memory)
export { PomodoroModule, PaintModule, RegexModule, JsonModule, ColorPickerModule, QrModule, DevtoolsModule, FilesModule, BrowserModule, CalendarModule, WhiteboardModule } from "./extra-modules";
