# Launch checklist — beyond this demo

This app is a **10-org pilot** with **Phase 1 auth** (NextAuth credentials) and a Prisma multi-tenant schema. Product/listing data still uses mock adapters. See [PILOT.md](./PILOT.md).

## Phase 0–1 (shipped)

- Org context + 10 pilot orgs + membership-aware switcher
- NextAuth email/password (shared pilot password)
- Prisma schema + seed (`npm run db:push` / `db:seed`)
- Ops console with impersonation (`ops@hammoq.example`)
- `MockApiClient` adapters ready to swap for HTTP

## Remaining production requirements

### Data & inventory
- [ ] Persist products / manifests / listings in Postgres (schema ready)
- [ ] Real orders, refunds, and shipment records with sync from channels
- [ ] Durable file storage for product photos and listing assets

### Auth & tenancy
- [x] Real authentication (email/password credentials)
- [x] Roles on Membership + session `isOps`
- [x] Multi-org tenancy scaffolding + JWT orgId
- [ ] Optional SSO / invite flows

### Marketplace integrations (Phase 2)
- [x] Adapter stubs + `NEXT_PUBLIC_MARKETPLACE_MODE=mock|live` switch
- [ ] ShopGoodwill OAuth + listing create/update/end APIs (keys required)
- [ ] eBay OAuth + Trading / Inventory / Fulfillment APIs (keys required)
- [ ] Webhooks or polling for sold / unpaid / cancelled events

### Infinity AI
- [ ] Production Auto-List routing (channel rules, pricing floors, QA gates)
- [ ] Audit log of AI suggestions vs human edits
- [x] Auto-List only — no Auto-Draft

### Ops hardware
- [ ] Carrier label APIs (USPS / UPS / FedEx as required)
- [ ] Label printer integration
- [ ] Barcode scanner workflows wired to live SKUs

### Legal & reliability
- [ ] ToS / Privacy / DPA as needed
- [ ] Staging, observability, backups

## What this pilot already covers

- Credential login with documented seed users
- Org-scoped session + Ops impersonation
- End-to-end UI path with mock inventory
- Infinity AI Auto-List queue (simulated)
- Connections stubs for ShopGoodwill / eBay

Set `NEXT_PUBLIC_MARKETPLACE_MODE=live` to route connections through marketplace stubs; without vendor keys they return `NOT_CONFIGURED`. Keep routes and `orgId` scoping.
