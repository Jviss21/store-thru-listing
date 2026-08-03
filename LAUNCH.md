# Launch checklist — beyond this demo

This app is a **customer-shareable pilot UI** with client-side mock data and a password gate. The items below are required for a real production deployment and are **not** implemented here (by design — no fake backends).

## Remaining production requirements

### Data & inventory
- [ ] Real inventory / products / manifests database (Postgres or equivalent)
- [ ] Real orders, refunds, and shipment records with sync from channels
- [ ] Durable file storage for product photos and listing assets

### Auth & tenancy
- [ ] Real authentication (email/password or SSO)
- [ ] Roles & permissions (ops lead, lister, photographer, admin)
- [ ] Multi-org tenancy if serving more than Test Goodwill

### Marketplace integrations
- [ ] ShopGoodwill OAuth + listing create/update/end APIs
- [ ] eBay OAuth + Trading / Inventory / Fulfillment APIs
- [ ] Webhooks or polling for sold / unpaid / cancelled events

### Infinity AI
- [ ] Production Auto-List routing (channel rules, pricing floors, QA gates)
- [ ] Audit log of AI suggestions vs human edits

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
- Org branding for Test Goodwill + hammoq palette

When the systems above are ready, replace mock modules under `src/lib/mock-data.ts` / `demo-actions.ts` with authenticated API clients — keep the existing route structure where possible.
