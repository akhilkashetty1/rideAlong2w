import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ASSESSMENT_SECTIONS } from "@/lib/form-content";
import FramedCard from "@/components/FramedCard";
import GuidelinesTable from "@/components/GuidelinesTable";
import { LinkButton } from "@/components/Buttons";

export function generateStaticParams() {
  return ASSESSMENT_SECTIONS.map((s) => ({ section: s.id }));
}

type Props = { params: Promise<{ section: string }> };

/** One page per assessment section: the vehicle guidelines, then the rider guidelines. */
export default async function GuidelinesPage({ params }: Props) {
  const { section: id } = await params;
  const index = ASSESSMENT_SECTIONS.findIndex((s) => s.id === id);
  if (index === -1) notFound();
  const section = ASSESSMENT_SECTIONS[index];
  const prev = ASSESSMENT_SECTIONS[index - 1];
  const next = ASSESSMENT_SECTIONS[index + 1];

  return (
    <main className="px-3 py-6 sm:px-6 sm:py-10">
      <FramedCard tint>
        <h1 className="mb-1 text-center font-display text-[clamp(1.2rem,4vw,1.9rem)] uppercase leading-tight">{section.guidelinesHeading}</h1>
        <p className="mb-5 text-center text-sm font-medium text-ink-soft">
          For the Line Manager · {index + 1} of {ASSESSMENT_SECTIONS.length}
        </p>

        <GuidelinesTable section={section} />

        <nav className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <LinkButton href={prev ? `/guidelines/${prev.id}` : "/"} variant="back">
            <ArrowLeft className="h-4 w-4" />
            Previous
          </LinkButton>
          <LinkButton href={next ? `/guidelines/${next.id}` : "/assessment"}>
            {section.guidelinesNext}
            <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </nav>
      </FramedCard>
    </main>
  );
}
