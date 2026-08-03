/**
 * eBay category item-aspects provider.
 *
 * Pilot uses MockEbayAspectsClient. When eBay API keys exist, replace the mock with
 * Commerce Taxonomy `getItemAspectsForCategory` (and related metadata) behind the
 * same EbayAspectsClient interface — see PILOT.md § eBay item specifics.
 */

import type { ApiResult } from "./types";

export type EbayAspectMode =
  | "FREE_TEXT"
  | "SELECTION_ONLY"
  | "SELECTION_AND_FREE_TEXT";

export type EbayAspect = {
  name: string;
  required: boolean;
  mode: EbayAspectMode;
  values?: string[];
  /** Demo search-volume hint shown under the field (eBay-style). */
  searchVolume?: number;
};

export type EbayCategoryAspects = {
  categoryId: string;
  categoryPath: string;
  aspects: EbayAspect[];
};

export type EbayCategoryOption = {
  id: string;
  path: string;
  leafName: string;
  parentId?: string;
};

/** ShopGoodwill category-driven fields (mock until SGW taxonomy API). */
export type SgwCategoryField = {
  name: string;
  required: boolean;
  values?: string[];
};

export type SgwCategoryFields = {
  categoryId: string;
  categoryPath: string;
  fields: SgwCategoryField[];
};

export interface EbayAspectsClient {
  getEbayCategoryAspects(
    categoryId: string
  ): Promise<ApiResult<EbayCategoryAspects>>;
  listCategories(): Promise<ApiResult<EbayCategoryOption[]>>;
  getSgwCategoryFields?(
    categoryPath: string
  ): Promise<ApiResult<SgwCategoryFields>>;
}

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail<T = never>(error: string, code?: string): ApiResult<T> {
  return { ok: false, error, code };
}

function aspect(
  name: string,
  required: boolean,
  values?: string[],
  searchVolume?: number,
  mode: EbayAspectMode = values?.length
    ? "SELECTION_AND_FREE_TEXT"
    : "FREE_TEXT"
): EbayAspect {
  return { name, required, mode, values, searchVolume };
}

/** Seeded eBay leaf categories used by the pilot mock (incl. Travel/Luggage from screenshots). */
export const MOCK_EBAY_CATEGORIES: EbayCategoryOption[] = [
  {
    id: "3001",
    path: "Clothing, Shoes & Accessories > Men's Clothing > Suits & Suit Separates",
    leafName: "Suits & Suit Separates",
  },
  {
    id: "15724",
    path: "Clothing, Shoes & Accessories > Women > Handbags & Bags",
    leafName: "Handbags & Bags",
  },
  {
    id: "112529",
    path: "Consumer Electronics > Portable Audio & Headphones > Headphones",
    leafName: "Headphones",
  },
  {
    id: "10968",
    path: "Jewelry & Watches > Fashion Jewelry > Necklaces & Pendants",
    leafName: "Necklaces & Pendants",
  },
  {
    id: "93427",
    path: "Clothing, Shoes & Accessories > Men's Shoes > Athletic Shoes",
    leafName: "Athletic Shoes",
  },
  {
    id: "137",
    path: "Collectibles > Decorative Collectibles > Figurines",
    leafName: "Figurines",
  },
  {
    id: "181378",
    path: "Travel > Luggage",
    leafName: "Luggage",
    parentId: "travel",
  },
  {
    id: "181379",
    path: "Travel > Luggage > Backpacks",
    leafName: "Backpacks",
    parentId: "181378",
  },
  {
    id: "261953",
    path: "Travel > Luggage > Travel Duffel Bags",
    leafName: "Travel Duffel Bags",
    parentId: "181378",
  },
];

const LUGGAGE_ASPECTS: EbayAspect[] = [
  aspect("Brand", true, ["Loungefly", "The North Face", "Coach", "Disney", "Unbranded", "Generic"], 365901),
  aspect("Type", true, ["Backpack", "Duffel", "Carry-On", "Suitcase", "Daypack"], 88000),
  aspect("Color", true, ["Black", "Multi", "Blue", "Red", "Brown", "Pink"], 210000),
  aspect("Material", true, ["Polyester", "Nylon", "Leather", "Canvas", "Vinyl"], 76000),
  aspect("Size", false, ["Small", "Medium", "Large", "One Size"], 54000),
  aspect("Features", false, ["Pockets", "Adjustable Straps", "Laptop Sleeve", "Water Resistant", "Wheeled"], 41000),
  aspect("Pattern", false, ["Solid", "Character", "Floral", "Geometric", "Animal Print"]),
  aspect("Gender", false, ["Unisex Adults", "Women", "Men", "Girls", "Boys"]),
  aspect("Department", false, ["Unisex Adults", "Women", "Men"]),
  aspect("Style", false, ["Mini", "Fashion", "Hiking", "School", "Travel"]),
  aspect("Character Family", false, ["Disney", "Marvel", "Star Wars", "None"]),
  aspect("Theme", false, ["Disney", "Travel", "Holiday", "Animals", "Fashion"]),
  aspect("Year Manufactured", false, ["2023", "2022", "2021", "2020", "Earlier"]),
  aspect("Country of Origin", false, ["China", "United States", "Vietnam", "Unknown"]),
  aspect("MPN", false),
  aspect("Model", false),
];

const BACKPACK_ASPECTS: EbayAspect[] = [
  aspect("Brand", true, ["Loungefly", "The North Face", "Nike", "Adidas", "Disney", "Unbranded"], 365901),
  aspect("Type", true, ["Backpack", "Mini Backpack", "Hiking Backpack", "School Backpack"], 92000),
  aspect("Color", true, ["Black", "Multi", "Blue", "Pink", "Red"], 210000),
  aspect("Material", true, ["Polyester", "Nylon", "Faux Leather", "Canvas"], 76000),
  aspect("Size", true, ["Mini", "Small", "Medium", "Large"], 54000),
  aspect("Features", false, ["Pockets", "Adjustable Straps", "Zip Closure", "Character Print"], 41000),
  aspect("Pattern", false, ["Solid", "Character", "Floral", "Logo"]),
  aspect("Gender", false, ["Unisex Adults", "Women", "Men", "Girls", "Boys"]),
  aspect("Character Family", false, ["Disney", "Marvel", "Hello Kitty", "None"]),
  aspect("Theme", false, ["Disney", "Travel", "Holiday", "Animals"]),
  aspect("Year Manufactured", false, ["2023", "2022", "2021", "2020"]),
  aspect("Country of Origin", false, ["China", "United States", "Vietnam"]),
  aspect("MPN", false),
];

const HANDBAG_ASPECTS: EbayAspect[] = [
  aspect("Brand", true, ["Coach", "Michael Kors", "Kate Spade", "Unbranded", "Generic"], 420000),
  aspect("Style", true, ["Crossbody", "Shoulder Bag", "Tote", "Satchel", "Clutch"], 180000),
  aspect("Color", true, ["Black", "Brown", "Tan", "Red", "Multi"], 250000),
  aspect("Material", true, ["Leather", "Canvas", "Suede", "Faux Leather"], 120000),
  aspect("Department", true, ["Women", "Men", "Unisex Adults"], 90000),
  aspect("Size", false, ["Mini", "Small", "Medium", "Large"]),
  aspect("Features", false, ["Inner Pockets", "Adjustable Strap", "Zip Closure"]),
  aspect("Pattern", false, ["Solid", "Monogram", "Quilted"]),
  aspect("Hardware Color", false, ["Gold", "Silver", "Brass", "Gunmetal"]),
  aspect("Country of Origin", false, ["United States", "Italy", "China", "Unknown"]),
  aspect("MPN", false),
  aspect("Model", false, ["5265", "Willis", "Other"]),
];

const ASPECTS_BY_CATEGORY: Record<string, EbayAspect[]> = {
  "3001": [
    aspect("Brand", true, ["ASDF", "Adidas", "Levi's", "Unbranded", "Harley-Davidson"], 628215),
    aspect("Size Type", true, ["Regular", "Big & Tall", "Petite", "Plus"], 41200),
    aspect("Size", true, ["S", "M", "L", "XL", "42R", "40R", "38R"], 89000),
    aspect("Type", true, ["Suit", "Suit Separate", "Blazer", "Casual Dress"], 52000),
    aspect("Color", true, ["Black", "Navy", "Gray", "Brown", "Blue", "Multi"], 210000),
    aspect("Department", true, ["Men", "Women", "Unisex Adults", "Boys"], 180000),
    aspect("Style", true, ["2-Piece", "3-Piece", "Sport Coat", "Tuxedo"], 34000),
    aspect("Waist Size", false, ["30", "32", "34", "36", "38", "40"]),
    aspect("Material", false, ["Wool", "Polyester", "Cotton Blend", "Linen"]),
    aspect("Jacket/Coat Length", false, ["Regular", "Short", "Long"]),
    aspect("Fit", false, ["Slim", "Classic", "Relaxed"]),
    aspect("Inseam", false, ["30", "32", "34"]),
    aspect("Chest Size", false, ["38", "40", "42", "44"]),
    aspect("Leg Style", false, ["Straight", "Tapered", "Wide"]),
    aspect("Fabric Type", false, ["Woven", "Knit"]),
    aspect("Lining Material", false, ["Polyester", "Viscose", "Cupro"]),
    aspect("Pattern", false, ["Solid", "Plaid", "Striped", "Check"]),
    aspect("Theme", false, ["Classic", "Business", "Wedding", "Formal"]),
    aspect("Jacket Cut", false, ["Single Breasted", "Double Breasted"]),
    aspect("Jacket Lapel Style", false, ["Notch", "Peak", "Shawl"]),
    aspect("Occasion", false, ["Business", "Formal", "Casual", "Wedding"]),
    aspect("Vintage", false, ["Yes", "No"]),
    aspect("Jacket Front Button Style", false, ["1-Button", "2-Button", "3-Button"]),
    aspect("Season", false, ["All Seasons", "Fall", "Winter", "Spring"]),
    aspect("Jacket Vent Style", false, ["No Vent", "Center Vent", "Side Vents"]),
    aspect("Front Type", false, ["Button", "Zip"]),
    aspect("Number of Pieces", false, ["1", "2", "3"]),
    aspect("Country of Origin", false, ["United States", "China", "Italy", "Unknown"]),
    aspect("Features", false, ["Pockets", "Lined", "Breathable"]),
    aspect("MPN", false),
  ],
  "15724": HANDBAG_ASPECTS,
  "112529": [
    aspect("Brand", true, ["Sony", "Apple", "Bose", "Beats", "JBL", "Unbranded"], 510000),
    aspect("Model", true, ["WH-1000XM4", "WH-1000XM5", "AirPods Pro", "QuietComfort"], 220000),
    aspect("Color", true, ["Black", "Silver", "White", "Blue"], 180000),
    aspect("Connectivity", true, ["Wireless", "Wired", "Both"], 95000),
    aspect("Type", true, ["Over-Ear", "On-Ear", "In-Ear", "Earbud"], 140000),
    aspect("Features", true, ["Noise Cancelling", "Microphone", "Foldable", "Bluetooth"], 88000),
    aspect("Form Factor", false, ["Circumaural", "Supra-aural"]),
    aspect("Wireless Technology", false, ["Bluetooth", "RF", "Infrared"]),
    aspect("Microphone", false, ["Yes", "No"]),
    aspect("Noise Cancellation", false, ["Active", "Passive", "None"]),
    aspect("Compatible Brand", false, ["Universal", "Apple", "Android"]),
    aspect("MPN", false),
    aspect("Country/Region of Manufacture", false, ["China", "Japan", "Malaysia"]),
    aspect("Custom Bundle", false, ["Yes", "No"]),
    aspect("Bundle Description", false),
  ],
  "10968": [
    aspect("Brand", true, ["Coach", "Tiffany & Co.", "Unbranded", "Generic"], 120000),
    aspect("Metal", true, ["Sterling Silver", "Gold Plated", "Stainless Steel", "Base Metal"], 98000),
    aspect("Color", true, ["Silver", "Gold", "Rose Gold", "Multi"], 76000),
    aspect("Style", true, ["Pendant", "Chain", "Choker", "Locket"], 54000),
    aspect("Necklace Length", true, ["16 in", "18 in", "20 in", "24 in", "Adjustable"], 41000),
    aspect("Main Stone", false, ["None", "Crystal", "Cubic Zirconia", "Pearl"]),
    aspect("Department", false, ["Women", "Men", "Unisex Adults"]),
    aspect("Theme", false, ["Fashion", "Religious", "Nature", "Heart"]),
    aspect("Closure", false, ["Lobster", "Spring Ring", "Toggle"]),
    aspect("Country of Origin", false, ["United States", "China", "Italy"]),
    aspect("MPN", false),
    aspect("Signed", false, ["Yes", "No"]),
    aspect("Vintage", false, ["Yes", "No"]),
  ],
  "93427": [
    aspect("Brand", true, ["Adidas", "Nike", "New Balance", "The North Face", "Unbranded"], 420000),
    aspect("US Shoe Size", true, ["8", "9", "10", "10.5", "11", "12"], 310000),
    aspect("Color", true, ["Black", "Blue", "White", "Gray", "Multi"], 250000),
    aspect("Department", true, ["Men", "Women", "Unisex Adults"], 190000),
    aspect("Type", true, ["Athletic", "Running", "Training", "Casual"], 88000),
    aspect("Style", true, ["Sneaker", "Cleat", "Trail"], 62000),
    aspect("Upper Material", false, ["Mesh", "Leather", "Synthetic", "Knit"]),
    aspect("Closure", false, ["Lace Up", "Slip On", "Velcro"]),
    aspect("Width", false, ["Medium (D, M)", "Wide (2E)", "Extra Wide (4E)"]),
    aspect("Features", false, ["Breathable", "Cushioned", "Lightweight"]),
    aspect("Country of Origin", false, ["Vietnam", "China", "Indonesia", "USA"]),
    aspect("MPN", false),
    aspect("Model", false),
  ],
  "137": [
    aspect("Brand", true, ["Lego", "Disney", "Unbranded", "Generic"], 88000),
    aspect("Type", true, ["Figurine", "Statue", "Miniature", "Ornament"], 54000),
    aspect("Material", true, ["Plastic", "Resin", "Porcelain", "Metal"], 41000),
    aspect("Color", true, ["Multi", "White", "Blue", "Gold"], 36000),
    aspect("Theme", true, ["Fantasy", "Sports", "Animals", "Holiday"], 29000),
    aspect("Era", false, ["Contemporary", "Modern", "Vintage (Pre-2000)"]),
    aspect("Country of Origin", false, ["China", "United States", "Japan"]),
    aspect("Collection", false),
    aspect("Character Family", false),
    aspect("Signed", false, ["Yes", "No"]),
    aspect("Original/Reproduction", false, ["Original", "Reproduction"]),
    aspect("MPN", false),
  ],
  "181378": LUGGAGE_ASPECTS,
  "181379": BACKPACK_ASPECTS,
  "261953": [
    ...LUGGAGE_ASPECTS.filter((a) => a.name !== "Type"),
    aspect("Type", true, ["Duffel", "Weekender", "Gym Bag", "Travel Bag"], 42000),
  ],
};

/** Map internal product categories → default eBay leaf category id. */
export function defaultEbayCategoryIdForProductCategory(category: string): string {
  const map: Record<string, string> = {
    Apparel: "3001",
    Electronics: "112529",
    "Jewelry & Accessories": "10968",
    Sports: "93427",
    Collectibles: "137",
    "Toys & Games": "137",
    "Home Goods": "137",
    "Books & Media": "137",
    "Tools & Hardware": "137",
    "General Merchandise": "137",
    Travel: "181379",
    "Handbags & Bags": "15724",
  };
  return map[category] ?? "3001";
}

/** Parallel SGW category paths (screenshot: Travel/Luggage > Backpacks). */
export const SGW_CATEGORY_PATHS: Record<string, string> = {
  Apparel: "Clothing & Accessories > Apparel",
  Electronics: "Electronics > Consumer Electronics",
  Sports: "Sporting Goods > Outdoor",
  "Books & Media": "Books & Media > Books",
  "General Merchandise": "Everything Else > General",
  "Toys & Games": "Toys & Hobbies > Games",
  "Jewelry & Accessories": "Jewelry > Fashion Jewelry",
  "Tools & Hardware": "Home & Garden > Tools",
  Collectibles: "Collectibles > Decorative",
  "Home Goods": "Home & Garden > Household",
  Travel: "Travel/Luggage > Backpacks",
  "Handbags & Bags": "Clothing & Accessories > Handbags",
};

const SGW_FIELDS_BY_PATH: Record<string, SgwCategoryField[]> = {
  "Travel/Luggage > Backpacks": [
    { name: "Brand", required: true, values: ["Loungefly", "Disney", "The North Face", "Unbranded"] },
    { name: "Color", required: true, values: ["Black", "Multi", "Blue", "Red"] },
    { name: "Material", required: false, values: ["Polyester", "Nylon", "Leather"] },
    { name: "Size", required: false, values: ["Mini", "Small", "Medium", "Large"] },
  ],
  "Travel/Luggage > Luggage": [
    { name: "Brand", required: true, values: ["Samsonite", "Unbranded"] },
    { name: "Type", required: true, values: ["Carry-On", "Checked", "Duffel"] },
    { name: "Color", required: false, values: ["Black", "Blue", "Red"] },
  ],
  "Clothing & Accessories > Handbags": [
    { name: "Brand", required: true, values: ["Coach", "Michael Kors", "Unbranded"] },
    { name: "Style", required: true, values: ["Crossbody", "Shoulder", "Tote"] },
    { name: "Color", required: true, values: ["Black", "Brown", "Tan"] },
    { name: "Material", required: false, values: ["Leather", "Canvas"] },
  ],
  "Clothing & Accessories > Apparel": [
    { name: "Brand", required: true },
    { name: "Size", required: true, values: ["S", "M", "L", "XL"] },
    { name: "Color", required: false },
    { name: "Department", required: false, values: ["Men", "Women", "Unisex"] },
  ],
  "Electronics > Consumer Electronics": [
    { name: "Brand", required: true },
    { name: "Model", required: true },
    { name: "Color", required: false },
  ],
};

function defaultSgwFields(): SgwCategoryField[] {
  return [
    { name: "Brand", required: true },
    { name: "Color", required: false },
    { name: "Condition notes", required: false },
  ];
}

export function getSgwFieldsForPath(categoryPath: string): SgwCategoryFields {
  const fields = SGW_FIELDS_BY_PATH[categoryPath] ?? defaultSgwFields();
  return {
    categoryId: categoryPath,
    categoryPath,
    fields: fields.map((f) => ({ ...f, values: f.values ? [...f.values] : undefined })),
  };
}

/**
 * When category changes: keep values whose aspect names still exist; drop the rest.
 * Required names newly introduced stay empty until the user fills them.
 */
export function reconcileItemSpecifics(
  previous: Record<string, string>,
  aspects: EbayAspect[]
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const a of aspects) {
    if (previous[a.name] != null && previous[a.name] !== "") {
      next[a.name] = previous[a.name]!;
    }
  }
  return next;
}

export function requiredAspectNames(aspects: EbayAspect[]): string[] {
  return aspects.filter((a) => a.required).map((a) => a.name);
}

export function optionalAspectNames(aspects: EbayAspect[]): string[] {
  return aspects.filter((a) => !a.required).map((a) => a.name);
}

/** Guess Brand from title when specifics are empty (Coach / Loungefly / Nike…). */
const KNOWN_BRANDS = [
  "Loungefly",
  "Coach",
  "Disney",
  "Nike",
  "Adidas",
  "Sony",
  "Apple",
  "Bose",
  "Levi's",
  "Levis",
  "Patagonia",
  "The North Face",
  "Harley-Davidson",
  "Harley Davidson",
  "Michael Kors",
  "Kate Spade",
  "Tiffany",
  "Lego",
  "KitchenAid",
  "Cuisinart",
  "DeWalt",
  "Nintendo",
  "Yankee Candle",
];

export function inferBrandFromTitle(title: string): string | undefined {
  const t = title.toLowerCase();
  for (const b of KNOWN_BRANDS) {
    if (t.includes(b.toLowerCase())) return b === "Levis" ? "Levi's" : b === "Harley Davidson" ? "Harley-Davidson" : b;
  }
  return undefined;
}

export function inferConditionFromText(
  title: string,
  description?: string
): string | undefined {
  const blob = `${title} ${description ?? ""}`.toLowerCase();
  if (/\bnew with tags\b|\bnwt\b/.test(blob)) return "New with tags";
  if (/\bfor parts\b|\bnot working\b/.test(blob)) return "For parts or not working";
  if (/\bvintage\b|\bpre-?owned\b|\bused\b|\bwear\b/.test(blob)) return "Used - Good";
  return undefined;
}

/**
 * Seed Brand (and related) into itemSpecifics from title when empty.
 * Does not overwrite user-entered values.
 */
export function seedSpecificsFromTitle(
  title: string,
  specifics: Record<string, string>,
  aspects: EbayAspect[],
  description?: string
): { specifics: Record<string, string>; brand?: string; condition?: string } {
  const next = { ...specifics };
  const brandAspect = aspects.find((a) => a.name === "Brand");
  const inferredBrand = inferBrandFromTitle(title);
  if (brandAspect && !next.Brand && inferredBrand) {
    next.Brand = inferredBrand;
  }
  const condition = inferConditionFromText(title, description);
  return {
    specifics: next,
    brand: next.Brand || inferredBrand,
    condition,
  };
}

export function missingRequiredSpecifics(
  specifics: Record<string, string>,
  aspects: EbayAspect[]
): string[] {
  return aspects
    .filter((a) => a.required)
    .filter((a) => !specifics[a.name]?.trim())
    .map((a) => a.name);
}

export class MockEbayAspectsClient implements EbayAspectsClient {
  async listCategories(): Promise<ApiResult<EbayCategoryOption[]>> {
    return ok(MOCK_EBAY_CATEGORIES);
  }

  async getEbayCategoryAspects(
    categoryId: string
  ): Promise<ApiResult<EbayCategoryAspects>> {
    const cat = MOCK_EBAY_CATEGORIES.find((c) => c.id === categoryId);
    const aspects = ASPECTS_BY_CATEGORY[categoryId];
    if (!cat || !aspects) {
      return fail(`Unknown eBay category: ${categoryId}`, "UNKNOWN_CATEGORY");
    }
    return ok({
      categoryId: cat.id,
      categoryPath: cat.path,
      aspects: aspects.map((a) => ({ ...a, values: a.values ? [...a.values] : undefined })),
    });
  }

  async getSgwCategoryFields(
    categoryPath: string
  ): Promise<ApiResult<SgwCategoryFields>> {
    return ok(getSgwFieldsForPath(categoryPath));
  }
}

let aspectsClient: EbayAspectsClient | null = null;

/** Singleton — swap implementation when Taxonomy API is wired. */
export function getEbayAspectsClient(): EbayAspectsClient {
  if (!aspectsClient) aspectsClient = new MockEbayAspectsClient();
  return aspectsClient;
}

export function setEbayAspectsClient(client: EbayAspectsClient) {
  aspectsClient = client;
}
