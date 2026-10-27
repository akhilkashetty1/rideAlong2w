/**
 * The notification email for a submitted ride-along: a branded header, the score at a glance, what needs
 * follow-up first (with remarks), then every answer by section. Built from table markup and inline
 * styles only, because mail apps ignore everything else. Pure functions, no Node or React imports.
 */

import { ASSESSMENT_SECTIONS, PARTICIPANT_FIELDS, VEHICLE_FIELDS } from "@/lib/form-content";

export type EmailRow = {
  label: string;
  value: string;
  remark?: string;
  flagged?: boolean;
  /** Follow-up details shown under the answer (e.g. the licence valid-till date). */
  extras?: { label: string; value: string }[];
};
export type EmailSection = { title: string; kind: "fields" | "assessment"; rows: EmailRow[] };

export type EmailMeta = {
  /** e.g. "2W Ride Along". */
  formName: string;
  /** Who and where, shown under the title. */
  who: string;
  /** When it was done, already formatted. */
  when: string;
  /** Where the full record lives (the Submissions Hub portal), if known. */
  portalUrl?: string;
};

const INK = "#1b1c20";
const NAVY = "#1b2a4a";
const RED = "#da1f26";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const hasRemark = (r?: string) => !!r && !/^no remarks?$/i.test(r.trim()) && r.trim() !== "—";

const assessed = (sections: EmailSection[]) => sections.filter((s) => s.kind === "assessment").flatMap((s) => s.rows);

export function emailStats(sections: EmailSection[]) {
  const rows = assessed(sections);
  const flagged = rows.filter((r) => r.flagged).length;
  return { total: rows.length, flagged, passed: rows.length - flagged };
}

/** "2W Ride Along · Priya Sharma (Hyderabad) · 3 to follow up", or "· all clear". */
export function emailSubject(formName: string, who: string, flagged: number) {
  return `${flagged ? "⚠ " : "✓ "}${formName} · ${who} · ${flagged ? `${flagged} to follow up` : "all clear"}`;
}

function stat(label: string, value: string, tone?: string) {
  return `<td width="33%" style="padding:14px 8px;text-align:center;border-right:1px solid ${LINE};">
    <div style="font-size:22px;font-weight:700;line-height:1.1;color:${tone ?? INK};">${esc(value)}</div>
    <div style="margin-top:4px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${MUTED};">${esc(label)}</div>
  </td>`;
}

function heading(text: string) {
  return `<tr><td style="padding:26px 28px 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${NAVY};">${esc(text)}</td></tr>`;
}

export function renderEmail(sections: EmailSection[], meta: EmailMeta): string {
  const { total, flagged, passed } = emailStats(sections);

  const followUps = sections
    .filter((s) => s.kind === "assessment")
    .flatMap((s) => s.rows.filter((r) => r.flagged).map((r) => ({ ...r, section: s.title })));

  const followUpBlock = followUps.length
    ? `${heading(`Needs follow-up (${followUps.length})`)}
       <tr><td style="padding:0 28px;">${followUps
         .map(
           (r) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;background:#fdf1f1;border:1px solid #f6d4d6;border-left:4px solid ${RED};border-radius:6px;">
             <tr><td style="padding:10px 14px;">
               <div style="font-size:11px;color:${MUTED};">${esc(r.section)}</div>
               <div style="margin-top:2px;font-size:14px;font-weight:600;color:${INK};line-height:1.4;">${esc(r.label)}</div>
               <div style="margin-top:4px;font-size:13px;color:#b3141a;"><strong>Answered: ${esc(r.value)}</strong>${hasRemark(r.remark) ? ` &nbsp;·&nbsp; <em style="color:#454a54;">“${esc(r.remark)}”</em>` : ""}</div>
             </td></tr></table>`,
         )
         .join("")}</td></tr>`
    : `<tr><td style="padding:22px 28px 0;"><div style="background:#effaf3;border:1px solid #cdebd8;border-radius:6px;padding:12px 14px;font-size:14px;color:#166534;"><strong>All clear.</strong> Every check was answered as expected.</div></td></tr>`;

  const cell = `padding:7px 10px;border-bottom:1px solid ${LINE};vertical-align:top;font-size:13px;`;
  const body = sections
    .map((s) => {
      const rows = s.rows
        .map((r) => {
          const mark = s.kind === "assessment" ? `<span style="color:${r.flagged ? RED : "#16a34a"};font-weight:700;">${r.flagged ? "✕" : "✓"}</span>&nbsp; ` : "";
          const extras = (r.extras ?? []).map((x) => `<div style="margin-top:3px;font-size:12px;color:#454a54;">↳ ${esc(x.label)}: <strong>${esc(x.value)}</strong></div>`).join("");
          const remark = s.kind === "assessment" && hasRemark(r.remark) ? `<div style="margin-top:3px;font-size:12px;color:#454a54;font-style:italic;">“${esc(r.remark)}”</div>` : "";
          return s.kind === "assessment"
            ? `<tr><td style="${cell}color:${INK};">${mark}${esc(r.label)}${remark}${extras}</td><td style="${cell}width:64px;text-align:right;font-weight:700;color:${r.flagged ? "#b3141a" : INK};white-space:nowrap;">${esc(r.value)}</td></tr>`
            : `<tr><td style="${cell}width:40%;color:${MUTED};">${esc(r.label)}</td><td style="${cell}font-weight:600;color:${INK};">${esc(r.value)}</td></tr>`;
        })
        .join("");
      return `${heading(s.title)}<tr><td style="padding:0 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};">${rows}</table></td></tr>`;
    })
    .join("");

  return `<!doctype html><html><body style="margin:0;padding:0;background:#eef0f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f4;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:10px;overflow:hidden;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <tr><td style="background:${NAVY};border-top:4px solid ${RED};padding:22px 28px;">
    <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#aab3c5;">New submission</div>
    <div style="margin-top:4px;font-size:22px;font-weight:700;color:#ffffff;">${esc(meta.formName)}</div>
    <div style="margin-top:6px;font-size:14px;color:#dbe1ee;">${esc(meta.who)} &nbsp;·&nbsp; ${esc(meta.when)}</div>
  </td></tr>
  <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid ${LINE};"><tr>
    ${stat("Checks passed", total ? `${passed}/${total}` : "—", total && !flagged ? "#16a34a" : undefined)}
    ${stat("Need follow-up", String(flagged), flagged ? RED : "#16a34a")}
    ${stat("Score", total ? `${Math.round((passed / total) * 100)}%` : "—")}
  </tr></table></td></tr>
  ${followUpBlock}
  ${body}
  <tr><td style="padding:28px;text-align:center;">
    ${meta.portalUrl ? `<a href="${esc(meta.portalUrl)}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:10px 18px;border-radius:6px;">Open in Submissions Hub</a>` : ""}
    <div style="margin-top:16px;font-size:11px;color:#9ca3af;">Automatic notification from the ${esc(meta.formName)} form. Replies to this address are not monitored.</div>
  </td></tr>
</table></td></tr></table></body></html>`;
}

/** Plain-text twin of the email (better deliverability, and what some mail apps show first). */
export function renderEmailText(sections: EmailSection[], meta: EmailMeta): string {
  const { total, flagged, passed } = emailStats(sections);
  const lines = [`${meta.formName}: ${meta.who} (${meta.when})`, total ? `${passed}/${total} checks passed, ${flagged} to follow up` : "", ""];
  for (const s of sections) {
    const rows = s.kind === "assessment" ? s.rows.filter((r) => r.flagged) : s.rows;
    if (!rows.length) continue;
    lines.push(s.kind === "assessment" ? `${s.title.toUpperCase()}: needs follow-up` : s.title.toUpperCase());
    for (const r of rows) {
      lines.push(`- ${r.label}: ${r.value}${hasRemark(r.remark) ? ` (${r.remark})` : ""}`);
      for (const x of r.extras ?? []) lines.push(`    ${x.label}: ${x.value}`);
    }
    lines.push("");
  }
  if (meta.portalUrl) lines.push(`Open in Submissions Hub: ${meta.portalUrl}`);
  return lines.join("\n").trim();
}

/** The Submissions Hub portal for this form, from the ingest URL (…/api/ingest/<portal>). */
export function portalUrlFromIngest(ingestUrl: string | undefined): string | undefined {
  try {
    if (!ingestUrl) return undefined;
    const u = new URL(ingestUrl);
    const m = u.pathname.match(/\/api\/ingest\/([^/]+)/);
    return m ? `${u.origin}/p/${m[1]}` : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Rebuilds the sections of the review page from the flat `{ "<Sheet heading>": "<value>" }` payload the
 * form sends ("Yes, Remarks: No Remarks"), so the email reads like the form did. Anything the form
 * doesn't know about is listed under "Other details" rather than dropped.
 */
export function reportFromPayload(payload: Record<string, unknown>): EmailSection[] {
  const text = (k: string) => (typeof payload[k] === "string" ? (payload[k] as string).trim() : payload[k] == null ? "" : String(payload[k]));
  const used = new Set<string>();
  const field = (label: string, key: string): EmailRow | null => {
    used.add(key);
    const v = text(key);
    return v ? { label, value: v } : null;
  };
  const rowsOf = (defs: { label: string; sheetLabel: string }[]) => defs.map((d) => field(d.label, d.sheetLabel)).filter((r): r is EmailRow => !!r);

  const sections: EmailSection[] = [{ title: "Details", kind: "fields", rows: [...(field("Date", "Date") ? [field("Date", "Date")!] : []), ...rowsOf(PARTICIPANT_FIELDS)] }];

  for (const s of ASSESSMENT_SECTIONS) {
    const rows: EmailRow[] = [];
    s.questions.forEach((q, i) => {
      used.add(q.sheetLabel);
      const raw = text(q.sheetLabel);
      if (!raw) return;
      const m = raw.match(/^(Yes|No),\s*Remarks:\s*([\s\S]*)$/);
      const answer = m?.[1] ?? raw;
      const extras = Object.keys(payload)
        .filter((k) => k.startsWith(`${q.sheetLabel} — `))
        .map((k) => (used.add(k), { label: k.slice(q.sheetLabel.length + 3), value: text(k) }));
      rows.push({ label: `${i + 1}. ${q.sheetLabel}`, value: answer, remark: m?.[2]?.trim(), flagged: (answer === "Yes" || answer === "No") && answer !== (q.expected ?? "Yes"), ...(extras.length ? { extras } : {}) });
    });
    if (rows.length) sections.push({ title: s.title, kind: "assessment", rows });
  }

  const vehicle = rowsOf(VEHICLE_FIELDS);
  if (vehicle.length) sections.push({ title: "Vehicle Details", kind: "fields", rows: vehicle });

  const other = Object.keys(payload).filter((k) => !used.has(k) && text(k)).map((k) => ({ label: k, value: text(k) }));
  if (other.length) sections.push({ title: "Other details", kind: "fields", rows: other });
  return sections;
}
