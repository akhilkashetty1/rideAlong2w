/**
 * Form state, validation, and the two things built from it: the review report and the
 * flat `{ "<Sheet heading>": "<value>" }` payload the backend saves.
 *
 * Pure functions with no React or Node imports, so the wizard and the tests share them.
 * The payload format (`"Yes, Remarks: No Remarks"` and the exact headings) is the
 * contract with the Google Sheet and the submissions hub: it must not change.
 */
import {
  ASSESSMENT_SECTIONS,
  FORM_META,
  PARTICIPANT_FIELDS,
  VEHICLE_FIELDS,
  type FieldDef,
  type YesNo,
} from "@/lib/form-content";

export type Answer = {
  answer?: YesNo;
  remark: string;
  /** Follow-up details (e.g. valid-till dates as YYYY-MM-DD), keyed by follow-up field id. */
  details?: Record<string, string>;
};

export type FormState = {
  fields: Record<string, string>;
  /** Keyed `${sectionId}.${questionId}`. */
  answers: Record<string, Answer>;
  confirmed: boolean;
};

export type Errors = Record<string, string>;

export const answerKey = (sectionId: string, questionId: string) => `${sectionId}.${questionId}`;
export const detailKey = (key: string, fieldId: string) => `${key}.${fieldId}`;

/* ---------------------------------------------------------------- dates */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in India, as YYYY-MM-DD (what a date picker gives). */
export const todayIST = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

/** A real calendar date in YYYY-MM-DD form (rejects 2026-02-31 and the like). */
export const isIsoDate = (v: string) => ISO_DATE.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

/** "2027-03-05" → "05 Mar 2027". */
export function formatIsoDate(iso: string) {
  if (!isIsoDate(iso)) return iso;
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Why a valid-till date can't be accepted, or null. A date in the past means the document has expired. */
export function validTillProblem(v: string, today: string): string | null {
  if (!v) return "Pick the date";
  if (!isIsoDate(v)) return "Pick a valid date";
  if (v < today) return "This date has passed. If the document has expired, answer No";
  if (Number(v.slice(0, 4)) > Number(today.slice(0, 4)) + 40) return "Pick a valid date";
  return null;
}

/* ---------------------------------------------------------------- steps */

/** Participant details sit at the top of the first assessment step, as before. */
export type Step =
  | { kind: "assessment"; key: string; label: string; sectionId: string; withParticipant: boolean }
  | { kind: "vehicle"; key: "vehicle-details"; label: string }
  | { kind: "review"; key: "review"; label: string };

export const STEPS: Step[] = [
  ...ASSESSMENT_SECTIONS.map(
    (s, i): Step => ({ kind: "assessment", key: `section-${s.id}`, label: s.stepLabel, sectionId: s.id, withParticipant: i === 0 }),
  ),
  { kind: "vehicle", key: "vehicle-details", label: "Vehicle Details" },
  { kind: "review", key: "review", label: "Review" },
];

/* --------------------------------------------------------------- fields */

const ALL_FIELDS = [...PARTICIPANT_FIELDS, ...VEHICLE_FIELDS];

export function fieldOptions(field: FieldDef, fields: Record<string, string>): string[] {
  if (field.kind === "text") return [];
  if (Array.isArray(field.options)) return field.options;
  return field.options.map[fields[field.options.dependsOn]] ?? [];
}

export function isVisible(field: FieldDef, fields: Record<string, string>) {
  return !field.showIf || fields[field.showIf.field] === field.showIf.equals;
}

/** Sets a field and clears any select whose options depend on it and no longer include its value. */
export function applyFieldChange(fields: Record<string, string>, id: string, value: string) {
  const next = { ...fields, [id]: value };
  for (const f of ALL_FIELDS) {
    if (f.kind !== "select" || Array.isArray(f.options) || f.options.dependsOn !== id) continue;
    if (!fieldOptions(f, next).includes(next[f.id])) next[f.id] = "";
  }
  return next;
}

export function initialState(): FormState {
  const fields: Record<string, string> = {};
  // Everything starts empty, drop-downs and Yes/No included, so every answer is a deliberate choice.
  for (const f of ALL_FIELDS) fields[f.id] = "";
  const answers: Record<string, Answer> = {};
  for (const s of ASSESSMENT_SECTIONS) {
    for (const q of s.questions) {
      answers[answerKey(s.id, q.id)] = { answer: FORM_META.prefillExpectedAnswers ? (q.expected ?? "Yes") : undefined, remark: "" };
    }
  }
  return { fields, answers, confirmed: false };
}

/* ----------------------------------------------------------- validation */

function validateFields(defs: FieldDef[], fields: Record<string, string>, errors: Errors) {
  for (const f of defs) {
    if (!isVisible(f, fields)) continue;
    const v = (fields[f.id] ?? "").trim();
    if (f.required && !v) errors[f.id] = f.kind === "text" ? "This field is mandatory" : "Please choose one";
    else if (v && f.kind !== "text" && !fieldOptions(f, fields).includes(v)) errors[f.id] = "Choose one of the options";
  }
}

export function validateStep(step: Step, state: FormState, today = todayIST()): Errors {
  const errors: Errors = {};
  if (step.kind === "assessment") {
    if (step.withParticipant) validateFields(PARTICIPANT_FIELDS, state.fields, errors);
    const section = ASSESSMENT_SECTIONS.find((s) => s.id === step.sectionId)!;
    for (const q of section.questions) {
      const key = answerKey(section.id, q.id);
      const a = state.answers[key];
      if (!a?.answer) {
        errors[key] = "Choose Yes or No";
        continue;
      }
      if (q.followUp && a.answer === q.followUp.when) {
        for (const f of q.followUp.fields) {
          const problem = validTillProblem(a.details?.[f.id] ?? "", today);
          if (problem) errors[detailKey(key, f.id)] = problem;
        }
      }
    }
  }
  if (step.kind === "vehicle") {
    validateFields(VEHICLE_FIELDS, state.fields, errors);
    if (!state.confirmed) errors.confirmed = "Please tick the checkbox";
  }
  return errors;
}

export function validateAll(state: FormState, today = todayIST()): Errors {
  return Object.assign({}, ...STEPS.map((s) => validateStep(s, state, today)));
}

/* --------------------------------------------------------------- report */

/** `DD/MM/YYYY`, the format the Sheet has always received. */
export const formatDate = (d: Date) => d.toLocaleDateString("en-GB");

export const NOT_PROVIDED = "Not Provided";
export const NO_REMARKS = "No Remarks";

export type ReportRow = {
  label: string;
  value: string;
  /** Assessment rows only. */
  remark?: string;
  flagged?: boolean;
  /** Follow-up details shown under the answer, each with its own Sheet column. */
  extras?: { label: string; value: string }[];
};
export type ReportSection = { title: string; kind: "fields" | "assessment"; rows: ReportRow[] };

function fieldRows(defs: FieldDef[], fields: Record<string, string>): { def: FieldDef; value: string }[] {
  return defs.filter((f) => isVisible(f, fields)).map((f) => ({ def: f, value: (fields[f.id] ?? "").trim() || NOT_PROVIDED }));
}

export function buildReport(state: FormState, date = new Date()): ReportSection[] {
  return [
    {
      title: "Details",
      kind: "fields",
      rows: [{ label: "Date", value: formatDate(date) }, ...fieldRows(PARTICIPANT_FIELDS, state.fields).map(({ def, value }) => ({ label: def.label, value }))],
    },
    ...ASSESSMENT_SECTIONS.map(
      (s): ReportSection => ({
        title: s.title,
        kind: "assessment",
        rows: s.questions.map((q, i) => {
          const a = state.answers[answerKey(s.id, q.id)];
          return {
            label: `${i + 1}. ${q.sheetLabel}`,
            value: a?.answer ?? "Not answered",
            remark: a?.remark.trim() || NO_REMARKS,
            flagged: !!a?.answer && a.answer !== (q.expected ?? "Yes"),
            ...(q.followUp && a?.answer === q.followUp.when
              ? { extras: q.followUp.fields.map((f) => ({ label: f.label, value: a.details?.[f.id] ? formatIsoDate(a.details[f.id]) : NOT_PROVIDED })) }
              : {}),
          };
        }),
      }),
    ),
    {
      title: "Vehicle Details",
      kind: "fields",
      rows: fieldRows(VEHICLE_FIELDS, state.fields).map(({ def, value }) => ({ label: def.label, value })),
    },
  ];
}

export const countFlagged = (report: ReportSection[]) => report.reduce((n, s) => n + s.rows.filter((r) => r.flagged).length, 0);

/* -------------------------------------------------------------- payload */

/**
 * The flat object sent to /api/submit-to-sheets: `{ "<Sheet heading>": "<value>" }`, in the order
 * the Sheet has always had: details, vehicle assessment, rider assessment, vehicle details.
 * Assessment answers look like "Yes, Remarks: No Remarks".
 *
 * Questions added later that carry follow-up details (the documents question and its two valid-till
 * dates) come LAST, after the vehicle details, so every column the Sheet already had keeps its
 * position even if the Sheet script maps columns by order. The dates are plain text like "05 Mar 2027",
 * under "<question> — <label>", and only present when the answer was Yes.
 */
export function buildPayload(state: FormState, date = new Date()): Record<string, string> {
  const out: Record<string, string> = { Date: formatDate(date) };
  const answerValue = (key: string) => {
    const a = state.answers[key];
    return `${a?.answer ?? "Yes"}, Remarks: ${a?.remark.trim() || NO_REMARKS}`;
  };
  for (const { def, value } of fieldRows(PARTICIPANT_FIELDS, state.fields)) out[def.sheetLabel] = value;
  for (const s of ASSESSMENT_SECTIONS) {
    for (const q of s.questions) if (!q.followUp) out[q.sheetLabel] = answerValue(answerKey(s.id, q.id));
  }
  for (const { def, value } of fieldRows(VEHICLE_FIELDS, state.fields)) out[def.sheetLabel] = value;
  for (const s of ASSESSMENT_SECTIONS) {
    for (const q of s.questions) {
      if (!q.followUp) continue;
      const key = answerKey(s.id, q.id);
      out[q.sheetLabel] = answerValue(key);
      if (state.answers[key]?.answer === q.followUp.when) {
        for (const f of q.followUp.fields) {
          const v = state.answers[key]?.details?.[f.id];
          out[`${q.sheetLabel} — ${f.label}`] = v ? formatIsoDate(v) : NOT_PROVIDED;
        }
      }
    }
  }
  return out;
}

/** Sheet headings of answers that need follow-up (not what the question expects), for the hub's red flags. */
export function flaggedHeadings(payload: Record<string, unknown>): string[] {
  const flagged: string[] = [];
  for (const s of ASSESSMENT_SECTIONS) {
    for (const q of s.questions) {
      const v = payload[q.sheetLabel];
      if (typeof v !== "string") continue;
      const answer = v.startsWith("Yes,") ? "Yes" : v.startsWith("No,") ? "No" : null;
      if (answer && answer !== (q.expected ?? "Yes")) flagged.push(q.sheetLabel);
    }
  }
  return flagged;
}
