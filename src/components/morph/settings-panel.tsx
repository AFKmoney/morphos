"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Key, Globe, Palette, Info, Check, AlertCircle, Loader2,
  ExternalLink, Server, Cpu, Sparkles, RotateCcw, Zap, Shield, Copy, Eye, EyeOff,
} from "lucide-react";
import { useSettings, ACCENT_COLORS, type AccentTheme } from "@/lib/settings-store";
import { PROVIDER_LIST, PROVIDERS, type ProviderId } from "@/lib/providers";
import { useT } from "@/lib/use-t";
import { cn, fetchJson } from "@/lib/utils";

type Tab = "provider" | "appearance" | "about";

export function SettingsPanel() {
  const open = useSettings((s) => s.settingsOpen);
  const close = useSettings((s) => s.closeSettings);
  const t = useT();
  const [tab, setTab] = useState<Tab>("provider");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-md"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] glass-panel-strong rounded-2xl overflow-hidden w-[760px] max-w-[94vw] h-[640px] max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-black/40">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/30 to-emerald-400/20 border border-cyan-400/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-white">{t("settings.title")}</div>
                <div className="text-[11px] text-white/50">{t("settings.subtitle")}</div>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-md text-white/40 hover:text-white hover:bg-white/5 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 py-3 border-b border-white/5">
              <TabBtn active={tab === "provider"} onClick={() => setTab("provider")} icon={Cpu} label={t("settings.tab.provider")} />
              <TabBtn active={tab === "appearance"} onClick={() => setTab("appearance")} icon={Palette} label={t("settings.tab.appearance")} />
              <TabBtn active={tab === "about"} onClick={() => setTab("about")} icon={Info} label={t("settings.tab.about")} />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto thin-scroll p-5">
              {tab === "provider" && <ProviderTab />}
              {tab === "appearance" && <AppearanceTab />}
              {tab === "about" && <AboutTab />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition",
        active
          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
          : "text-white/60 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}

function ProviderTab() {
  const t = useT();
  const providerId = useSettings((s) => s.providerId);
  const apiKeys = useSettings((s) => s.apiKeys);
  const baseUrls = useSettings((s) => s.baseUrls);
  const models = useSettings((s) => s.models);
  const testedAt = useSettings((s) => s.testedAt);
  const setProvider = useSettings((s) => s.setProvider);
  const setApiKey = useSettings((s) => s.setApiKey);
  const setBaseUrl = useSettings((s) => s.setBaseUrl);
  const setModel = useSettings((s) => s.setModel);
  const setTested = useSettings((s) => s.setTested);

  const cfg = PROVIDERS[providerId];
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [availModels, setAvailModels] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const customRef = useRef<HTMLInputElement>(null);

  const currentKey = apiKeys[providerId] ?? "";
  const currentBaseUrl = baseUrls[providerId] ?? cfg.baseUrl;
  const currentModel = models[providerId] ?? cfg.defaultModel;

  function changeProvider(id: ProviderId) {
    setProvider(id);
    setTestStatus("idle");
    setTestMsg("");
    setCustomModel("");
    setAvailModels([]);
    setLatencyMs(null);
    setCopied(false);
  }

  async function test(modelOverride?: string) {
    setTestStatus("testing");
    setTestMsg("");
    setLatencyMs(null);
    const t0 = performance.now();
    try {
      const data = await fetchJson("/api/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          apiKey: currentKey,
          baseUrl: currentBaseUrl,
          model: modelOverride ?? (customModel || currentModel),
        }),
      });
      setLatencyMs(Math.round(performance.now() - t0));
      if (Array.isArray(data.models)) setAvailModels(data.models);
      if (data.ok) {
        setTestStatus("ok");
        setTested(providerId);
        const n = Array.isArray(data.models) ? data.models.length : 0;
        setTestMsg((data.reply || "OK") + (n ? ` · ${n} models on endpoint` : ""));
      } else {
        setTestStatus("fail");
        setTestMsg(data.error || "Failed");
      }
    } catch (e) {
      setLatencyMs(Math.round(performance.now() - t0));
      setTestStatus("fail");
      setTestMsg(e instanceof Error ? e.message : String(e));
    }
  }

  async function copyError() {
    try {
      await navigator.clipboard.writeText(testMsg);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="space-y-5">
      {/* Provider grid */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5">
          <Server className="w-3 h-3" />
          {t("settings.provider")}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROVIDER_LIST.map((p) => {
            const selected = p.id === providerId;
            const hasKey = !!apiKeys[p.id];
            return (
              <button
                key={p.id}
                onClick={() => changeProvider(p.id)}
                className={cn(
                  "text-left p-2.5 rounded-lg border transition relative",
                  selected
                    ? "border-cyan-400/50 bg-cyan-500/10"
                    : "border-white/8 bg-black/30 hover:border-white/20 hover:bg-black/50"
                )}
                style={selected ? { boxShadow: `0 0 20px -5px ${p.accent}40` } : {}}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: p.accent, boxShadow: `0 0 6px ${p.accent}` }}
                  />
                  <span className="text-xs font-medium text-white truncate">{p.label}</span>
                  {p.local && (
                    <span className="text-[8px] px-1 rounded bg-emerald-500/20 text-emerald-300 uppercase">local</span>
                  )}
                </div>
                <div className="text-[10px] text-white/50 leading-tight line-clamp-2">{p.description}</div>
                {selected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-black" />
                  </div>
                )}
                {(p.requiresKey || p.keyOptional) && (hasKey || testedAt[p.id]) && (
                  <div
                    title={testedAt[p.id] ? t("settings.test.tested") : t("settings.test.keyOnly")}
                    className={cn(
                      "absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full",
                      testedAt[p.id] ? "bg-emerald-400" : "bg-amber-400"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Config for selected provider */}
      <div className="space-y-3 p-4 bg-black/30 rounded-lg border border-white/8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: cfg.accent, boxShadow: `0 0 8px ${cfg.accent}` }}
            />
            <span className="text-sm font-medium text-white">{cfg.label}</span>
            {cfg.docsUrl && (
              <a
                href={cfg.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
              >
                {t("settings.docs")} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
          <button
            onClick={() => test()}
            disabled={testStatus === "testing"}
            className="text-[11px] px-2.5 py-1 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-50 flex items-center gap-1"
          >
            {testStatus === "testing" ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> {t("settings.apiKey.testing")}</>
            ) : (
              <><Zap className="w-3 h-3" /> {t("settings.apiKey.test")}</>
            )}
          </button>
        </div>

        {/* API key */}
        {(cfg.requiresKey || cfg.keyOptional) && (
          <Field label={cfg.keyOptional ? t("settings.apiKey.optional") : t("settings.apiKey")} icon={Key}>
            <input
              type={showKey ? "text" : "password"}
              value={currentKey}
              onChange={(e) => setApiKey(providerId, e.target.value)}
              placeholder={cfg.keyHint}
              spellCheck={false}
              className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50 font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              title={showKey ? t("settings.test.hideKey") : t("settings.test.showKey")}
              className="text-white/40 hover:text-white p-1 shrink-0"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <span className={cn("text-[10px]", currentKey ? "text-emerald-400" : "text-white/40")}>
              {currentKey ? t("settings.apiKey.set") : (cfg.keyOptional ? "optional" : t("settings.apiKey.unset"))}
            </span>
          </Field>
        )}

        {/* Base URL */}
        {cfg.baseUrlEditable && (
          <Field label={t("settings.baseUrl")} icon={Server}>
            <input
              type="text"
              value={currentBaseUrl}
              onChange={(e) => setBaseUrl(providerId, e.target.value)}
              placeholder={cfg.baseUrl}
              className="flex-1 bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50 font-mono"
            />
          </Field>
        )}

        {/* Model */}
        <Field label={t("settings.model")} icon={Cpu}>
          <select
            value={
              currentModel === cfg.defaultModel
                ? ""
                : cfg.models.includes(currentModel)
                  ? currentModel
                  : "__current"
            }
            onChange={(e) => {
              if (e.target.value === "__custom" || e.target.value === "__current") {
                customRef.current?.focus();
                return;
              }
              setModel(providerId, e.target.value || cfg.defaultModel);
              setCustomModel("");
            }}
            className="bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50"
          >
            <option value="">{cfg.defaultModel} (default)</option>
            {cfg.models.filter((m) => m !== cfg.defaultModel).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            {!cfg.models.includes(currentModel) && currentModel !== cfg.defaultModel && (
              <option value="__current">{currentModel} (current)</option>
            )}
            <option value="__custom">Custom…</option>
          </select>
        </Field>

        {/* Custom model input */}
        <Field label={t("settings.model.custom")} icon={Cpu}>
          <input
            ref={customRef}
            type="text"
            value={customModel}
            onChange={(e) => {
              setCustomModel(e.target.value);
              if (e.target.value) setModel(providerId, e.target.value);
            }}
            placeholder={cfg.defaultModel}
            className="flex-1 bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50 font-mono"
          />
          {customModel && (
            <button
              onClick={() => { setCustomModel(""); setModel(providerId, cfg.defaultModel); }}
              className="text-[10px] text-white/40 hover:text-white"
            >
              reset
            </button>
          )}
        </Field>

        {/* Test result */}
        {testStatus !== "idle" && (
          <div className={cn(
            "text-[11px] px-2.5 py-1.5 rounded flex items-start gap-1.5",
            testStatus === "ok" && "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30",
            testStatus === "fail" && "bg-rose-500/15 text-rose-300 border border-rose-400/30",
            testStatus === "testing" && "bg-cyan-500/15 text-cyan-300 border border-cyan-400/30"
          )}>
            <span className="mt-0.5 shrink-0">
              {testStatus === "ok" && <Check className="w-3 h-3" />}
              {testStatus === "fail" && <AlertCircle className="w-3 h-3" />}
              {testStatus === "testing" && <Loader2 className="w-3 h-3 animate-spin" />}
            </span>
            <span className="font-mono flex-1 whitespace-pre-wrap break-words max-h-28 overflow-y-auto thin-scroll">
              {testMsg || (testStatus === "ok" ? t("settings.apiKey.ok") : testStatus === "fail" ? t("settings.apiKey.fail") : t("settings.apiKey.testing"))}
              {latencyMs !== null && testStatus !== "testing" && (
                <span className="opacity-70"> · {latencyMs}ms</span>
              )}
            </span>
            {testStatus === "fail" && testMsg && (
              <button
                onClick={copyError}
                title={t("settings.test.copy")}
                className="shrink-0 text-white/50 hover:text-white p-0.5"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        )}

        {/* Live models from the endpoint — click one to apply it and retest */}
        {availModels.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
              {t("settings.test.availableModels")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availModels.slice(0, 12).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setModel(providerId, m);
                    setCustomModel(m);
                    test(m);
                  }}
                  disabled={testStatus === "testing"}
                  title={m}
                  className="text-[10px] font-mono px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-400/25 text-cyan-200 hover:bg-cyan-500/25 disabled:opacity-50 max-w-full truncate"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1 flex items-center gap-1">
        <Icon className="w-2.5 h-2.5" />
        {label}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function AppearanceTab() {
  const t = useT();
  const language = useSettings((s) => s.language);
  const setLanguage = useSettings((s) => s.setLanguage);
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const enableSound = useSettings((s) => s.enableSound);
  const setSound = useSettings((s) => s.setSound);
  const enableBoot = useSettings((s) => s.enableBoot);
  const setBoot = useSettings((s) => s.setBoot);
  const resetAll = useSettings((s) => s.resetAll);
  const factoryReset = useSettings((s) => s.factoryReset);

  return (
    <div className="space-y-5">
      {/* Language */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5">
          <Globe className="w-3 h-3" />
          {t("settings.language")}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage("en")}
            className={cn(
              "flex-1 py-2.5 rounded-lg border text-sm flex items-center justify-center gap-2 transition",
              language === "en"
                ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
                : "bg-black/30 border-white/8 text-white/60 hover:text-white"
            )}
          >
            🇬🇧 {t("settings.language.en")}
          </button>
          <button
            onClick={() => setLanguage("fr")}
            className={cn(
              "flex-1 py-2.5 rounded-lg border text-sm flex items-center justify-center gap-2 transition",
              language === "fr"
                ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
                : "bg-black/30 border-white/8 text-white/60 hover:text-white"
            )}
          >
            🇫🇷 {t("settings.language.fr")}
          </button>
        </div>
      </div>

      {/* Theme */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5">
          <Palette className="w-3 h-3" />
          {t("settings.theme")}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(ACCENT_COLORS) as AccentTheme[]).map((key) => {
            const c = ACCENT_COLORS[key];
            const selected = theme === key;
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={cn(
                  "p-3 rounded-lg border flex flex-col items-center gap-1.5 transition",
                  selected ? "border-white/30 bg-white/5" : "border-white/8 bg-black/30 hover:border-white/20"
                )}
                style={selected ? { boxShadow: `0 0 20px -5px ${c.primary}` } : {}}
              >
                <div
                  className="w-8 h-8 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`,
                    boxShadow: `0 0 12px ${c.primary}80`,
                  }}
                />
                <span className="text-[10px] text-white/70">{t(`settings.theme.${key}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <Toggle label={t("settings.boot")} value={enableBoot} onChange={setBoot} />
        <Toggle label={t("settings.sound")} value={enableSound} onChange={setSound} />
      </div>

      {/* Reset */}
      <div className="pt-4 border-t border-white/8 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-white/40">Reset</div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (confirm(t("settings.reset.confirm"))) resetAll();
            }}
            className="text-xs px-3 py-1.5 rounded-md bg-rose-500/15 border border-rose-400/30 text-rose-300 hover:bg-rose-500/25 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            {t("settings.reset")}
          </button>
          <button
            onClick={() => {
              if (confirm("Factory reset? This will clear all windows, chat history, workspaces, and module states — but KEEP your API keys and provider settings.")) {
                factoryReset();
              }
            }}
            className="text-xs px-3 py-1.5 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 hover:bg-amber-500/25 flex items-center gap-1.5"
          >
            <Shield className="w-3 h-3" />
            Factory Reset (keep API keys)
          </button>
        </div>
        <div className="text-[9px] text-white/30 leading-relaxed">
          "Reset" clears all settings including API keys. "Factory Reset" clears windows, chat, workspaces and module states but keeps your API keys, provider config, and model preferences.
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/8">
      <span className="text-sm text-white/80">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "w-10 h-6 rounded-full relative transition",
          value ? "bg-cyan-500/40" : "bg-white/10"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all",
            value ? "left-[18px]" : "left-0.5"
          )}
          style={value ? { boxShadow: "0 0 8px rgba(34,211,238,0.6)" } : {}}
        />
      </button>
    </div>
  );
}

function AboutTab() {
  const t = useT();
  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="text-base font-bold text-white">MorphOS</div>
            <div className="text-[10px] text-white/40 font-mono">v0.9.5 · self-writing interface</div>
          </div>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          {t("settings.about.desc")}
        </p>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2">{t("settings.about.tech")}</div>
        <div className="flex flex-wrap gap-1.5">
          {["Next.js 16", "TypeScript", "Tailwind CSS 4", "Framer Motion", "Zustand", "Recharts", "z-ai-web-dev-sdk"].map((tech) => (
            <span key={tech} className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 font-mono">
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1">
          <Shield className="w-2.5 h-2.5" />
          Privacy
        </div>
        <p className="text-[11px] text-white/60 leading-relaxed bg-amber-500/5 border border-amber-400/20 rounded p-2.5">
          {t("settings.about.disclaimer")}
        </p>
      </div>

      <div className="pt-3 border-t border-white/8 text-center">
        <div className="text-[10px] text-white/40">{t("settings.about.gtm")}</div>
      </div>
    </div>
  );
}
