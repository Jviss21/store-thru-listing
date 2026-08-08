# IMS ↔ backend test plan

See **[docs/TEST_DIRECTIONS.md](./docs/TEST_DIRECTIONS.md)** for copy-paste run steps.

## Scope

Automated smoke covering more than upload-item:

1. **Auth** — Lister + Admin login; invite → accept account when DB available
2. **Donor / categories** — UI SKU/barcode; Products API create for Clothing, Collectibles, Computers & Electronics, Home, Jewelry
3. **Extras** — Fake eBay publish (optional skip); putaway/scan smoke

## Stack

| Layer | Tool | Script |
|-------|------|--------|
| Unit | Vitest | `npm run test:unit` |
| E2E + API | Playwright | `npm run test:e2e` |

## Files

```
e2e/
  auth.spec.ts
  invite.spec.ts
  donor-categories.spec.ts
  extras.spec.ts
  helpers/
tests/unit/
  password-policy.test.ts
  donor-sku.test.ts
  categories.test.ts
  hammoq-market-config.test.ts
  invite-token.test.ts
playwright.config.ts
vitest.config.ts
docs/TEST_DIRECTIONS.md
```

## Pass criteria (summary)

- Lister and Admin can sign in with `DEMO_PASSWORD` / `testgoodwill`
- Manual donor create generates a visible SKU and barcode
- Each major intake category can be created via `/api/products` when DB is ready; otherwise mock list path is verified
- Invite+accept runs when Postgres invites work; otherwise skipped (not a red failure)
- Fake eBay skipped without `FAKE_EBAY_*` — not a red failure
