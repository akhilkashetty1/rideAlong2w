"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Lock, RefreshCw } from "lucide-react";
import cover from "@/public/images/cover.jpg";

/**
 * What riders see while an admin has the form closed (hub → Forms): the cover, dimmed, with the key
 * taken out and the words the admin wrote. Used instead of the whole app, and over the form when it
 * is closed while someone is part-way through (`keepsAnswers`: their answers stay on the device).
 */
export default function ClosedScreen({ title, message, keepsAnswers, onReopened }: { title: string; message: string; keepsAnswers?: boolean; onReopened?: () => void }) {
  const [checking, setChecking] = useState(false);
  const [still, setStill] = useState(false);

  const check = async () => {
    setChecking(true);
    setStill(false);
    try {
      const res = await fetch("/api/form-status", { cache: "no-store" });
      const body = await res.json();
      if (body.open === true) {
        if (onReopened) onReopened();
        else window.location.reload();
        return;
      }
    } catch {}
    setStill(true);
    setChecking(false);
  };

  return (
    <div role="status" className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-auto bg-black px-6 py-10 text-center text-white">
      <Image src={cover} alt="" aria-hidden placeholder="blur" priority sizes="100vw" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 blur-sm grayscale" />
      <div className="relative flex max-w-md flex-col items-center gap-6">
        <span className="relative grid h-28 w-28 place-items-center rounded-full bg-gradient-to-b from-[#2a2b30] to-[#0c0d10] shadow-[0_0_60px_-10px_rgba(255,0,0,.5)] ring-2 ring-white/10">
          <span className="absolute inset-1.5 rounded-full border-[5px] border-dashed border-[#ff0000]/60 motion-safe:animate-pulse" />
          <Lock className="h-9 w-9 text-neon" strokeWidth={2.4} />
        </span>
        <h1 className="font-display text-3xl leading-tight tracking-wide sm:text-4xl">{title}</h1>
        <p className="whitespace-pre-line text-base leading-relaxed text-white/75">{message}</p>
        {keepsAnswers && <p className="rounded-2xl bg-white/10 px-4 py-2 text-xs leading-relaxed text-white/80">Your answers are saved on this device. When the form opens again, press Submit.</p>}
        <button type="button" onClick={check} disabled={checking} className="inline-flex h-10 items-center gap-2 rounded-full bg-neon px-5 text-sm font-semibold text-black transition hover:brightness-95 disabled:opacity-60">
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Check again
        </button>
        <p className="h-4 text-xs text-white/60" aria-live="polite">
          {still ? "Still closed. Please try again later." : ""}
        </p>
      </div>
    </div>
  );
}
