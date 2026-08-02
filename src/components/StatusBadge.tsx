import { cn } from "@/lib/utils";
import type { ItemReviewStatus, ListingStatus, ManifestStatus, ProductStatus } from "@/lib/types";

const manifestTone: Record<ManifestStatus, "neutral" | "blue" | "green" | "orange" | "red" | "purple" | "yellow"> = {
  Created: "blue",
  "Ready for Pickup": "orange",
  "In Transit": "purple",
  Received: "blue",
  "Partially Processed": "orange",
  Processed: "green",
  Missing: "red",
};

const reviewTone: Record<ItemReviewStatus, "neutral" | "blue" | "green" | "orange" | "red" | "yellow"> = {
  "Not processed": "neutral",
  Accepted: "green",
  Rejected: "red",
  Missing: "red",
  "On hold": "yellow",
  "Draft product": "blue",
};

const productTone: Record<ProductStatus, "neutral" | "blue" | "green" | "orange"> = {
  Active: "green",
  Draft: "blue",
  Recycled: "orange",
};

const listingTone: Record<ListingStatus, "neutral" | "blue" | "green" | "orange" | "red" | "yellow"> = {
  Queued: "yellow",
  Active: "green",
  Unpaid: "orange",
  Sold: "blue",
  Expired: "neutral",
  Delisted: "neutral",
  Recycled: "orange",
  "Additional QA Required": "red",
};

function Pill({
  children,
  tone,
  className,
}: {
  children: React.ReactNode;
  tone: string;
  className?: string;
}) {
  const map: Record<string, string> = {
    neutral: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-emerald-100 text-emerald-800",
    orange: "bg-orange-100 text-orange-800",
    red: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
    yellow: "bg-amber-100 text-amber-900",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", map[tone], className)}>
      {children}
    </span>
  );
}

export function ManifestStatusBadge({ status }: { status: ManifestStatus }) {
  return <Pill tone={manifestTone[status]}>{status}</Pill>;
}

export function ReviewStatusBadge({ status }: { status: ItemReviewStatus }) {
  return <Pill tone={reviewTone[status]}>{status}</Pill>;
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Pill tone={productTone[status]}>{status}</Pill>;
}

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return <Pill tone={listingTone[status]}>{status}</Pill>;
}
