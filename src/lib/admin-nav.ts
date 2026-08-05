/**
 * Customer Admin sidebar IA.
 * Add new pages by appending to a group — routes stay under `/admin/*`.
 */

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Boxes,
  Cable,
  Code2,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Package,
  PackageOpen,
  Printer,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  Users,
  UserCog,
  FileText,
  Database,
  Sparkles,
  Building2,
} from "lucide-react";
import { BRAND } from "@/lib/mock-data";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Admin / Ops master event log only */
  masterOnly?: boolean;
  /** Soft stub — page ships but marked Coming soon */
  stub?: boolean;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/organization", label: "Organization", icon: Building2 },
      { href: "/admin/audit", label: "Master event log", icon: ScrollText, masterOnly: true },
      { href: "/admin/data", label: "Data & exports", icon: Database },
      { href: "/admin/infinity-ai", label: BRAND.ai, icon: Sparkles },
    ],
  },
  {
    id: "general",
    label: "General",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/suppliers", label: "Suppliers", icon: Store },
    ],
  },
  {
    id: "manifests",
    label: "Donor intake & Authentication",
    items: [
      { href: "/admin/item-authentication", label: "Item Authentication", icon: ShieldCheck },
      { href: "/admin/donor-item-creation", label: "Donor Item Creation", icon: PackageOpen },
    ],
  },
  {
    id: "products",
    label: "Products & Listing",
    items: [
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/images", label: "Images", icon: ImageIcon },
      { href: "/admin/listing-strategies", label: "Listing Strategies", icon: ListChecks },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/templates", label: "Templates", icon: FileText },
    ],
  },
  {
    id: "inventory",
    label: "Inventory, Shipping & Printing",
    items: [
      { href: "/admin/inventory-locations", label: "Inventory Locations", icon: MapPin },
      { href: "/admin/shipping", label: "Shipping", icon: Truck },
      { href: "/admin/shipping-boxes", label: "Shipping Boxes", icon: Boxes },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/print-settings", label: "Print settings", icon: Printer },
    ],
  },
  {
    id: "team",
    label: "Team",
    items: [
      { href: "/admin/teammates", label: "Teammates", icon: Users },
      { href: "/admin/roles", label: "Roles", icon: UserCog },
    ],
  },
  {
    id: "channels",
    label: "Channels",
    items: [
      { href: "/admin/channels/ebay", label: "eBay", icon: Tags },
      { href: "/admin/channels/shopgoodwill", label: "ShopGoodwill", icon: Store },
      { href: "/admin/marketplaces", label: "All connections", icon: Cable },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    items: [
      { href: "/admin/developer", label: "Developer", icon: Code2 },
    ],
  },
];

export function isAdminNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact || href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
