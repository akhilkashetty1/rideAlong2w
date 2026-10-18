# Two Wheeler Ride Along Form

Line-manager ride-along assessment for **two wheelers** ([ride-along-form.in](https://ride-along-form.in)).
Sibling of the 4W form ([rideAlong4w](https://github.com/akhilkashetty1/rideAlong4w)) and RoadShield, and built the same way:
**one Next.js app on Vercel, frontend and backend together.** No separate server, no Render.

## The 2W experience

The look is the 2W form's own: white page, black outer / red inner frame, lime `#cedb28` buttons and headings,
orange Previous buttons, the same cover poster, watermark and thank-you image. The screens and interactions are
shared with the 4W form.

| Screen | What it does |
|---|---|
| Cover (`/`) | The poster over a live 3D road (lime lane grid, red centre line) drawn on the white page, and a push-to-start **START** button: the gauges sweep and the warning lamps do a bulb check before it moves on. |
| Guidelines (`/guidelines/vehicle`, `/guidelines/rider`) | The two guideline tables in the original style (lime header, black lines); stacked cards on phones. |
| Assessment (`/assessment`) | One wizard: **Vehicle Assessment** (with HQ / Name / Team / Line Manager at the top) → **Rider Safety** → **Vehicle Details** → **Review**. An instrument cluster shows a speedometer for progress, the three steps, a 3D handlebar that turns as you go, and warning lamps that light for flagged answers. |
| Vehicle Assessment | A 3D **walkaround motorcycle** beside the questions. Every question is a numbered pin on its part (tyres, speedometer, fuel tank, mirrors, brake disc, horn, start button, key, seat, stands, number plate). The bike turns to the question you're on and that part demonstrates itself. Drag to spin. |
| Rider Assessment | The questions sit along a road; a top-view motorcycle rides to the active question, answered checks leave a lime cat's-eye, flagged ones a hazard triangle. |
| Review | A plain summary of every answer (remarks included), then Print, Download as PDF and Submit. |
| Thank you | The same thank-you image. If saving fails the form says so and keeps every answer so Submit can be pressed again (the old form showed "thank you" even when saving failed). |

### Every answer is a deliberate choice

At the client's request nothing is pre-filled (`FORM_META.prefillExpectedAnswers: false`):

- Every Yes/No starts with neither button chosen, and **Next** is refused until all of a step's questions are
  answered. Unanswered cards have a dashed border; on a refused Next they turn red, a banner counts them and the page
  scrolls to the first one. Each step shows "X of Y answered", and a first answer glides to the next unanswered
  question. Remarks stay optional.
- Vehicle Details starts blank: Primary Vehicle and Fuel Type start on "Select…", Manufacturer and Model are
  required, and "Do you use a Secondary Vehicle?" starts with neither Yes nor No. Yes opens the secondary vehicle
  fields, which are then all required. Changing the vehicle type clears a fuel choice that no longer fits.
- Flagged answers (anything but the expected one: **No** normally, **Yes** for "sleepy" and "mobile phone") show red
  on the question, the road, the review and the lamps.

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| 3D | three.js (loaded only on the pages that use it; the questions work without WebGL) |
| Backend | `app/api/submit-to-sheets/route.ts` (was the Express server on Render) |
| Saves to | Google Sheet (Apps Script) + submissions hub (database + admin), Brevo email |
| Hosting | Vercel |

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
```

Submitting from a local run writes to the **real** Google Sheet unless `GOOGLE_SHEET_WEBAPP_URL` points
somewhere else (see below). Point it at a test URL, or don't press Submit on real data.

## Environment variables

All are optional. With none set, the form writes to the same Google Sheet the Render backend used. See `.env.example`.

| Variable | Purpose |
|---|---|
| `GOOGLE_SHEET_WEBAPP_URL` | Apps Script Web App (defaults to the existing Sheet) |
| `BREVO_API_KEY` | Notification email; without it no email is sent. **Use a new key.** |
| `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` / `ADMIN_EMAIL_PRIMARY` / `ADMIN_EMAIL_CC` | Email addresses (default to the previous ones) |
| `HUB_INGEST_URL` / `HUB_INGEST_KEY` | Submissions hub: `https://<hub-domain>/api/ingest/2w` and the hub's `INGEST_KEY_2W` |

## How a submission is saved

The review page posts a flat object to `/api/submit-to-sheets`: `{ "<Sheet heading>": "<value>" }`, e.g.
`"Is the horn functioning properly?": "No, Remarks: Sounds weak"`. The route writes to the Sheet and the hub **in
parallel** and sends the email. The entry counts as saved if **either** the Sheet or the hub accepted it, so one
service being down no longer loses data. For the hub it also sends which answers are flagged (red in the hub) and
the time.

**The Sheet contract must not change.** The headings (`sheetLabel` in `lib/form-content.ts`), their order and the
`"Yes, Remarks: No Remarks"` value format are exactly what the old form sent: `lib/submission.ts → buildPayload` is
tested against the old form's own code for 300 random forms (identical keys, order and values), so existing Sheet
columns and the hub keep lining up. Changing a `sheetLabel` starts a new column.

## Project structure

```
app/
  layout.tsx, globals.css       theme (the 2W palette), fonts
  page.tsx                      cover + 3D road + START
  guidelines/[section]/         vehicle and rider guideline tables
  assessment/                   the wizard
  api/submit-to-sheets/         the backend (Sheet + hub + email)
components/
  form/                         wizard, question cards, review, rider road, lamps, instrument cluster
  three/                        WalkaroundBike, Handlebar3D, RoadBackdrop (three.js)
  IgnitionButton, FramedCard, GuidelinesTable, Buttons, BikeWheel
lib/
  form-content.ts               EVERY word: questions, guidelines, fields, Sheet headings
  submission.ts                 state, validation, review report, the Sheet payload
  question-visuals.tsx          which lamp icon and which bike part each question uses
  pdf.ts                        Download as PDF
public/images/                  cover, thank-you and watermark (unchanged artwork)
```

**Editing the form:** change questions, guidelines or fields in `lib/form-content.ts`. The guidelines pages, the
form, the review, the PDF and the Sheet row are all generated from it. Keep each `sheetLabel` as it is unless the
Sheet is being changed on purpose.

## Deploying

1. Import this repo into Vercel (framework auto-detected as Next.js) and add the env vars.
2. Check the Vercel preview URL end to end. **A preview submission goes to the same Google Sheet** unless
   `GOOGLE_SHEET_WEBAPP_URL` is set to something else for the Preview environment.
3. `ride-along-form.in` is attached under Vercel → Settings → Domains.
