/** Pilot org catalog — Test Goodwill + 9 anonymized peers. */

export type OrgSyncStatus = "healthy" | "degraded" | "error" | "paused";

export type OrgFeatureFlags = {
  autoList: boolean;
  shopgoodwill: boolean;
  ebay: boolean;
  /** Kill switch — when false, Auto-List and outbound sync are blocked. */
  killSwitchOff: boolean;
};

export type Org = {
  id: string;
  name: string;
  slug: string;
  /** Short label for Ops console */
  region: string;
  type: "goodwill" | "resale";
  /** Seed health for Ops dashboard (overridden by mock ops state). */
  seedSyncStatus: OrgSyncStatus;
  seedErrorCount: number;
  seedAutoListVolume: number;
  flags: OrgFeatureFlags;
};

export const DEFAULT_ORG_ID = "org-test-goodwill";

export const PILOT_ORGS: Org[] = [
  {
    id: "org-test-goodwill",
    name: "Test Goodwill",
    slug: "test-goodwill",
    region: "Pacific Demo",
    type: "goodwill",
    seedSyncStatus: "healthy",
    seedErrorCount: 28,
    seedAutoListVolume: 168,
    flags: {
      autoList: true,
      shopgoodwill: true,
      ebay: true,
      killSwitchOff: true,
    },
  },
  {
    id: "org-gw-cascade",
    name: "Cascade Valley Goodwill",
    slug: "cascade-valley-gw",
    region: "Pacific NW",
    type: "goodwill",
    seedSyncStatus: "healthy",
    seedErrorCount: 4,
    seedAutoListVolume: 92,
    flags: {
      autoList: true,
      shopgoodwill: true,
      ebay: true,
      killSwitchOff: true,
    },
  },
  {
    id: "org-gw-prairie",
    name: "Prairie Lakes Goodwill",
    slug: "prairie-lakes-gw",
    region: "Midwest",
    type: "goodwill",
    seedSyncStatus: "degraded",
    seedErrorCount: 19,
    seedAutoListVolume: 74,
    flags: {
      autoList: true,
      shopgoodwill: true,
      ebay: true,
      killSwitchOff: true,
    },
  },
  {
    id: "org-gw-harbor",
    name: "Harbor City Goodwill",
    slug: "harbor-city-gw",
    region: "Northeast",
    type: "goodwill",
    seedSyncStatus: "healthy",
    seedErrorCount: 2,
    seedAutoListVolume: 141,
    flags: {
      autoList: true,
      shopgoodwill: true,
      ebay: false,
      killSwitchOff: true,
    },
  },
  {
    id: "org-gw-mesa",
    name: "Mesa Ridge Goodwill",
    slug: "mesa-ridge-gw",
    region: "Southwest",
    type: "goodwill",
    seedSyncStatus: "error",
    seedErrorCount: 47,
    seedAutoListVolume: 38,
    flags: {
      autoList: true,
      shopgoodwill: true,
      ebay: true,
      killSwitchOff: true,
    },
  },
  {
    id: "org-gw-lake",
    name: "Great Lakes Goodwill",
    slug: "great-lakes-gw",
    region: "Great Lakes",
    type: "goodwill",
    seedSyncStatus: "healthy",
    seedErrorCount: 7,
    seedAutoListVolume: 203,
    flags: {
      autoList: true,
      shopgoodwill: true,
      ebay: true,
      killSwitchOff: true,
    },
  },
  {
    id: "org-resale-oak",
    name: "Oak & Thread Resale",
    slug: "oak-thread-resale",
    region: "Mid-Atlantic",
    type: "resale",
    seedSyncStatus: "degraded",
    seedErrorCount: 12,
    seedAutoListVolume: 55,
    flags: {
      autoList: true,
      shopgoodwill: false,
      ebay: true,
      killSwitchOff: true,
    },
  },
  {
    id: "org-resale-summit",
    name: "Summit Thrift Collective",
    slug: "summit-thrift",
    region: "Mountain",
    type: "resale",
    seedSyncStatus: "healthy",
    seedErrorCount: 1,
    seedAutoListVolume: 61,
    flags: {
      autoList: true,
      shopgoodwill: true,
      ebay: true,
      killSwitchOff: true,
    },
  },
  {
    id: "org-gw-bayou",
    name: "Bayou Parish Goodwill",
    slug: "bayou-parish-gw",
    region: "Gulf",
    type: "goodwill",
    seedSyncStatus: "paused",
    seedErrorCount: 0,
    seedAutoListVolume: 0,
    flags: {
      autoList: false,
      shopgoodwill: true,
      ebay: true,
      killSwitchOff: false,
    },
  },
  {
    id: "org-resale-northstar",
    name: "Northstar Reuse Hub",
    slug: "northstar-reuse",
    region: "Upper Midwest",
    type: "resale",
    seedSyncStatus: "healthy",
    seedErrorCount: 5,
    seedAutoListVolume: 88,
    flags: {
      autoList: true,
      shopgoodwill: true,
      ebay: true,
      killSwitchOff: true,
    },
  },
];

export function getOrgById(id: string): Org | undefined {
  return PILOT_ORGS.find((o) => o.id === id);
}

export function getOrgBySlug(slug: string): Org | undefined {
  return PILOT_ORGS.find((o) => o.slug === slug);
}

/** Deterministic index 0–9 for deriving org-scoped mock variants. */
export function orgIndex(orgId: string): number {
  const i = PILOT_ORGS.findIndex((o) => o.id === orgId);
  return i >= 0 ? i : 0;
}
