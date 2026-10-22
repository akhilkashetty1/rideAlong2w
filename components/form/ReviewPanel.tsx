import type { ReportSection } from "@/lib/submission";
import { cn } from "@/lib/utils";

/** Read-only summary of every answer, section by section. Also what gets printed. */
export default function ReviewPanel({ report }: { report: ReportSection[] }) {
  return (
    <div className="space-y-6">
      {report.map((section) => (
        <section key={section.title} className="print-avoid-break overflow-hidden rounded-lg border border-line bg-paper-3">
          <h2 className="border-b-2 border-black bg-neon px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-black">{section.title}</h2>
          <dl className="divide-y divide-line">
            {section.rows.map((r) => (
              <div key={r.label} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[1fr_8rem] sm:gap-4">
                <dt className="font-semibold text-[#555]">
                  {r.label}
                  {r.extras?.map((x) => (
                    <span key={x.label} className="mt-0.5 block text-xs font-semibold text-black">
                      {x.label}: {x.value}
                    </span>
                  ))}
                  {section.kind === "assessment" && <span className="mt-0.5 block text-xs font-normal italic text-[#777]">Remarks: {r.remark || "No Remarks"}</span>}
                </dt>
                <dd className={cn("font-semibold sm:text-right", r.flagged && "text-brake")}>{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
