import { NextResponse } from "next/server";
import { flaggedHeadings } from "@/lib/submission";

/**
 * POST /api/submit-to-sheets — formerly the Express server on Render
 * (rideAlongBackend/index.js), now part of this app on Vercel.
 *
 * Same contract as before: the review page sends the flat
 * { "<question>": "<answer, Remarks: ...>" } object and gets back JSON with
 * `result: "success"` when the entry was saved.
 *
 * It's saved to every configured place in parallel:
 *   - the Google Sheet (Apps Script Web App, unchanged)
 *   - the submissions hub (database + admin login), if HUB_INGEST_URL/KEY are set
 *   - a Brevo notification email, if BREVO_API_KEY is set
 * The entry counts as saved if the Sheet or the hub accepted it.
 */

// Defaults are the values the Render backend used, so nothing changes if the env vars aren't set.
const GOOGLE_SHEET_WEBAPP_URL =
  process.env.GOOGLE_SHEET_WEBAPP_URL ||
  "https://script.google.com/macros/s/AKfycbx-vWHsNFf9k-EGwWcDfFr8pqVKmP28yVzSiOdccEWPytbM0ts00-7aHW0s4WYguK6o/exec";
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "ridealongform.project@gmail.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "RideAlongForm";
const ADMIN_EMAIL_PRIMARY = process.env.ADMIN_EMAIL_PRIMARY || "ridealongform@gmail.com";

const MAX_BYTES = 200_000;

type FormData = Record<string, unknown>;

const escapeHtml = (s: unknown) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function saveToSheet(formData: FormData) {
  const res = await fetch(GOOGLE_SHEET_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body) throw new Error(`Google Sheets responded ${res.status}`);
  return body; // The Apps Script's own reply, e.g. { result: "success" }
}

async function saveToHub(formData: FormData) {
  const url = process.env.HUB_INGEST_URL;
  const key = process.env.HUB_INGEST_KEY;
  if (!url || !key) return null;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-hub-key": key },
    // The flat answers as the Sheet gets them, plus which answers need follow-up (shown red in the hub) and when.
    body: JSON.stringify({ fields: formData, flagged: flaggedHeadings(formData), submittedAt: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Hub responded ${res.status}: ${await res.text().catch(() => "")}`);
  return true;
}

async function sendEmail(formData: FormData) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  const lines = Object.entries(formData)
    .map(([key, value]) => `<strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}`)
    .join("<br>");
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { accept: "application/json", "api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email: ADMIN_EMAIL_PRIMARY }],
      ...(process.env.ADMIN_EMAIL_CC ? { cc: [{ email: process.env.ADMIN_EMAIL_CC }] } : {}),
      subject: "Form Submission Notification",
      htmlContent: `<html><body><strong>A new form submission has been received:</strong><br>${lines}</body></html>`,
    }),
  });
  if (!res.ok) throw new Error(`Brevo responded ${res.status}: ${await res.text().catch(() => "")}`);
  return true;
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "Submission too large" }, { status: 413 });

  let formData: FormData;
  try {
    formData = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  if (!formData || typeof formData !== "object" || Array.isArray(formData) || !Object.keys(formData).length) {
    return NextResponse.json({ error: "Expected the form's fields as a JSON object" }, { status: 400 });
  }

  const [sheet, hub, email] = await Promise.allSettled([saveToSheet(formData), saveToHub(formData), sendEmail(formData)]);
  const outcomes: [string, PromiseSettledResult<unknown>][] = [["Google Sheets", sheet], ["Hub", hub], ["Email", email]];
  for (const [name, r] of outcomes) {
    if (r.status === "rejected") console.error(`submit-to-sheets: ${name} failed`, r.reason);
  }

  // The Apps Script answers 200 even when it fails internally; only its own "success" counts.
  const sheetOk = sheet.status === "fulfilled" && sheet.value?.result === "success";
  if (sheet.status === "fulfilled" && !sheetOk) console.error("submit-to-sheets: Google Sheets replied", sheet.value);
  const hubOk = hub.status === "fulfilled" && hub.value === true;

  if (!sheetOk && !hubOk) {
    return NextResponse.json({ error: "Failed to submit data to Google Sheets" }, { status: 500 });
  }

  // Same reply as the Render backend (the Apps Script's own JSON). If only the hub saved it,
  // still report success so the line manager isn't told their entry was lost.
  return NextResponse.json({
    ...(sheetOk ? sheet.value : {}),
    result: "success",
    saved: { sheet: sheetOk, hub: hubOk, email: email.status === "fulfilled" && email.value === true },
  });
}
