# 10-customer pilot — Phase plan

Auto-List only (no Auto-Draft). Test Goodwill is one of N orgs. Hammoq navy/gold brand.

## Phase 0 — DONE (this deploy)

| Item | Status |
|------|--------|
| Org context (`OrgProvider`, `activeOrgId` in localStorage + cookie) | Done |
| 10 pilot orgs seeded (Test Goodwill + 9 anonymized) | Done |
| API adapter layer `src/lib/api/` with `MockApiClient` + `createApiClient()` | Done |
| Connection UI `/settings/connections` + Admin marketplaces Connect stubs | Done |
| Failure UX — Additional QA Required + sync error banners on listings | Done |
| Hammoq Ops `/ops` — health, impersonate, flags, force sync, errors | Done |
| Docs | This file + `LAUNCH.md` |

### How to switch orgs

1. **Sidebar** — “Active org” dropdown (all 10 pilots).
2. **Hammoq Ops** — Open / Impersonate sets `activeOrgId` and routes home.
3. Persisted as `stl-active-org-id` (localStorage) and `stl_active_org` cookie.

### Ops access

- URL: `/ops` (not customer `/admin`)
- Unlock: same demo password on the Ops gate, **or** set Settings email to contain `hammoq` and Save
- Nav link “Hammoq Ops” appears when unlocked / staff email

### Adapters (`src/lib/api/`)

`products`, `listings`, `autoList`, `orders`, `shipments`, `reports`, `photos`, `connections`, `ops`, `orgs` — all on `MockApiClient` today. Swap via `createApiClient()` when HTTP backends exist.

### Phase 1 scaffold

- Multi-tenant table sketch: `src/lib/db/schema.ts` (`orgId` on tenant rows)
- No Postgres required for Phase 0 / Vercel demo

## Phase 1 — NEXT (auth / DB)

- [ ] Real auth (replace password gate; keep org-aware session shape)
- [ ] Postgres + Prisma (or equivalent) from `src/lib/db/schema.ts`
- [ ] Wire `createApiClient()` to HTTP / server actions scoped by `orgId`
- [ ] Real ShopGoodwill / eBay OAuth (replace stubs)
- [ ] Durable photo storage

## Phase 3 (later)

- Carrier labels, printer profiles, webhooks, observability, legal

## Constraint reminder

Infinity AI ships **Auto-List only** — do not reintroduce Auto-Draft in product or schema.
