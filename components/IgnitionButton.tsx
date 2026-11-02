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
  ride: "Let's ride",
};

/**
 * START ASSESSMENT as a 3D instrument pod with an ignition key (a push-to-start button if WebGL is
 * unavailable). The key runs a real bike's start-up (bulb check, crank, catch, idle), then the pod
 * revs and an iris opens out of it, streaked like a warp, into the guidelines. Without WebGL the
 * button plays the 2D version: gauge needles sweep and every lamp lights, then it pulls away.
 */
export default function IgnitionButton({ href }: { href: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"off" | "sweep" | "settle">("off");
  const [gl, setGl] = useState<"loading" | "ok" | "none">("loading");
  const [stage, setStage] = useState<KeyStage>("idle");
  const [ride, setRide] = useState<{ x: number; y: number } | null>(null);
  const keyRef = useRef<IgnitionKeyHandle>(null);

  useEffect(() => {
    router.prefetch(href);
  }, [router, href]);

  const pullAway = (origin: { x: number; y: number }) => {
    if (prefersReducedMotion()) return router.push(href);
    setRide(origin);
    setTimeout(() => router.push(href), 700);
  };

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
        <div className="relative h-48 w-48 rounded-full has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-neon sm:h-56 sm:w-56">
          <IgnitionKey3D
            ref={keyRef}
            onRide={pullAway}
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
            <div className="flex items-center gap-1.5">
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
            </div>
          </>
        )}
      </div>

      {ride && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-live="polite">
          <div className="iris-out absolute rounded-full bg-black" style={{ left: ride.x, top: ride.y }}>
            <div className="warp absolute inset-0 rounded-full" />
          </div>
          <p className="warp-text absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display text-4xl tracking-wider text-neon sm:text-5xl" style={{ left: ride.x, top: ride.y }}>
            LET&apos;S RIDE
          </p>
        </div>
      )}

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
