# Handoff — store-thru-listing (Test Goodwill demo IMS)

**Audience:** Head of Product (+ eng follow-up)  
**Prepared:** 2026-08-04  
**Status:** **Send-ready for Product early review.** Demo-ready on Vercel; eng continues P0 (durable domain SoR). Not production-ready for onboarding ~20 real listers.

This document is the single starting point. Deeper phase notes live in [PILOT.md](./PILOT.md) and [LAUNCH.md](./LAUNCH.md). Repo overview: [README.md](./README.md).

**IMS vs sibling products:** This repo/folder is **IMS-only** (`store-thru-listing`). Four products stack later as add-ons — see [INTEGRATIONS.md](./INTEGRATIONS.md). Do not merge other product source here:

| Product | Folder | Role |
|---------|--------|------|
| **IMS** | `store-thru-listing` (this) | Ecom operations |
| **InfinityAI** | Separate (TBD) — App Store id `6746443451` | Fills **Auto-List** into IMS |
| **Retail production systems** | Future separate folder | Store retail ops |
| **Hammoq Retail** | Sibling `..\hammoq-retail` — App Store id `6460302479` | Store triage retail vs ecom + retail AI |

`C:\Users\Jared Visser\Documents\HAMMOQ\Hammoq AI Build\hammoq-retail`

---

## 1. What this product is

**store-thru-listing** is a **Test Goodwill / 10-org pilot demo** of a store-through-listing IMS (inventory management system), powered by **hammoq**. **InfinityAI** (separate iOS app) feeds **Auto-List only** — no Auto-Draft. **Hammoq Retail** (separate) handles store retail-vs-ecom triage before ecom continues here.

It walks the floor-to-channel path:

> intake / Donor Item Creation → products → photo & listing editors → ShopGoodwill & eBay listings → orders & shipments → customer Admin settings → Hammoq Ops control plane

Primary demo org: **Test Goodwill**. Nine additional pilot orgs exist for multi-tenant / Ops demos.

---

## 2. Links & ownership

| Item | Value |
|------|--------|
| **Live demo** | https://store-thru-listing.vercel.app |
| **Login** | https://store-thru-listing.vercel.app/login |
| **GitHub** | https://github.com/Jviss21/store-thru-listing |
| **Default branch** | `master` |
| **Vercel team / project** | `hammoq` / `store-thru-listing` |
| **Vercel project id** | `prj_WzDggd0C55Z0EdAHKbBTb2rWx2ME` (also in `.vercel/project.json` locally) |

Ask Jared / eng for GitHub collaborator access and Vercel team membership if you need deploy rights.

---

## 3. Demo logins

**Shared password for all seeded users:** `testgoodwill`  
(Override locally / on Vercel with env `DEMO_PASSWORD`.)

| Who | Email | Role | Where to go |
|-----|--------|------|-------------|
| **Customer (default)** | `john.doe@testgoodwill.example` | Ops Lead @ Test Goodwill | Floor app `/` |
| **Customer Admin** | `morgan.hale@testgoodwill.example` | Admin @ Test Goodwill | `/admin` |
| **Lister** | `jane.smith@testgoodwill.example` | Lister | Floor listing flows |
| **Photographer** | `bob.wilson@testgoodwill.example` | Photographer | Photo / product flows |
| **Viewer** | `chris.taylor@testgoodwill.example` | Viewer | Read-oriented demo |
| **Hammoq Ops** | `ops@hammoq.example` | Ops (all 10 orgs) | `/ops` |
| **Other org admins** | `admin@{org-slug}.example` | Admin | e.g. `admin@cascade-valley-gw.example` |

Password is intentionally shared for the pilot. Do **not** treat these accounts as production credentials.

---

## 4. Architecture layers

Three product surfaces share one Next.js 14 app:

| Layer | Routes | Audience | Purpose |
|-------|--------|----------|---------|
| **Floor app** | `/`, `/manifests`, `/products`, `/listings/*`, `/orders`, `/shipments`, `/settings/*` | Store operators / listers | Day-to-day intake → list → ship |
| **Customer Admin** | `/admin/*` | Org admins | IMS settings suite (categories, strategies, teammates, channels, etc.) |
| **Hammoq Ops** | `/ops` | Hammoq staff (`isOps`) | Multi-org health, feature flags, impersonation |

### Supporting stack

- **Auth / DB (production):** **Prisma + Neon Postgres** — Vercel Production + Preview have `DATABASE_URL` / `DATABASE_URL_UNPOOLED` for Neon project `store-thru-listing-db`. Schema push + seed completed; prod `/api/me` returns `dbMode: "prisma"`. NextAuth credentials (email + shared pilot password); JWT carries `userId`, `orgId`, `role`, `isOps`, memberships
- **Schema:** Prisma multi-tenant models (`Org`, `User`, `Membership`, `Product`, `Manifest`, `Listing`, `Order`/`OrderLine`, `OrgSettings`, `Invite`, …) in `prisma/schema.prisma`
- **Domain data:** **Postgres SoR started** — donor create (`/manifests/new`) writes Manifest + Products when DB ready; Products list merges DB ∪ mock; Admin IMS settings save to `OrgSettings` JSON (and localStorage cache). Listings/orders UI still largely mock; Invite path is live for new teammates
- **Marketplaces:** adapter stubs; `NEXT_PUBLIC_MARKETPLACE_MODE=mock|live` (live returns `NOT_CONFIGURED` without vendor keys)

---

## 5. What’s DONE

- GitHub ↔ Vercel production deploy (`store-thru-listing.vercel.app`)
- Broad UI coverage of floor IMS: Donor Item Creation, products, Auto-List queue, listing editors (category-driven eBay specifics + strategies), photo editor, orders, shipments, reports, connections stubs
- Role-aware auth + org switcher; Ops impersonation
- Customer Admin IMS settings suite under `/admin` (persists per-org in `localStorage`)
- Hammoq Ops console `/ops` (org health, flags, impersonate)
- 10 pilot orgs + seeded users (including Test Goodwill role demos)
- **Neon Postgres live on Vercel** (Production + Preview): schema push + seed done; auth/session backed by Prisma (`dbMode: "prisma"`)
- Marketplace client stubs (ShopGoodwill / eBay) with mock/live env switch (`NEXT_PUBLIC_MARKETPLACE_MODE=mock` in prod)
- Brand / InfinityAI positioning: **Auto-List only** — primary path is InfinityAI → Auto-List (`/products/auto-list`); full manual listing form is secondary. See [INTEGRATIONS.md](./INTEGRATIONS.md).
- Formal Product handoff (`HANDOFF.md`) + Desktop zip packaging script
- Product stack doc (`INTEGRATIONS.md`): IMS / InfinityAI / Retail production / Hammoq Retail folder rules + App Store CTA map

---

## 6. What’s NOT done / deferred / next for Product + Eng

Be explicit with stakeholders: **this is a high-fidelity demo, not a production onboard for 20+ listers.**  
**Send to Product now for early review** while eng continues P0 (durable domain SoR). Do **not** block Product walkthroughs on marketplace live or domain SoR.

| Gap | Notes |
|-----|--------|
| **Durable domain data (P0 eng — in progress)** | **Landed:** Product/Manifest/Invite/OrgSettings (+ OrderLine stub). Donor create + Admin IMS settings persist to Neon when session has orgId. **Still mock:** most listings/orders UI, seed catalog overlay, photos/object storage |
| **Marketplace live — DEFERRED for developers** | ShopGoodwill / eBay OAuth + listing APIs need real credentials; stubs only. **Do not start marketplace live in this handoff pass** — leave for eng when keys + scope are ready |
| **Ops → real multi-org control plane** | `/ops` is a thin pilot console (health/flags/impersonation) — not full multi-org provisioning, support tooling, or audit |
| **Teammate provisioning** | **Invites landed** (`/admin/teammates` → copyable `/invite/[token]`). Seeded demo logins still use shared password. MFA / bulk 20+ lister ops still open |
| **Photos / files** | No durable object storage for product images yet (URLs/json stub on Product) |
| **Carrier / printers / scanners** | Label APIs, printer profiles, barcode workflows not production-wired |
| **Legal / reliability** | ToS/Privacy/DPA, staging, observability, backups — open |
| **Retail product** | Separate codebase at `..\hammoq-retail` — out of scope for this IMS handoff. InfinityAI is also a separate app (Auto-List fusion only). See [INTEGRATIONS.md](./INTEGRATIONS.md) |

See [LAUNCH.md](./LAUNCH.md) for the longer production checklist.

---

## 7. Environment variables (names only — no secrets)

From [`.env.example`](./.env.example):

| Name | Purpose |
|------|---------|
| `DEMO_PASSWORD` | Shared pilot password (default `testgoodwill`) |
| `NEXTAUTH_URL` | Canonical site URL |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `DATABASE_URL` | Postgres pooled connection (Prisma app queries) |
| `DATABASE_URL_UNPOOLED` | Postgres direct URL (migrate / `db push`) |
| `RESEND_API_KEY` | Resend API key for invite (+ password-help) emails |
| `EMAIL_FROM` | Verified From address for Resend/SMTP |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Optional SMTP instead of Resend (needs `nodemailer`) |
| `NEXT_PUBLIC_MARKETPLACE_MODE` | `mock` (default) or `live` |
| `MARKETPLACE_MODE` | Optional server-side fallback for marketplace mode |
| `SHOPGOODWILL_CLIENT_ID` / `_SECRET` / `_API_BASE_URL` | Phase 2 SGW (optional) |
| `EBAY_CLIENT_ID` / `_SECRET` / `EBAY_RU_NAME` / `EBAY_ENV` | Phase 2 eBay (optional) |

**Do not commit** `.env`, `.env.local`, or any file containing real `DATABASE_URL` / `NEXTAUTH_SECRET` values. Neon also injects related `POSTGRES_*` / `PG*` vars on Vercel — treat those as secrets.

---

## 8. How to run locally

```bash
npm install
cp .env.example .env.local
# Set NEXTAUTH_SECRET (any long random string). Optionally set DATABASE_URL(+_UNPOOLED).
npm run db:push    # if Postgres available
npm run db:seed    # if Postgres available
npm run dev
```

Open http://localhost:3000/login — e.g. `john.doe@testgoodwill.example` / `testgoodwill`.

Without Postgres, auth still works via the in-code seed user module (same emails/password).

Useful scripts: `db:push`, `db:seed`, `db:studio`, `lint`, `build`.

---

## 9. Where docs live

| Doc | Use |
|-----|-----|
| **This file — `HANDOFF.md`** | Formal pass-off for Product |
| [README.md](./README.md) | Quick start, links, seeded users |
| [INTEGRATIONS.md](./INTEGRATIONS.md) | **4-product stack**, App Store CTAs, InfinityAI → Auto-List / Hammoq Retail triage, folder rules |
| [PILOT.md](./PILOT.md) | Phase 0–2 plan, real vs mock matrix, Admin URL map |
| [LAUNCH.md](./LAUNCH.md) | Beyond-demo production checklist |
| [docs/GCP-MIGRATION.md](./docs/GCP-MIGRATION.md) | **Future** Google Cloud cutover prep (Cloud Run / SQL / GCS) — Vercel stays until you choose to move |

---

## 10. Honesty statement (copy for stakeholders)

> **store-thru-listing is demo-ready and send-ready for Product early review:** live on Vercel, GitHub linked, Auto-List primary Item Creation (InfinityAI → Auto-List; not Hammoq Retail), roles and Admin/Ops surfaces in place, marketplace flows in **mock** mode, and **auth/org membership on Prisma + Neon** (`dbMode: "prisma"`). Domain SoR + teammate invites have landed for donor products / OrgSettings / invites.  
> **It is not yet a full production IMS** for onboarding twenty real listers: listings/orders UI and photos are still largely mock, **marketplace live is deferred for developers**, and Ops is a thin pilot console — not a full multi-org control plane. **Sibling products stay separate:** InfinityAI, Hammoq Retail (`hammoq-retail`), and future retail production systems — see [INTEGRATIONS.md](./INTEGRATIONS.md).

---

## 11. Suggested first 15 minutes for Product

1. Open https://store-thru-listing.vercel.app/login  
2. Sign in as `john.doe@testgoodwill.example` / `testgoodwill` → click through Products → Listings → Orders  
3. Sign in as `morgan.hale@testgoodwill.example` → browse `/admin` settings groups  
4. Sign in as `ops@hammoq.example` → open `/ops`, try org impersonation  
5. Skim [PILOT.md](./PILOT.md) “What’s real vs mock” and [LAUNCH.md](./LAUNCH.md) remaining checklist  

Questions on roadmap / pilot scope → Jared + eng; deploy/env access → Vercel team `hammoq`.
