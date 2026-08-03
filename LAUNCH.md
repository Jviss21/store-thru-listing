# Launch checklist — beyond this demo

This app is a **10-org pilot UI** with client-side mock data, an API adapter layer, and a password gate. See [PILOT.md](./PILOT.md) for Phase 0 (done) and Phase 1 next steps.

## Phase 0 (shipped)

- Org context + 10 pilot orgs
- `MockApiClient` adapters ready to swap for HTTP
- Marketplace Connect stubs + Ops console at `/ops`
- Failure UX for Additional QA Required / sync errors

## Remaining production requirements

### Data & inventory
- [ ] Real inventory / products / manifests database (Postgres or equivalent) — schema sketch in `src/lib/db/schema.ts`
- [ ] Real orders, refunds, and shipment records with sync from channels
- [ ] Durable file storage for product photos and listing assets

### Auth & tenancy
- [ ] Real authentication (email/password or SSO)
- [ ] Roles & permissions (ops lead, lister, photographer, admin)
- [x] Multi-org tenancy scaffolding (pilot orgs + `activeOrgId`; DB wiring in Phase 1)

### Marketplace integrations
- [ ] ShopGoodwill OAuth + listing create/update/end APIs (stub Connect UI exists)
- [ ] eBay OAuth + Trading / Inventory / Fulfillment APIs
- [ ] Webhooks or polling for sold / unpaid / cancelled events

### Infinity AI
- [ ] Production Auto-List routing (channel rules, pricing floors, QA gates)
- [ ] Audit log of AI suggestions vs human edits
- [x] Auto-List only — no Auto-Draft

### Ops hardware
- [ ] Carrier label APIs (USPS / UPS / FedEx as required)
- [ ] Label printer integration (Zebra / Brother / browser print profiles)
- [ ] Barcode scanner workflows wired to live SKUs

### Legal & compliance
- [ ] Terms of Service and Privacy Policy if user accounts exist
- [ ] Data processing agreement with the customer org
- [ ] Marketplace seller policy compliance review

### Reliability
- [ ] Staging environment with synthetic or scrubbed data
- [ ] Observability (error tracking, uptime, API latency)
- [ ] Backup / restore and incident runbooks

## What this demo already covers for a walkthrough

- Password-gated public URL for safe customer sharing
- End-to-end UI path: intake → draft → list → orders → reports
- CSV/JSON report and listing packet downloads
- Infinity AI Auto-List queue (simulated)
- Org branding (Hammoq navy/gold) + org switcher across 10 pilots
- Hammoq Ops console for staff health / impersonation / kill switches

When backends are ready, replace `MockApiClient` via `createApiClient()` in `src/lib/api/` — keep the existing route structure where possible.
