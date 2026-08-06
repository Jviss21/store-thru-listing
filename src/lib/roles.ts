/**
 * Role-based UI / route visibility for store-thru-listing.
 * Kept free of heavy mock-data imports so middleware can use it on the Edge.
 * Master event log: Admin role or Hammoq Ops (isOps) only — not Ops Lead / Lister / etc.
 */

export type AdminRole = "Admin" | "Ops Lead" | "Lister" | "Photographer" | "Viewer";

export type NavSection =
  | "home"
  | "manifests"
  | "products"
  | "listings"
  | "orders"
  | "shipments"
  | "reports"
  | "auto-list"
  | "workflow"
  | "admin"
  | "connections"
  | "settings"
  | "notifications"
  | "ops"
  | "master-events";

type Perm = {
  viewInventory: boolean;
  createListings: boolean;
  runAutoList: boolean;
  manageOrders: boolean;
  manageShipments: boolean;
  viewReports: boolean;
  manageUsers: boolean;
  manageOrg: boolean;
  manageConnections: boolean;
  manageAi: boolean;
};

const ROLE_PERMISSIONS: Record<AdminRole, Perm> = {
  Admin: {
    viewInventory: true,
    createListings: true,
    runAutoList: true,
    manageOrders: true,
    manageShipments: true,
    viewReports: true,
    manageUsers: true,
    manageOrg: true,
    manageConnections: true,
    manageAi: true,
  },
  "Ops Lead": {
    viewInventory: true,
    createListings: true,
    runAutoList: true,
    manageOrders: true,
    manageShipments: true,
    viewReports: true,
    manageUsers: true,
    manageOrg: false,
    manageConnections: true,
    manageAi: true,
  },
  Lister: {
    viewInventory: true,
    createListings: true,
    runAutoList: true,
    manageOrders: false,
    manageShipments: false,
    viewReports: true,
    manageUsers: false,
    manageOrg: false,
    manageConnections: false,
    manageAi: false,
  },
  Photographer: {
    viewInventory: true,
    createListings: false,
    runAutoList: false,
    manageOrders: false,
    manageShipments: false,
    viewReports: false,
    manageUsers: false,
    manageOrg: false,
    manageConnections: false,
    manageAi: false,
  },
  Viewer: {
    viewInventory: true,
    createListings: false,
    runAutoList: false,
    manageOrders: false,
    manageShipments: false,
    viewReports: true,
    manageUsers: false,
    manageOrg: false,
    manageConnections: false,
    manageAi: false,
  },
};

export function normalizeRole(role: string): AdminRole {
  if (
    role === "Admin" ||
    role === "Ops Lead" ||
    role === "Lister" ||
    role === "Photographer" ||
    role === "Viewer"
  ) {
    return role;
  }
  return "Viewer";
}

export function isAdminCapable(role: AdminRole | string) {
  return role === "Admin" || role === "Ops Lead";
}

/** Full cross-system event log — Admin (org) or Hammoq Ops only. */
export function canViewMasterEventLog(role: string, isOps: boolean): boolean {
  return isOps || normalizeRole(role) === "Admin";
}

export function canAccessAdminConsole(role: string, isOps: boolean): boolean {
  return isOps || isAdminCapable(role);
}

export function canAccessNav(section: NavSection, role: string, isOps: boolean): boolean {
  if (isOps) return true;
  const r = normalizeRole(role);
  const p = ROLE_PERMISSIONS[r];

  switch (section) {
    case "home":
    case "settings":
    case "notifications":
    case "workflow":
      return true;
    case "manifests":
    case "products":
      return p.viewInventory;
    case "listings":
      return p.viewInventory && r !== "Photographer";
    case "auto-list":
      return p.runAutoList;
    case "orders":
      return p.manageOrders;
    case "shipments":
      return p.manageShipments;
    case "reports":
      return p.viewReports;
    case "admin":
      return isAdminCapable(r);
    case "connections":
      return p.manageConnections;
    case "master-events":
      return canViewMasterEventLog(r, false);
    case "ops":
      return false;
    default:
      return true;
  }
}

/** Path prefix → nav section for client/middleware guards. */
export function sectionForPath(pathname: string): NavSection | null {
  if (pathname.startsWith("/ops")) return "ops";
  if (pathname.startsWith("/workflow")) return "workflow";
  if (pathname.startsWith("/admin/audit") || pathname.startsWith("/reports/events")) {
    return "master-events";
  }
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/settings/connections")) return "connections";
  if (pathname.startsWith("/products/auto-list")) return "auto-list";
  if (pathname.startsWith("/manifests")) return "manifests";
  if (pathname.startsWith("/products")) return "products";
  if (pathname.startsWith("/listings")) return "listings";
  if (pathname.startsWith("/orders")) return "orders";
  if (pathname.startsWith("/shipments")) return "shipments";
  if (pathname.startsWith("/reports")) return "reports";
  return null;
}

export function canAccessPath(pathname: string, role: string, isOps: boolean): boolean {
  const section = sectionForPath(pathname);
  if (!section) return true;
  if (section === "ops") return isOps;
  return canAccessNav(section, role, isOps);
}
