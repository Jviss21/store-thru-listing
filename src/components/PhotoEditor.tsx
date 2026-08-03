"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  FlipHorizontal2,
  FlipVertical2,
  Pencil,
  RotateCcw,
  RotateCw,
  X,
} from "lucide-react";
import { PhotoEditorErrorBoundary } from "@/components/PhotoEditorErrorBoundary";
import { Button, Input } from "@/components/ui";
import {
  ASPECT_PRESETS,
  DEFAULT_EDIT,
  applyImageEdit,
  aspectRatio,
  clampCrop,
  cropForAspect,
  loadImage,
  type AspectPreset,
  type ImageEditState,
} from "@/lib/image-edit";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
};

type TransformSub = "flip-rotate" | "crop-size";
type MainTab = "transform" | "adjust";

function PhotoEditorInner({ src, open, onClose, onSave }: Props) {
  const [edit, setEdit] = useState<ImageEditState>(DEFAULT_EDIT);
  const [mainTab, setMainTab] = useState<MainTab>("transform");
  const [subTab, setSubTab] = useState<TransformSub>("flip-rotate");
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    cropX: number;
    cropY: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setEdit({ ...DEFAULT_EDIT });
    setMainTab("transform");
    setSubTab("flip-rotate");
    setSavedFlash(false);
    setError(null);
    let cancelled = false;
    void loadImage(src)
      .then((img) => {
        if (!cancelled) setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof Error && /cors|taint|security/i.test(err.message)
            ? "This image can’t be edited in the browser (CORS). Try uploading a local photo."
            : "Could not load image for editing.";
        setError(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [open, src]);

  /** Lock page scroll while the viewport-fixed modal is open. */
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const html = document.documentElement;
    const prevBody = body.style.overflow;
    const prevHtml = html.style.overflow;
    const prevPad = body.style.paddingRight;
    const scrollbar = window.innerWidth - html.clientWidth;
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
      body.style.paddingRight = prevPad;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const patch = useCallback((partial: Partial<ImageEditState>) => {
    setEdit((prev) => ({ ...prev, ...partial }));
    setSavedFlash(false);
  }, []);

  const setAspect = useCallback(
    (aspect: AspectPreset) => {
      const ratio = aspectRatio(aspect);
      const crop = cropForAspect(ratio);
      patch({ aspect, ...crop });
    },
    [patch]
  );

  const rotateBy = useCallback(
    (deg: number) => {
      let next = edit.rotation + deg;
      while (next > 180) next -= 360;
      while (next < -180) next += 360;
      patch({ rotation: Math.round(next) });
    },
    [edit.rotation, patch]
  );

  const reset = useCallback(() => {
    setEdit({ ...DEFAULT_EDIT });
    setSavedFlash(false);
    setError(null);
  }, []);

  const pixelCrop = useMemo(() => {
    const w = Math.max(1, Math.round(edit.cropW * (imgSize.w || 1)));
    const h = Math.max(1, Math.round(edit.cropH * (imgSize.h || 1)));
    return { w, h };
  }, [edit.cropW, edit.cropH, imgSize.w, imgSize.h]);

  function setCropPixels(w: number, h: number) {
    if (!imgSize.w || !imgSize.h) return;
    const cropW = Math.min(1, Math.max(0.05, w / imgSize.w));
    const cropH = Math.min(1, Math.max(0.05, h / imgSize.h));
    const crop = clampCrop({
      cropX: edit.cropX,
      cropY: edit.cropY,
      cropW,
      cropH,
    });
    patch({ aspect: "custom", ...crop });
  }

  function onCropPointerDown(e: ReactPointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      cropX: edit.cropX,
      cropY: edit.cropY,
    };
  }

  function onCropPointerMove(e: ReactPointerEvent) {
    if (!dragRef.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragRef.current.startX) / rect.width;
    const dy = (e.clientY - dragRef.current.startY) / rect.height;
    const crop = clampCrop({
      cropX: dragRef.current.cropX + dx,
      cropY: dragRef.current.cropY + dy,
      cropW: edit.cropW,
      cropH: edit.cropH,
    });
    patch({ cropX: crop.cropX, cropY: crop.cropY });
  }

  function onCropPointerUp() {
    dragRef.current = null;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const dataUrl = await applyImageEdit(src, edit);
      onSave(dataUrl);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2800);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && /cors|taint|security/i.test(err.message)
          ? "Could not export this image (browser security / CORS). Upload a local copy instead."
          : "Could not save edited image. Try a different photo or refresh.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!open || !mounted) return null;

  const filterStyle = {
    filter: `brightness(${edit.brightness}%) contrast(${edit.contrast}%) saturate(${edit.saturation}%)`,
    transform: `scaleX(${edit.flipH ? -1 : 1}) scaleY(${edit.flipV ? -1 : 1}) rotate(${edit.rotation}deg)`,
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-3 sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Photo editor"
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-float"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-ink/8 px-4 py-3">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-gold" />
            <h2 className="font-display text-lg font-bold text-ink">Edit photo</h2>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-muted hover:bg-mist hover:text-ink"
            onClick={onClose}
            aria-label="Close editor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[1fr_320px]">
          {/* Preview */}
          <div className="flex min-h-[200px] items-center justify-center overflow-hidden bg-[#1a2438] p-4 lg:min-h-0">
            <div
              ref={stageRef}
              className="relative max-h-[min(52vh,420px)] w-full max-w-xl overflow-hidden rounded-lg bg-black/40"
              style={{
                aspectRatio: imgSize.w && imgSize.h ? `${imgSize.w} / ${imgSize.h}` : "1",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Editing"
                className="h-full w-full object-contain transition-transform duration-150"
                style={filterStyle}
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className="absolute border-2 border-gold shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                  style={{
                    left: `${edit.cropX * 100}%`,
                    top: `${edit.cropY * 100}%`,
                    width: `${edit.cropW * 100}%`,
                    height: `${edit.cropH * 100}%`,
                  }}
                >
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white/25" />
                    ))}
                  </div>
                </div>
              </div>
              <div
                className="absolute cursor-move touch-none"
                style={{
                  left: `${edit.cropX * 100}%`,
                  top: `${edit.cropY * 100}%`,
                  width: `${edit.cropW * 100}%`,
                  height: `${edit.cropH * 100}%`,
                }}
                onPointerDown={onCropPointerDown}
                onPointerMove={onCropPointerMove}
                onPointerUp={onCropPointerUp}
                onPointerCancel={onCropPointerUp}
              />
            </div>
          </div>

          {/* Controls — internal scroll only */}
          <div className="flex min-h-0 flex-col overflow-hidden border-t border-ink/8 bg-mist/30 lg:border-l lg:border-t-0">
            <div className="flex shrink-0 border-b border-ink/8">
              {(["transform", "adjust"] as MainTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={cn(
                    "flex-1 px-3 py-2.5 text-sm font-semibold capitalize",
                    mainTab === tab
                      ? "border-b-2 border-gold bg-white text-ink"
                      : "text-muted hover:text-ink"
                  )}
                  onClick={() => setMainTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {mainTab === "transform" && (
                <>
                  <div className="flex rounded-lg border border-ink/10 bg-white p-0.5">
                    {(
                      [
                        ["flip-rotate", "Flip & Rotate"],
                        ["crop-size", "Crop Size"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className={cn(
                          "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold",
                          subTab === id ? "bg-ink text-white" : "text-muted hover:text-ink"
                        )}
                        onClick={() => setSubTab(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {subTab === "flip-rotate" && (
                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                          Flip
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={edit.flipH ? "accent" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => patch({ flipH: !edit.flipH })}
                          >
                            <FlipHorizontal2 className="h-4 w-4" /> Horizontal
                          </Button>
                          <Button
                            type="button"
                            variant={edit.flipV ? "accent" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => patch({ flipV: !edit.flipV })}
                          >
                            <FlipVertical2 className="h-4 w-4" /> Vertical
                          </Button>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                            Rotate
                          </p>
                          <span className="font-mono text-xs text-ink">{edit.rotation}°</span>
                        </div>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          step={1}
                          value={edit.rotation}
                          onChange={(e) => patch({ rotation: Number(e.target.value) })}
                          className="w-full accent-[var(--gold)]"
                        />
                        <div className="mt-2 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => rotateBy(-90)}
                          >
                            <RotateCcw className="h-4 w-4" /> 90° CCW
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => rotateBy(90)}
                          >
                            <RotateCw className="h-4 w-4" /> 90° CW
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {subTab === "crop-size" && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Crop size (px)
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-medium text-muted">W</label>
                          <Input
                            type="number"
                            min={1}
                            value={pixelCrop.w}
                            onChange={(e) =>
                              setCropPixels(Number(e.target.value) || 1, pixelCrop.h)
                            }
                          />
                        </div>
                        <span className="mt-4 text-muted">×</span>
                        <div className="flex-1">
                          <label className="text-[10px] font-medium text-muted">H</label>
                          <Input
                            type="number"
                            min={1}
                            value={pixelCrop.h}
                            onChange={(e) =>
                              setCropPixels(pixelCrop.w, Number(e.target.value) || 1)
                            }
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-muted">
                        Drag the gold frame on the preview to reposition. Grid shows rule of
                        thirds.
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                      Aspect ratio
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {ASPECT_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={cn(
                            "rounded-lg border px-2 py-2 text-xs font-semibold",
                            edit.aspect === p.id
                              ? "border-gold bg-gold/20 text-ink"
                              : "border-ink/10 bg-white text-muted hover:border-ink/25"
                          )}
                          onClick={() => setAspect(p.id)}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {mainTab === "adjust" && (
                <div className="space-y-4">
                  {(
                    [
                      ["brightness", "Brightness", edit.brightness],
                      ["contrast", "Contrast", edit.contrast],
                      ["saturation", "Saturation", edit.saturation],
                    ] as const
                  ).map(([key, label, val]) => (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-semibold text-ink">{label}</span>
                        <span className="font-mono text-muted">{val}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={200}
                        step={1}
                        value={val}
                        onChange={(e) => patch({ [key]: Number(e.target.value) })}
                        className="w-full accent-[var(--gold)]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
                  {error}
                </p>
              )}
              {savedFlash && (
                <div className="animate-save-toast flex items-center gap-2 rounded-lg border border-save-ok/40 bg-save-ok/15 px-3 py-2 text-sm font-semibold text-ink">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-save-ok text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  Image saved to product
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 border-t border-ink/8 bg-white p-4">
              <Button type="button" variant="outline" size="sm" onClick={reset}>
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                className={cn(
                  "flex-1",
                  savedFlash && "animate-save-pulse bg-save-ok text-white hover:bg-save-ok/90"
                )}
                disabled={saving || Boolean(error && !imgSize.w)}
                onClick={() => void handleSave()}
              >
                {savedFlash ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={3} /> Saved
                  </>
                ) : saving ? (
                  "Saving…"
                ) : (
                  "Save image"
                )}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

export function PhotoEditor(props: Props) {
  if (!props.open) return null;
  return (
    <PhotoEditorErrorBoundary onClose={props.onClose}>
      <PhotoEditorInner {...props} />
    </PhotoEditorErrorBoundary>
  );
}
