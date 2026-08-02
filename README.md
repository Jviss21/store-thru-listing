# Hammoq — Store thru Listing

Clickable inventory UI prototype covering the full **store → listing** pipeline, based on:

- Your walkthrough video (item creation / store intake → accept/reject → product → marketplace list)
- Your 23-page inventory management PDF (Home, Products, Listings, Item Creation, Orders, Shipments, Reports, Settings, Notifications)

All numbers and records are **fake demo data** — no database or marketplace APIs yet.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## What’s included

| Area | Routes |
|------|--------|
| Home dashboard | `/` |
| Item Creation | `/manifests`, `/manifests/new`, `/manifests/[id]` |
| Products | `/products`, `/products/new`, `/products/draft`, `/products/scan-book`, `/products/express-list`, `/products/[id]` |
| Listings | `/listings/shopgoodwill`, `/listings/ebay` |
| Orders / Shipments | `/orders`, `/shipments` |
| Reports | `/reports/*` |
| Settings / Printer / Notifications | `/settings`, `/settings/printer`, `/notifications` |

Suggested click-path: **Home → Create Item → open `1231WR1Z1` → Accept item → Create product → Listings**.
