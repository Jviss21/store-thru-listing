# 10-customer pilot — Phase plan

Auto-List only (no Auto-Draft). Test Goodwill is one of N orgs. Hammoq navy/gold brand.

## Phase 0 — DONE

| Item | Status |
|------|--------|
| Org context, 10 pilot orgs, MockApiClient adapters | Done |
| Connections stubs, Ops `/ops`, failure UX | Done |

## Phase 1 — DONE (this deploy)

| Item | Status |
|------|--------|
| Prisma schema (`prisma/schema.prisma`) — Org, User, Membership, Product, Listing, Order, Shipment, MarketplaceConnection, AutoListJob, AuditEvent, … all with `orgId` | Done |
| NextAuth credentials (email + shared pilot password) | Done |
| Seed catalog: 10 org admins + `ops@hammoq.example` | Done |
| Session JWT: `userId`, `orgId`, `role`, `isOps`, memberships | Done |
| Middleware protects app; org switcher filters memberships (ops sees all) | Done |
| `/api/orgs`, `/api/org/switch`, `/api/ops/impersonate`, `/api/me` | Done |
| Vercel-safe auth without Postgres (seed-module fallback) | Done |

### Login

- URL: `/login` (also https://store-thru-listing.vercel.app/login)
- **Shared password for all seeded users:** `testgoodwill` (override with `DEMO_PASSWORD`)
- Default customer: `john.doe@testgoodwill.example`
- Ops: `ops@hammoq.example`
- Other orgs: `admin@{org-slug}.example` (e.g. `admin@cascade-valley-gw.example`)

### Database

| Environment | Behavior |
|-------------|----------|
| Local | `DATABASE_URL="file:./dev.db"` → `npm run db:push` → `npm run db:seed` |
| Vercel (no Postgres) | Auth uses in-code seed users; product/listing APIs stay on `MockApiClient` |
| Vercel + Postgres | Set `DATABASE_URL` to `postgres://…`, change Prisma `provider` to `postgresql`, `db push` + seed |

### Env vars

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXTAUTH_SECRET` | Prod | Random string for JWT signing |
| `NEXTAUTH_URL` | Prod | Canonical site URL |
| `DEMO_PASSWORD` | Recommended | Pilot password (default `testgoodwill`) |
| `DATABASE_URL` | Optional | SQLite file locally; Postgres for prod persistence |

### What’s real vs mock

| Layer | Status |
|-------|--------|
| Auth / session / org memberships | **Real** (NextAuth + seed or Prisma) |
| Org switch + Ops impersonation | **Real** (JWT + cookies; audit when DB ready) |
| Products, listings, orders, Auto-List queue | **Still mock** (`MockApiClient`) |
| Marketplace OAuth / sync | **Stubs** (`marketplaces/*`; live mode via env) |

### Phase 2 — IN PROGRESS (marketplace stubs)

| Item | Status |
|------|--------|
| Env switch `NEXT_PUBLIC_MARKETPLACE_MODE=mock\|live` via `createApiClient()` | Done (scaffold) |
| ShopGoodwill client stub (`src/lib/api/marketplaces/shopgoodwill.ts`) | Done (NOT_CONFIGURED without keys) |
| eBay client stub (`src/lib/api/marketplaces/ebay.ts`) | Done (NOT_CONFIGURED without keys) |
| API routes `/api/marketplaces/{status,connect,sync}` | Done (scaffold) |
| Real OAuth + listing create/update/end against vendor APIs | Next (needs keys) |
| Persist products/listings/orders in Prisma | Later |
| Durable photo storage | Later |

#### Phase 2 env vars (optional — do not block pilot)

| Variable | Channel | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_MARKETPLACE_MODE` | both | `mock` (default) or `live` |
| `SHOPGOODWILL_CLIENT_ID` | SGW | OAuth client id |
| `SHOPGOODWILL_CLIENT_SECRET` | SGW | OAuth secret |
| `SHOPGOODWILL_API_BASE_URL` | SGW | API host |
| `EBAY_CLIENT_ID` | eBay | App id (Client ID) |
| `EBAY_CLIENT_SECRET` | eBay | Cert id (Client Secret) |
| `EBAY_RU_NAME` | eBay | RuName / redirect name |
| `EBAY_ENV` | eBay | `sandbox` or `production` |

## Phase 3 (later)

- Carrier labels, printer profiles, webhooks, observability, legal

## Constraint reminder

Infinity AI ships **Auto-List only** — do not reintroduce Auto-Draft in product or schema.


## eBay item specifics (category-driven)

| Layer | Location |
|-------|----------|
| Interface | `EbayAspectsClient.getEbayCategoryAspects(categoryId)` in `src/lib/api/ebay-aspects.ts` |
| Mock | `MockEbayAspectsClient` (Suits, Headphones, Jewelry, Shoes, Collectibles) |
| UI | `ListingEditorForm` re-renders Required/Optional Specifics on category change |
| Storage | `listing.itemSpecifics: Record<string, string>` |

Replace mock with eBay Commerce Taxonomy **getItemAspectsForCategory** when API keys exist.
