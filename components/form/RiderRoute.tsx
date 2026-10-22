"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Marker = { key: string; state: "ok" | "flagged" | "unanswered" };

/**
 * The Rider Assessment is the ride itself, so its questions sit along a road. A top-view
 * motorcycle rides to whichever question is active; answered checks leave a lime cat's-eye
 * and flagged behaviour leaves a hazard triangle on the road.
 *
 * Rows are found by `data-qkey` inside the children and measured, so the list markup stays
 * the same as everywhere else.
 */
export default function RiderRoute({ markers, activeKey, children }: { markers: Marker[]; activeKey?: string | null; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tops, setTops] = useState<Record<string, number>>({});

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const base = el.getBoundingClientRect().top;
      const next: Record<string, number> = {};
      el.querySelectorAll<HTMLElement>("[data-qkey]").forEach((row) => {
        const r = row.getBoundingClientRect();
        next[row.dataset.qkey!] = r.top - base + Math.min(r.height / 2, 28);
      });
      setTops(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const bikeTop = activeKey != null ? tops[activeKey] : undefined;
  const firstKey = markers[0]?.key;

  return (
    <div ref={ref} className="relative pl-11 sm:pl-14">
      {/* Road */}
      <div aria-hidden className="absolute bottom-0 left-0 top-0 w-8 overflow-hidden rounded-full bg-night-2 sm:w-10">
        <div className="absolute inset-y-0 left-0.5 w-[2px] bg-white/60" />
        <div className="absolute inset-y-0 right-0.5 w-[2px] bg-white/60" />
        <div className="road-dash absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2" />
      </div>

      {/* Markers */}
      {markers.map((m) =>
        tops[m.key] == null || m.state === "unanswered" ? null : (
          <span
            key={m.key}
            aria-hidden
            style={{ top: tops[m.key] }}
            className={cn("absolute left-4 z-[1] -translate-x-1/2 -translate-y-1/2 sm:left-5", m.state === "ok" ? "h-2 w-2 rounded-full bg-neon shadow-[0_0_8px_var(--color-neon)]" : "")}
          >
            {m.state === "flagged" && (
              <svg viewBox="0 0 24 22" className="h-5 w-5 drop-shadow-[0_0_6px_rgba(255,0,0,.9)]">
                <path d="M12 1 23 21H1Z" fill="var(--color-brake)" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M12 8v6M12 16.5v.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            )}
          </span>
        ),
      )}

      {/* Motorcycle, seen from above */}
      <span
        aria-hidden
        style={{ top: bikeTop ?? tops[firstKey ?? ""] ?? 0 }}
        className="absolute left-4 z-[2] -translate-x-1/2 -translate-y-1/2 transition-[top] duration-700 ease-[cubic-bezier(.34,1.3,.64,1)] sm:left-5"
      >
        <svg viewBox="0 0 20 38" className="h-10 w-5 drop-shadow-[0_4px_8px_rgba(0,0,0,.6)] sm:h-11 sm:w-6">
          <rect x="7.5" y="1" width="5" height="9" rx="2.5" fill="#000" stroke="var(--color-neon)" strokeWidth="1" />
          <rect x="7.5" y="28" width="5" height="9" rx="2.5" fill="#000" stroke="var(--color-neon)" strokeWidth="1" />
          <rect x="5.5" y="9" width="9" height="19" rx="4.5" fill="var(--color-neon)" stroke="#000" strokeWidth="1" />
          <rect x="6.5" y="15" width="7" height="8" rx="2" fill="#000" />
          <rect x="1" y="11" width="18" height="2.4" rx="1.2" fill="#000" />
          <rect x="1" y="9.6" width="2.4" height="5.2" rx="1.1" fill="#000" stroke="var(--color-neon)" strokeWidth=".6" />
          <rect x="16.6" y="9.6" width="2.4" height="5.2" rx="1.1" fill="#000" stroke="var(--color-neon)" strokeWidth=".6" />
          <rect x="8.2" y="33" width="3.6" height="1.6" rx=".8" fill="var(--color-brake)" />
        </svg>
      </span>

      {children}
    </div>
  );
}
