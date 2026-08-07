# IMS navigation guide

Sidebar + Home map for **store-thru-listing** (Hammoq IMS). Roles come from `src/lib/roles.ts`. Hammoq Ops (`isOps`) sees every section.

**Naming:** sidebar label is **Donor Item Creation** (route remains `/manifests`). **Item pipeline** lives under **Settings** → `/workflow` (not a main Workspace nav item).

---

## Workspace (main sidebar)

### Home
| | |
| --- | --- |
| **Route** | `/` |
| **Who** | All signed-in roles |
| **Shows** | Sales dashboard — top-line revenue, ASP, sell-through, top sales / listers / photographers, ops shortcuts (to ship, QA holds, pipeline volume) |

**What you can do**
- Pick Day / Week / Month / Custom to re-scope metrics and charts
- Open Top 50 / productivity full reports from section links
- Jump to unfulfilled orders, Additional QA Required listings, or draft products
- Start next work from **Infinity AI** or **Donor Item Creation** (hero links)

---

### Infinity AI
| | |
| --- | --- |
| **Route** | `/infinity-ai` (also `/products/auto-list`) |
| **Who** | Admin, Ops Lead, Lister, Photographer (+ Ops). Photographers use photo handoff; Lister+ can publish |
| **Shows** | Auto-List queue — items that arrived from Infinity AI / photo app, ready for IMS listing |

**What you can do**
- Review SKUs that need publish or edit
- Select rows and publish to channels (Lister+)
- Open product / listing editors; export CSV or listing packs
- Install / open the Infinity AI mobile app for capture

*Also pinned as a promo card above Workspace and as a mobile FAB.*

---

### Donor Item Creation
| | |
| --- | --- |
| **Route** | `/manifests` |
| **Who** | All roles with inventory view (all standard roles) |
| **Shows** | Donation intake batches — status, supplier, unit counts |

**What you can do**
- Create a new batch and add units with SKU / barcode
- Filter by status or supplier; bulk update status or delete
- Export CSV; Admins can open Admin donor intake settings
- After create → Scan / putaway on Products, then photos via Infinity AI

---

### Products
| | |
| --- | --- |
| **Route** | `/products` |
| **Who** | All roles with inventory view |
| **Shows** | Catalog of products (Active / Draft / Recycled) with location, supplier, channels |

**What you can do**
- Search and filter; open a product journey page
- Scan / putaway, draft product, export CSV or barcodes
- Edit photos, listing strategy, and channel status on the product detail

---

### Listings
| | |
| --- | --- |
| **Route** | `/listings/shopgoodwill` (eBay at `/listings/ebay`) |
| **Who** | Admin, Ops Lead, Lister, Viewer (not Photographer) |
| **Shows** | Channel listings table — status buckets, QA holds, sync errors |

**What you can do**
- Switch ShopGoodwill ↔ eBay
- Filter / search; open Edit for full listing fields
- Clear **Additional QA Required** before items can sell
- Export listings CSV

---

### Orders
| | |
| --- | --- |
| **Route** | `/orders` |
| **Who** | Admin, Ops Lead (+ Ops) |
| **Shows** | Marketplace orders (ShopGoodwill + eBay) with fulfillment tabs |

**What you can do**
- Search and filter; open an order for pick / pack / ship
- Create pick lists from open orders
- Export orders CSV; use More actions for demo ops stubs

---

### Shipments
| | |
| --- | --- |
| **Route** | `/shipments` |
| **Who** | Admin, Ops Lead (+ Ops) |
| **Shows** | Labels, carriers, tracking (EasyPost when configured) |

**What you can do**
- Filter by carrier / channel / status; open or reprint labels
- Create a new shipment / buy label
- Export shipments CSV

---

### Reports
| | |
| --- | --- |
| **Route** | `/reports` |
| **Who** | Admin, Ops Lead, Lister, Viewer (not Photographer) |
| **Shows** | Index of in-app reports and CSV downloads |

**What you can do**
- Open productivity, operational, donor intake, suppliers, top sales, etc.
- Generate downloads (listings, orders, shipments, products, Auto-List queue)
- Set date range / timezone on each report page

---

### Event log
| | |
| --- | --- |
| **Route** | `/logs` |
| **Who** | Any role with inventory view (all standard roles + Ops) |
| **Shows** | Org-wide activity trail across all sections (same data as Admin master log) |

**What you can do**
- Filter by section or date; search user / action / resource
- Follow resource links back into the workflow
- Download CSV; Admin / Ops can also open **Master event log** at `/admin/audit`

---

## Footer sidebar

### Alerts
| | |
| --- | --- |
| **Route** | `/notifications` |
| **Who** | All roles |
| **Shows** | Notification feed (failed listings, unfulfilled orders, blockers) |

**What you can do**
- Click through to the related order, listing, or product
- Resolve the blocker on the destination page

---

### Admin
| | |
| --- | --- |
| **Route** | `/admin` (Master event log: `/admin/audit`) |
| **Who** | Admin, Ops Lead (+ Ops); master log is Admin / Hammoq Ops only |
| **Shows** | Org health overview + Admin sidebar IA (team, channels, strategies, shipping, …) |

**What you can do**
- Manage teammates, roles, suppliers, categories, listing strategies
- Configure ShopGoodwill / eBay / all marketplace connections
- Tune inventory locations, shipping boxes, print settings, Infinity AI admin
- Open **Master event log** (Admin / Ops) — same trail as floor **Event log** with admin chrome

---

### Connections
| | |
| --- | --- |
| **Route** | `/settings/connections` |
| **Who** | Admin, Ops Lead (+ Ops) — `manageConnections` |
| **Shows** | ShopGoodwill + eBay connection cards (fake / live / stub mode) |

**What you can do**
- Connect or reconnect OAuth / credentials
- Check last sync and account IDs
- Jump to Admin → All connections for deeper settings

---

### Settings
| | |
| --- | --- |
| **Route** | `/settings` (Account: `/settings/account`; Printer: `/settings/printer`) |
| **Who** | All roles |
| **Shows** | Workspace prefs, Edit Account card, **Item pipeline** entry, Infinity AI toggles |

**What you can do**
- Open Edit Account (profile, role, ShopGoodwill login)
- Open **Item pipeline** (SKU walkthrough at `/workflow`)
- Open **View event log** → `/logs`
- Toggle Auto-List preferences; connect printers under Printer settings

---

### Item pipeline *(via Settings, not main Workspace nav)*
| | |
| --- | --- |
| **Route** | `/workflow` |
| **Who** | All roles |
| **Shows** | Stage map for one SKU — intake → donor → putaway → photos → QA → strategy → channels → fulfill → ship → sold |

**What you can do**
- Scan / enter SKU or barcode
- See current stage and counts across the catalog
- Jump to the suggested next action (donor create, putaway, Infinity AI, orders, …)

---

### Hammoq Ops
| | |
| --- | --- |
| **Route** | `/ops` |
| **Who** | Hammoq staff (`isOps`) only — hidden for customers |
| **Shows** | 10-org pilot console (health, kill switches, impersonation) |

**What you can do**
- Inspect org sync health and Auto-List volume
- Impersonate a tenant in the customer app
- Toggle kill switches; return via End impersonation / Customer app

---

## Role cheat sheet

| Section | Admin | Ops Lead | Lister | Photographer | Viewer | Ops staff |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| Home / Settings / Alerts / Item pipeline | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Infinity AI | ✓ | ✓ | ✓ | ✓ (photo) | — | ✓ |
| Donor Item Creation / Products | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Listings | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Orders / Shipments | ✓ | ✓ | — | — | — | ✓ |
| Reports | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Event log (`/logs`) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin / Connections | ✓ | ✓ | — | — | — | ✓ |
| Master event log (`/admin/audit`) | ✓ | — | — | — | — | ✓ |
| Hammoq Ops | — | — | — | — | — | ✓ |
