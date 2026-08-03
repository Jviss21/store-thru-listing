/** Client-side canvas helpers for product photo editing. */

export type AspectPreset = "custom" | "1:1" | "4:3" | "16:9" | "3:4" | "9:16";

export const ASPECT_PRESETS: { id: AspectPreset; label: string; ratio: number | null }[] = [
  { id: "custom", label: "Custom", ratio: null },
  { id: "1:1", label: "Square", ratio: 1 },
  { id: "4:3", label: "4:3", ratio: 4 / 3 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
  { id: "3:4", label: "3:4", ratio: 3 / 4 },
  { id: "9:16", label: "9:16", ratio: 9 / 16 },
];

export type ImageEditState = {
  flipH: boolean;
  flipV: boolean;
  /** Free rotation in degrees (−180…180). */
  rotation: number;
  aspect: AspectPreset;
  /** Normalized crop rect in image space after transform (0–1). */
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  brightness: number;
  contrast: number;
  saturation: number;
};

export const DEFAULT_EDIT: ImageEditState = {
  flipH: false,
  flipV: false,
  rotation: 0,
  aspect: "custom",
  cropX: 0,
  cropY: 0,
  cropW: 1,
  cropH: 1,
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Data/blob URLs don't need CORS; remote URLs do for canvas export.
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function safeToDataUrl(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.92): string {
  try {
    return canvas.toDataURL(type, quality);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`CORS/security: cannot export canvas (${msg})`);
  }
}

/** Quick 90° clockwise rotate → data URL (JPEG). */
export async function rotateImage90Cw(src: string): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalHeight;
  canvas.height = img.naturalWidth;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.translate(canvas.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, 0, 0);
  return safeToDataUrl(canvas);
}

function cssFilter(edit: Pick<ImageEditState, "brightness" | "contrast" | "saturation">): string {
  return `brightness(${edit.brightness}%) contrast(${edit.contrast}%) saturate(${edit.saturation}%)`;
}

/**
 * Draw the source image with flip + free rotation into a canvas sized
 * to the axis-aligned bounding box of the rotated image.
 */
function drawTransformed(
  img: HTMLImageElement,
  edit: Pick<ImageEditState, "flipH" | "flipV" | "rotation" | "brightness" | "contrast" | "saturation">
): HTMLCanvasElement {
  const rad = (edit.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const bw = Math.ceil(w * cos + h * sin);
  const bh = Math.ceil(w * sin + h * cos);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, bw);
  canvas.height = Math.max(1, bh);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  ctx.filter = cssFilter(edit);
  ctx.translate(bw / 2, bh / 2);
  ctx.rotate(rad);
  ctx.scale(edit.flipH ? -1 : 1, edit.flipV ? -1 : 1);
  ctx.drawImage(img, -w / 2, -h / 2);
  ctx.filter = "none";
  return canvas;
}

/** Apply full edit (transform + crop + adjust) → JPEG data URL. */
export async function applyImageEdit(src: string, edit: ImageEditState): Promise<string> {
  const img = await loadImage(src);
  const transformed = drawTransformed(img, edit);
  const tw = transformed.width;
  const th = transformed.height;

  let sx = Math.round(edit.cropX * tw);
  let sy = Math.round(edit.cropY * th);
  let sw = Math.round(edit.cropW * tw);
  let sh = Math.round(edit.cropH * th);

  sx = Math.max(0, Math.min(sx, tw - 1));
  sy = Math.max(0, Math.min(sy, th - 1));
  sw = Math.max(1, Math.min(sw, tw - sx));
  sh = Math.max(1, Math.min(sh, th - sy));

  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.drawImage(transformed, sx, sy, sw, sh, 0, 0, sw, sh);
  return safeToDataUrl(out);
}

export function aspectRatio(preset: AspectPreset): number | null {
  return ASPECT_PRESETS.find((p) => p.id === preset)?.ratio ?? null;
}

/** Fit a crop of the given aspect inside [0,1]², centered. */
export function cropForAspect(ratio: number | null, baseW = 1, baseH = 1): Pick<ImageEditState, "cropX" | "cropY" | "cropW" | "cropH"> {
  if (!ratio || ratio <= 0) {
    return { cropX: 0, cropY: 0, cropW: 1, cropH: 1 };
  }
  const frame = baseW / baseH;
  let cropW: number;
  let cropH: number;
  if (ratio > frame) {
    cropW = 1;
    cropH = frame / ratio;
  } else {
    cropH = 1;
    cropW = ratio / frame;
  }
  return {
    cropX: (1 - cropW) / 2,
    cropY: (1 - cropH) / 2,
    cropW,
    cropH,
  };
}

export function clampCrop(
  crop: Pick<ImageEditState, "cropX" | "cropY" | "cropW" | "cropH">
): Pick<ImageEditState, "cropX" | "cropY" | "cropW" | "cropH"> {
  let { cropW, cropH, cropX, cropY } = crop;
  cropW = Math.min(1, Math.max(0.05, cropW));
  cropH = Math.min(1, Math.max(0.05, cropH));
  cropX = Math.min(1 - cropW, Math.max(0, cropX));
  cropY = Math.min(1 - cropH, Math.max(0, cropY));
  return { cropX, cropY, cropW, cropH };
}
