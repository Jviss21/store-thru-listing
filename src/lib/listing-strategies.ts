/**
 * Listing strategies — saved profiles that drive Auto-List / upload defaults.
 * Editable under Admin → Listing defaults. Selecting a strategy on the product
 * or listing form applies these defaults (user can override).
 */

import type { ListingChannel, ListingType } from "./types";

export type ListingStrategy = {
  id: string;
  name: string;
  channel: ListingChannel | "Both";
  /** Preferred product category leaf for routing hints. */
  preferredCategory?: string;
  defaultWeightLbs: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  dimUnit: "IN" | "CM";
  boxPadding: string;
  shippingMethod: string;
  carrier: string;
  shippingBox: string;
  shippingWeightLbs: number;
  listingType: ListingType;
  listingDuration: string;
  startTime: string;
  listImmediately: boolean;
  /** Auction / list starting price */
  startingPrice: number;
  buyItNowPrice?: number;
  reservePrice?: number;
  bidIncrement?: number;
  handlingPrice?: number;
  shippingPrice?: number;
  stockQuantity: number;
  handlingTimeDays: number;
  allowBestOffer: boolean;
  shippingPolicy: string;
  returnsPolicy: string;
  paymentPolicy: string;
  storeCategory: string;
  notes?: string;
};

/** Seeded strategies — names match Upright / Goodwill screenshot conventions where possible. */
export const LISTING_STRATEGIES: ListingStrategy[] = [
  {
    id: "clothing-shoes",
    name: "Clothing/Shoes/Purses",
    channel: "Both",
    preferredCategory: "Apparel",
    defaultWeightLbs: 1.5,
    lengthIn: 14,
    widthIn: 11,
    heightIn: 4,
    dimUnit: "IN",
    boxPadding: "1 inch",
    shippingMethod: "USPS",
    carrier: "USPS",
    shippingBox: "Poly Mailer",
    shippingWeightLbs: 1.5,
    listingType: "Auction",
    listingDuration: "7 Days",
    startTime: "Immediately",
    listImmediately: true,
    startingPrice: 9.99,
    bidIncrement: 1,
    handlingPrice: 0,
    shippingPrice: 0,
    stockQuantity: 1,
    handlingTimeDays: 2,
    allowBestOffer: false,
    shippingPolicy: "Calculated - FedEx Ground",
    returnsPolicy: "30-day returns - Buyer pays return shipping",
    paymentPolicy: "ebay Managed Payments",
    storeCategory: "Apparel",
    notes: "Soft goods — poly mailer, light weight.",
  },
  {
    id: "travel-luggage",
    name: "Travel - Luggage & Backpacks",
    channel: "Both",
    preferredCategory: "Travel",
    defaultWeightLbs: 2,
    lengthIn: 16,
    widthIn: 12,
    heightIn: 6,
    dimUnit: "IN",
    boxPadding: "1 inch",
    shippingMethod: "FedEx",
    carrier: "FedEx",
    shippingBox: "Medium Box",
    shippingWeightLbs: 2.5,
    listingType: "Auction",
    listingDuration: "5 Days",
    startTime: "Immediately",
    listImmediately: true,
    startingPrice: 9.99,
    buyItNowPrice: 50,
    bidIncrement: 2,
    handlingPrice: 2.99,
    shippingPrice: 0,
    stockQuantity: 1,
    handlingTimeDays: 5,
    allowBestOffer: false,
    shippingPolicy: "Shipping Default",
    returnsPolicy: "Return Default",
    paymentPolicy: "Auction Items",
    storeCategory: "Travel",
    notes: "Matches Upright backpack / luggage strategy defaults.",
  },
  {
    id: "hardgoods-1499",
    name: "HardGoods $14.99",
    channel: "Both",
    preferredCategory: "Home Goods",
    defaultWeightLbs: 5,
    lengthIn: 18,
    widthIn: 14,
    heightIn: 10,
    dimUnit: "IN",
    boxPadding: "2 inches",
    shippingMethod: "FedEx",
    carrier: "FedEx",
    shippingBox: "Large Box",
    shippingWeightLbs: 5.5,
    listingType: "Auction",
    listingDuration: "7 Days",
    startTime: "Immediately",
    listImmediately: true,
    startingPrice: 14.99,
    bidIncrement: 1,
    handlingPrice: 2.99,
    shippingPrice: 0,
    stockQuantity: 1,
    handlingTimeDays: 3,
    allowBestOffer: false,
    shippingPolicy: "Calculated - FedEx Ground",
    returnsPolicy: "30-day returns - Buyer pays return shipping",
    paymentPolicy: "ebay Managed Payments",
    storeCategory: "Hard Goods",
  },
  {
    id: "lots-1999",
    name: "Lots $19.99",
    channel: "ShopGoodwill",
    preferredCategory: "General Merchandise",
    defaultWeightLbs: 8,
    lengthIn: 20,
    widthIn: 16,
    heightIn: 12,
    dimUnit: "IN",
    boxPadding: "2 inches",
    shippingMethod: "FedEx",
    carrier: "FedEx",
    shippingBox: "Large Box",
    shippingWeightLbs: 8.5,
    listingType: "Auction",
    listingDuration: "7 Days",
    startTime: "Immediately",
    listImmediately: true,
    startingPrice: 19.99,
    bidIncrement: 2,
    handlingPrice: 4.99,
    shippingPrice: 0,
    stockQuantity: 1,
    handlingTimeDays: 3,
    allowBestOffer: false,
    shippingPolicy: "Flat $9.99",
    returnsPolicy: "No returns accepted",
    paymentPolicy: "Managed payments (eBay / marketplace default)",
    storeCategory: "Lots",
  },
  {
    id: "electronics-fixed",
    name: "Electronics Fixed $29.99",
    channel: "eBay",
    preferredCategory: "Electronics",
    defaultWeightLbs: 1.2,
    lengthIn: 12,
    widthIn: 9,
    heightIn: 4,
    dimUnit: "IN",
    boxPadding: "2 inches",
    shippingMethod: "UPS",
    carrier: "UPS",
    shippingBox: "Medium Box",
    shippingWeightLbs: 1.5,
    listingType: "Fixed Price",
    listingDuration: "GTC",
    startTime: "Immediately",
    listImmediately: true,
    startingPrice: 29.99,
    buyItNowPrice: 29.99,
    stockQuantity: 1,
    handlingTimeDays: 1,
    allowBestOffer: true,
    shippingPolicy: "FedEx Free Shipping",
    returnsPolicy: "30-day returns - Seller pays return shipping",
    paymentPolicy: "ebay Managed Payments",
    storeCategory: "Electronics",
  },
  {
    id: "books-499",
    name: "Books $4.99",
    channel: "ShopGoodwill",
    preferredCategory: "Books & Media",
    defaultWeightLbs: 1,
    lengthIn: 10,
    widthIn: 8,
    heightIn: 2,
    dimUnit: "IN",
    boxPadding: "None",
    shippingMethod: "USPS",
    carrier: "USPS",
    shippingBox: "Poly Mailer",
    shippingWeightLbs: 1,
    listingType: "Auction",
    listingDuration: "5 Days",
    startTime: "Immediately",
    listImmediately: true,
    startingPrice: 4.99,
    bidIncrement: 1,
    handlingPrice: 0,
    shippingPrice: 0,
    stockQuantity: 1,
    handlingTimeDays: 2,
    allowBestOffer: false,
    shippingPolicy: "Flat $9.99",
    returnsPolicy: "No returns accepted",
    paymentPolicy: "Managed payments (eBay / marketplace default)",
    storeCategory: "Books",
  },
  {
    id: "collectibles-auction",
    name: "Collectibles Auction",
    channel: "eBay",
    preferredCategory: "Collectibles",
    defaultWeightLbs: 2,
    lengthIn: 12,
    widthIn: 10,
    heightIn: 8,
    dimUnit: "IN",
    boxPadding: "3 inches",
    shippingMethod: "USPS",
    carrier: "USPS",
    shippingBox: "Medium Box",
    shippingWeightLbs: 2.5,
    listingType: "Auction",
    listingDuration: "7 Days",
    startTime: "Immediately",
    listImmediately: true,
    startingPrice: 9.99,
    reservePrice: 0,
    bidIncrement: 1,
    stockQuantity: 1,
    handlingTimeDays: 2,
    allowBestOffer: false,
    shippingPolicy: "Calculated - FedEx Ground",
    returnsPolicy: "30-day returns - Buyer pays return shipping",
    paymentPolicy: "Auction Items",
    storeCategory: "Collectibles",
  },
  {
    id: "ebay-auction-import",
    name: "eBay Auction Import",
    channel: "eBay",
    preferredCategory: "General Merchandise",
    defaultWeightLbs: 3,
    lengthIn: 14,
    widthIn: 12,
    heightIn: 8,
    dimUnit: "IN",
    boxPadding: "2 inches",
    shippingMethod: "FedEx",
    carrier: "FedEx",
    shippingBox: "Medium Box",
    shippingWeightLbs: 3.5,
    listingType: "Auction",
    listingDuration: "5 Days",
    startTime: "Schedule for later",
    listImmediately: false,
    startingPrice: 9.99,
    bidIncrement: 1,
    stockQuantity: 1,
    handlingTimeDays: 5,
    allowBestOffer: false,
    shippingPolicy: "Shipping Default",
    returnsPolicy: "Return Default",
    paymentPolicy: "Auction Items",
    storeCategory: "Default",
    notes: "Import / scheduled auction defaults for eBay Auto-List.",
  },
];

export const STRATEGY_NAMES = LISTING_STRATEGIES.map((s) => s.name);

export function getStrategyByName(name: string): ListingStrategy | undefined {
  return LISTING_STRATEGIES.find((s) => s.name === name);
}

export function getStrategyById(id: string): ListingStrategy | undefined {
  return LISTING_STRATEGIES.find((s) => s.id === id);
}

/** Partial form fields applied when a strategy is selected. */
export type StrategyFormDefaults = {
  strategy: string;
  weightLbs: string;
  weightUnit: "LBS" | "KG";
  lengthIn: string;
  widthIn: string;
  heightIn: string;
  dimUnit: "IN" | "CM";
  boxPadding: string;
  shippingMethod: string;
  carrier: string;
  shippingBox: string;
  shippingWeightLbs: string;
  listingType: ListingType;
  listingDuration: string;
  startTime: string;
  listImmediately: boolean;
  startingPrice: string;
  buyItNowPrice: string;
  reservePrice: string;
  bidIncrement: string;
  handlingPrice: string;
  shippingPrice: string;
  stockQuantity: string;
  price: string;
  handlingTimeDays: string;
  allowBestOffer: boolean;
  shippingPolicy: string;
  returnsPolicy: string;
  paymentPolicy: string;
  storeCategory: string;
};

export function strategyToFormDefaults(s: ListingStrategy): StrategyFormDefaults {
  return {
    strategy: s.name,
    weightLbs: String(s.defaultWeightLbs),
    weightUnit: "LBS",
    lengthIn: String(s.lengthIn),
    widthIn: String(s.widthIn),
    heightIn: String(s.heightIn),
    dimUnit: s.dimUnit,
    boxPadding: s.boxPadding,
    shippingMethod: s.shippingMethod,
    carrier: s.carrier,
    shippingBox: s.shippingBox,
    shippingWeightLbs: String(s.shippingWeightLbs),
    listingType: s.listingType,
    listingDuration: s.listingDuration,
    startTime: s.startTime,
    listImmediately: s.listImmediately,
    startingPrice: String(s.startingPrice),
    buyItNowPrice: s.buyItNowPrice != null ? String(s.buyItNowPrice) : "",
    reservePrice: s.reservePrice != null ? String(s.reservePrice) : "",
    bidIncrement: String(s.bidIncrement ?? 1),
    handlingPrice: String(s.handlingPrice ?? 0),
    shippingPrice: String(s.shippingPrice ?? 0),
    stockQuantity: String(s.stockQuantity || 1),
    price: String(s.startingPrice),
    handlingTimeDays: String(s.handlingTimeDays),
    allowBestOffer: s.allowBestOffer,
    shippingPolicy: s.shippingPolicy,
    returnsPolicy: s.returnsPolicy,
    paymentPolicy: s.paymentPolicy,
    storeCategory: s.storeCategory,
  };
}

/** Mutable copy used by Admin → Listing defaults (localStorage). */
export type EditableStrategy = ListingStrategy;

export function cloneStrategies(): ListingStrategy[] {
  return LISTING_STRATEGIES.map((s) => ({ ...s }));
}
