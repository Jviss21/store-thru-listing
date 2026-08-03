# Hammoq — Store thru Listing

Customer pilot UI for **10 orgs** (including **Test Goodwill**): store intake → products → marketplace listings → orders, powered by **hammoq / Infinity AI** (Auto-List only).

**Live demo:** https://store-thru-listing.vercel.app  
**Access password:** `testgoodwill` (override with `DEMO_PASSWORD` env)  
**Ops:** `/ops` (unlock with demo password or email containing `hammoq`)

All numbers and records are **illustrative demo data** — mock API adapters only. See [PILOT.md](./PILOT.md) and [LAUNCH.md](./LAUNCH.md).

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000 — enter the demo password when prompted.

## Deploy (Vercel)

```bash
# Set production password (once)
npx vercel env add DEMO_PASSWORD production

# Production deploy
npx vercel --prod --yes
```

Project is already linked under Vercel as `store-thru-listing`.

## What’s included

| Area | Routes |
|------|--------|
| Home dashboard | `/` |
| Item Creation | `/manifests`, `/manifests/new`, `/manifests/[id]` |
| Products | `/products`, `/products/new`, `/products/draft`, `/products/scan-book`, `/products/auto-list`, `/products/[id]` |
| Listings | `/listings/shopgoodwill`, `/listings/ebay` |
| Orders / Shipments | `/orders`, `/shipments` |
| Reports | `/reports/*` (CSV/JSON downloads) |
| Connections / Settings | `/settings/connections`, `/settings`, `/settings/printer` |
| Customer Admin | `/admin/*` |
| Hammoq Ops (staff) | `/ops` |

Suggested walkthrough: **Home → Auto-List → Listings → Connections → Ops**.

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `DEMO_PASSWORD` | Recommended for prod | Server-only. Defaults to `testgoodwill` if unset. Never use `NEXT_PUBLIC_*` for this. |
