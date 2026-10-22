import type { AssessmentSection } from "@/lib/form-content";

/** The guidelines table, in the 2W form's own style (lime header, black lines): a real table from `sm` up, stacked cards on phones. */
export default function GuidelinesTable({ section }: { section: AssessmentSection }) {
  const th = "border-2 border-black bg-neon px-3 py-2.5 text-left font-bold text-white";
  const td = "border-2 border-black px-3 py-2.5 align-top";
  return (
    <>
      <table className="relative hidden w-full border-collapse overflow-hidden rounded-[10px] bg-white text-left text-sm shadow-[0_4px_8px_rgba(0,0,0,.1)] sm:table">
        <thead>
          <tr>
            <th className={`${th} w-14 text-center`}>No.</th>
            <th className={`${th} w-[36%]`}>{section.tableTitle}</th>
            <th className={th}>Assessment Guidelines for Line Manager</th>
          </tr>
        </thead>
        <tbody>
          {section.questions.map((q, i) => (
            <tr key={q.id} className="bg-paper-3 hover:bg-[#f0f0f0]">
              <td className={`${td} text-center font-semibold`}>{i + 1}</td>
              <td className={td}>{q.tableText ?? q.text}</td>
              <td className={td}>{q.guideline}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ol className="space-y-3 sm:hidden">
        {section.questions.map((q, i) => (
          <li key={q.id} className="overflow-hidden rounded-lg border-2 border-black bg-white">
            <p className="flex gap-2 bg-neon px-3 py-2.5 text-sm font-semibold text-black">
              <span>{i + 1}.</span>
              {q.tableText ?? q.text}
            </p>
            <div className="px-3 py-2.5 text-[0.82rem] text-ink-soft">{q.guideline}</div>
          </li>
        ))}
      </ol>
    </>
  );
}
