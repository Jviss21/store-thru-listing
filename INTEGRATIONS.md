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
| 2 | **InfinityAI / Photo WebApp** | Sibling `..\..\Hammoq Photo WebApp` + InfinityAI App Store | Photos → Unshelved intake via `/api/photo-station`; AI listing fields → Auto-List |
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

### InfinityAI / Photo WebApp → Unshelved intake

```
Hammoq Photo WebApp (this companion)
  → same IMS credentials (validated via /api/auth/login)
  → scan exact printed SKU/barcode (TG-{seq} / same-as-sku Code 128)
  → square photos + supplier + location
  → POST /api/photo-station  (status Unshelved, tags unshelved + stage:photos)
  → product appears in IMS Products for Auto-List / Infinity AI queue
```

- Env: shared `PHOTO_STATION_SECRET` on IMS + Photo WebApp; `IMS_BASE_URL` on Photo WebApp.
- Auth headers for companion: `x-photo-station-secret`, `x-photo-station-email`, `x-photo-station-org`.
- Folder: `Documents\HAMMOQ\Hammoq Photo WebApp` (port 3005).

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
| `..\hammoq-backend` | **Hammoq Backend** — staff console + domain API / Prisma SoR (port 3001). See its README + `DATA_POINTS.md`. |
| `..\hammoq-retail` | Retail **placeholder** stub — leave mostly alone; docs/CTAs may cross-link |
| InfinityAI folder | **TBD** — built separately; not in this workspace |
| Retail production systems | **Future** separate folder |

## UI feature → backend data point (required)

**Critical ongoing rule:** when this IMS UI adds a feature that persists or manages data, also update **hammoq-backend**:

1. Register the entity/fields in `../hammoq-backend/DATA_POINTS.md` + `src/data-points/catalog.ts`
2. Add/extend `/api/v1/...` (or staff `/api/...`) and Prisma/`src/lib/db` as needed
3. Keep Vercel IMS working: mirror first; only set `API_BASE_URL` when ready to call the backend

Cursor rule: `.cursor/rules/backend-data-points.mdc`

### How IMS calls hammoq-backend (gradual cutover)

```env
# unset = use same-origin /api/* (current Vercel behavior)
API_BASE_URL=http://localhost:3001
# NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

| Mode | Behavior |
|------|----------|
| `API_BASE_URL` unset | IMS Next routes under `/api/*` (live deploy unchanged) |
| `API_BASE_URL` set | Clients should call `{API_BASE_URL}/api/v1/...` for domain CRUD |

Shared Neon: same `DATABASE_URL` / `DATABASE_URL_UNPOOLED` on both apps (or a Neon branch for backend experiments).

Health check: `GET {API_BASE_URL}/api/v1/health`

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
| **Market DB** | Neon Postgres DB `hammoq_market` via Market Vercel `DATABASE_URL` (+ `DATABASE_URL_UNPOOLED`). Not SQLite/`/tmp` — shared DB so IMS publishes appear on `/shop` + `/listing/:id`. Separate from IMS/`neondb` tables. |

### How to trigger a push

1. Open a product in IMS → **Mock channel list** (or Infinity AI Auto-List publish with eBay channel).
2. IMS POSTs to /api/marketplaces/ebay/publish, which upserts on Hammoq Market as Fake eBay.
3. **Simulate sold + end siblings** calls /api/marketplaces/ebay/sold → Market .../sold (removes from storefront).

Real eBay stays gated: if all of `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` / `EBAY_RU_NAME` / `EBAY_ENV` are set, Fake eBay is skipped and the **live** Inventory client is used instead.

Code: `src/lib/api/marketplaces/hammoq-market.ts`, `ebay.ts`, `ebay-oauth.ts`, `ebay-inventory.ts`, `src/lib/channel-sim.ts`.

### Real eBay scaffolding

When the four core `EBAY_*` vars are set:

| Piece | Path / notes |
|--|--|
| OAuth scopes | `api_scope`, `sell.inventory`, `sell.account`, `sell.fulfillment` — `ebay-oauth.ts` |
| Authorize URL | `buildEbayAuthorizeUrl` → Connect button redirects when mode=`live` |
| Callback | `GET /api/marketplaces/callback/ebay` — code exchange + encrypted refresh token in `MarketplaceConnection.oauthRefreshTokenEnc` |
| Inventory publish | `publishEbayInventoryListing` — location → item → offer → publishOffer |
| Policies | `EBAY_FULFILLMENT/PAYMENT/RETURN_POLICY_ID` or first Account API policy |
| Account deletion | `GET/POST /api/marketplaces/ebay/account-deletion` (SHA256 challenge; ECDSA TODO) |
| Notifications | `GET/POST /api/marketplaces/ebay/notifications` (challenge + ack/log; ECDSA TODO) |

Optional: `EBAY_USER_REFRESH_TOKEN` for headless Inventory without interactive OAuth.

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
