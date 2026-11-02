/**
 * Is this form taking submissions? An admin switches it in the submissions hub (Forms); the hub answers
 * at <hub>/api/form-status/2w. If the hub can't be reached the form stays OPEN: a hub outage must never
 * take the form down.
 */
const FORM_ID = "2w";

export type FormGate = { open: boolean; title: string; message: string };

const OPEN: FormGate = { open: true, title: "", message: "" };

function statusUrl() {
  const ingest = process.env.HUB_INGEST_URL;
  if (!ingest) return null;
  try {
    return `${new URL(ingest).origin}/api/form-status/${FORM_ID}`;
  } catch {
    return null;
  }
}

/** `fresh` skips the 10-second cache: used when someone is submitting and by "Check again". */
export async function formGate({ fresh = false } = {}): Promise<FormGate> {
  const url = statusUrl();
  if (!url) return OPEN;
  try {
    const res = await fetch(url, { ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 10 } }), signal: AbortSignal.timeout(2500) });
    if (!res.ok) return OPEN;
    const body = await res.json();
    return body.open === false ? { open: false, title: String(body.title ?? ""), message: String(body.message ?? "") } : OPEN;
  } catch {
    return OPEN;
  }
}
