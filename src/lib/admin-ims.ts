/**
 * Org-scoped Admin IMS settings (localStorage).
 * Key: `stl-admin-ims:<orgId>`
 */

import { ADMIN_USERS, LOCATIONS, type AdminRole, type AdminUser } from "@/lib/admin-data";
import { DEFAULT_ORG_ID } from "@/lib/orgs";

export const ADMIN_IMS_KEY_PREFIX = "stl-admin-ims:";

export type Supplier = {
  id: string;
  name: string;
  abbreviation: string;
  active: boolean;
};

export type ListingTemplate = {
  id: string;
  title: string;
  kind: "builder" | "static";
  status: "Draft" | "Published";
  updatedAt: string;
  inputs: string[];
  outputTitle: string;
  outputBody: string;
};

export type InventoryLocation = {
  id: string;
  name: string;
  createdAt: string;
  controlledInShop: boolean;
};

export type ShippingBox = {
  id: string;
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightOz: number;
  scanSheet: boolean;
};

export type RoleCard = {
  id: string;
  name: string;
  description: string;
  teammateCount: number;
  kind: "default" | "custom";
  /** Maps to auth AdminRole when applicable */
  mapsTo?: AdminRole;
};

export type ApiToken = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type TeammateAccount = AdminUser & {
  supplierId: string | null;
  sgwUsername: string;
  sgwPasswordSet: boolean;
  loginEnabled: boolean;
  mfaEnabled: boolean;
  passwordHintSet: boolean;
};

export type AdminImsState = {
  general: {
    companyName: string;
    timezone: string;
    defaultLocale: string;
    supportEmail: string;
  };
  notifications: {
    digestFrequency: "Daily" | "Weekly" | "Monthly" | "Off";
  };
  suppliers: Supplier[];
  itemAuth: {
    requireAuthForLuxury: boolean;
    authHoldThreshold: number;
    notes: string;
  };
  manifests: {
    rejectionReasons: string[];
    requirePhotosOnAccept: boolean;
    autoAssignProcessor: boolean;
  };
  categories: { id: string; name: string; parentId: string | null }[];
  images: {
    watermarkEnabled: boolean;
    defaultAspect: "Custom" | "Square" | "4:3" | "16:9";
    maxUploadMb: number;
  };
  products: {
    hammoqConnect: "Connected" | "Not Connected";
    skuType: string;
    defaultShippingMethod: string;
    requiredPostingFields: string[];
    blockDraftReshelf: boolean;
    tags: { id: string; name: string; count: number }[];
  };
  templates: ListingTemplate[];
  inventoryLocations: InventoryLocation[];
  shipping: {
    easyPostConnected: boolean;
    carriers: { name: string; lastUpdated: string }[];
    disabledRates: string[];
    requirePacking: boolean;
    autoSelectBestRate: boolean;
    autoSelectPacker: boolean;
    autoRequireSignature: boolean;
    signatureThreshold: number;
    insuranceThreshold: number;
  };
  shippingBoxes: ShippingBox[];
  orders: {
    autoArchiveDays: number;
    packingSlipHeader: string;
    packingSlipFooter: string;
    requireBoxSelection: boolean;
    pickingProfiles: { id: string; name: string; active: boolean }[];
  };
  print: {
    listerConnect: boolean;
    optionalLabelFields: string[];
    previewMode: "PDF" | "Dymo";
  };
  teammates: TeammateAccount[];
  roles: RoleCard[];
  channels: {
    ebay: {
      connected: boolean;
      accounts: { id: string; name: string; status: string }[];
      defaultDuration: string;
      defaultHandlingDays: number;
    };
    shopgoodwill: {
      connected: boolean;
      accountName: string;
      defaultHandlingPrice: number;
      defaultStartingPrice: string;
      defaultShippingPrice: string;
      defaultBidIncrement: number;
      defaultAuctionDuration: string;
      defaultEndTimes: string[];
      noCombineShipping: boolean;
      listImmediately: boolean;
      autoPrivateDescSku: boolean;
      auctionStart: string;
      titleTransform: string;
      orderImport: string;
      shippingDestinations: string;
      descriptionFooter: string;
    };
    shopify: { activated: boolean; notes: string };
    goodwillfinds: { activated: boolean; notes: string };
  };
  developer: {
    tokens: ApiToken[];
  };
  embeddedListings: {
    activated: boolean;
    notes: string;
  };
};

function daysAgo(d: number) {
  return new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
}

function isoDaysAgo(d: number) {
  return new Date(Date.now() - d * 86400000).toISOString();
}

export function seedTeammates(): TeammateAccount[] {
  return ADMIN_USERS.map((u) => ({
    ...u,
    supplierId: null,
    sgwUsername: u.handle,
    sgwPasswordSet: false,
    loginEnabled: u.status !== "Deactivated",
    mfaEnabled: u.role === "Admin" || u.role === "Ops Lead",
    passwordHintSet: true,
  }));
}

export function defaultAdminImsState(): AdminImsState {
  return {
    general: {
      companyName: "Test Goodwill",
      timezone: "America/Los_Angeles",
      defaultLocale: "en-US",
      supportEmail: "ops@testgoodwill.example",
    },
    notifications: {
      digestFrequency: "Weekly",
    },
    suppliers: [
      { id: "sup-acme", name: "Acme", abbreviation: "ACM", active: true },
      { id: "sup-main", name: "Main Warehouse Intake", abbreviation: "MWI", active: true },
      { id: "sup-retail", name: "Retail Overflow", abbreviation: "RTL", active: true },
      { id: "sup-ebook", name: "eBooks", abbreviation: "EBK", active: false },
    ],
    itemAuth: {
      requireAuthForLuxury: true,
      authHoldThreshold: 95,
      notes: "Authenticated designer holds route to Additional QA Required until cleared.",
    },
    manifests: {
      rejectionReasons: [
        "Damaged/Broken/Torn",
        "Low Value",
        "Too Heavy/Bulky/Can't Ship",
        "Prohibited Item",
        "Counterfeit",
        "Do Not Send List",
        "Contaminated/Biohazard",
        "Bundling",
        "Duplicate tag",
        "Mismatched shoes/different sizes",
        "Technology Testing",
        "Stolen Property/Suspicion",
        "Moved to Jewelry",
        "Technology Error",
        "Wrong Description (Re-Added)",
      ],
      requirePhotosOnAccept: true,
      autoAssignProcessor: false,
    },
    categories: [
      { id: "cat-antiques", name: "Antiques", parentId: null },
      { id: "cat-art", name: "Art", parentId: null },
      { id: "cat-books", name: "Books/Movies/Music", parentId: null },
      { id: "cat-bulk", name: "Bulk", parentId: "cat-books" },
      { id: "cat-clothing", name: "Clothing", parentId: null },
      { id: "cat-collectibles", name: "Collectibles", parentId: null },
      { id: "cat-electronics", name: "Computers & Electronics", parentId: null },
      { id: "cat-home", name: "Home", parentId: null },
      { id: "cat-jewelry", name: "Jewelry", parentId: null },
      { id: "cat-travel", name: "Travel/Luggage", parentId: null },
    ],
    images: {
      watermarkEnabled: true,
      defaultAspect: "Square",
      maxUploadMb: 12,
    },
    products: {
      hammoqConnect: "Connected",
      skuType: "Alphanumeric with Number Endings (default)",
      defaultShippingMethod: "FedEx",
      requiredPostingFields: [
        "Images",
        "Category",
        "Listing Strategy",
        "SKU",
        "Supplier",
        "Weight",
      ],
      blockDraftReshelf: false,
      tags: [
        { id: "tg-1", name: "AutoLister", count: 42 },
        { id: "tg-2", name: "Bag And Box", count: 18 },
        { id: "tg-3", name: "Breakage", count: 3 },
        { id: "tg-4", name: "COA", count: 11 },
        { id: "tg-5", name: "DNF", count: 7 },
        { id: "tg-6", name: "Ebay Imported Expired", count: 5 },
        { id: "tg-7", name: "HMQ-Auto-List", count: 128 },
      ],
    },
    templates: [
      {
        id: "tpl-11565",
        title: "Games and Consoles",
        kind: "builder",
        status: "Published",
        updatedAt: "2025-02-13",
        inputs: ["brand", "model", "condition", "storage"],
        outputTitle: "{{brand}} {{model}} — {{condition}}",
        outputBody:
          "{{brand}} {{model}} in {{condition}} condition.\n\nStorage: {{storage}}\n\nShips from Test Goodwill.",
      },
      {
        id: "tpl-9927",
        title: "Hammoq — (Default) Clothing",
        kind: "builder",
        status: "Published",
        updatedAt: "2025-01-08",
        inputs: ["brand", "type", "size", "color", "condition"],
        outputTitle: "Men's {{brand}} {{type}} — Size {{size}}",
        outputBody:
          "• Brand: {{brand}}\n• Type: {{type}}\n• Size: {{size}}\n• Color: {{color}}\n• Condition: {{condition}}",
      },
      {
        id: "tpl-8801",
        title: "Electronics Fixed Price",
        kind: "builder",
        status: "Draft",
        updatedAt: "2024-11-22",
        inputs: ["brand", "title", "condition"],
        outputTitle: "{{brand}} {{title}}",
        outputBody: "{{title}} by {{brand}}. Condition: {{condition}}.",
      },
      {
        id: "tpl-static-1",
        title: "Returns policy blurb",
        kind: "static",
        status: "Draft",
        updatedAt: "2024-09-01",
        inputs: [],
        outputTitle: "Returns",
        outputBody: "30-day returns. Buyer pays return shipping unless item not as described.",
      },
    ],
    inventoryLocations: [
      ...LOCATIONS.map((l, i) => ({
        id: l.id,
        name: l.name,
        createdAt: daysAgo(120 + i * 10),
        controlledInShop: l.type === "Store" || l.type === "Warehouse",
      })),
      {
        id: "loc-zr-5-1",
        name: "Z-Racks 5-1",
        createdAt: "2026-03-16",
        controlledInShop: true,
      },
      {
        id: "loc-zr-6-2",
        name: "Z-Rack Long 6-2",
        createdAt: "2026-03-16",
        controlledInShop: true,
      },
      {
        id: "loc-cart-29",
        name: "Cart - 29",
        createdAt: "2026-02-01",
        controlledInShop: false,
      },
      {
        id: "loc-n-5-2",
        name: "N - 5 - 2",
        createdAt: "2025-11-12",
        controlledInShop: true,
      },
    ],
    shipping: {
      easyPostConnected: true,
      carriers: [
        { name: "USPS Account", lastUpdated: "Feb 20, 2025" },
        { name: "DHL Express Account", lastUpdated: "Jan 10, 2025" },
        { name: "FedEx 7888-6544-9 (788865449)", lastUpdated: "Jan 22, 2025" },
      ],
      disabledRates: [],
      requirePacking: true,
      autoSelectBestRate: false,
      autoSelectPacker: false,
      autoRequireSignature: true,
      signatureThreshold: 200,
      insuranceThreshold: 100,
    },
    shippingBoxes: [
      {
        id: "box-sm",
        name: "Small poly mailer",
        lengthIn: 10,
        widthIn: 8,
        heightIn: 1,
        weightOz: 1,
        scanSheet: false,
      },
      {
        id: "box-med",
        name: "Medium box 12×10×8",
        lengthIn: 12,
        widthIn: 10,
        heightIn: 8,
        weightOz: 8,
        scanSheet: true,
      },
    ],
    orders: {
      autoArchiveDays: 90,
      packingSlipHeader: "Test Goodwill · Thank you for your order",
      packingSlipFooter: "Questions? ops@testgoodwill.example",
      requireBoxSelection: true,
      pickingProfiles: [
        { id: "pp-single", name: "Single item orders", active: true },
        { id: "pp-multi", name: "Multi-item pick wave", active: true },
        { id: "pp-jewelry", name: "Jewelry vault pick", active: false },
      ],
    },
    print: {
      listerConnect: true,
      optionalLabelFields: ["SKU", "Location", "Supplier"],
      previewMode: "PDF",
    },
    teammates: seedTeammates(),
    roles: [
      {
        id: "role-admin",
        name: "Admin",
        description: "Unrestricted access to everything",
        teammateCount: 2,
        kind: "default",
        mapsTo: "Admin",
      },
      {
        id: "role-ops",
        name: "Ops Lead",
        description: "Floor ops + users; no org branding",
        teammateCount: 1,
        kind: "default",
        mapsTo: "Ops Lead",
      },
      {
        id: "role-lister",
        name: "Lister / Poster",
        description: "Can post items and manage inventory",
        teammateCount: 4,
        kind: "default",
        mapsTo: "Lister",
      },
      {
        id: "role-photo",
        name: "Photographer",
        description: "Photo stations and product images",
        teammateCount: 2,
        kind: "default",
        mapsTo: "Photographer",
      },
      {
        id: "role-viewer",
        name: "Reports Only / Viewer",
        description: "Can access reports",
        teammateCount: 1,
        kind: "default",
        mapsTo: "Viewer",
      },
      {
        id: "role-shipping",
        name: "Shipping Only",
        description: "Can access orders and create shipments",
        teammateCount: 0,
        kind: "default",
      },
      {
        id: "role-driver",
        name: "Driver",
        description: "Can pickup manifests",
        teammateCount: 0,
        kind: "default",
      },
      {
        id: "role-manager",
        name: "Manager",
        description: "Access to everything but settings",
        teammateCount: 0,
        kind: "default",
      },
      {
        id: "role-custom-ecom",
        name: "Collectibles Ecomm Associates",
        description: "Channel posting for collectibles",
        teammateCount: 0,
        kind: "custom",
        mapsTo: "Lister",
      },
      {
        id: "role-custom-finance",
        name: "Finance",
        description: "View and download finance and performance reports",
        teammateCount: 0,
        kind: "custom",
        mapsTo: "Viewer",
      },
      {
        id: "role-custom-it",
        name: "IT",
        description: "Access to users, reports, developer settings",
        teammateCount: 0,
        kind: "custom",
        mapsTo: "Admin",
      },
    ],
    channels: {
      ebay: {
        connected: true,
        accounts: [
          { id: "eb-1", name: "Test Goodwill eBay Store", status: "Connected" },
          { id: "eb-2", name: "TGW Collectibles", status: "Connected" },
        ],
        defaultDuration: "GTC",
        defaultHandlingDays: 3,
      },
      shopgoodwill: {
        connected: true,
        accountName: "Test Goodwill — ShopGoodwill",
        defaultHandlingPrice: 2.99,
        defaultStartingPrice: "",
        defaultShippingPrice: "",
        defaultBidIncrement: 2,
        defaultAuctionDuration: "5 days",
        defaultEndTimes: ["18:00 PT", "19:00 PT", "20:00 PT"],
        noCombineShipping: false,
        listImmediately: true,
        autoPrivateDescSku: true,
        auctionStart: "Immediately",
        titleTransform: "To Title Case",
        orderImport: "Import all",
        shippingDestinations: "No International shipments (U.S. Only)",
        descriptionFooter: "Sold as-is. See photos for condition details.",
      },
      shopify: {
        activated: false,
        notes: "Shopify channel stub — activate when OAuth credentials are available.",
      },
      goodwillfinds: {
        activated: false,
        notes: "GoodwillFinds channel stub — activate when partner API is configured.",
      },
    },
    developer: {
      tokens: [
        {
          id: "tok-1",
          name: "Floor sync bot",
          prefix: "hmq_live_4f2a…",
          createdAt: isoDaysAgo(40),
          lastUsedAt: isoDaysAgo(0),
        },
        {
          id: "tok-2",
          name: "Reporting export",
          prefix: "hmq_live_9c10…",
          createdAt: isoDaysAgo(120),
          lastUsedAt: isoDaysAgo(3),
        },
      ],
    },
    embeddedListings: {
      activated: false,
      notes: "Embed Hammoq listing widgets on partner storefronts. Activation stub for pilot.",
    },
  };
}

export function adminImsStorageKey(orgId: string) {
  return `${ADMIN_IMS_KEY_PREFIX}${orgId || DEFAULT_ORG_ID}`;
}

export function loadAdminIms(orgId: string): AdminImsState {
  const defaults = defaultAdminImsState();
  if (typeof window === "undefined") return structuredClone(defaults);
  try {
    const raw = localStorage.getItem(adminImsStorageKey(orgId));
    if (!raw) return structuredClone(defaults);
    const parsed = JSON.parse(raw) as Partial<AdminImsState>;
    return deepMergeIms(defaults, parsed);
  } catch {
    return structuredClone(defaults);
  }
}

export function saveAdminIms(orgId: string, state: AdminImsState) {
  localStorage.setItem(adminImsStorageKey(orgId), JSON.stringify(state));
  return state;
}

function deepMergeIms(base: AdminImsState, patch: Partial<AdminImsState>): AdminImsState {
  return {
    ...base,
    ...patch,
    general: { ...base.general, ...patch.general },
    notifications: { ...base.notifications, ...patch.notifications },
    suppliers: patch.suppliers?.length ? patch.suppliers : base.suppliers,
    itemAuth: { ...base.itemAuth, ...patch.itemAuth },
    manifests: {
      ...base.manifests,
      ...patch.manifests,
      rejectionReasons: patch.manifests?.rejectionReasons?.length
        ? patch.manifests.rejectionReasons
        : base.manifests.rejectionReasons,
    },
    categories: patch.categories?.length ? patch.categories : base.categories,
    images: { ...base.images, ...patch.images },
    products: {
      ...base.products,
      ...patch.products,
      requiredPostingFields:
        patch.products?.requiredPostingFields ?? base.products.requiredPostingFields,
      tags: patch.products?.tags?.length ? patch.products.tags : base.products.tags,
    },
    templates: patch.templates?.length ? patch.templates : base.templates,
    inventoryLocations: patch.inventoryLocations?.length
      ? patch.inventoryLocations
      : base.inventoryLocations,
    shipping: {
      ...base.shipping,
      ...patch.shipping,
      carriers: patch.shipping?.carriers?.length ? patch.shipping.carriers : base.shipping.carriers,
    },
    shippingBoxes: patch.shippingBoxes ?? base.shippingBoxes,
    orders: {
      ...base.orders,
      ...patch.orders,
      pickingProfiles: patch.orders?.pickingProfiles?.length
        ? patch.orders.pickingProfiles
        : base.orders.pickingProfiles,
    },
    print: {
      ...base.print,
      ...patch.print,
      optionalLabelFields: patch.print?.optionalLabelFields ?? base.print.optionalLabelFields,
    },
    teammates: patch.teammates?.length ? patch.teammates : base.teammates,
    roles: patch.roles?.length ? patch.roles : base.roles,
    channels: {
      ebay: { ...base.channels.ebay, ...patch.channels?.ebay },
      shopgoodwill: { ...base.channels.shopgoodwill, ...patch.channels?.shopgoodwill },
      shopify: { ...base.channels.shopify, ...patch.channels?.shopify },
      goodwillfinds: { ...base.channels.goodwillfinds, ...patch.channels?.goodwillfinds },
    },
    developer: {
      tokens: patch.developer?.tokens?.length ? patch.developer.tokens : base.developer.tokens,
    },
    embeddedListings: { ...base.embeddedListings, ...patch.embeddedListings },
  };
}

export function passwordRequirements(password: string) {
  return [
    {
      id: "length",
      label: "Be a minimum of 12 characters in length",
      ok: password.length >= 12,
    },
    {
      id: "upper",
      label: "Contain at least 1 uppercase letter",
      ok: /[A-Z]/.test(password),
    },
    {
      id: "lower",
      label: "Contain at least 1 lowercase letter",
      ok: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "Contain at least 1 number",
      ok: /[0-9]/.test(password),
    },
    {
      id: "special",
      label: "Contain at least 1 special character",
      ok: /[^A-Za-z0-9]/.test(password),
    },
  ] as const;
}

export function passwordMeetsAll(password: string) {
  return passwordRequirements(password).every((r) => r.ok);
}
