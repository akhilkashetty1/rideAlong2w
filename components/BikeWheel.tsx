import { cn } from "@/lib/utils";

/** Flat spoked motorcycle wheel: frame decoration and small icons. Inherits `currentColor`. */
/** Rounded so the server and the browser print identical coordinates. */
const pt = (n: number) => Math.round(n * 100) / 100;

export default function BikeWheel({ className }: { className?: string }) {
  const spokes = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
  return (
    <svg viewBox="0 0 100 100" className={cn("block", className)} aria-hidden>
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx="50" cy="50" r="42" strokeWidth="10" />
        <circle cx="50" cy="50" r="31" strokeWidth="2.5" />
        {spokes.map((a) => (
          <line key={a} x1={pt(50 + Math.cos(a) * 9)} y1={pt(50 + Math.sin(a) * 9)} x2={pt(50 + Math.cos(a) * 31)} y2={pt(50 + Math.sin(a) * 31)} strokeWidth="2" />
        ))}
      </g>
      <circle cx="50" cy="50" r="8" fill="currentColor" />
    </svg>
  );
}
