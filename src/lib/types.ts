export type ManifestStatus =
  | "Created"
  | "Ready for Pickup"
  | "In Transit"
  | "Received"
  | "Partially Processed"
  | "Processed"
  | "Missing";

export type ItemReviewStatus =
  | "Not processed"
  | "Accepted"
  | "Rejected"
  | "Missing"
  | "On hold"
  | "Draft product";

export type ProductStatus = "Active" | "Draft" | "Recycled";
export type ListingChannel = "ShopGoodwill" | "eBay";
export type ListingStatus =
  | "Queued"
  | "Active"
  | "Unpaid"
  | "Sold"
  | "Expired"
  | "Delisted"
  | "Recycled"
  | "Additional QA Required";
export type OrderFulfillment = "Unfulfilled" | "Partial" | "Fulfilled";
export type PaymentStatus = "Pending" | "Paid" | "Refunded";
export type ListingType = "Auction" | "Fixed Price";

export interface ManifestItem {
  id: string;
  title: string;
  sku: string;
  reviewStatus: ItemReviewStatus;
  rejectReason?: string;
}
export interface ManifestEvent { id: string; user: string; action: string; at: string; }
export interface ManifestNote { id: string; user: string; body: string; at: string; }
export interface Manifest {
  id: string; code: string; supplier: string; createdBy: string; createdAt: string; updatedAt: string;
  status: ManifestStatus; productCount: number; items: ManifestItem[]; notes: ManifestNote[]; events: ManifestEvent[];
}

export interface Product {
  id: string; title: string; sku: string; status: ProductStatus; location: string; supplier: string;
  createdBy: string; createdAt: string; category: string; categoryPath: string; price: number;
  imageColor: string; imageUrls: string[]; mainImageIndex?: number; listedOn: ListingChannel[];
  description?: string; privateDescription?: string; carrier?: string; condition?: string;
  conditionDescription?: string; brand?: string; mpn?: string; upc?: string; weightLbs?: number;
  weightUnit?: "LBS" | "KG"; lengthIn?: number; widthIn?: number; heightIn?: number; dimUnit?: "IN" | "CM";
  boxPadding?: string; shippingMethod?: string; shippingBox?: string; shippingWeightLbs?: number;
  strategy?: string; tags?: string[]; uprightProductId?: string; subtitle?: string; productNotes?: string;
  ebayCategoryId?: string; listingType?: ListingType; listingDuration?: string; startTime?: string;
  listImmediately?: boolean; startingPrice?: number; buyItNowPrice?: number; reservePrice?: number;
  handlingTimeDays?: number; allowBestOffer?: boolean; shippingPolicy?: string; returnsPolicy?: string;
  paymentPolicy?: string; storeCategory?: string; itemSpecifics?: Record<string, string>;
}

export interface Listing {
  id: string; productId: string; channel: ListingChannel; title: string; subtitle?: string; sku: string;
  status: ListingStatus; price: number; quantity: number; strategy: string; tags: string[];
  postedBy: string; postedAt: string; productCreatedAt: string; location: string; supplier: string;
  carrier: string; categoryPath: string; externalId: string; uprightProductId: string;
  privateDescription: string; condition: string; conditionDescription?: string; brand: string;
  mpn?: string; upc?: string; weightLbs: number; weightUnit?: "LBS" | "KG"; lengthIn: number;
  widthIn: number; heightIn: number; dimUnit?: "IN" | "CM"; boxPadding?: string; shippingMethod?: string;
  shippingBox?: string; shippingWeightLbs?: number; description: string; imageColor: string;
  imageUrls: string[]; mainImageIndex?: number; itemSpecifics: Record<string, string>;
  returnsPolicy: string; paymentPolicy: string; shippingPolicy: string; itemLocation: string;
  productNotes?: string; ebayCategoryId?: string; listingType?: ListingType; listingDuration?: string;
  startTime?: string; listImmediately?: boolean; startingPrice?: number; buyItNowPrice?: number;
  reservePrice?: number; handlingTimeDays?: number; allowBestOffer?: boolean; autoDeclinePrice?: number;
  autoAcceptPrice?: number; storeCategory?: string; bids?: number;
}

export interface Order {
  id: string; orderNumber: string; channel: ListingChannel; customer: string; total: number;
  paymentStatus: PaymentStatus; fulfillmentStatus: OrderFulfillment; itemCount: number; createdAt: string;
}
export type ShipmentStatus = "Label created" | "In transit" | "Delivered";
export interface Shipment {
  id: string;
  /** Numeric display ID shown in the Shipments list (Upright-style). */
  shipmentNumber: string;
  orderId: string;
  orderNumber: string;
  /** Marketplace-facing order id shown next to the channel icon. */
  channelOrderId: string;
  channel: ListingChannel;
  carrier: string;
  trackingNumber: string;
  easyPostId: string;
  /** Label cost (alias kept as `cost` for existing CSV/export callers). */
  cost: number;
  fees: number;
  insurance: number | null;
  createdBy: string;
  packedBy: string;
  shippedAt: string;
  status: ShipmentStatus;
}

export interface EbayListingInputPack {
  organization: string; channel: "eBay"; title: string; subtitle: string; description: string;
  condition: string; conditionDescription: string; category: string; categoryPath: string;
  ebayCategoryId: string; listingType: string; listingDuration: string; startTime: string;
  startingPrice: number; buyItNowPrice: number; reservePrice: number; handlingTimeDays: number;
  allowBestOffer: boolean; itemSpecifics: string; brand: string; mpn: string; upc: string;
  price: number; quantity: number; sku: string; photoUrls: string; mainImageIndex: number;
  shippingPolicy: string; shippingMethod: string; shippingBox: string; shippingWeightLbs: number;
  weightLbs: number; lengthIn: number; widthIn: number; heightIn: number; dimUnit: string;
  boxPadding: string; returnsPolicy: string; paymentPolicy: string; itemLocation: string;
  privateDescription: string; productNotes: string; inventoryLocation: string; supplier: string;
  carrier: string; strategy: string; tags: string; uprightProductId: string; externalId: string;
  status: string; bids: number; generatedAt: string;
}

export function canEditListing(listing: Pick<Listing, "status" | "bids">): boolean {
  if (listing.status === "Sold") return false;
  if (listing.status === "Active" && (listing.bids ?? 0) > 0) return false;
  return true;
}
