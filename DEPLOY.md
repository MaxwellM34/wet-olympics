# Deploying Wet Olympics

Two steps: provision a Postgres URL, then deploy on Vercel.

## 1. Get a `DATABASE_URL`

### Option A — Vercel-native (recommended, fastest)

1. In your Vercel project → **Storage** → **Create database** → **Neon** (or "Postgres").
2. Vercel auto-creates `POSTGRES_URL` env vars across all environments.
3. Set `DATABASE_URL = $POSTGRES_URL` (or alias in env).

### Option B — Existing VPS Postgres (already set up)

The VPS already has an isolated `wet_olympics` database + user (created in this build session). Connection string:

```
postgres://wet_olympics:<password>@<vps-ip>:5432/wet_olympics?sslmode=require
```

For Vercel to reach it, you must open port 5432 on the VPS firewall:

```bash
ssh peptpal "ufw allow 5432/tcp && ufw reload"
```

Then bind the docker postgres to all interfaces (currently bound to 127.0.0.1 only — for local SSH-tunnel dev). Edit `/opt/peptpal/backend/docker-compose.yml` on the VPS, change `"127.0.0.1:5432:5432"` to `"5432:5432"` under the `db:` service, then:

```bash
ssh peptpal "cd /opt/peptpal/backend && docker compose up -d db"
```

⚠ Risk: this exposes peptpal's postgres to the public internet. The `wet_olympics` user is scoped to its own DB (cannot read peptpal data), but the `peptpal` superuser is still reachable — strongly recommend rotating the peptpal password before opening the port.

(Password for the wet_olympics user is in `.env.local` on dev machine.)

## 2. Deploy on Vercel

```bash
# One time
npm i -g vercel
vercel login          # interactive — pick GitHub
cd /home/max/workspace/wet/olympics
vercel link           # → New project → wet-olympics
```

Then set env vars (Vercel dashboard → Settings → Environment Variables, or via CLI):

```bash
vercel env add DATABASE_URL production       # paste connection string
vercel env add ADMIN_USER production         # paste: admin
vercel env add ADMIN_PASS production         # paste: wetparty2026 (or your choice)
vercel env add ADMIN_JWT_SECRET production   # paste: openssl rand -base64 32
vercel env add INIT_TOKEN production         # paste: openssl rand -hex 16
vercel env add TZ production                 # paste: Asia/Bangkok
```

Deploy:

```bash
vercel --prod
```

After first deploy, initialize the DB schema (one time):

```bash
curl -X POST https://<your-domain>/api/init-db -H "x-init-token: $INIT_TOKEN"
```

That's it — visit `/` to sign teams up, `/admin` to manage, `/qr` for the joining QR.
