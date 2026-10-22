import Image from "next/image";
import { cn } from "@/lib/utils";
import BikeWheel from "@/components/BikeWheel";
import watermark from "@/public/images/watermark.png";

/**
 * The page card: the 2W black/red double frame, the same watermark at the bottom, and a
 * couple of half-hidden wheels peeking in from the edges (the 4W form does this with steering wheels).
 */
export default function FramedCard({ children, className, tint }: { children: React.ReactNode; className?: string; tint?: boolean }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[1000px]", className)}>
      <BikeWheel className="no-print pointer-events-none absolute -left-9 top-28 hidden h-20 w-20 text-neon drop-shadow-[1px_1px_0_#000] md:block" />
      <BikeWheel className="no-print pointer-events-none absolute -right-9 top-[46%] hidden h-20 w-20 rotate-45 text-neon drop-shadow-[1px_1px_0_#000] md:block" />
      <div className={cn("frame relative overflow-clip p-4 sm:p-7", tint && "bg-paper-2")}>
        <Image
          src={watermark}
          alt=""
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-1/2 h-auto w-full max-w-[300px] -translate-x-1/2 opacity-10"
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
