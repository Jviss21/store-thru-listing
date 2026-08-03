# Hammoq — Store thru Listing

Customer pilot UI for **Test Goodwill**: store intake → products → marketplace listings → orders, powered by **hammoq / Infinity AI**.

**Live demo:** https://store-thru-listing.vercel.app  
**Access password:** `testgoodwill` (override with `DEMO_PASSWORD` env)

All numbers and records are **illustrative demo data** — no live database or marketplace APIs yet. See [LAUNCH.md](./LAUNCH.md) for what remains before true production.

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

## GitHub (if not connected yet)

`gh` may not be on PATH on every machine. From this folder:

```powershell
# Install GitHub CLI if needed, then:
gh auth login
gh repo create hammoq/store-thru-listing --private --source=. --remote=origin --push
```

Or without `gh`:

```powershell
# Create an empty private repo on GitHub, then:
git remote add origin https://github.com/<org>/store-thru-listing.git
git push -u origin master
```

## What’s included

| Area | Routes |
|------|--------|
| Home dashboard | `/` |
| Item Creation | `/manifests`, `/manifests/new`, `/manifests/[id]` |
| Products | `/products`, `/products/new`, `/products/draft`, `/products/scan-book`, `/products/auto-list`, `/products/[id]` |
| Listings | `/listings/shopgoodwill`, `/listings/ebay` |
| Orders / Shipments | `/orders`, `/shipments` |
| Reports | `/reports/*` (CSV/JSON downloads) |
| Settings / Printer / Notifications | `/settings`, `/settings/printer`, `/notifications` |

Suggested walkthrough: **Home → Auto-List → Listings → Orders → Reports**.

## Environment

| Variable | Required | Notes |
|----------|----------|-------|
| `DEMO_PASSWORD` | Recommended for prod | Server-only. Defaults to `testgoodwill` if unset. Never use `NEXT_PUBLIC_*` for this. |
