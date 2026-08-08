import { describe, expect, it } from "vitest";
import {
  formatDonorBarcode,
  formatDonorSku,
  normalizeSkuPrefix,
  peekNextDonorSku,
} from "@/lib/admin-ims";

describe("donor SKU / barcode helpers", () => {
  it("normalizes prefix and formats SKU", () => {
    expect(normalizeSkuPrefix("tg")).toBe("TG");
    expect(formatDonorSku("TG", 4801)).toBe("TG-4801");
  });

  it("peeks next SKU from sequence", () => {
    const manifests = {
      rejectionReasons: [] as string[],
      requirePhotosOnAccept: false,
      autoAssignProcessor: false,
      skuPrefix: "TG",
      autoGenerateSkuOnCreate: true,
      lastIssuedSequence: 4800,
      barcodeFormat: "same-as-sku" as const,
      printBarcodeOnCreate: false,
    };
    expect(peekNextDonorSku(manifests)).toBe("TG-4801");
  });

  it("formats barcode by mode", () => {
    const base = {
      skuPrefix: "TG",
      lastIssuedSequence: 12,
      barcodeFormat: "same-as-sku" as const,
    };
    expect(formatDonorBarcode("TG-12", base)).toBe("TG-12");
    expect(
      formatDonorBarcode("TG-12", { ...base, barcodeFormat: "prefix-dash-seq" })
    ).toBe("TG-12");
    expect(
      formatDonorBarcode("TG-12", { ...base, barcodeFormat: "code128-sku" })
    ).toBe("C128:TG-12");
  });
});
