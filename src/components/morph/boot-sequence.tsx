"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hexagon, Terminal, Check } from "lucide-react";
import { useSettings } from "@/lib/settings-store";
import { useT } from "@/lib/use-t";

const BOOT_STEPS_FR = [
  { key: "boot.init", delay: 0 },
  { key: "boot.registry", delay: 350 },
  { key: "boot.windows", delay: 700 },
  { key: "boot.hotreload", delay: 1050 },
  { key: "boot.hotswap", delay: 1350 },
  { key: "boot.ipc", delay: 1650 },
  { key: "boot.ready", delay: 2050 },
];

const BOOT_STEPS_EN = BOOT_STEPS_FR;

export function BootSequence({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const steps = BOOT_STEPS_EN;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((s, i) => {
      timers.push(setTimeout(() => setStep(i + 1), s.delay));
    });
    // Allow tap-to-skip after a short delay
    timers.push(setTimeout(() => setStep(steps.length), steps[steps.length - 1].delay + 200));
    return () => timers.forEach(clearTimeout);
  }, [steps]);

  function done() {
    if (exiting) return;
    setExiting(true);
    setTimeout(onDone, 600);
  }

  // Auto-advance to "tap to enter" after all steps
  useEffect(() => {
    if (step >= steps.length) {
      // Wait for tap, but auto-advance after 4s
      const id = setTimeout(done, 4000);
      return () => clearTimeout(id);
    }
  }, [step, steps.length]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[2000] bg-[rgb(8,10,18)] flex items-center justify-center cursor-pointer"
          onClick={done}
        >
          {/* Grid bg */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, #22d3ee, transparent 70%)", filter: "blur(80px)" }}
          />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #f472b6, transparent 70%)", filter: "blur(80px)" }}
          />

          <div className="relative z-10 max-w-2xl w-full px-8">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
              className="flex flex-col items-center mb-8"
            >
              <div className="relative mb-4">
                <Hexagon className="w-20 h-20 text-cyan-400" strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Hexagon className="w-14 h-14 text-cyan-400/50" strokeWidth={0.5} />
                  </motion.div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 live-dot" style={{ boxShadow: "0 0 16px #22d3ee" }} />
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-white tracking-tight">
                  Morph<span className="text-cyan-400">OS</span>
                </div>
                <div className="text-[11px] text-white/40 font-mono mt-1">
                  {t("app.tagline")}
                </div>
              </motion.div>
            </motion.div>

            {/* Steps */}
            <div className="font-mono text-xs space-y-1.5 mb-6">
              {steps.map((s, i) => {
                const done = step > i;
                const active = step === i;
                return (
                  <motion.div
                    key={s.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: done || active ? 1 : 0.3, x: 0 }}
                    transition={{ delay: s.delay / 1000 }}
                    className="flex items-center gap-2"
                  >
                    <span className="w-4">
                      {done ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : active ? (
                        <motion.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="inline-block w-2 h-2 rounded-full bg-cyan-400"
                        />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-white/10 ml-0.5" />
                      )}
                    </span>
                    <span className={done ? "text-white/80" : active ? "text-cyan-300" : "text-white/30"}>
                      {t(s.key)}
                    </span>
                    {done && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-emerald-400/60 ml-auto text-[10px]"
                      >
                        ok
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Tap to enter */}
            <AnimatePresence>
              {step >= steps.length && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="text-sm text-cyan-300 flex items-center justify-center gap-2"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    {t("boot.tapToEnter")}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
