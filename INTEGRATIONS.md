# Product stack & integrations

**Audience:** Product + eng  
**Repo:** `store-thru-listing` (IMS only)  
**Updated:** 2026-08-05

Four separate folders / products that stack as one platform when ready — **not** one mixed codebase.

```
┌─────────────────────────────────────────────────────────────────┐
│  Shared platform (future): org / auth / API                      │
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
| 1 | **IMS** | `store-thru-listing` (this repo) | Ecom operations: donor create, products, Auto-List queue, listings, orders, shipments, Admin, Ops |
| 2 | **InfinityAI** | Separate app/folder (**TBD** — user builds separately) | Photos → AI listing fields → feeds **Auto-List** into IMS |
| 3 | **Retail production systems** | Separate folder (**future**) | Store retail ops (floor, POS-adjacent, retail inventory) |
| 4 | **Hammoq Retail** (AI retail app) | Sibling stub `..\hammoq-retail` + App Store | Store triage: **retail-worthy vs ecom-worthy**; retail AI |

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
  → listing packet / queue in IMS Auto-List (`/products/auto-list`)
  → channel publish (eBay / ShopGoodwill / …)
```

- **Does not** fuse into Hammoq Retail.
- IMS CTA copy: **Upload in InfinityAI** — mobile → App Store; desktop web demo → `/products/auto-list`.

### Hammoq Retail → store intake triage

```
Item at store in Hammoq Retail
  → decide retail-worthy vs ecom-worthy
  → retail → retail production systems / floor
  → ecom → continue in IMS (Donor Item Creation / Auto-List)
```

- **Does not** own Auto-List.
- IMS Donor hub links to Hammoq Retail App Store; demo line toggle stores `triage:retail|ecom|undecided` on product tags until a real iOS bridge exists.

## Sibling / future folders

| Path | Status |
|------|--------|
| `..\hammoq-retail` | Retail **placeholder** stub — leave mostly alone; docs/CTAs may cross-link |
| InfinityAI folder | **TBD** — built separately; not in this workspace |
| Retail production systems | **Future** separate folder |

## Future APIs / deep links (not built yet)

- Universal / app links for InfinityAI ↔ IMS Auto-List handoff (scheme TBD)
- Universal / app links for Hammoq Retail → IMS ecom create when triage = ecom
- Shared org/auth tokens so mobile apps post into IMS APIs without mixing repos
- Product create / Auto-List enqueue APIs for InfinityAI payloads
- Triage webhook or sync from Hammoq Retail → IMS product tags / channel path

Until those land: App Store links + in-app demo surfaces only. No native bridge code in this repo.

## IMS CTA map (this repo)

| Surface | CTA | Target |
|---------|-----|--------|
| Donor Item Creation hub | Upload in InfinityAI | Mobile: App Store `6746443451`; desktop: `/products/auto-list` |
| Donor Item Creation hub | Retail vs ecom | App Store `6460302479` (Hammoq Retail) |
| Manual donor create | Upload in InfinityAI | Same InfinityAI resolver |
| Manual donor create | Get Hammoq Retail | App Store `6460302479` |
| Auto-List page | Get InfinityAI | Same InfinityAI resolver |
| New product | Upload in InfinityAI | Same InfinityAI resolver |

Constants: `src/lib/mock-data.ts` (`INFINITY_AI_APP_STORE_URL`, `HAMMOQ_RETAIL_APP_STORE_URL`, `resolveInfinityAiUploadHref`).
Components: `InfinityAiUploadLink`, `HammoqRetailLink` in `src/components/Brand.tsx`.

## Item pipeline (IMS ops)

End-to-end thrift/resale stages, status tags, and “walk one SKU” demo path: **[WORKFLOW.md](./WORKFLOW.md)**.
