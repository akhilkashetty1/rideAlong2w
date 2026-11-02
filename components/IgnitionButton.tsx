"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Power } from "lucide-react";
import { Speedometer } from "@/components/form/Dashboard";
import { Telltale } from "@/components/form/Telltales";
import IgnitionKey3D, { type IgnitionKeyHandle, type KeyStage } from "@/components/three/IgnitionKey3D";
import { QUESTION_VISUALS } from "@/lib/question-visuals";
import { cn, prefersReducedMotion } from "@/lib/utils";

const BULB_CHECK = Object.keys(QUESTION_VISUALS)
  .filter((k) => k.startsWith("vehicle."))
  .slice(0, 9)
  .map((key) => ({ key, label: key, flagged: false }));

/** What the line under the key says at each point of the sequence. */
const CAPTIONS: Record<KeyStage, string> = {
  idle: "Tap the key, or turn it",
  in: "Key in",
  on: "Ignition on",
  crank: "Cranking",
  live: "Engine live",
};

/**
 * START ASSESSMENT as a 3D ignition key (a push-to-start button if WebGL is unavailable). Turning
 * the key does what a real bike does on ignition: the gauge needles sweep and every warning lamp lights
 * for a bulb check, then it pulls away to the guidelines. (Black and lime, the cover's own colours.)
 */
export default function IgnitionButton({ href }: { href: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"off" | "sweep" | "settle">("off");
  const [gl, setGl] = useState<"loading" | "ok" | "none">("loading");
  const [stage, setStage] = useState<KeyStage>("idle");
  const keyRef = useRef<IgnitionKeyHandle>(null);

  useEffect(() => {
    router.prefetch(href);
  }, [router, href]);

  const start = () => {
    if (phase !== "off") return;
    if (prefersReducedMotion()) return router.push(href);
    navigator.vibrate?.([30, 50, 60]);
    setPhase("sweep");
    setTimeout(() => setPhase("settle"), 750);
    setTimeout(() => router.push(href), 1500);
  };

  const needle = phase === "sweep" ? 1 : 0;

  return (
    <>
      <div className="flex flex-col items-center gap-1">
        <div className="relative h-60 w-60 rounded-full has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-neon sm:h-64 sm:w-64">
          <IgnitionKey3D
            ref={keyRef}
            onStart={start}
            onStage={setStage}
            onReady={(ok) => setGl(ok ? "ok" : "none")}
            className={cn("absolute inset-0 cursor-grab touch-none active:cursor-grabbing", gl !== "ok" && "invisible")}
          />
          {gl === "ok" ? (
            <button type="button" onClick={() => keyRef.current?.turn()} className="sr-only">
              Start assessment
            </button>
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <button
                type="button"
                onClick={start}
                aria-label="Start assessment"
                className={cn(
                  "group relative grid h-32 w-32 place-items-center rounded-full bg-black text-neon ring-[6px] ring-neon transition-all duration-300",
                  "shadow-[0_8px_24px_rgba(0,0,0,.35)] hover:scale-[1.04] hover:ring-az active:scale-95",
                  phase !== "off" && "scale-95 text-white ring-az",
                )}
              >
                <span className="flex flex-col items-center gap-0.5">
                  <Power className="h-7 w-7" strokeWidth={2.6} />
                  <span className="font-display text-[0.95rem] leading-none tracking-wider">START</span>
                  <span className="text-[0.55rem] font-semibold tracking-[0.22em] text-white/70">ASSESSMENT</span>
                </span>
                <span className="pointer-events-none absolute inset-[-14px] rounded-full border border-black/30 group-hover:animate-ping" />
              </button>
            </div>
          )}
        </div>
        {gl === "ok" && (
          <>
            <span className="rounded-full bg-white/85 px-3 py-1 font-display text-base leading-none tracking-wider">START ASSESSMENT</span>
            {/* keyed so each stage's words slide in fresh; the lime pill marks that the engine is going */}
            <span
              key={stage}
              aria-hidden
              className={cn(
                "step-in rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.22em]",
                stage === "idle" ? "bg-white/85 text-ink-soft" : "bg-neon text-black",
              )}
            >
              {CAPTIONS[stage]}
              {(stage === "in" || stage === "crank") && "…"}
            </span>
          </>
        )}
      </div>

      {phase !== "off" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90" aria-live="polite">
          <div className="step-in flex flex-col items-center gap-4">
            <div className="flex items-end gap-6">
              <Speedometer progress={needle} readout={false} className="h-28 w-32" />
              <Speedometer progress={needle} readout={false} className="h-28 w-32" />
            </div>
            <div className="flex gap-1">
              {BULB_CHECK.map((i) => (
                <Telltale key={i.key} item={i} size="sm" bulbCheck={phase === "sweep"} />
              ))}
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon">{phase === "sweep" ? "Ignition on · systems check" : "All systems OK"}</p>
          </div>
        </div>
      )}
    </>
  );
}
