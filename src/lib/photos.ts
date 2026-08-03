/** Seeded placeholder photos + helpers for demo product imagery. */

export function productPhotoUrl(seed: string, size = 400): string {
  const safe = encodeURIComponent(seed.replace(/[^a-zA-Z0-9_-]/g, ""));
  return `https://picsum.photos/seed/${safe}/${size}/${size}`;
}

export function productPhotoUrls(seed: string, count = 4): string[] {
  return Array.from({ length: count }, (_, i) =>
    productPhotoUrl(`${seed}-img${i + 1}`, i === 0 ? 640 : 400)
  );
}

export function readFilesAsDataUrls(files: FileList | File[]): Promise<string[]> {
  const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
  return Promise.all(
    list.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result ?? ""));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        })
    )
  );
}

/** Fetch remote image and re-encode as data URL so canvas edits work (CORS-safe when allowed). */
export async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    // Fallback: draw via crossOrigin image
    const { loadImage } = await import("@/lib/image-edit");
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  }
}
