import {
  DEFAULT_AI_SETTINGS,
  DEFAULT_CONNECTIONS,
  DEFAULT_LISTING_DEFAULTS,
  DEFAULT_STATIONS,
  ORG_PROFILE,
  type AiAdminSettings,
  type ListingDefaults,
  type MarketplaceConnection,
  type StationDevice,
  type AdminRole,
  ADMIN_USERS,
  type AdminUser,
  ROLE_PERMISSIONS,
  type PermissionKey,
} from "@/lib/admin-data";
import { cloneStrategies, type ListingStrategy } from "@/lib/listing-strategies";

const KEY = "test-goodwill-admin";

export type AdminPersistedState = {
  orgName: string;
  orgSlug: string;
  timezone: string;
  brandingNotes: string;
  connections: MarketplaceConnection[];
  ai: AiAdminSettings;
  listingDefaults: ListingDefaults;
  /** Editable listing strategies (Auto-List defaults). */
  strategies: ListingStrategy[];
  stations: StationDevice[];
  users: AdminUser[];
  /** Demo permission overrides keyed by role → permission → enabled */
  permissionOverrides: Partial<Record<AdminRole, Partial<Record<PermissionKey, boolean>>>>;
  actingAsUserId: string;
};

export const DEFAULT_ADMIN_STATE: AdminPersistedState = {
  orgName: ORG_PROFILE.name,
  orgSlug: ORG_PROFILE.slug,
  timezone: ORG_PROFILE.timezone,
  brandingNotes: ORG_PROFILE.brandingNotes,
  connections: DEFAULT_CONNECTIONS.map((c) => ({ ...c })),
  ai: { ...DEFAULT_AI_SETTINGS, categoryRouting: DEFAULT_AI_SETTINGS.categoryRouting.map((r) => ({ ...r })) },
  listingDefaults: { ...DEFAULT_LISTING_DEFAULTS },
  strategies: cloneStrategies(),
  stations: DEFAULT_STATIONS.map((s) => ({ ...s })),
  users: ADMIN_USERS.map((u) => ({ ...u })),
  permissionOverrides: {},
  actingAsUserId: ADMIN_USERS[0]!.id,
};

export function loadAdminState(): AdminPersistedState {
  if (typeof window === "undefined") return structuredClone(DEFAULT_ADMIN_STATE);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_ADMIN_STATE);
    const parsed = JSON.parse(raw) as Partial<AdminPersistedState>;
    return {
      ...structuredClone(DEFAULT_ADMIN_STATE),
      ...parsed,
      connections: parsed.connections?.length
        ? parsed.connections
        : structuredClone(DEFAULT_ADMIN_STATE.connections),
      ai: {
        ...DEFAULT_AI_SETTINGS,
        ...parsed.ai,
        categoryRouting:
          parsed.ai?.categoryRouting?.length
            ? parsed.ai.categoryRouting
            : DEFAULT_AI_SETTINGS.categoryRouting.map((r) => ({ ...r })),
      },
      listingDefaults: { ...DEFAULT_LISTING_DEFAULTS, ...parsed.listingDefaults },
      strategies: parsed.strategies?.length
        ? parsed.strategies
        : cloneStrategies(),
      stations: parsed.stations?.length
        ? parsed.stations
        : structuredClone(DEFAULT_ADMIN_STATE.stations),
      users: parsed.users?.length ? parsed.users : structuredClone(DEFAULT_ADMIN_STATE.users),
      permissionOverrides: parsed.permissionOverrides ?? {},
      actingAsUserId: parsed.actingAsUserId ?? DEFAULT_ADMIN_STATE.actingAsUserId,
    };
  } catch {
    return structuredClone(DEFAULT_ADMIN_STATE);
  }
}

export function saveAdminState(state: AdminPersistedState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

export function clearAdminLocalStorage() {
  for (const k of [
    "test-goodwill-settings",
    "test-goodwill-demo-created",
    "test-goodwill-demo-photos",
    KEY,
  ]) {
    localStorage.removeItem(k);
  }
  // Org-scoped IMS settings keys
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith("stl-admin-ims:")) localStorage.removeItem(k);
  }
}

export function effectivePermissions(
  role: AdminRole,
  overrides: AdminPersistedState["permissionOverrides"]
): Record<PermissionKey, boolean> {
  const base = { ...ROLE_PERMISSIONS[role] };
  const o = overrides[role];
  if (!o) return base;
  return { ...base, ...o };
}
