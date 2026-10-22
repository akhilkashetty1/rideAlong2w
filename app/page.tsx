import Image from "next/image";
import cover from "@/public/images/cover.jpg";
import RoadBackdrop from "@/components/three/RoadBackdrop";
import IgnitionButton from "@/components/IgnitionButton";
import { FORM_META } from "@/lib/form-content";

/** The cover poster and a Start button, over a live road. The page stays white, as before. */
export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-10 px-4 py-10">
      <RoadBackdrop />
      <Image
        src={cover}
        alt={`${FORM_META.posterTitle.join(" ")} cover`}
        priority
        placeholder="blur"
        sizes="(min-width: 1024px) 550px, (min-width: 768px) 450px, 80vw"
        className="poster-pulse h-auto max-h-[calc(100dvh-17rem)] min-h-[16rem] w-auto max-w-[80vw] rounded-[15px] shadow-[0_8px_16px_rgba(0,0,0,.2)] md:max-w-[450px] lg:max-w-[550px]"
      />
      <IgnitionButton href="/guidelines/vehicle" />
    </main>
  );
}
