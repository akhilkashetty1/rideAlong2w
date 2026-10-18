import { FORM_META } from "@/lib/form-content";
import { countFlagged, type ReportSection } from "@/lib/submission";

/** Builds and downloads the review as an A4 PDF. jsPDF is loaded only when asked for. */
export async function downloadReportPdf(report: ReportSection[], fileName: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  let y = 0;

  const header = () => {
    doc.setFillColor(206, 219, 40); // lime
    doc.rect(0, 0, W, 16, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(FORM_META.title.toUpperCase(), M, 10.5);
    y = 26;
  };
  const ensure = (h: number) => {
    if (y + h > H - 14) {
      doc.addPage();
      header();
    }
  };

  header();
  const flagged = countFlagged(report);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(flagged ? 255 : 0, 0, 0);
  doc.text(flagged ? `${flagged} item(s) flagged for follow-up` : "No items flagged", M, y);
  y += 8;

  for (const section of report) {
    ensure(16);
    doc.setFillColor(0, 0, 0);
    doc.rect(M, y - 5, W - 2 * M, 7.5, "F");
    doc.setTextColor(206, 219, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(section.title, M + 2.5, y);
    y += 7;

    for (const row of section.rows) {
      const labelLines = doc.splitTextToSize(row.label, (W - 2 * M) * 0.62);
      const remarkLines = row.remark ? doc.splitTextToSize(`Remarks: ${row.remark}`, W - 2 * M - 4) : [];
      const h = Math.max(labelLines.length, 1) * 4.6 + remarkLines.length * 4.3 + 3;
      ensure(h);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      doc.text(labelLines, M + 2, y);
      doc.setFont("helvetica", "bold");
      if (row.flagged) doc.setTextColor(255, 0, 0);
      doc.text(row.flagged ? `${row.value}  (flagged)` : row.value, W - M - 2, y, { align: "right" });
      y += labelLines.length * 4.6;
      if (remarkLines.length) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(85, 85, 85);
        doc.text(remarkLines, M + 4, y);
        y += remarkLines.length * 4.3;
      }
      doc.setDrawColor(204, 204, 204);
      doc.line(M, y - 1.5, W - M, y - 1.5);
      y += 3;
    }
    y += 4;
  }

  doc.save(fileName);
}
