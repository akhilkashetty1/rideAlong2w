# Two Wheeler Ride Along Form

Line-manager ride-along assessment for **two wheelers** ([ride-along-form.in](https://ride-along-form.in)).
Sibling of the 4W form ([rideAlong4w](https://github.com/akhilkashetty1/rideAlong4w)) and RoadShield, and built the same way:
**one Next.js app on Vercel, frontend and backend together.** No separate server, no Render.

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Form screens | `src/components/*`, the original screens and CSS, unchanged |
| Backend | `app/api/submit-to-sheets/route.js` (was the Express server on Render) |
| Saves to | Google Sheet (Apps Script) + submissions hub (database + admin), Brevo email |
| Hosting | Vercel |

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
```

## Environment variables

All are optional. With none set, the form writes to the same Google Sheet the Render
backend used, so behaviour is unchanged. See `.env.example`.

| Variable | Purpose |
|---|---|
| `GOOGLE_SHEET_WEBAPP_URL` | Apps Script Web App (defaults to the existing Sheet) |
| `BREVO_API_KEY` | Notification email; without it no email is sent. **Use a new key.** |
| `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` / `ADMIN_EMAIL_PRIMARY` / `ADMIN_EMAIL_CC` | Email addresses (default to the previous ones) |
| `HUB_INGEST_URL` / `HUB_INGEST_KEY` | Submissions hub: `https://<hub-domain>/api/ingest/2w` and the hub's `INGEST_KEY_2W` |

## How a submission is saved

The review page posts the form to `/api/submit-to-sheets`. The route writes to the Sheet
and the hub **in parallel** and sends the email. The entry counts as saved if **either** the
Sheet or the hub accepted it, so one service being down no longer loses data.

## Project structure

```
app/
  layout.js, page.js          Next.js shell around the original form
  api/submit-to-sheets/       the backend (Sheet + hub + email)
src/
  App.js
  components/                 the form screens and their CSS (formerly src/pages)
  assets/                     cover, thank-you and watermark images
public/Favicon.ico
```

`src/pages` was renamed to `src/components` because Next.js reserves a `pages` folder for routes.

## Deploying

1. Import this repo into Vercel (framework auto-detected as Next.js) and add the env vars.
2. Check the Vercel preview URL end to end.
3. In Vercel → Settings → Domains, add `ride-along-form.in` and update the DNS records
   as Vercel shows. Until DNS switches, the old GitHub Pages site + Render keep working.
4. After the domain is live on Vercel, the Render service (`rideAlongBackend`) can be shut down.
