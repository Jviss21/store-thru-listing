# 10-customer pilot — Phase plan

Auto-List only (no Auto-Draft). Test Goodwill is one of N orgs. Hammoq navy/gold brand.

**Hosting today:** Vercel. **Future GCP move (prep only):** see [docs/GCP-MIGRATION.md](./docs/GCP-MIGRATION.md) — do not cut over until ready.

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
| Local | Postgres via `DATABASE_URL` (+ `DATABASE_URL_UNPOOLED`) → `npm run db:push` → `npm run db:seed` |
| Vercel (no Postgres) | Auth uses in-code seed users; product/listing APIs stay on `MockApiClient` |
| Vercel + Neon/Postgres | Marketplace Neon sets `DATABASE_URL` / `DATABASE_URL_UNPOOLED`; then `db push` + seed |

### Env vars

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXTAUTH_SECRET` | Prod | Random string for JWT signing |
| `NEXTAUTH_URL` | Prod | Canonical site URL |
| `DEMO_PASSWORD` | Recommended | Pilot password (default `testgoodwill`) |
| `DATABASE_URL` | Optional | Postgres (pooled) for Prisma; omit → seed-module auth |
| `DATABASE_URL_UNPOOLED` | With Neon | Direct Postgres URL for `db push` / migrate |
| `RESEND_API_KEY` | For real invite email | Resend API key |
| `EMAIL_FROM` | With Resend | Verified sender address |

### What’s real vs mock

| Layer | Status |
|-------|--------|
| Auth / session / org memberships | **Real** (NextAuth + seed or Prisma) |
| Org switch + Ops impersonation | **Real** (JWT + cookies; audit when DB ready) |
| Teammate invites | **Real** (Prisma `Invite`; hashed tokens; `/admin/teammates` + `/invite/[token]`; Resend email when `RESEND_API_KEY` set; otherwise honest copy-link UI) |
| Donor create products / manifests | **Prefer Postgres** when `dbMode: prisma` — falls back to localStorage mock |
| Admin IMS settings | **Prefer Postgres** `OrgSettings.adminImsJson` on save; localStorage cache |
| Products list | **DB ∪ mock** (Prisma rows when present, else seed/mock) |
| Listings, orders, Auto-List queue UI | **Still largely mock** (`MockApiClient` / local) — tables exist as stubs |
| Marketplace OAuth / sync | **Stubs** (`marketplaces/*`; live mode via env) |

### Domain SoR + invites (landed)

- Schema: extended `Product`, `Manifest`/`ManifestLine`, `OrderLine`, `OrgSettings`, `Invite`
- Repos: `src/lib/db/{products,manifests,invites,org-settings}.ts`
- APIs: `/api/manifests`, `/api/invites`, `/api/invites/[token]`, `/api/org/settings`, `/api/products` POST
- **Still mock:** full listings/orders cutover, marketplace live; full TOTP MFA (Reset MFA stub remains); self-serve password-reset tokens (light `/api/auth/forgot-password` + Admin re-invite)

### Phase 2 — IN PROGRESS (marketplace stubs)

| Item | Status |
|------|--------|
| Env switch `NEXT_PUBLIC_MARKETPLACE_MODE=mock\|live` via `createApiClient()` | Done (scaffold) |
| ShopGoodwill client stub (`src/lib/api/marketplaces/shopgoodwill.ts`) | Done (NOT_CONFIGURED without keys) |
| eBay client stub (`src/lib/api/marketplaces/ebay.ts`) | Done (NOT_CONFIGURED without keys) |
| API routes `/api/marketplaces/{status,connect,sync}` | Done (scaffold) |
| Real OAuth + listing create/update/end against vendor APIs | Next (needs keys) |
| Persist products/listings/orders in Prisma | **Partial** — products/manifests/settings/invites yes; listings/orders UI cutover later |
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
| Mock | `MockEbayAspectsClient` (Suits, Handbags, Headphones, Jewelry, Shoes, Collectibles, Travel/Luggage, Backpacks) + generic aspects for other taxonomy nodes |
| SGW fields | `getSgwCategoryFields` / `getSgwFieldsForPath` — separate SGW paths (e.g. Travel/Luggage > Backpacks) |
| UI | `ListingEditorForm` remounts Required/Optional Specifics on category change |
| Storage | `listing.itemSpecifics: Record<string, string>` |

Replace mock aspects with eBay Commerce Taxonomy **getItemAspectsForCategory** when API keys exist.

## eBay US category taxonomy tree

| Layer | Location |
|-------|----------|
| Bundled tree | `src/lib/ebay/us-category-tree.json` (+ `.gz`) — ~5k EBAY_US nodes for offline demo |
| Generator | `scripts/generate-ebay-us-category-tree.mjs` (then dense-expand when regenerating) |
| Helpers | `src/lib/ebay/category-tree.ts` — index, path, search, children |
| Client | `src/lib/ebay/taxonomy-client.ts` — mock loads bundled; live calls `getCategoryTree` when `EBAY_CLIENT_ID` + `EBAY_CLIENT_SECRET` set, else bundled fallback |
| API | `GET /api/ebay/category-tree` — roots / children / search |
| Admin UI | `/admin/categories` — org categories + browsable/searchable eBay tree mapping |
| Listing UI | `EbayCategoryTreePicker` in `ListingEditorForm` eBay channel section |

**Source:** Vendored demo snapshot shaped like Commerce Taxonomy `getCategoryTree` for marketplace `EBAY_US` (tree id `0`). Real leaf IDs preserved for aspect-mock categories. Live mode refreshes from eBay when credentials exist (`EBAY_ENV=sandbox|production`). Regenerate with `node scripts/generate-ebay-us-category-tree.mjs`.

## Listing strategies (Auto-List defaults)

| Layer | Location |
|-------|----------|
| Model | `ListingStrategy` in `src/lib/listing-strategies.ts` |
| Seeds | Clothing/Shoes/Purses, Travel - Luggage & Backpacks, HardGoods $14.99, Lots $19.99, Electronics Fixed $29.99, Books $4.99, Collectibles Auction, eBay Auction Import |
| Admin | `/admin/listing-defaults` — edit strategy weight/dims/shipping/pricing/profiles |
| Form | Strategy select auto-fills form; user can override |
| Auto-List | Pack builders apply strategy when product weight/dims are blank or zero |

## Screenshot field inventory (Upright Labs reference — 2026-08-03)

User intent: **fields change by category/subcategory**; **listing strategy** auto-fills weight, measurements, pricing, shipping carrier, etc. for auto-upload.

### Screen 1 — Product details
Images · Title · Category + Strategy (side-by-side) · SKU · Item Weight · Supplier · Inventory Location · Dimensions · Box Padding · Brand · Condition

### Screen 2 — Shipping + ShopGoodwill + eBay start
Shipping Method · Shipping Box (+ Calculate) · Shipping Weight · SGW Category · Private description · Auction start/duration · Starting bid · Bid increment · Reserve · Buy Now · Stock qty · Handling/Shipping price · Featured / No Combine · eBay category / store / type / duration / start

### Screen 3 — eBay channel options + Required Specifics
Store category · Listing type/duration/start · Starting / BIN / Reserve · Handling time · Best Offer · Shipping/Returns/Payment profiles · Condition description · Required + Optional Specifics · UPC · Description

### Gaps addressed (2026-08-03)

1. Strategy auto-fill for weight, dims, box, shipping weight, carrier, pricing
2. Category change remounts Required Specifics (+ SGW category attributes)
3. SGW stock quantity defaults to ≥ 1
4. Brand/Condition inferred from title when empty
5. Separate eBay vs SGW category trees; single Condition under Product details; required specifics validated on save

## Customer Admin IMS settings (2026-08-03)

Grouped sidebar under `/admin`. Settings persist per org in `localStorage` key `stl-admin-ims:<orgId>`.
Add new pages by appending to `ADMIN_NAV_GROUPS` in `src/lib/admin-nav.ts` and creating `src/app/admin/<route>/page.tsx`.

### Admin URL map

| Group | Route | Notes |
|-------|-------|-------|
| Overview | `/admin` | Org health |
| Overview | `/admin/organization` | Legacy org profile |
| Overview | `/admin/audit` | Master event log (Admin/Ops) |
| Overview | `/admin/data` | Demo exports / clear storage |
| Overview | `/admin/infinity-ai` | Auto-List AI settings |
| General | `/admin/settings` | Company / timezone |
| General | `/admin/notifications` | Digest frequency + preview |
| General | `/admin/suppliers` | Supplier abbreviations |
| Donor Item Creation | `/admin/item-authentication` | Luxury hold rules |
| Donor Item Creation | `/admin/manifests` → `/admin/donor-item-creation` | Rejection responses |
| Products | `/admin/categories` | Org categories + eBay US taxonomy mapping |
| Products | `/admin/images` | Watermark / crop defaults |
| Products | `/admin/listing-strategies` | Alias of listing-defaults |
| Products | `/admin/listing-defaults` | Strategy editor (kept) |
| Products | `/admin/products` | SKU, required fields, tags, Connect |
| Products | `/admin/templates` | Builder/Static list |
| Products | `/admin/templates/[id]` | Input → Output `{{vars}}` |
| Inventory | `/admin/inventory-locations` | Locations + barcodes |
| Inventory | `/admin/shipping` | EasyPost + toggles |
| Inventory | `/admin/shipping-boxes` | Box dimensions |
| Inventory | `/admin/orders` | Packing slip / pick profiles |
| Inventory | `/admin/print-settings` | Lister Connect / PDF·Dymo |
| Inventory | `/admin/stations` | Printers & stations (kept) |
| Team | `/admin/teammates` | Active/inactive roster |
| Team | `/admin/teammates/[id]` | Edit Account form |
| Team | `/admin/roles` | Default + custom role cards |
| Team | `/admin/users` | Redirect → teammates |
| Channels | `/admin/channels/ebay` | Accounts + defaults |
| Channels | `/admin/channels/shopgoodwill` | SGW defaults form |
| Channels | `/admin/marketplaces` | All connections (kept) |

> Shopify and GoodwillFinds channel stubs were removed from the Admin UI (nav + `/admin/channels/shopify` / `goodwillfinds` pages).
> Embedded Listings stub was removed from the Admin UI (nav + `/admin/embedded-listings` page).
| Advanced | `/admin/developer` | API tokens table |

### Account settings

| Route | Purpose |
|-------|---------|
| `/settings/account` | Self-edit (Edit Account form) |
| `/settings` | Workspace prefs + link to account |
| `/admin/teammates/[id]` | Admin edit same form |
