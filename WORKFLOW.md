# Item workflow (IMS)

**Audience:** Floor + ops  
**Live:** https://store-thru-listing.vercel.app  
**Updated:** 2026-08-05

Canonical thrift/resale pipeline in this repo — statuses and next-action CTAs stay aligned end-to-end.

## Stages (top → bottom)

| # | Stage | Product tag | Where |
|---|--------|-------------|--------|
| 1 | Store intake / triage | `triage:retail\|ecom\|undecided` | Hammoq Retail + donor line triage |
| 2 | Donor / manifest create | `stage:putaway` (or `stage:retail`) | `/manifests/new` |
| 3 | Putaway | → `stage:photos` | `/products/putaway` |
| 4 | Photo + Auto-List | `stage:photos` → `qa` / `strategy` | InfinityAI + `/products/auto-list` |
| 5 | QA / Queued | `stage:qa` · listing `Queued` / `Additional QA Required` | Listings |
| 6 | Listing strategy | `stage:strategy` | Listing detail + Admin strategies |
| 7 | Channel list | `stage:listed` · listing `Active` | Mock SGW + **Fake eBay → Hammoq Market** when `FAKE_EBAY_*` set |
| 8 | Order → pick → pack | `stage:fulfill` | `/orders` · `/orders/pick-lists` |
| 9 | Ship + label | `stage:ship` | `/shipments/new` |
| 10 | Sold / end siblings | `stage:sold` · sold + `Delisted` siblings | Product “Simulate sold” |

Retail triage exits at `stage:retail` (no Auto-List).

## Status model

| Entity | Values | Notes |
|--------|--------|--------|
| **Product.status** | `Draft` · `Active` · `Recycled` | Inventory row; not the pipeline stage |
| **Product.tags** | `stage:*`, `triage:*`, `batch:*`, `barcode:*` | Stage of truth in demo; Postgres `tagsJson` when DB ready |
| **Listing.status** | `Queued` · `Active` · `Sold` · `Delisted` · `Additional QA Required` · … | Channel lifecycle |
| **Order** | payment / fulfillment / pickPack | Fulfillment path after sell |
| **Shipment** | Label created → In transit → Delivered | After pack |

Stage is **not** a Prisma column — stored as `stage:<id>` inside `tagsJson` so Neon stays compatible without a migration.

## Walk one SKU (live demo)

1. Open **Item pipeline** (`/workflow`) or Home → **Open pipeline**.
2. **Donor Item Creation** → **Manual donor create** (`/manifests/new`).
   - Set triage **ecom** on a line → Create → lands on **putaway** with barcode.
3. Assign a shelf → banner **Photos / Auto-List**.
4. On Auto-List, select the row (or use `?sku=`) → **Try Auto-List** — mock-publishes SGW/eBay + downloads packets → next is **strategy**.
5. Open the **product** (`/products/[id]`):
   - **Item pipeline** panel shows stage + next CTA.
   - **Mock channel list** / **Simulate sold + end siblings** — eBay pushes to Hammoq Market when Fake eBay env is set (see [INTEGRATIONS.md](./INTEGRATIONS.md)).
6. After sale: open **Orders** → pick list → pack → **Shipments** → create label.

Keyboard/scan: putaway barcode field and `/workflow` SKU field are autofocused.

## What was wired

- `src/lib/workflow.ts` — stage catalog, resolve, next-action CTAs  
- `src/lib/channel-sim.ts` — mock publish + end-on-sale (+ Fake eBay → Hammoq Market)  
- `ItemPipelinePanel` on product detail; `/workflow` + Home widget  
- Donor create → putaway handoff; putaway → photos/Auto-List; Auto-List → mock list + strategy CTA  
- `PATCH /api/products/[id]` persists tags/stage to Postgres when available  
- Order detail: pick list + ship CTAs  

Stack context (InfinityAI / Retail apps): see [INTEGRATIONS.md](./INTEGRATIONS.md).

