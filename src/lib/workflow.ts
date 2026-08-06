/**
 * Canonical thrift/resale item pipeline for store-thru-listing (IMS).
 * Stage is persisted as a `stage:<id>` tag on Product.tags / tagsJson.
 * See WORKFLOW.md for the operator one-pager.
 */

import type { Listing, ListingStatus, Product } from "@/lib/types";
import { findShelfLocation } from "@/lib/putaway-store";
import type { RetailTriage } from "@/lib/mock-data";

export const WORKFLOW_STAGE_PREFIX = "stage:";

export type WorkflowStageId =
  | "intake"
  | "donor"
  | "putaway"
  | "photos"
  | "qa"
  | "strategy"
  | "listed"
  | "fulfill"
  | "ship"
  | "sold"
  | "retail";

export type WorkflowStage = {
  id: WorkflowStageId;
  label: string;
  shortLabel: string;
  order: number;
  description: string;
};

/** Ordered pipeline (retail exits early). */
export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: "intake",
    label: "Store intake / triage",
    shortLabel: "Intake",
    order: 1,
    description: "Retail vs ecom in Hammoq Retail (demo triage flag on product tags).",
  },
  {
    id: "donor",
    label: "Donor / manifest create",
    shortLabel: "Donor",
    order: 2,
    description: "Batch + SKU/barcode print via Donor Item Creation.",
  },
  {
    id: "putaway",
    label: "Putaway",
    shortLabel: "Putaway",
    order: 3,
    description: "Scan barcode → assign shelf from Admin Inventory Locations.",
  },
  {
    id: "photos",
    label: "Photo + Auto-List",
    shortLabel: "Photos",
    order: 4,
    description: "Ecom path: InfinityAI photos → Auto-List queue.",
  },
  {
    id: "qa",
    label: "QA / Queued",
    shortLabel: "QA",
    order: 5,
    description: "Queued, Held QA, or Additional QA Required before live sell.",
  },
  {
    id: "strategy",
    label: "Listing strategy",
    shortLabel: "Strategy",
    order: 6,
    description: "Auction → BIN → concurrent → purge lifecycle.",
  },
  {
    id: "listed",
    label: "Channel listed",
    shortLabel: "Listed",
    order: 7,
    description: "Active on ShopGoodwill and/or eBay (mock publish OK).",
  },
  {
    id: "fulfill",
    label: "Pick / pack",
    shortLabel: "Fulfill",
    order: 8,
    description: "Order → pick list → pack.",
  },
  {
    id: "ship",
    label: "Ship + label",
    shortLabel: "Ship",
    order: 9,
    description: "Create EasyPost/stub label and mark shipped.",
  },
  {
    id: "sold",
    label: "Sold",
    shortLabel: "Sold",
    order: 10,
    description: "Sold; sibling channel listings ended.",
  },
  {
    id: "retail",
    label: "Retail path",
    shortLabel: "Retail",
    order: 0,
    description: "Triaged retail-worthy — leaves ecom pipeline.",
  },
];

export type WorkflowNextAction = {
  label: string;
  href: string;
  hint?: string;
  /** Primary button style */
  primary?: boolean;
};

export type WorkflowSnapshot = {
  stage: WorkflowStage;
  triage: RetailTriage;
  next: WorkflowNextAction | null;
  secondary?: WorkflowNextAction[];
  putawayLocation: string | null;
  listingStatuses: ListingStatus[];
  channels: string[];
};

export function stageTag(id: WorkflowStageId): string {
  return `${WORKFLOW_STAGE_PREFIX}${id}`;
}

export function parseStageTag(tags: string[] | undefined | null): WorkflowStageId | null {
  if (!tags?.length) return null;
  for (const t of tags) {
    if (t.startsWith(WORKFLOW_STAGE_PREFIX)) {
      const id = t.slice(WORKFLOW_STAGE_PREFIX.length) as WorkflowStageId;
      if (WORKFLOW_STAGES.some((s) => s.id === id)) return id;
    }
  }
  return null;
}

export function withStageTag(tags: string[] | undefined | null, id: WorkflowStageId): string[] {
  const base = (tags ?? []).filter((t) => !t.startsWith(WORKFLOW_STAGE_PREFIX));
  return [...base, stageTag(id)];
}

export function parseTriage(tags: string[] | undefined | null): RetailTriage {
  const hit = (tags ?? []).find((t) => t.startsWith("triage:"));
  if (!hit) return "undecided";
  const v = hit.slice("triage:".length);
  if (v === "retail" || v === "ecom" || v === "undecided") return v;
  return "undecided";
}

function getStageById(id: WorkflowStageId): WorkflowStage {
  return WORKFLOW_STAGES.find((s) => s.id === id) ?? WORKFLOW_STAGES[0]!;
}

export type WorkflowProductInput = {
  id: string;
  sku: string;
  upc?: string | null;
  status: string;
  location?: string | null;
  tags?: string[] | null;
  imageUrls?: string[] | null;
  strategy?: string | null;
  listedOn?: string[] | null;
};

export type WorkflowListingInput = {
  productId: string;
  channel: string;
  status: ListingStatus | string;
};

/**
 * Derive pipeline stage from tags + inventory/listing signals.
 * Explicit `stage:*` tag wins; otherwise infer from putaway / photos / listings.
 */
export function resolveWorkflowStage(
  product: WorkflowProductInput,
  opts: {
    orgId: string;
    listings?: WorkflowListingInput[];
    hasOpenOrder?: boolean;
    orderPickPack?: string | null;
    hasShipment?: boolean;
  }
): WorkflowStageId {
  const tagged = parseStageTag(product.tags);
  const triage = parseTriage(product.tags);

  if (tagged === "sold" || tagged === "retail") return tagged;
  if (triage === "retail" && (!tagged || tagged === "intake" || tagged === "donor")) {
    return "retail";
  }

  const productListings = (opts.listings ?? []).filter((l) => l.productId === product.id);
  const statuses = productListings.map((l) => l.status);
  if (statuses.some((s) => s === "Sold")) return "sold";

  if (opts.hasShipment || tagged === "ship") return "ship";
  if (
    opts.hasOpenOrder ||
    tagged === "fulfill" ||
    (opts.orderPickPack &&
      ["Being pulled", "Picked", "Packed", "Not started"].includes(opts.orderPickPack))
  ) {
    if (opts.orderPickPack === "Packed" && !opts.hasShipment) return "ship";
    return "fulfill";
  }

  const activeish = statuses.some((s) => s === "Active" || s === "Unpaid");
  if (activeish || (product.listedOn?.length && statuses.some((s) => s === "Active"))) {
    if (tagged === "strategy") return "strategy";
    return tagged === "listed" ? "listed" : product.strategy ? "listed" : "strategy";
  }

  if (
    statuses.some(
      (s) =>
        s === "Queued" ||
        s === "Additional QA Required" ||
        s === "HeldQA" ||
        String(s) === "HeldQA"
    )
  ) {
    return "qa";
  }

  if (tagged) return tagged;

  const shelf = findShelfLocation(opts.orgId, {
    barcode: product.upc ?? undefined,
    upc: product.upc ?? undefined,
    sku: product.sku,
  });
  const loc = product.location ?? "";
  const hasLocation =
    Boolean(shelf?.locationName) ||
    (Boolean(loc) && loc !== "Receiving" && loc.toLowerCase() !== "receiving");

  const photoCount = product.imageUrls?.length ?? 0;
  const isEcom = triage === "ecom" || triage === "undecided";

  if (!hasLocation) return product.tags?.some((t) => t === "Donor") ? "putaway" : "donor";
  if (isEcom && photoCount === 0) return "photos";
  if (isEcom && (product.status === "Draft" || !productListings.length)) return "photos";
  if (product.strategy && !activeish) return "strategy";
  return "donor";
}

export function buildWorkflowSnapshot(
  product: WorkflowProductInput,
  opts: {
    orgId: string;
    listings?: WorkflowListingInput[];
    hasOpenOrder?: boolean;
    orderPickPack?: string | null;
    hasShipment?: boolean;
  }
): WorkflowSnapshot {
  const stageId = resolveWorkflowStage(product, opts);
  const stage = getStageById(stageId);
  const triage = parseTriage(product.tags);
  const shelf = findShelfLocation(opts.orgId, {
    barcode: product.upc ?? undefined,
    upc: product.upc ?? undefined,
    sku: product.sku,
  });
  const putawayLocation = shelf?.locationName || product.location || null;
  const productListings = (opts.listings ?? []).filter((l) => l.productId === product.id);
  const listingStatuses = productListings.map((l) => l.status as ListingStatus);
  const channels = Array.from(
    new Set([
      ...(product.listedOn ?? []),
      ...productListings.map((l) => l.channel),
    ])
  );

  const barcode = encodeURIComponent(product.upc || product.sku);
  const productHref = `/products/${encodeURIComponent(product.id)}`;
  const autoListHref = `/infinity-ai?sku=${encodeURIComponent(product.sku)}`;

  let next: WorkflowNextAction | null = null;
  const secondary: WorkflowNextAction[] = [];

  switch (stageId) {
    case "intake":
      next = {
        label: "Open donor create",
        href: "/manifests/new",
        hint: "Mark retail vs ecom triage on each line",
        primary: true,
      };
      secondary.push({
        label: "Hammoq Retail (store)",
        href: "https://apps.apple.com/us/app/hammoq-retail/id6460302479",
      });
      break;
    case "donor":
      next = {
        label: "Putaway this SKU",
        href: `/products/putaway?barcode=${barcode}`,
        hint: "Scan barcode → assign shelf",
        primary: true,
      };
      break;
    case "putaway":
      next = {
        label: "Scan / putaway",
        href: `/products/putaway?barcode=${barcode}`,
        hint: putawayLocation ? `Current: ${putawayLocation}` : "Not on shelf yet",
        primary: true,
      };
      break;
    case "photos":
      next = {
        label: "Photos / Auto-List",
        href: autoListHref,
        hint: "Ecom: InfinityAI → Auto-List queue",
        primary: true,
      };
      secondary.push({ label: "Edit product photos", href: productHref });
      break;
    case "qa":
      next = {
        label: "Review QA queue",
        href: "/listings/ebay?status=Additional%20QA%20Required",
        hint: "Clear Additional QA or publish Queued",
        primary: true,
      };
      secondary.push({ label: "Open product", href: productHref });
      break;
    case "strategy": {
      const withId = (
        opts.listings as Array<WorkflowListingInput & { id?: string }> | undefined
      )?.find((l) => l.productId === product.id && l.id);
      next = {
        label: withId?.id ? "Advance strategy" : "Assign strategy on product",
        href: withId?.id
          ? `/listings/${encodeURIComponent(withId.id)}`
          : productHref,
        hint: "Auction → BIN → concurrent → purge",
        primary: true,
      };
      secondary.push({ label: "Admin strategies", href: "/admin/listing-strategies" });
      break;
    }
    case "listed":
      next = {
        label: "Simulate sale",
        href: `${productHref}?action=simulate-sale`,
        hint: "Ends sibling channel listings",
        primary: true,
      };
      secondary.push({ label: "Orders", href: "/orders" });
      break;
    case "fulfill":
      next = {
        label: "Pick lists",
        href: "/orders/pick-lists",
        hint: "Pull → pack",
        primary: true,
      };
      secondary.push({ label: "Orders", href: "/orders?fulfillment=Unfulfilled" });
      break;
    case "ship":
      next = {
        label: "Create shipment",
        href: "/shipments/new",
        hint: "Label + mark shipped",
        primary: true,
      };
      break;
    case "sold":
      next = {
        label: "View product",
        href: productHref,
        hint: "Sibling listings ended",
      };
      break;
    case "retail":
      next = {
        label: "Donor hub",
        href: "/manifests",
        hint: "Retail path — out of ecom Auto-List",
      };
      break;
  }

  return {
    stage,
    triage,
    next,
    secondary: secondary.length ? secondary : undefined,
    putawayLocation,
    listingStatuses,
    channels,
  };
}

/** Merge seed + created listings for a product id. */
export function listingsForProduct(
  productId: string,
  seed: Listing[],
  created: Array<{
    id: string;
    productId: string;
    channel: string;
    status: string;
  }>
): Array<WorkflowListingInput & { id: string }> {
  const fromSeed = seed
    .filter((l) => l.productId === productId)
    .map((l) => ({
      id: l.id,
      productId: l.productId,
      channel: l.channel,
      status: l.status,
    }));
  const fromCreated = created
    .filter((l) => l.productId === productId)
    .map((l) => ({
      id: l.id,
      productId: l.productId,
      channel: l.channel,
      status: l.status as ListingStatus,
    }));
  const byId = new Map<string, WorkflowListingInput & { id: string }>();
  for (const l of [...fromSeed, ...fromCreated]) byId.set(l.id, l);
  return Array.from(byId.values());
}

export function productToWorkflowInput(
  p: Pick<
    Product,
    "id" | "sku" | "status" | "location" | "tags" | "imageUrls" | "strategy" | "listedOn"
  > & { upc?: string }
): WorkflowProductInput {
  return {
    id: p.id,
    sku: p.sku,
    upc: p.upc,
    status: p.status,
    location: p.location,
    tags: p.tags,
    imageUrls: p.imageUrls,
    strategy: p.strategy,
    listedOn: p.listedOn,
  };
}

export const WORKFLOW_STAGE_LABELS: Record<WorkflowStageId, string> = Object.fromEntries(
  WORKFLOW_STAGES.map((s) => [s.id, s.label])
) as Record<WorkflowStageId, string>;
