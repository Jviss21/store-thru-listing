"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  GripVertical,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  RotateCw,
  Ship,
  Trash2,
  X,
} from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { PhotoEditor } from "@/components/PhotoEditor";
import { ProductImage } from "@/components/ProductImage";
import { SaveToast, useSaveFeedback } from "@/components/SaveFeedback";
import {
  defaultEbayCategoryIdForProductCategory,
  getEbayAspectsClient,
  getSgwFieldsForPath,
  missingRequiredSpecifics,
  reconcileItemSpecifics,
  seedSpecificsFromTitle,
  SGW_CATEGORY_PATHS,
  type EbayAspect,
  type SgwCategoryField,
} from "@/lib/api/ebay-aspects";
import { EbayCategoryTreePicker } from "@/components/ebay/EbayCategoryTreePicker";
import { getBundledCategoryIndex, getCategoryPath } from "@/lib/ebay/category-tree";
import {
  getStrategyByName,
  strategyToFormDefaults,
} from "@/lib/listing-strategies";
import { readFilesAsDataUrls, urlToDataUrl } from "@/lib/photos";
import { rotateImage90Cw } from "@/lib/image-edit";
import {
  BOX_PADDINGS,
  CARRIERS,
  CATEGORIES,
  CATEGORY_PATHS,
  CONDITIONS,
  LISTING_DURATIONS,
  PAYMENT_PROFILES,
  RETURNS_PROFILES,
  SHIPPING_BOXES,
  SHIPPING_PROFILES,
  START_TIMES,
  STRATEGIES,
  SUPPLIERS,
} from "@/lib/mock-data";
import type { Listing, ListingChannel, ListingType, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ListingFormState = {
  title: string;
  sku: string;
  category: string;
  categoryPath: string;
  strategy: string;
  supplier: string;
  location: string;
  weightLbs: string;
  weightUnit: "LBS" | "KG";
  lengthIn: string;
  widthIn: string;
  heightIn: string;
  dimUnit: "IN" | "CM";
  boxPadding: string;
  tags: string[];
  tagInput: string;
  shippingMethod: string;
  shippingBox: string;
  shippingWeightLbs: string;
  description: string;
  privateDescription: string;
  productNotes: string;
  condition: string;
  conditionDescription: string;
  brand: string;
  upc: string;
  mpn: string;
  imageUrls: string[];
  mainImageIndex: number;
  /** Active channels on this form. */
  channels: ListingChannel[];
  // eBay
  ebayCategoryId: string;
  ebayCategoryPath: string;
  listingType: ListingType;
  listingDuration: string;
  startTime: string;
  listImmediately: boolean;
  startingPrice: string;
  buyItNowPrice: string;
  reservePrice: string;
  handlingTimeDays: string;
  allowBestOffer: boolean;
  autoDeclinePrice: string;
  autoAcceptPrice: string;
  shippingPolicy: string;
  returnsPolicy: string;
  paymentPolicy: string;
  storeCategory: string;
  itemSpecifics: Record<string, string>;
  // SGW
  sgwCategoryPath: string;
  price: string;
  carrier: string;
  bidIncrement: string;
  handlingPrice: string;
  shippingPrice: string;
  stockQuantity: string;
  noCombineShipping: boolean;
  featuredItem: boolean;
  sgwSpecifics: Record<string, string>;
};

const STOCK_FALLBACKS = [
  "https://picsum.photos/seed/stl-stock-a/640/640",
  "https://picsum.photos/seed/stl-stock-b/640/640",
  "https://picsum.photos/seed/stl-stock-c/640/640",
  "https://picsum.photos/seed/stl-stock-d/640/640",
];

export function listingToFormState(listing: Listing): ListingFormState {
  const leaf = listing.categoryPath.split(" > ").pop() ?? listing.categoryPath;
  const strategy = getStrategyByName(listing.strategy);
  const seeded = seedSpecificsFromTitle(
    listing.title,
    { ...listing.itemSpecifics },
    [],
    listing.description
  );
  const brand = listing.brand || seeded.brand || "";
  const specifics = { ...seeded.specifics };
  if (brand && !specifics.Brand) specifics.Brand = brand;

  const base: ListingFormState = {
    title: listing.title,
    sku: listing.sku,
    category: leaf,
    categoryPath: listing.categoryPath,
    strategy: listing.strategy,
    supplier: listing.supplier,
    location: listing.location,
    weightLbs: String(listing.weightLbs ?? ""),
    weightUnit: listing.weightUnit ?? "LBS",
    lengthIn: String(listing.lengthIn ?? ""),
    widthIn: String(listing.widthIn ?? ""),
    heightIn: String(listing.heightIn ?? ""),
    dimUnit: listing.dimUnit ?? "IN",
    boxPadding: listing.boxPadding ?? "3 inches",
    tags: [...listing.tags],
    tagInput: "",
    shippingMethod: listing.shippingMethod ?? listing.carrier,
    shippingBox: listing.shippingBox ?? "Medium Box",
    shippingWeightLbs: String(listing.shippingWeightLbs ?? listing.weightLbs ?? ""),
    description: listing.description,
    privateDescription: listing.privateDescription,
    productNotes: listing.productNotes ?? "",
    condition: listing.condition || seeded.condition || CONDITIONS[0]!,
    conditionDescription: listing.conditionDescription ?? "",
    brand,
    upc: listing.upc ?? "Does Not Apply",
    mpn: listing.mpn ?? "",
    imageUrls: [...listing.imageUrls],
    mainImageIndex: listing.mainImageIndex ?? 0,
    channels: [listing.channel],
    ebayCategoryId: listing.ebayCategoryId ?? defaultEbayCategoryIdForProductCategory(leaf),
    ebayCategoryPath: listing.channel === "eBay" ? listing.categoryPath : "",
    listingType: listing.listingType ?? "Auction",
    listingDuration: listing.listingDuration ?? "7 Days",
    startTime: listing.startTime ?? "Immediately",
    listImmediately: listing.listImmediately ?? true,
    startingPrice: String(listing.startingPrice ?? listing.price),
    buyItNowPrice: listing.buyItNowPrice != null ? String(listing.buyItNowPrice) : "",
    reservePrice: listing.reservePrice != null ? String(listing.reservePrice) : "",
    handlingTimeDays: String(listing.handlingTimeDays ?? 2),
    allowBestOffer: listing.allowBestOffer ?? false,
    autoDeclinePrice: listing.autoDeclinePrice != null ? String(listing.autoDeclinePrice) : "",
    autoAcceptPrice: listing.autoAcceptPrice != null ? String(listing.autoAcceptPrice) : "",
    shippingPolicy: listing.shippingPolicy,
    returnsPolicy: listing.returnsPolicy,
    paymentPolicy: listing.paymentPolicy,
    storeCategory: listing.storeCategory ?? "Default",
    itemSpecifics: specifics,
    sgwCategoryPath: listing.channel === "ShopGoodwill" ? listing.categoryPath : "",
    price: String(listing.price),
    carrier: listing.carrier,
    bidIncrement: strategy ? String(strategy.bidIncrement ?? 1) : "1",
    handlingPrice: strategy ? String(strategy.handlingPrice ?? 0) : "0",
    shippingPrice: strategy ? String(strategy.shippingPrice ?? 0) : "0",
    stockQuantity: String(Math.max(1, listing.quantity || 1)),
    noCombineShipping: false,
    featuredItem: false,
    sgwSpecifics: {},
  };

  const weightNum = Number(base.weightLbs);
  if (strategy && (!base.weightLbs || weightNum === 0)) {
    return { ...base, ...strategyToFormDefaults(strategy), strategy: strategy.name, stockQuantity: base.stockQuantity };
  }
  return base;
}

export function productToFormState(
  product: Product,
  defaultChannel: ListingChannel = "ShopGoodwill"
): ListingFormState {
  const ebayId =
    product.ebayCategoryId ?? defaultEbayCategoryIdForProductCategory(product.category);
  const strategy = getStrategyByName(product.strategy ?? "") ?? getStrategyByName(STRATEGIES[0]!);
  const seeded = seedSpecificsFromTitle(
    product.title,
    { ...(product.itemSpecifics ?? {}) },
    [],
    product.description
  );
  const brand = product.brand || seeded.brand || "";
  const specifics = { ...seeded.specifics };
  if (brand && !specifics.Brand) specifics.Brand = brand;

  const base: ListingFormState = {
    title: product.title,
    sku: product.sku,
    category: product.category,
    categoryPath: product.categoryPath,
    strategy: product.strategy ?? STRATEGIES[0]!,
    supplier: product.supplier,
    location: product.location,
    weightLbs: String(product.weightLbs ?? ""),
    weightUnit: product.weightUnit ?? "LBS",
    lengthIn: String(product.lengthIn ?? ""),
    widthIn: String(product.widthIn ?? ""),
    heightIn: String(product.heightIn ?? ""),
    dimUnit: product.dimUnit ?? "IN",
    boxPadding: product.boxPadding ?? "3 inches",
    tags: [...(product.tags ?? [])],
    tagInput: "",
    shippingMethod: product.shippingMethod ?? product.carrier ?? "FedEx",
    shippingBox: product.shippingBox ?? "Select",
    shippingWeightLbs: String(product.shippingWeightLbs ?? product.weightLbs ?? ""),
    description: product.description ?? "",
    privateDescription: product.privateDescription ?? "",
    productNotes: product.productNotes ?? "",
    condition: product.condition || seeded.condition || CONDITIONS[0]!,
    conditionDescription: product.conditionDescription ?? "",
    brand,
    upc: product.upc ?? "",
    mpn: product.mpn ?? "",
    imageUrls: [...product.imageUrls],
    mainImageIndex: product.mainImageIndex ?? 0,
    channels: product.listedOn.length ? [...product.listedOn] : [defaultChannel],
    ebayCategoryId: ebayId,
    ebayCategoryPath: product.categoryPath,
    listingType: product.listingType ?? "Auction",
    listingDuration: product.listingDuration ?? "7 Days",
    startTime: product.startTime ?? "Immediately",
    listImmediately: product.listImmediately ?? true,
    startingPrice: String(product.startingPrice ?? product.price),
    buyItNowPrice: product.buyItNowPrice != null ? String(product.buyItNowPrice) : "",
    reservePrice: product.reservePrice != null ? String(product.reservePrice) : "",
    handlingTimeDays: String(product.handlingTimeDays ?? 2),
    allowBestOffer: product.allowBestOffer ?? false,
    autoDeclinePrice: "",
    autoAcceptPrice: "",
    shippingPolicy: product.shippingPolicy ?? SHIPPING_PROFILES[0]!,
    returnsPolicy: product.returnsPolicy ?? RETURNS_PROFILES[0]!,
    paymentPolicy: product.paymentPolicy ?? PAYMENT_PROFILES[0]!,
    storeCategory: product.storeCategory ?? "Default",
    itemSpecifics: specifics,
    sgwCategoryPath:
      SGW_CATEGORY_PATHS[product.category] ?? product.categoryPath,
    price: String(product.price),
    carrier: product.carrier ?? "FedEx",
    bidIncrement: "1",
    handlingPrice: "0",
    shippingPrice: "0",
    stockQuantity: "1",
    noCombineShipping: false,
    featuredItem: false,
    sgwSpecifics: {},
  };

  // If weight/dims are missing (0/blank) and a strategy is set, apply strategy defaults.
  const weightNum = Number(base.weightLbs);
  if (strategy && (!base.weightLbs || weightNum === 0)) {
    return { ...base, ...strategyToFormDefaults(strategy), strategy: strategy.name };
  }
  return base;
}

export function emptyFormState(): ListingFormState {
  const strategy = getStrategyByName("Travel - Luggage & Backpacks") ?? getStrategyByName(STRATEGIES[0]!);
  const defaults = strategy ? strategyToFormDefaults(strategy) : null;
  return {
    title: "",
    sku: `SKU-${Date.now().toString().slice(-6)}`,
    category: "Travel",
    categoryPath: CATEGORY_PATHS.Travel ?? "Travel/Luggage > Backpacks",
    strategy: defaults?.strategy ?? STRATEGIES[0]!,
    supplier: SUPPLIERS[0]!,
    location: "Cart - 1",
    weightLbs: defaults?.weightLbs ?? "2",
    weightUnit: "LBS",
    lengthIn: defaults?.lengthIn ?? "16",
    widthIn: defaults?.widthIn ?? "12",
    heightIn: defaults?.heightIn ?? "6",
    dimUnit: "IN",
    boxPadding: defaults?.boxPadding ?? "1 inch",
    tags: [],
    tagInput: "",
    shippingMethod: defaults?.shippingMethod ?? "FedEx",
    shippingBox: defaults?.shippingBox ?? "Medium Box",
    shippingWeightLbs: defaults?.shippingWeightLbs ?? "2.5",
    description: "",
    privateDescription: "",
    productNotes: "",
    condition: CONDITIONS[0]!,
    conditionDescription: "",
    brand: "",
    upc: "Does Not Apply",
    mpn: "",
    imageUrls: [],
    mainImageIndex: 0,
    channels: [],
    ebayCategoryId: "181379",
    ebayCategoryPath: "Travel > Luggage > Backpacks",
    listingType: defaults?.listingType ?? "Auction",
    listingDuration: defaults?.listingDuration ?? "5 Days",
    startTime: defaults?.startTime ?? "Immediately",
    listImmediately: defaults?.listImmediately ?? true,
    startingPrice: defaults?.startingPrice ?? "9.99",
    buyItNowPrice: defaults?.buyItNowPrice ?? "",
    reservePrice: defaults?.reservePrice ?? "",
    handlingTimeDays: defaults?.handlingTimeDays ?? "5",
    allowBestOffer: defaults?.allowBestOffer ?? false,
    autoDeclinePrice: "",
    autoAcceptPrice: "",
    shippingPolicy: defaults?.shippingPolicy ?? SHIPPING_PROFILES[0]!,
    returnsPolicy: defaults?.returnsPolicy ?? RETURNS_PROFILES[0]!,
    paymentPolicy: defaults?.paymentPolicy ?? PAYMENT_PROFILES[0]!,
    storeCategory: defaults?.storeCategory ?? "Travel",
    itemSpecifics: {},
    sgwCategoryPath: SGW_CATEGORY_PATHS.Travel ?? "Travel/Luggage > Backpacks",
    price: defaults?.price ?? "9.99",
    carrier: defaults?.carrier ?? "FedEx",
    bidIncrement: defaults?.bidIncrement ?? "2",
    handlingPrice: defaults?.handlingPrice ?? "2.99",
    shippingPrice: defaults?.shippingPrice ?? "0",
    stockQuantity: defaults?.stockQuantity ?? "1",
    noCombineShipping: false,
    featuredItem: false,
    sgwSpecifics: {},
  };
}

export function applyFormToListing(
  listing: Listing,
  form: ListingFormState
): Listing {
  const price = Number(form.price) || listing.price;
  const starting = Number(form.startingPrice) || price;
  return {
    ...listing,
    title: form.title.trim(),
    sku: form.sku.trim(),
    strategy: form.strategy,
    supplier: form.supplier,
    location: form.location,
    weightLbs: Number(form.weightLbs) || 0,
    weightUnit: form.weightUnit,
    lengthIn: Number(form.lengthIn) || 0,
    widthIn: Number(form.widthIn) || 0,
    heightIn: Number(form.heightIn) || 0,
    dimUnit: form.dimUnit,
    boxPadding: form.boxPadding,
    tags: form.tags,
    shippingMethod: form.shippingMethod,
    shippingBox: form.shippingBox,
    shippingWeightLbs: Number(form.shippingWeightLbs) || 0,
    description: form.description,
    privateDescription: form.privateDescription,
    productNotes: form.productNotes,
    condition: form.condition,
    conditionDescription: form.conditionDescription,
    brand: form.brand || form.itemSpecifics.Brand || listing.brand,
    upc: form.upc,
    mpn: form.mpn || undefined,
    imageUrls: form.imageUrls,
    mainImageIndex: form.mainImageIndex,
    itemSpecifics: { ...form.itemSpecifics },
    returnsPolicy: form.returnsPolicy,
    paymentPolicy: form.paymentPolicy,
    shippingPolicy: form.shippingPolicy,
    carrier: form.carrier || form.shippingMethod,
    categoryPath:
      listing.channel === "eBay"
        ? form.ebayCategoryPath || form.categoryPath
        : form.sgwCategoryPath || form.categoryPath,
    ebayCategoryId: listing.channel === "eBay" ? form.ebayCategoryId : listing.ebayCategoryId,
    listingType: listing.channel === "eBay" ? form.listingType : listing.listingType,
    listingDuration: listing.channel === "eBay" ? form.listingDuration : listing.listingDuration,
    startTime: listing.channel === "eBay" ? form.startTime : listing.startTime,
    listImmediately: form.listImmediately,
    startingPrice: starting,
    buyItNowPrice: form.buyItNowPrice ? Number(form.buyItNowPrice) : undefined,
    reservePrice: form.reservePrice ? Number(form.reservePrice) : undefined,
    handlingTimeDays: Number(form.handlingTimeDays) || 2,
    allowBestOffer: form.allowBestOffer,
    autoDeclinePrice: form.autoDeclinePrice ? Number(form.autoDeclinePrice) : undefined,
    autoAcceptPrice: form.autoAcceptPrice ? Number(form.autoAcceptPrice) : undefined,
    storeCategory: form.storeCategory,
    price: listing.channel === "eBay" ? starting : price,
    quantity: Math.max(1, Number(form.stockQuantity) || 1),
  };
}

/** Validate required eBay specifics (and condition) before save/list. */
export function validateListingForm(
  form: ListingFormState,
  aspects: EbayAspect[]
): string | null {
  if (!form.title.trim()) return "Title is required.";
  if (!form.sku.trim()) return "SKU is required.";
  if (!form.condition?.trim()) return "Condition is required.";
  if (form.channels.includes("eBay") && aspects.length) {
    const missing = missingRequiredSpecifics(form.itemSpecifics, aspects);
    if (missing.length) {
      return `Required specifics missing: ${missing.join(", ")}`;
    }
  }
  if (form.channels.includes("ShopGoodwill")) {
    const qty = Number(form.stockQuantity);
    if (!qty || qty < 1) return "ShopGoodwill stock quantity must be at least 1.";
  }
  return null;
}

type Props = {
  value: ListingFormState;
  onChange: (next: ListingFormState) => void;
  /** Lock channel list to a single channel (listing edit). */
  lockedChannel?: ListingChannel;
  readOnly?: boolean;
  className?: string;
};

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <label className="text-xs font-medium text-ink/80">{children}</label>
      {required && <span className="text-[10px] font-semibold text-coral">Required</span>}
      {hint && <span className="text-[10px] text-muted">{hint}</span>}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <select
      disabled={disabled}
      className="h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm outline-none focus:border-ink/30 focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function AspectInput({
  aspect,
  value,
  onChange,
  disabled,
}: {
  aspect: EbayAspect;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const hasValues = !!aspect.values?.length;
  return (
    <div>
      <FieldLabel required={aspect.required}>{aspect.name}</FieldLabel>
      {hasValues ? (
        <div className="relative">
          <input
            list={`aspect-${aspect.name}`}
            disabled={disabled}
            className="h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm outline-none focus:border-ink/30 focus:ring-2 focus:ring-accent/40 disabled:opacity-60"
            placeholder="Create or Select"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <datalist id={`aspect-${aspect.name}`}>
            {aspect.values!.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>
      ) : (
        <Input
          disabled={disabled}
          placeholder="Create or Select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {aspect.searchVolume != null && (
        <p className="mt-0.5 text-[10px] text-muted">
          {aspect.searchVolume.toLocaleString()} searches
        </p>
      )}
    </div>
  );
}

export function ListingEditorForm({
  value,
  onChange,
  lockedChannel,
  readOnly,
  className,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewIdx, setPreviewIdx] = useState(value.mainImageIndex);
  const [editorIdx, setEditorIdx] = useState<number | null>(null);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [rotatingIdx, setRotatingIdx] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const { feedback: photoFeedback, announce: announcePhoto } = useSaveFeedback(4000);
  const [ebayCategoriesReady, setEbayCategoriesReady] = useState(false);
  const [aspects, setAspects] = useState<EbayAspect[]>([]);
  const [sgwFields, setSgwFields] = useState<SgwCategoryField[]>([]);
  const [showOptional, setShowOptional] = useState(true);
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [aspectsKey, setAspectsKey] = useState(0);

  const patch = useCallback(
    (partial: Partial<ListingFormState>) => {
      if (readOnly) return;
      onChange({ ...value, ...partial });
    },
    [onChange, readOnly, value]
  );

  function applyStrategy(name: string) {
    if (readOnly) return;
    const s = getStrategyByName(name);
    if (!s) {
      patch({ strategy: name });
      return;
    }
    onChange({ ...value, ...strategyToFormDefaults(s) });
  }

  function onProductCategoryChange(category: string) {
    if (readOnly) return;
    const ebayId = defaultEbayCategoryIdForProductCategory(category);
    const index = getBundledCategoryIndex();
    const path =
      getCategoryPath(index, ebayId) ||
      CATEGORY_PATHS[category] ||
      value.ebayCategoryPath;
    const sgwPath = SGW_CATEGORY_PATHS[category] ?? CATEGORY_PATHS[category] ?? category;
    onChange({
      ...value,
      category,
      categoryPath: CATEGORY_PATHS[category] ?? category,
      sgwCategoryPath: sgwPath,
      ebayCategoryId: ebayId,
      ebayCategoryPath: path,
      itemSpecifics: {},
      sgwSpecifics: {},
    });
    setAspectsKey((k) => k + 1);
  }

  const showEbay = value.channels.includes("eBay");
  const showSgw = value.channels.includes("ShopGoodwill");

  useEffect(() => {
    setEbayCategoriesReady(true);
  }, []);

  useEffect(() => {
    if (!showEbay || !value.ebayCategoryId) {
      setAspects([]);
      return;
    }
    let cancelled = false;
    void getEbayAspectsClient()
      .getEbayCategoryAspects(value.ebayCategoryId)
      .then((res) => {
        if (cancelled || !res.ok) return;
        setAspects(res.data.aspects);
        setAspectsKey((k) => k + 1);
        const reconciled = reconcileItemSpecifics(value.itemSpecifics, res.data.aspects);
        const seeded = seedSpecificsFromTitle(
          value.title,
          reconciled,
          res.data.aspects,
          value.description
        );
        const pathChanged = value.ebayCategoryPath !== res.data.categoryPath;
        const keysChanged =
          Object.keys(seeded.specifics).sort().join("|") !==
          Object.keys(value.itemSpecifics).sort().join("|");
        const brandChanged = seeded.brand && !value.brand;
        const conditionChanged =
          seeded.condition &&
          (!value.condition || value.condition === CONDITIONS[0]);
        if (pathChanged || keysChanged || brandChanged || conditionChanged) {
          onChange({
            ...value,
            ebayCategoryPath: res.data.categoryPath,
            categoryPath: showSgw ? value.sgwCategoryPath || value.categoryPath : res.data.categoryPath,
            itemSpecifics: seeded.specifics,
            brand: value.brand || seeded.brand || "",
            condition: conditionChanged && seeded.condition ? seeded.condition : value.condition,
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // Only re-fetch when category id / channel visibility changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.ebayCategoryId, showEbay]);

  useEffect(() => {
    if (!showSgw) {
      setSgwFields([]);
      return;
    }
    const path = value.sgwCategoryPath || value.categoryPath;
    const fields = getSgwFieldsForPath(path).fields;
    setSgwFields(fields);
  }, [showSgw, value.sgwCategoryPath, value.categoryPath]);

  const requiredAspects = useMemo(() => aspects.filter((a) => a.required), [aspects]);
  const optionalAspects = useMemo(() => aspects.filter((a) => !a.required), [aspects]);

  async function onFiles(files: FileList | null) {
    if (!files?.length || readOnly) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    const urls = await readFilesAsDataUrls(list);
    const next = [...value.imageUrls, ...urls];
    patch({
      imageUrls: next,
      mainImageIndex: value.imageUrls.length === 0 ? 0 : value.mainImageIndex,
    });
    if (value.imageUrls.length === 0) setPreviewIdx(0);
  }

  async function addStockImages() {
    if (readOnly) return;
    try {
      const urls = await Promise.all(STOCK_FALLBACKS.slice(0, 3).map((u) => urlToDataUrl(u)));
      const next = [...value.imageUrls, ...urls];
      patch({
        imageUrls: next,
        mainImageIndex: value.imageUrls.length === 0 ? 0 : value.mainImageIndex,
      });
      if (value.imageUrls.length === 0) setPreviewIdx(0);
    } catch {
      const next = [...value.imageUrls, ...STOCK_FALLBACKS.slice(0, 3)];
      patch({
        imageUrls: next,
        mainImageIndex: value.imageUrls.length === 0 ? 0 : value.mainImageIndex,
      });
    }
  }

  async function ensureEditableUrl(index: number): Promise<string | null> {
    const url = value.imageUrls[index];
    if (!url) return null;
    if (url.startsWith("data:") || url.startsWith("blob:")) return url;
    try {
      const dataUrl = await urlToDataUrl(url);
      const next = [...value.imageUrls];
      next[index] = dataUrl;
      patch({ imageUrls: next });
      return dataUrl;
    } catch {
      return null;
    }
  }

  async function rotateThumb(index: number) {
    if (readOnly) return;
    setRotatingIdx(index);
    try {
      const url = await ensureEditableUrl(index);
      if (!url) {
        announcePhoto("Couldn’t rotate this image (CORS). Upload a local photo instead.", {
          error: true,
        });
        return;
      }
      const nextUrl = await rotateImage90Cw(url);
      const next = [...value.imageUrls];
      next[index] = nextUrl;
      patch({ imageUrls: next });
    } catch {
      announcePhoto("Couldn’t rotate this image. Try uploading a local copy.", { error: true });
    } finally {
      setRotatingIdx(null);
    }
  }

  async function openEditor(index: number) {
    if (readOnly) return;
    setPreviewIdx(index);
    const url = await ensureEditableUrl(index);
    if (!url) {
      announcePhoto("Couldn’t open photo editor for this image (CORS). Upload a local photo instead.", {
        error: true,
      });
      return;
    }
    setEditorSrc(url);
    setEditorIdx(index);
  }

  function replaceImageAt(index: number, dataUrl: string) {
    const next = [...value.imageUrls];
    next[index] = dataUrl;
    patch({ imageUrls: next });
    setEditorSrc(dataUrl);
  }

  /** Reorder strip; whatever lands at index 0 becomes Main Image. */
  function reorderImages(from: number, to: number) {
    if (readOnly || from === to || from < 0 || to < 0) return;
    const next = [...value.imageUrls];
    if (from >= next.length || to >= next.length) return;
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    let newPreview = previewIdx;
    if (previewIdx === from) newPreview = to;
    else if (from < previewIdx && to >= previewIdx) newPreview = previewIdx - 1;
    else if (from > previewIdx && to <= previewIdx) newPreview = previewIdx + 1;
    let newEditor = editorIdx;
    if (editorIdx != null) {
      if (editorIdx === from) newEditor = to;
      else if (from < editorIdx && to >= editorIdx) newEditor = editorIdx - 1;
      else if (from > editorIdx && to <= editorIdx) newEditor = editorIdx + 1;
    }
    patch({ imageUrls: next, mainImageIndex: 0 });
    setPreviewIdx(newPreview);
    if (newEditor !== editorIdx) setEditorIdx(newEditor);
  }

  /** Move selected photo to front and mark as main. */
  function setAsMainImage(index: number) {
    if (readOnly || index < 0 || index >= value.imageUrls.length) return;
    if (index === 0) {
      patch({ mainImageIndex: 0 });
      setPreviewIdx(0);
      return;
    }
    const next = [...value.imageUrls];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    let newEditor = editorIdx;
    if (editorIdx === index) newEditor = 0;
    else if (editorIdx != null && editorIdx < index) newEditor = editorIdx + 1;
    patch({ imageUrls: next, mainImageIndex: 0 });
    setPreviewIdx(0);
    if (newEditor !== editorIdx) setEditorIdx(newEditor);
  }

  function addTag() {
    const t = value.tagInput.trim();
    if (!t || value.tags.includes(t)) return;
    patch({ tags: [...value.tags, t], tagInput: "" });
  }

  function addChannel(ch: ListingChannel) {
    if (value.channels.includes(ch)) return;
    patch({ channels: [...value.channels, ch] });
    setAddChannelOpen(false);
  }

  function removeChannel(ch: ListingChannel) {
    if (lockedChannel && ch === lockedChannel) return;
    patch({ channels: value.channels.filter((c) => c !== ch) });
  }

  function generateDescriptionStub() {
    const bits = [
      value.title,
      value.brand || value.itemSpecifics.Brand
        ? `Brand: ${value.brand || value.itemSpecifics.Brand}`
        : null,
      value.itemSpecifics.Type ? `Type: ${value.itemSpecifics.Type}` : null,
      value.itemSpecifics.Size ? `Size: ${value.itemSpecifics.Size}` : null,
      value.condition ? `Condition: ${value.condition}` : null,
      "Inspected in-facility. Photos show the actual item.",
    ].filter(Boolean);
    patch({ description: bits.join("\n") });
  }

  const previewUrl = value.imageUrls[previewIdx] ?? value.imageUrls[value.mainImageIndex];

  return (
    <div className={cn("space-y-5", className)}>
      {/* Images */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-ink">Images</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={readOnly}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" /> Upload
            </Button>
            <Button variant="outline" size="sm" type="button" disabled={readOnly} onClick={addStockImages}>
              Stock photos
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </div>
        </div>

        {value.imageUrls.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] text-muted">
              Drag thumbnails to reorder — the first image is the Main Image.
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {value.imageUrls.map((url, i) => (
                <div
                  key={`${i}-${url.slice(0, 40)}`}
                  draggable={!readOnly}
                  onDragStart={(e) => {
                    if (readOnly) return;
                    setDragFrom(i);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(i));
                  }}
                  onDragEnd={() => {
                    setDragFrom(null);
                    setDragOver(null);
                  }}
                  onDragOver={(e) => {
                    if (readOnly || dragFrom == null) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOver !== i) setDragOver(i);
                  }}
                  onDragLeave={() => {
                    if (dragOver === i) setDragOver(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const from = dragFrom ?? Number(e.dataTransfer.getData("text/plain"));
                    setDragFrom(null);
                    setDragOver(null);
                    if (Number.isFinite(from)) reorderImages(from, i);
                  }}
                  className={cn(
                    "relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition",
                    i === previewIdx ? "border-primary" : "border-ink/10",
                    dragFrom === i && "opacity-50",
                    dragOver === i && dragFrom !== i && "border-gold ring-2 ring-gold/40",
                    !readOnly && "cursor-grab active:cursor-grabbing"
                  )}
                >
                  {!readOnly && (
                    <span
                      data-drag-handle
                      className="pointer-events-none absolute bottom-0.5 left-0.5 z-10 rounded bg-ink/55 p-0.5 text-white"
                      title="Drag to reorder"
                      aria-hidden
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <button
                    type="button"
                    className="h-full w-full"
                    onClick={() => setPreviewIdx(i)}
                  >
                    <ProductImage src={url} seed={`img-${i}`} alt="" className="h-full w-full" />
                  </button>
                  {i === value.mainImageIndex && (
                    <span className="pointer-events-none absolute left-0.5 top-0.5 z-10 rounded bg-primary px-1 py-0.5 text-[9px] font-semibold text-white">
                      Main Image
                    </span>
                  )}
                  {!readOnly && (
                    <div className="absolute bottom-0.5 right-0.5 z-10 flex gap-0.5">
                      <button
                        type="button"
                        title="Rotate 90°"
                        disabled={rotatingIdx === i}
                        className="rounded bg-ink/80 p-1 text-white hover:bg-ink disabled:opacity-50"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          void rotateThumb(i);
                        }}
                      >
                        <RotateCw className={cn("h-3 w-3", rotatingIdx === i && "animate-spin")} />
                      </button>
                      <button
                        type="button"
                        title="Edit photo"
                        className="rounded bg-gold p-1 text-ink hover:brightness-95"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          void openEditor(i);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className="mt-3 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/15 bg-mist/40 px-4 py-8 text-center transition hover:border-ink/30"
          onClick={() => !readOnly && fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }}
        >
          {previewUrl ? (
            <div className="relative w-full max-w-md">
              <ProductImage
                src={previewUrl}
                seed="preview"
                alt={value.title}
                className="aspect-square w-full rounded-xl"
              />
              {!readOnly && (
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void rotateThumb(previewIdx);
                    }}
                  >
                    <RotateCw className="h-3.5 w-3.5" /> Rotate
                  </Button>
                  <Button
                    size="sm"
                    variant="accent"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void openEditor(previewIdx);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit photo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAsMainImage(previewIdx);
                    }}
                  >
                    Set as Main Image
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = value.imageUrls.filter((_, i) => i !== previewIdx);
                      const main =
                        value.mainImageIndex === previewIdx
                          ? 0
                          : value.mainImageIndex > previewIdx
                            ? value.mainImageIndex - 1
                            : value.mainImageIndex;
                      patch({ imageUrls: next, mainImageIndex: Math.min(main, Math.max(0, next.length - 1)) });
                      setPreviewIdx(0);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-muted" />
              <p className="mt-2 text-sm font-semibold">Drag and drop or click to add images</p>
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">
          Watermarks will be added to images when uploaded to the channel.
        </p>
      </Card>

      {/* Product details */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Product details</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <FieldLabel>Title</FieldLabel>
              <span className="text-xs text-muted">{value.title.length}/80</span>
            </div>
            <Input
              disabled={readOnly}
              maxLength={80}
              value={value.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Category</FieldLabel>
            <SelectField
              disabled={readOnly}
              value={value.category}
              options={CATEGORIES}
              onChange={onProductCategoryChange}
            />
            <p className="mt-1 text-xs text-muted">{value.categoryPath}</p>
          </div>
          <div>
            <FieldLabel>Strategy</FieldLabel>
            <SelectField
              disabled={readOnly}
              value={value.strategy}
              options={STRATEGIES}
              onChange={applyStrategy}
            />
            <p className="mt-1 text-xs text-muted">
              Auto-fills weight, dims, shipping, pricing. Auto-List uses this for channel payload.
            </p>
          </div>
          <div>
            <FieldLabel>SKU</FieldLabel>
            <Input disabled={readOnly} value={value.sku} onChange={(e) => patch({ sku: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Item weight</FieldLabel>
            <div className="flex gap-2">
              <Input
                disabled={readOnly}
                type="number"
                step="0.01"
                value={value.weightLbs}
                onChange={(e) =>
                  patch({
                    weightLbs: e.target.value,
                    shippingWeightLbs: value.shippingWeightLbs || e.target.value,
                  })
                }
              />
              <select
                disabled={readOnly}
                className="h-10 rounded-xl border border-ink/10 bg-white px-2 text-sm"
                value={value.weightUnit}
                onChange={(e) => patch({ weightUnit: e.target.value as "LBS" | "KG" })}
              >
                <option value="LBS">LBS</option>
                <option value="KG">KG</option>
              </select>
            </div>
          </div>
          <div>
            <FieldLabel>Supplier</FieldLabel>
            <SelectField
              disabled={readOnly}
              value={value.supplier}
              options={SUPPLIERS}
              onChange={(supplier) => patch({ supplier })}
            />
          </div>
          <div>
            <FieldLabel>Inventory location</FieldLabel>
            <Input
              disabled={readOnly}
              value={value.location}
              onChange={(e) => patch({ location: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel required>Condition</FieldLabel>
            <SelectField
              disabled={readOnly}
              value={value.condition}
              options={CONDITIONS}
              onChange={(condition) => patch({ condition })}
            />
          </div>
          <div>
            <FieldLabel>Brand</FieldLabel>
            <Input
              disabled={readOnly}
              value={value.brand}
              onChange={(e) =>
                patch({
                  brand: e.target.value,
                  itemSpecifics: { ...value.itemSpecifics, Brand: e.target.value },
                })
              }
              placeholder="From title when empty"
            />
          </div>
          <div className="md:col-span-2 grid grid-cols-3 gap-3">
            {(["lengthIn", "widthIn", "heightIn"] as const).map((key, i) => (
              <div key={key}>
                <FieldLabel>{["Length", "Width", "Height"][i]}</FieldLabel>
                <div className="flex gap-1">
                  <Input
                    disabled={readOnly}
                    type="number"
                    value={value[key]}
                    onChange={(e) => patch({ [key]: e.target.value })}
                  />
                  {i === 2 && (
                    <select
                      disabled={readOnly}
                      className="h-10 rounded-xl border border-ink/10 bg-white px-2 text-sm"
                      value={value.dimUnit}
                      onChange={(e) => patch({ dimUnit: e.target.value as "IN" | "CM" })}
                    >
                      <option value="IN">IN</option>
                      <option value="CM">CM</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div>
            <FieldLabel>Box padding</FieldLabel>
            <SelectField
              disabled={readOnly}
              value={value.boxPadding}
              options={BOX_PADDINGS}
              onChange={(boxPadding) => patch({ boxPadding })}
            />
          </div>
          <div>
            <FieldLabel>Tags</FieldLabel>
            <div className="flex gap-2">
              <Input
                disabled={readOnly}
                placeholder="Select or create tags"
                value={value.tagInput}
                onChange={(e) => patch({ tagInput: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button variant="outline" size="sm" type="button" disabled={readOnly} onClick={addTag}>
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {value.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-0.5 text-xs"
                >
                  {t}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => patch({ tags: value.tags.filter((x) => x !== t) })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Shipping */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Ship className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Shipping details</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <FieldLabel>Shipping method</FieldLabel>
            <SelectField
              disabled={readOnly}
              value={value.shippingMethod}
              options={CARRIERS}
              onChange={(shippingMethod) =>
                patch({ shippingMethod, carrier: shippingMethod })
              }
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <FieldLabel>Shipping box</FieldLabel>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() =>
                  !readOnly &&
                  patch({
                    shippingBox: "Medium Box",
                    shippingWeightLbs: value.weightLbs || value.shippingWeightLbs,
                  })
                }
              >
                Calculate
              </button>
            </div>
            <SelectField
              disabled={readOnly}
              value={value.shippingBox}
              options={SHIPPING_BOXES}
              onChange={(shippingBox) => patch({ shippingBox })}
            />
          </div>
          <div>
            <FieldLabel required>Shipping weight</FieldLabel>
            <div className="flex gap-2">
              <Input
                disabled={readOnly}
                type="number"
                step="0.01"
                value={value.shippingWeightLbs}
                onChange={(e) => patch({ shippingWeightLbs: e.target.value })}
              />
              <span className="flex h-10 items-center rounded-xl border border-ink/10 bg-mist px-2 text-xs">
                LBS
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Description */}
      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Description</h2>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={readOnly}
            onClick={generateDescriptionStub}
          >
            Generate summary
          </Button>
        </div>
        <Textarea
          disabled={readOnly}
          rows={6}
          value={value.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Listing description…"
        />
      </Card>

      {/* Channels */}
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Channels</h2>
          {!lockedChannel && !readOnly && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setAddChannelOpen((o) => !o)}
              >
                <Plus className="h-3.5 w-3.5" /> Add Channel
              </Button>
              {addChannelOpen && (
                <div className="absolute right-0 z-10 mt-1 w-48 rounded-xl border bg-white p-1 shadow-lg">
                  {(["ShopGoodwill", "eBay"] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      disabled={value.channels.includes(ch)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-mist disabled:opacity-40"
                      onClick={() => addChannel(ch)}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {value.channels.length === 0 && (
          <p className="text-sm text-muted">No channels added yet. Use Add Channel to attach ShopGoodwill or eBay.</p>
        )}

        {showEbay && (
          <div className="mb-6 rounded-xl border border-ink/10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-primary">eBay</h3>
              {!lockedChannel && (
                <button
                  type="button"
                  className="text-xs text-muted hover:text-coral"
                  onClick={() => removeChannel("eBay")}
                  disabled={readOnly}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel>eBay category</FieldLabel>
                {value.ebayCategoryPath ? (
                  <p className="mb-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm">
                    <span className="font-medium text-ink">{value.ebayCategoryPath}</span>
                    <span className="ml-2 font-mono text-xs text-muted">
                      #{value.ebayCategoryId}
                    </span>
                  </p>
                ) : null}
                {!readOnly && ebayCategoriesReady ? (
                  <EbayCategoryTreePicker
                    compact
                    selectedId={value.ebayCategoryId}
                    onSelect={(sel) => {
                      patch({
                        ebayCategoryId: sel.categoryId,
                        ebayCategoryPath: sel.path,
                        itemSpecifics: {},
                      });
                      setAspectsKey((k) => k + 1);
                    }}
                  />
                ) : null}
              </div>
              <div>
                <FieldLabel>Store category</FieldLabel>
                <Input
                  disabled={readOnly}
                  value={value.storeCategory}
                  onChange={(e) => patch({ storeCategory: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Listing type</FieldLabel>
                <SelectField
                  disabled={readOnly}
                  value={value.listingType}
                  options={["Auction", "Fixed Price"]}
                  onChange={(listingType) =>
                    patch({ listingType: listingType as ListingType })
                  }
                />
              </div>
              <div>
                <FieldLabel>Listing duration</FieldLabel>
                <SelectField
                  disabled={readOnly}
                  value={value.listingDuration}
                  options={LISTING_DURATIONS}
                  onChange={(listingDuration) => patch({ listingDuration })}
                />
              </div>
              <div>
                <FieldLabel>Start time</FieldLabel>
                <SelectField
                  disabled={readOnly}
                  value={value.startTime}
                  options={START_TIMES}
                  onChange={(startTime) => patch({ startTime })}
                />
                <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={value.listImmediately}
                    onChange={(e) => patch({ listImmediately: e.target.checked })}
                  />
                  List Immediately
                </label>
              </div>
              <div>
                <FieldLabel>Starting price</FieldLabel>
                <Input
                  disabled={readOnly}
                  type="number"
                  step="0.01"
                  value={value.startingPrice}
                  onChange={(e) => patch({ startingPrice: e.target.value, price: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Buy It Now price</FieldLabel>
                <Input
                  disabled={readOnly}
                  type="number"
                  step="0.01"
                  value={value.buyItNowPrice}
                  onChange={(e) => patch({ buyItNowPrice: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Reserve price</FieldLabel>
                <Input
                  disabled={readOnly}
                  type="number"
                  step="0.01"
                  value={value.reservePrice}
                  onChange={(e) => patch({ reservePrice: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Handling time (days)</FieldLabel>
                <Input
                  disabled={readOnly}
                  type="number"
                  value={value.handlingTimeDays}
                  onChange={(e) => patch({ handlingTimeDays: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition",
                      value.allowBestOffer ? "bg-primary" : "bg-ink/20"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      disabled={readOnly}
                      checked={value.allowBestOffer}
                      onChange={(e) => patch({ allowBestOffer: e.target.checked })}
                    />
                    <span
                      className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-white transition",
                        value.allowBestOffer ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </span>
                  Allow Best Offer
                </label>
                {value.allowBestOffer && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Auto decline</FieldLabel>
                      <Input
                        disabled={readOnly}
                        type="number"
                        step="0.01"
                        value={value.autoDeclinePrice}
                        onChange={(e) => patch({ autoDeclinePrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <FieldLabel>Auto accept</FieldLabel>
                      <Input
                        disabled={readOnly}
                        type="number"
                        step="0.01"
                        value={value.autoAcceptPrice}
                        onChange={(e) => patch({ autoAcceptPrice: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <FieldLabel>Shipping profile</FieldLabel>
                <SelectField
                  disabled={readOnly}
                  value={value.shippingPolicy}
                  options={SHIPPING_PROFILES}
                  onChange={(shippingPolicy) => patch({ shippingPolicy })}
                />
              </div>
              <div>
                <FieldLabel>Returns profile</FieldLabel>
                <SelectField
                  disabled={readOnly}
                  value={value.returnsPolicy}
                  options={RETURNS_PROFILES}
                  onChange={(returnsPolicy) => patch({ returnsPolicy })}
                />
              </div>
              <div>
                <FieldLabel>Payment profile</FieldLabel>
                <SelectField
                  disabled={readOnly}
                  value={value.paymentPolicy}
                  options={PAYMENT_PROFILES}
                  onChange={(paymentPolicy) => patch({ paymentPolicy })}
                />
              </div>
              <div className="md:col-span-2">
                <FieldLabel>Condition description</FieldLabel>
                <p className="mb-1 text-[10px] text-muted">
                  Condition is set under Product details ({value.condition || "—"}).
                </p>
                <Textarea
                  disabled={readOnly}
                  rows={2}
                  value={value.conditionDescription}
                  onChange={(e) => patch({ conditionDescription: e.target.value })}
                />
              </div>
            </div>

            {/* Category-driven specifics — remount on category change */}
            <div key={`ebay-aspects-${value.ebayCategoryId}-${aspectsKey}`} className="mt-6 border-t pt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold">Required Specifics</h4>
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setShowOptional((s) => !s)}
                  >
                    {showOptional
                      ? `Hide ${optionalAspects.length} Optional Specifics`
                      : `Show ${optionalAspects.length} Optional Specifics`}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-muted hover:text-ink"
                    onClick={() => {
                      void getEbayAspectsClient()
                        .getEbayCategoryAspects(value.ebayCategoryId)
                        .then((res) => {
                          if (res.ok) setAspects(res.data.aspects);
                        });
                    }}
                  >
                    <RefreshCw className="h-3 w-3" /> Refresh
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {requiredAspects.map((a) => (
                  <AspectInput
                    key={a.name}
                    aspect={a}
                    disabled={readOnly}
                    value={value.itemSpecifics[a.name] ?? ""}
                    onChange={(v) =>
                      patch({
                        itemSpecifics: { ...value.itemSpecifics, [a.name]: v },
                        brand: a.name === "Brand" ? v : value.brand,
                      })
                    }
                  />
                ))}
              </div>
              {showOptional && optionalAspects.length > 0 && (
                <>
                  <h4 className="mb-3 mt-6 font-semibold text-muted">Optional Specifics</h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {optionalAspects.map((a) => (
                      <AspectInput
                        key={a.name}
                        aspect={a}
                        disabled={readOnly}
                        value={value.itemSpecifics[a.name] ?? ""}
                        onChange={(v) =>
                          patch({
                            itemSpecifics: { ...value.itemSpecifics, [a.name]: v },
                          })
                        }
                      />
                    ))}
                  </div>
                </>
              )}
              <div className="mt-4 max-w-xs">
                <FieldLabel>UPC</FieldLabel>
                <Input
                  disabled={readOnly}
                  value={value.upc}
                  onChange={(e) => patch({ upc: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {showSgw && (
          <div className="rounded-xl border border-ink/10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-primary">ShopGoodwill</h3>
              {!lockedChannel && (
                <button
                  type="button"
                  className="text-xs text-muted hover:text-coral"
                  onClick={() => removeChannel("ShopGoodwill")}
                  disabled={readOnly}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FieldLabel>Category</FieldLabel>
                <select
                  disabled={readOnly}
                  className="h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm"
                  value={value.sgwCategoryPath}
                  onChange={(e) => {
                    const path = e.target.value;
                    patch({ sgwCategoryPath: path, sgwSpecifics: {} });
                  }}
                >
                  {Object.values(SGW_CATEGORY_PATHS).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  {!Object.values(SGW_CATEGORY_PATHS).includes(value.sgwCategoryPath) &&
                    value.sgwCategoryPath && (
                      <option value={value.sgwCategoryPath}>{value.sgwCategoryPath}</option>
                    )}
                </select>
                <p className="mt-1 text-[10px] text-muted">
                  Separate from eBay taxonomy (e.g. Travel/Luggage &gt; Backpacks).
                </p>
              </div>
              <div>
                <FieldLabel>Seller private description</FieldLabel>
                <Input
                  disabled={readOnly}
                  value={value.privateDescription || value.sku}
                  onChange={(e) => patch({ privateDescription: e.target.value })}
                  placeholder="Same as product SKU"
                />
                <p className="mt-0.5 text-[10px] text-muted">Same as product SKU by default</p>
              </div>
              <div>
                <FieldLabel>Auction start</FieldLabel>
                <SelectField
                  disabled={readOnly}
                  value={value.startTime}
                  options={START_TIMES}
                  onChange={(startTime) => patch({ startTime })}
                />
              </div>
              <div>
                <FieldLabel>Auction duration</FieldLabel>
                <SelectField
                  disabled={readOnly}
                  value={value.listingDuration}
                  options={LISTING_DURATIONS.filter((d) => d !== "GTC")}
                  onChange={(listingDuration) => patch({ listingDuration })}
                />
              </div>
              <div>
                <FieldLabel>Starting bid</FieldLabel>
                <Input
                  disabled={readOnly}
                  type="number"
                  step="0.01"
                  value={value.price}
                  onChange={(e) => patch({ price: e.target.value, startingPrice: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Bid increment</FieldLabel>
                <Input
                  disabled={readOnly}
                  type="number"
                  step="0.01"
                  value={value.bidIncrement}
                  onChange={(e) => patch({ bidIncrement: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Reserve price</FieldLabel>
                <Input
                  disabled={readOnly}
                  type="number"
                  step="0.01"
                  value={value.reservePrice}
                  onChange={(e) => patch({ reservePrice: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Buy now price</FieldLabel>
                <Input
                  disabled={readOnly}
                  type="number"
                  step="0.01"
                  value={value.buyItNowPrice}
                  onChange={(e) => patch({ buyItNowPrice: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel required>Stock quantity</FieldLabel>
                <Input
                  disabled={readOnly}
                  type="number"
                  min={1}
                  value={value.stockQuantity}
                  onChange={(e) => patch({ stockQuantity: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Handling price</FieldLabel>
                <Input
                  disabled={readOnly}
                  type="number"
                  step="0.01"
                  value={value.handlingPrice}
                  onChange={(e) => patch({ handlingPrice: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Shipping price</FieldLabel>
                <Input
                  disabled={readOnly}
                  type="number"
                  step="0.01"
                  value={value.shippingPrice}
                  onChange={(e) => patch({ shippingPrice: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel>Carrier</FieldLabel>
                <SelectField
                  disabled={readOnly}
                  value={value.carrier}
                  options={CARRIERS}
                  onChange={(carrier) =>
                    patch({ carrier, shippingMethod: carrier })
                  }
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={value.noCombineShipping}
                    onChange={(e) => patch({ noCombineShipping: e.target.checked })}
                  />
                  No Combine Shipping
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={value.featuredItem}
                    onChange={(e) => patch({ featuredItem: e.target.checked })}
                  />
                  Featured Item (additional cost: $6.95)
                </label>
              </div>
            </div>

            {sgwFields.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h4 className="mb-3 font-semibold">Category attributes</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sgwFields.map((f) => (
                    <div key={f.name}>
                      <FieldLabel required={f.required}>{f.name}</FieldLabel>
                      {f.values?.length ? (
                        <SelectField
                          disabled={readOnly}
                          value={value.sgwSpecifics[f.name] || "Select..."}
                          options={["Select...", ...f.values]}
                          onChange={(v) =>
                            patch({
                              sgwSpecifics: {
                                ...value.sgwSpecifics,
                                [f.name]: v === "Select..." ? "" : v,
                              },
                            })
                          }
                        />
                      ) : (
                        <Input
                          disabled={readOnly}
                          value={value.sgwSpecifics[f.name] ?? ""}
                          onChange={(e) =>
                            patch({
                              sgwSpecifics: {
                                ...value.sgwSpecifics,
                                [f.name]: e.target.value,
                              },
                            })
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Product notes */}
      <Card className="p-5">
        <h2 className="font-semibold">Product notes</h2>
        <p className="mt-1 text-xs text-muted">
          Enter any internal information about this product. This will not be shown on public
          listings.
        </p>
        <Textarea
          className="mt-3"
          disabled={readOnly}
          rows={3}
          value={value.productNotes}
          onChange={(e) => patch({ productNotes: e.target.value })}
          placeholder="Additional note"
        />
      </Card>

      {editorIdx != null && editorSrc && (
        <PhotoEditor
          open
          src={editorSrc}
          onClose={() => {
            setEditorIdx(null);
            setEditorSrc(null);
          }}
          onSave={(dataUrl) => {
            replaceImageAt(editorIdx, dataUrl);
          }}
        />
      )}

      {photoFeedback.show &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="pointer-events-none fixed bottom-6 left-1/2 z-[110] -translate-x-1/2">
            <SaveToast feedback={photoFeedback} className="pointer-events-auto" />
          </div>,
          document.body
        )}
    </div>
  );
}
