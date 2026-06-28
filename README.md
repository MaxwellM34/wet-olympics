# Wet Olympics 💦

5-game tournament app for Wet Party Hostel, Haad Rin.

Games: Pool Volleyball · Beer Pong · Billiards · Table Tennis · Basketball.

Players scan a QR, sign their team up, and watch live brackets.
The host runs the admin panel to mark winners and tweak anything in real time.

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind + Framer Motion
- Postgres (schema `wet_olympics`)
- Single user/pass admin auth (cookie-session)

## Setup

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, ADMIN_USER, ADMIN_PASS, ADMIN_JWT_SECRET, INIT_TOKEN
npm install
npm run dev
```

Then initialize the DB schema (one time):

```bash
curl -X POST http://localhost:3000/api/init-db -H "x-init-token: $INIT_TOKEN"
```

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it on vercel.com → New Project.
3. Set env vars (same as `.env.example`).
4. After first deploy: `curl -X POST https://<your-domain>/api/init-db -H "x-init-token: $INIT_TOKEN"`.

## How games work

Each tournament is scoped to a calendar **event date**. By default the app uses today.
Per event:
- Players sign up teams for each of the 5 games.
- Admin marks teams paid (100 ฿/player on game day) — unpaid teams stay on the bracket until the admin manually removes them at game start.
- Admin generates the bracket per game when ready.
- Admin sets winners as matches finish — winners auto-advance to the next round unless the admin has locked a downstream slot.

## Admin

- Login at `/admin`. Single user/pass from env.
- Master schedule editor for each event date — change times and game order.
- Per-game bracket editor — every team slot, winner, and status is independently editable.
- Setting any field manually flips a `locked_*` flag so auto-advance won't clobber the override.

## Layout

- `app/` — routes (Next.js App Router)
- `components/` — UI (mostly client components)
- `lib/games.ts` — the 5 games + default schedule + rules
- `lib/db.ts` — pg pool
- `lib/auth.ts` — admin session
- `lib/bracket.ts` — bracket generator + auto-advance
- `lib/schema.sql` — Postgres schema
