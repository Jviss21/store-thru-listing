# IMS test directions (copy-paste for Cursor / Claude)

Simple how-to for Jared. No real eBay keys required.

## Workspaces

- IMS: `store-thru-listing`
- Backend (optional): `hammoq-backend`

## One-time setup (IMS)

```powershell
cd "C:\Users\Jared Visser\Documents\HAMMOQ\Hammoq AI Build\store-thru-listing"
npm install
npx playwright install chromium
# If Chromium is missing under Cursor, point at the user cache:
$env:PLAYWRIGHT_BROWSERS_PATH="$env:LOCALAPPDATA\ms-playwright"
```

## Env vars

| Var | Default | Purpose |
|-----|---------|---------|
| `BASE_URL` | `https://store-thru-listing.vercel.app` | Target for e2e |
| `DEMO_PASSWORD` | `testgoodwill` | Shared pilot password |
| `E2E_LISTER_EMAIL` | `john.doe@testgoodwill.example` | Lister login |
| `E2E_ADMIN_EMAIL` | `morgan.hale@testgoodwill.example` | Admin login |
| `BACKEND_BASE_URL` | _(empty)_ | If set, category tests also probe `GET /api/v1/products` |
| `FAKE_EBAY_API_URL` / `FAKE_EBAY_API_KEY` | _(unset)_ | Optional Market publish; e2e **skips** if not configured |

Local app example:

```powershell
$env:BASE_URL="http://localhost:3000"
$env:DEMO_PASSWORD="testgoodwill"
```

## Run commands

```powershell
# Unit (Vitest) — password policy, SKU helpers, categories, invite token, Fake eBay config
npm run test:unit

# E2E (Playwright) — against Vercel by default
npm run test:e2e

# E2E against local Next
$env:BASE_URL="http://localhost:3000"; npm run test:e2e

# Both
npm test
```

## Expected pass list (Jared bullets)

### Auth / users

| # | Case | Automated? | Where |
|---|------|------------|-------|
| 1 | Login as Lister (`john.doe@…` / `testgoodwill`) | Yes | `e2e/auth.spec.ts` |
| 2 | Login as Admin (`morgan.hale@…` / `testgoodwill`) | Yes | `e2e/auth.spec.ts` |
| 3 | Create a user (Admin teammates invite) + Create an Account (accept invite) | Yes if Postgres | `e2e/invite.spec.ts` — **skips** when invite API has no DB |

### Category / donor create

| # | Case | Automated? | Notes |
|---|------|------------|-------|
| UI | Donor Item Creation → SKU + barcode | Yes | `e2e/donor-categories.spec.ts` — `/manifests/new` |
| API | Clothing, Collectibles, Computers & Electronics, Home, Jewelry | Yes | POST `/api/products` per category + GET list |
| Sync | Backend `/api/v1/products` | Soft | Only if `BACKEND_BASE_URL` set; mirror-first may not share cookies/DB |
| Mock path | No Postgres | Soft pass | Create returns 503 → test still asserts GET `/api/products` mock/prisma list works |

Floor donor UI currently saves category as **General Merchandise**; category coverage is via **Products API** using Admin IMS seed names.

### Extra

| # | Case | Automated? |
|---|------|------------|
| Fake eBay publish | Yes, **skip** if `NOT_CONFIGURED` | `e2e/extras.spec.ts` |
| Putaway / scan page | Yes (smoke load) | `e2e/extras.spec.ts` |

## Ask Cursor / Claude (paste)

```
In store-thru-listing, run the IMS sync test suite:
1) npm run test:unit
2) npm run test:e2e  (BASE_URL=https://store-thru-listing.vercel.app, DEMO_PASSWORD=testgoodwill)
Report pass/fail for: Lister login, Admin login, invite+accept (or skip), donor SKU UI, each intake category API create, Fake eBay (or skip), putaway smoke.
Do not require real eBay keys.
```

## Backend unit tests (optional)

```powershell
cd "C:\Users\Jared Visser\Documents\HAMMOQ\Hammoq AI Build\hammoq-backend"
npm install
npm run test:unit
```

Covers password policy + invite token helpers (same rules as IMS).
