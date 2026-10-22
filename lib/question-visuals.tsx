/**
 * Visual metadata for the questions in lib/form-content.ts, kept separate so the content file
 * stays pure copy. Keyed by `${sectionId}.${questionId}`.
 *
 * - `icon`: the dashboard lamp that lights when the answer is flagged.
 * - `part`: where the question lives on the 3D walkaround bike (vehicle questions only).
 *
 * A question without an entry still works everywhere; it just has no pin or lamp.
 */
import {
  Ambulance,
  Armchair,
  ArrowLeftRight,
  ArrowUpRight,
  CircleDot,
  Disc3,
  EyeOff,
  FileCheck,
  FlipHorizontal2,
  Footprints,
  Fuel,
  Gauge,
  GraduationCap,
  HardHat,
  HeartHandshake,
  Key,
  Megaphone,
  OctagonAlert,
  PersonStanding,
  Power,
  RectangleHorizontal,
  Shirt,
  Smartphone,
  TrafficCone,
  type LucideIcon,
} from "lucide-react";

type IconComponent = LucideIcon | ((p: { className?: string; strokeWidth?: number }) => React.ReactNode);

/** Side + main stand: the one lamp lucide doesn't have. */
function StandIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 7h9l3 11" />
      <path d="M13 7 9 18" />
      <path d="M7 18h4M14 18h5" />
    </svg>
  );
}

/** Anchor names understood by components/three/WalkaroundBike.tsx. */
export type BikePart = "tyre-front" | "tyre-rear" | "speedometer" | "fuel" | "mirror" | "brakes" | "horn" | "starter" | "key" | "seat" | "stands" | "plate";

export const QUESTION_VISUALS: Record<string, { icon: IconComponent; part?: BikePart }> = {
  "vehicle.tyre-pressure": { icon: CircleDot, part: "tyre-front" },
  "vehicle.tyre-tread": { icon: Disc3, part: "tyre-rear" },
  "vehicle.speedometer": { icon: Gauge, part: "speedometer" },
  "vehicle.fuel-meter": { icon: Fuel, part: "fuel" },
  "vehicle.mirrors": { icon: FlipHorizontal2, part: "mirror" },
  "vehicle.brakes": { icon: OctagonAlert, part: "brakes" },
  "vehicle.horn": { icon: Megaphone, part: "horn" },
  "vehicle.starter": { icon: Power, part: "starter" },
  "vehicle.key": { icon: Key, part: "key" },
  "vehicle.seat": { icon: Armchair, part: "seat" },
  "vehicle.stands": { icon: StandIcon, part: "stands" },
  "vehicle.number-plates": { icon: RectangleHorizontal, part: "plate" },

  "rider.hand-signal": { icon: ArrowLeftRight },
  "rider.overtaking": { icon: ArrowUpRight },
  "rider.shoes": { icon: Footprints },
  "rider.sleepy": { icon: EyeOff },
  "rider.traffic-signals": { icon: TrafficCone },
  "rider.mobile-phone": { icon: Smartphone },
  "rider.speed-limits": { icon: Gauge },
  "rider.posture": { icon: PersonStanding },
  "rider.ambulance": { icon: Ambulance },
  "rider.courtesy": { icon: HeartHandshake },
  "rider.safe-rider": { icon: GraduationCap },
  "rider.helmet-worn": { icon: HardHat },
  "rider.helmet-condition": { icon: HardHat },
  "rider.jacket-worn": { icon: Shirt },
  "rider.jacket-condition": { icon: Shirt },
  "rider.documents": { icon: FileCheck },
};
