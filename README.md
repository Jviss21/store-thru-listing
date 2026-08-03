# Hammoq — Store thru Listing

Customer pilot UI for **10 orgs** (including **Test Goodwill**): store intake → products → marketplace listings → orders, powered by **hammoq / Infinity AI** (Auto-List only).

**Live demo:** https://store-thru-listing.vercel.app  
**Login:** https://store-thru-listing.vercel.app/login  
**Pilot password:** `testgoodwill` (all seeded users; override with `DEMO_PASSWORD`)  
**Ops:** `ops@hammoq.example` → `/ops`

Phase 1 ships **real auth + multi-tenant schema**. Inventory/listings remain mock adapters until marketplace APIs. See [PILOT.md](./PILOT.md).

## Run locally

```bash
npm install
cp .env.example .env.local
# edit .env.local — DATABASE_URL, NEXTAUTH_SECRET
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000/login — e.g. `john.doe@testgoodwill.example` / `testgoodwill`.

## Deploy (Vercel)

```bash
npx vercel env add NEXTAUTH_SECRET production
npx vercel env add NEXTAUTH_URL production   # https://store-thru-listing.vercel.app
npx vercel env add DEMO_PASSWORD production  # optional; defaults to testgoodwill
# Optional Postgres later:
# npx vercel env add DATABASE_URL production

npx vercel --prod --yes
```

Auth works on Vercel **without** `DATABASE_URL` via the seeded user module. Add Postgres when you want durable org/user rows.

## Seeded users

| Email | Role | Orgs |
|-------|------|------|
| `john.doe@testgoodwill.example` | Ops Lead | Test Goodwill |
| `admin@{slug}.example` | Admin | Matching pilot org |
| `ops@hammoq.example` | Hammoq Ops | All 10 |

Password for all: `testgoodwill` (or `DEMO_PASSWORD`).

## What’s included

| Area | Routes |
|------|--------|
| Login | `/login` |
| Home dashboard | `/` |
| Item Creation | `/manifests`, … |
| Products / Auto-List | `/products`, `/products/auto-list` |
| Listings | `/listings/shopgoodwill`, `/listings/ebay` |
| Orders / Shipments | `/orders`, `/shipments` |
| Connections | `/settings/connections` |
| Customer Admin | `/admin/*` |
| Hammoq Ops | `/ops` |

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXTAUTH_SECRET` | Prod | JWT signing secret |
| `NEXTAUTH_URL` | Prod | Public site URL |
| `DEMO_PASSWORD` | Recommended | Shared pilot password |
| `DATABASE_URL` | Local / optional prod | `file:./dev.db` or Postgres URL |

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run db:push` | Apply Prisma schema (SQLite/Postgres) |
| `npm run db:seed` | Seed 10 orgs + users |
| `npm run db:studio` | Prisma Studio |
