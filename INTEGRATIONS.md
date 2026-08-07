# Product stack & integrations

**Audience:** Product + eng  
**Repo:** `store-thru-listing` (IMS only)  
**Updated:** 2026-08-06

Five separate folders / products that stack as one platform when ready — **not** one mixed codebase.

```
┌─────────────────────────────────────────────────────────────────┐
│  Hammoq Backend Admin (org / auth / customers / flags / ops)     │
│  sibling folder: ..\hammoq-backend  ·  port 3001                 │
└─────────────────────────────────────────────────────────────────┘
        │              │                │                 │
        ▼              ▼                ▼                 ▼
   ┌─────────┐   ┌───────────┐   ┌──────────────┐   ┌──────────────┐
   │   IMS   │   │ InfinityAI│   │ Retail prod. │   │ Hammoq Retail│
   │ (ecom)  │   │ (Auto-List│   │ systems      │   │ (AI retail   │
   │         │   │  intake)  │   │ (store ops)  │   │  triage app) │
   └─────────┘   └───────────┘   └──────────────┘   └──────────────┘
    this repo      iOS app          folder TBD         iOS app +
    store-thru-    App Store        (future)           sibling stub
    listing        id 6746443451                       hammoq-retail
                                                       App Store
                                                       id 6460302479
```

## Folder rules

| # | Product | Folder / home | Role |
|---|---------|---------------|------|
| 0 | **Hammoq Backend Admin** | Sibling `..\hammoq-backend` | Platform SoR: add customers, staff, feature flags, kill switches, audit, Open-in-IMS |
| 1 | **IMS** | `store-thru-listing` (this repo) | Ecom operations: donor create, products, Auto-List queue, listings, orders, shipments, customer Admin |
| 2 | **InfinityAI** | Separate app/folder (**TBD** — user builds separately) | Photos → AI listing fields → feeds **Auto-List** into IMS |
| 3 | **Retail production systems** | Separate folder (**future**) | Store retail ops (floor, POS-adjacent, retail inventory) |
| 4 | **Hammoq Retail** (AI retail app) | Sibling stub `..\hammoq-retail` + App Store | Store triage: **retail-worthy vs ecom-worthy**; retail AI |

**Hammoq Backend vs customer Admin:** `/admin` in IMS is **per-customer** settings. `hammoq-backend` is **Hammoq staff** platform console (replaces the pilot `/ops` console for day-to-day customer management). `/ops` may remain as an in-IMS shortcut during transition.

**Never merge InfinityAI or Hammoq Retail / retail-production source into IMS** until an intentional API integration. Cross-link in docs and deep-link CTAs only. Each remains a separate build until ready to stack as add-ons on shared org/auth/API.

## Official App Store identities

| App | App Store name | Apple id | URL |
|-----|----------------|----------|-----|
| InfinityAI | infinityAI | `6746443451` | https://apps.apple.com/us/app/infinityai/id6746443451 |
| Hammoq Retail | Hammoq Retail | `6460302479` | https://apps.apple.com/us/app/hammoq-retail/id6460302479 |

Seller: Hammoq Inc for both.

## Fusion flows (product)

### InfinityAI → Auto-List (ecom listing path)

```
Photos in InfinityAI → AI auto-fill (category, title, attrs…)
  → listing packet / queue in IMS Infinity AI (`/infinity-ai`; legacy `/products/auto-list` redirects)
  → channel publish (eBay / ShopGoodwill / …)
```

- **Does not** fuse into Hammoq Retail.
- **Own top-level IMS section** (sidebar): Infinity AI — not buried under Donor Item Creation or Admin-only.
- Primary CTA: **Get InfinityAI** App Store; secondary: in-app queue at `/infinity-ai`.

### Hammoq Retail → store intake triage

```
Item at store in Hammoq Retail
  → decide retail-worthy vs ecom-worthy
  → retail → retail production systems / floor
  → ecom → continue in IMS (Donor Item Creation and/or Infinity AI)
```

- **Does not** own Auto-List / Infinity AI.
- IMS Donor hub links to Hammoq Retail App Store; demo line toggle stores `triage:retail|ecom|undecided` on product tags until a real iOS bridge exists.

## Sibling / future folders

| Path | Status |
|------|--------|
| `..\hammoq-backend` | **Hammoq Backend Admin** — customers, staff, flags, audit (port 3001). See its README. |
| `..\hammoq-retail` | Retail **placeholder** stub — leave mostly alone; docs/CTAs may cross-link |
| InfinityAI folder | **TBD** — built separately; not in this workspace |
| Retail production systems | **Future** separate folder |

## Future APIs / deep links (not built yet)

- Universal / app links for InfinityAI ↔ IMS Auto-List handoff (scheme TBD)
- Universal / app links for Hammoq Retail → IMS ecom create when triage = ecom
- Shared org/auth tokens so mobile apps post into IMS APIs without mixing repos
- Product create / Auto-List enqueue APIs for InfinityAI payloads
- Triage webhook or sync from Hammoq Retail → IMS product tags / channel path
- Backend → IMS: `/ops?impersonate=<orgId>` deep-link (Open in IMS from `hammoq-backend`)

Until those land: App Store links + in-app demo surfaces only. No native bridge code in this repo.

## IMS CTA map (this repo)

| Surface | CTA | Target |
|---------|-----|--------|
| Sidebar / Infinity AI section | Infinity AI | `/infinity-ai` |
| Infinity AI hub | Get InfinityAI (primary) | App Store `6746443451` |
| Infinity AI hub | Auto-List queue (secondary) | Same page `/infinity-ai` |
| Infinity AI hub | Item pipeline | `/workflow` (ecom photo stage) |
| Donor Item Creation hub | Manual donor create | `/manifests/new` |
| Donor Item Creation hub | Retail vs ecom | App Store `6460302479` (Hammoq Retail) |
| Manual donor create | Get Hammoq Retail | App Store `6460302479` |
| Legacy Auto-List URL | redirect | `/products/auto-list` → `/infinity-ai` |
| New product | Upload in InfinityAI | Same InfinityAI resolver → `/infinity-ai` or App Store |

Constants: `src/lib/mock-data.ts` (`INFINITY_AI_APP_STORE_URL`, `HAMMOQ_RETAIL_APP_STORE_URL`, `resolveInfinityAiUploadHref` → `/infinity-ai`).
Components: `InfinityAiUploadLink`, `HammoqRetailLink` in `src/components/Brand.tsx`.

## Item pipeline (IMS ops)

End-to-end thrift/resale stages, status tags, and “walk one SKU” demo path: **[WORKFLOW.md](./WORKFLOW.md)**.

## Fake eBay = Hammoq Market

Until real eBay (EBAY_CLIENT_ID / EBAY_CLIENT_SECRET / EBAY_RU_NAME / EBAY_ENV) is connected, IMS treats **eBay publish** as a push to **Hammoq Market** (Online Marketplace / web).

| | |
|--|--|
| **Base URL (production)** | https://web-rose-two-83.vercel.app (alias https://web-hammoq.vercel.app) |
| **Local Market** | http://localhost:3002 |
| **Channel API** | POST /api/v1/listings · POST .../sold · POST .../delist · GET .../:externalId |
| **IMS env** | FAKE_EBAY_API_URL + FAKE_EBAY_API_KEY (aliases: MARKETPLACE_CHANNEL_URL / MARKETPLACE_CHANNEL_API_KEY) |
| **Demo API key** | hmq_demo_testgoodwill_west_devkey (Market seed / README) |

### How to trigger a push

1. Open a product in IMS → **Mock channel list** (or Infinity AI Auto-List publish with eBay channel).
2. IMS POSTs to /api/marketplaces/ebay/publish, which upserts on Hammoq Market as Fake eBay.
3. **Simulate sold + end siblings** calls /api/marketplaces/ebay/sold → Market .../sold (removes from storefront).

Real eBay stays gated: if all EBAY_* vars are set, Fake eBay is skipped and the live/stub eBay client is used instead.

Code: src/lib/api/marketplaces/hammoq-market.ts, ebay.ts, src/lib/channel-sim.ts.

## Customer go-live runbook (Fake eBay — today)

**IMS:** https://store-thru-listing.vercel.app  
**Fake eBay (Hammoq Market):** https://web-rose-two-83.vercel.app  

### Vercel env (IMS project `store-thru-listing`)

Set for **Production** (and Preview if you test PRs):

```
FAKE_EBAY_API_URL=https://web-rose-two-83.vercel.app
FAKE_EBAY_API_KEY=hmq_demo_testgoodwill_west_devkey
FAKE_EBAY_STORE_SLUG=test-goodwill-west
```

Do **not** set `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` / `EBAY_RU_NAME` / `EBAY_ENV` yet — those switch the client off Fake eBay onto real eBay (still stubbed).

Redeploy after saving env vars.

### Walk-through (one SKU)

1. **Admin invite** — Ops/Admin → invite user by email. If Resend is unset, copy the invite link from the UI and send it manually.
2. **Donor create** — Donor Item Creation → Manual donor create (`/manifests/new`). Triage **ecom** → Create (SKU + barcode).
3. **Putaway** — `/products/putaway` → scan/assign shelf.
4. **Photos** — attach photos on the product (or Infinity AI queue).
5. **List to Fake eBay** — open product → **Mock channel list** (or Infinity AI publish with eBay). Toast should mention Hammoq Market / Fake eBay. Confirm on Market shop: https://web-rose-two-83.vercel.app/shop
6. **Sold / end** — **Simulate sold + end siblings** → Market listing marked sold / removed from storefront.
7. **Fulfill** — Orders → pick list → pack → Shipments → create label (stub OK for today).
8. **Event logs** — Ops / event log shows publish + sold actions for the SKU.

### Skip for today

Real eBay OAuth, GCP cutover, multi-tenant scale.
