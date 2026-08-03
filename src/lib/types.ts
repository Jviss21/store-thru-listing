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

export interface ManifestItem {
  id: string;
  title: string;
  sku: string;
  reviewStatus: ItemReviewStatus;
  rejectReason?: string;
}

export interface ManifestEvent {
  id: string;
  user: string;
  action: string;
  at: string;
}

export interface ManifestNote {
  id: string;
  user: string;
  body: string;
  at: string;
}

export interface Manifest {
  id: string;
  code: string;
  supplier: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: ManifestStatus;
  productCount: number;
  items: ManifestItem[];
  notes: ManifestNote[];
  events: ManifestEvent[];
}

export interface Product {
  id: string;
  title: string;
  sku: string;
  status: ProductStatus;
  location: string;
  supplier: string;
  createdBy: string;
  createdAt: string;
  category: string;
  categoryPath: string;
  price: number;
  imageColor: string;
  imageUrls: string[];
  listedOn: ListingChannel[];
  description?: string;
  privateDescription?: string;
  carrier?: string;
  condition?: string;
  brand?: string;
  mpn?: string;
  upc?: string;
  weightLbs?: number;
  lengthIn?: number;
  widthIn?: number;
  heightIn?: number;
  strategy?: string;
  tags?: string[];
  uprightProductId?: string;
  subtitle?: string;
}

export interface Listing {
  id: string;
  productId: string;
  channel: ListingChannel;
  title: string;
  subtitle?: string;
  sku: string;
  status: ListingStatus;
  price: number;
  quantity: number;
  strategy: string;
  tags: string[];
  postedBy: string;
  postedAt: string;
  productCreatedAt: string;
  location: string;
  supplier: string;
  carrier: string;
  categoryPath: string;
  externalId: string;
  uprightProductId: string;
  privateDescription: string;
  condition: string;
  brand: string;
  mpn?: string;
  upc?: string;
  weightLbs: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  description: string;
  imageColor: string;
  imageUrls: string[];
  itemSpecifics: Record<string, string>;
  returnsPolicy: string;
  paymentPolicy: string;
  shippingPolicy: string;
  itemLocation: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  channel: ListingChannel;
  customer: string;
  total: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: OrderFulfillment;
  itemCount: number;
  createdAt: string;
}

export interface Shipment {
  id: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  cost: number;
  shippedAt: string;
  status: "Label created" | "In transit" | "Delivered";
}

/** Flat row used for eBay listing input pack CSV/JSON downloads. */
export interface EbayListingInputPack {
  organization: string;
  channel: "eBay";
  title: string;
  subtitle: string;
  description: string;
  condition: string;
  category: string;
  categoryPath: string;
  itemSpecifics: string;
  brand: string;
  mpn: string;
  upc: string;
  price: number;
  quantity: number;
  sku: string;
  photoUrls: string;
  shippingPolicy: string;
  weightLbs: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  returnsPolicy: string;
  paymentPolicy: string;
  itemLocation: string;
  privateDescription: string;
  inventoryLocation: string;
  supplier: string;
  carrier: string;
  strategy: string;
  tags: string;
  uprightProductId: string;
  externalId: string;
  status: string;
  generatedAt: string;
}
