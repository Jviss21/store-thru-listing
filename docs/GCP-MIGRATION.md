# Google Cloud migration prep (store-thru-listing)

**Status:** Prep only — **do not** cut over until you are ready.  
**Current production:** Vercel (`store-thru-listing.vercel.app`) + Neon Postgres + optional Vercel Blob.  
**Goal:** Be able to run the same Next.js 14 app on Google Cloud without surprises.

This repo already includes a Docker / Cloud Run–oriented layout (`Dockerfile`, `.dockerignore`, `cloudbuild.yaml`, `deploy/gcp/`). Nothing here provisions billing or disconnects Vercel/GitHub.

---

## Target recommendation

| Concern | Recommended GCP mapping | Keep-as-is option |
|---------|-------------------------|-------------------|
| Next.js app (SSR + API routes) | **Cloud Run** (container from this `Dockerfile`) | Stay on Vercel until cutover |
| Postgres | **Keep Neon** (simplest) **or** **Cloud SQL Postgres** | Neon works from Cloud Run over public/pooled URL |
| Product photos | **Cloud Storage (GCS)** bucket + signed/public URLs | Keep Vercel Blob until photo code gains a GCS backend |
| Secrets | **Secret Manager** → mounted/injected into Cloud Run | Mirror current Vercel env names |
| CI/CD | Optional **Cloud Build** from GitHub (`cloudbuild.yaml`) | Keep GitHub → Vercel until cutover; then point Cloud Build at `master` |
| Email | **Resend stays** (no GCP requirement) | Same `RESEND_API_KEY` / `EMAIL_FROM` |
| Auth | NextAuth env vars on Cloud Run | Same `NEXTAUTH_URL` / `NEXTAUTH_SECRET` |

**Default path when ready:** Cloud Run + **keep Neon** + GCS for photos + Secret Manager + optional Cloud Build. Move Neon → Cloud SQL later only if you want all data inside GCP VPC / compliance.

---

## What maps from the current stack

| Today | GCP / stay | Notes |
|-------|------------|-------|
| **Vercel** (Next.js host) | **Cloud Run** | Use `output: 'standalone'` (see `next.config.mjs`) + root `Dockerfile`. Port `8080` for Cloud Run. |
| **Neon Postgres** | Keep Neon **or** Cloud SQL | Prisma already uses `DATABASE_URL` (+ `DATABASE_URL_UNPOOLED` for migrate/push). Cloud SQL Auth Proxy or private IP for tighter security. |
| **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`) | **GCS** (`GCS_BUCKET`, ADC / service account) | Today photos go through `src/lib/photo-storage.ts` (Blob → local FS → memory). GCS adapter is a code task at cutover, not required for this prep. |
| **Resend** | Stay on Resend | No change. |
| **NextAuth** | Same env names | Set `NEXTAUTH_URL` to the Cloud Run / custom domain URL. |
| **GitHub → Vercel deploys** | Optional GitHub → Cloud Build → Artifact Registry → Cloud Run | Leave Vercel connected until DNS cutover; rollback = point DNS back. |

---

## Checklist — when you are ready

### A. Project & APIs (one-time)

- [ ] Create a GCP project (e.g. `hammoq-stl-prod`) and link billing
- [ ] Enable APIs: Cloud Run, Artifact Registry, Secret Manager, Cloud Build, Cloud Storage; add **Cloud SQL Admin** only if leaving Neon
- [ ] Choose region (e.g. `us-central1`) and stick to it for Run + Artifact Registry (+ SQL/GCS)

### B. Container

- [ ] Confirm local Docker build: `docker build -t store-thru-listing .`
- [ ] Confirm run: `docker run -p 8080:8080 -e PORT=8080 …` with at least `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`
- [ ] Push image to Artifact Registry (or let Cloud Build do it — see `cloudbuild.yaml`)

### C. Data & secrets

- [ ] **DB:** Keep Neon URLs in Secret Manager, **or** provision Cloud SQL Postgres, import schema (`prisma db push` / migrate), seed if needed, store URL in Secret Manager
- [ ] Create secrets mirroring Vercel: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `DEMO_PASSWORD`, `RESEND_API_KEY`, `EMAIL_FROM`, marketplace keys if any
- [ ] Create GCS bucket for photos; grant the Cloud Run service account `roles/storage.objectAdmin` (or narrower)
- [ ] Env parity checklist vs Vercel Project → Settings → Environment Variables (Production)

### D. Deploy Cloud Run (staging first)

- [ ] Deploy a **staging** Cloud Run service (see `deploy/gcp/cloud-run-service.yaml`)
- [ ] Wire secrets + env; set `NEXTAUTH_URL` to the staging URL
- [ ] Smoke test (below) on staging before touching production DNS

### E. Domain & cutover

- [ ] Map custom domain to Cloud Run (or Cloud Load Balancing + managed cert)
- [ ] Update `NEXTAUTH_URL` to the canonical production URL
- [ ] Lower DNS TTL ahead of cutover (e.g. 300s)
- [ ] Cut DNS (or domain mapping) from Vercel → GCP
- [ ] Re-run smoke tests on production hostname
- [ ] Keep Vercel project intact for rollback for at least one release cycle

### F. Optional CI

- [ ] Connect GitHub repo to Cloud Build (or use `gcloud builds submit`)
- [ ] Adjust `cloudbuild.yaml` substitutions (`_REGION`, `_SERVICE`, `_AR_REPO`)
- [ ] Disable or leave Vercel deploys idle after cutover (do **not** delete until rollback window closes)

---

## Step-by-step deploy sketch (commands)

> Illustrative only — adjust project IDs, regions, and names. Do **not** run against production until intentional.

```bash
# 1) Project
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com cloudbuild.googleapis.com storage.googleapis.com

# 2) Artifact Registry
gcloud artifacts repositories create stl-docker \
  --repository-format=docker --location=us-central1

# 3) Build & push (local) — or use cloudbuild.yaml
gcloud builds submit --config cloudbuild.yaml

# 4) Secrets (example pattern)
echo -n "https://your-canonical-host" | gcloud secrets create NEXTAUTH_URL --data-file=-
# …repeat for NEXTAUTH_SECRET, DATABASE_URL, etc.

# 5) Deploy
gcloud run deploy store-thru-listing \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/stl-docker/store-thru-listing:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-secrets=NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,DATABASE_URL=DATABASE_URL:latest \
  --set-env-vars=NEXTAUTH_URL=https://your-canonical-host,NEXT_PUBLIC_MARKETPLACE_MODE=mock
```

Standalone image notes:

- `next.config.mjs` sets `output: 'standalone'` so the image only needs the standalone server + static assets.
- Build still runs `prisma generate` (see `package.json` `build` script).
- Cloud Run sets `PORT`; the container listens on `0.0.0.0:$PORT` (default `8080` in the Dockerfile).

---

## Cutover plan

| Step | Action | Rollback |
|------|--------|----------|
| 1. Env parity | Export Vercel prod env names; recreate in Secret Manager / Cloud Run | N/A |
| 2. Staging | Deploy Cloud Run staging; point a test host or `*.run.app` URL | Delete staging service |
| 3. Smoke test | Login, `/api/me` (`dbMode: "prisma"`), create product/manifest, invite link, photo upload if GCS wired | Fix before DNS |
| 4. DNS | Point apex/www (or keep `*.vercel.app` as backup) to Cloud Run / LB | Revert DNS to Vercel |
| 5. Observe | Watch Cloud Run logs, error rate, DB connections for 24–72h | DNS back to Vercel; Vercel still has last good deploy |
| 6. Cleanup later | Optionally pause Vercel; migrate Blob → GCS data; retire Neon if on Cloud SQL | Only after confidence |

**Rollback to Vercel:** Restore DNS to Vercel; ensure Vercel env vars still valid; redeploy from `master` if needed. Prep files in this repo do **not** remove the Vercel integration.

### Smoke test checklist

- [ ] `GET /login` loads
- [ ] Sign in as seeded user (e.g. `john.doe@testgoodwill.example`)
- [ ] `GET /api/me` → authenticated + expected `dbMode`
- [ ] Org switch (if multi-membership)
- [ ] Donor create / products path that hits Prisma
- [ ] Invite create (email optional; copy-link OK)
- [ ] Photo upload (Blob or GCS, whichever is configured)
- [ ] No crash on `/admin` and `/ops` for appropriate roles

---

## Cost / size notes

### Small (pilot / demo / few users)

| Piece | Rough guidance |
|-------|----------------|
| Cloud Run | Scale-to-zero friendly; min instances `0`; 512Mi–1Gi RAM often enough for Next.js |
| Neon (keep) | Free/launch tiers often fine for pilot; egress from Cloud Run → Neon is normal |
| Cloud SQL | Overkill early; smallest instance + storage idle cost even at zero app traffic |
| GCS | Pennies for pilot photo volume |
| Secret Manager / Build | Negligible at low deploy frequency |
| **vs Vercel** | Hobby/Pro vs GCP: GCP has more knobs; small traffic may be similar or slightly higher with always-on SQL |

### Later (~100 customers)

| Piece | Rough guidance |
|-------|----------------|
| Cloud Run | Raise concurrency carefully; consider `minScale: 1` for cold-start UX; 1–2 Gi RAM |
| DB | Neon scale plan **or** Cloud SQL with connection pooling (Prisma + PgBouncer / built-in pooler); watch connection counts from many Run instances |
| Photos | GCS + CDN (Cloud CDN) if public catalog traffic grows |
| Observability | Cloud Logging + Error Reporting; optional Cloud Monitoring alerts on 5xx / latency |
| Multi-region | Not needed at 100 orgs unless SLA demands it — prefer one region + backups |

---

## Code / config already in repo for this prep

| Path | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage Next.js 14 standalone image |
| `.dockerignore` | Keeps build context small |
| `next.config.mjs` | `output: 'standalone'` for container deploys (Vercel continues to work) |
| `cloudbuild.yaml` | Stub: build → Artifact Registry → Cloud Run |
| `deploy/gcp/cloud-run-service.yaml` | Example Cloud Run service manifest |
| `deploy/gcp/README.md` | How to use the examples |
| `.env.example` | GCP-oriented comments (GCS, Cloud SQL / Neon URLs) |

---

## Explicit non-goals of this prep

- No GCP project/billing provisioning from this repo
- No disconnect of Vercel or GitHub
- No production DNS change
- No requirement to rewrite photo storage before cutover day (GCS adapter can land with the migrate PR)
