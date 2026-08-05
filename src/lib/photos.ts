/** Seeded placeholder photos + helpers for demo product imagery. */

export type DurableUploadResult = {
  url: string;
  id: string;
  backend: string;
  dataUrl?: string;
};

/**
 * Upload an image to durable storage (`/api/photos/upload`).
 * Falls back to a local data URL if the API is unavailable.
 */
export async function uploadDurablePhoto(
  file: File,
  opts?: { productId?: string; orgId?: string }
): Promise<DurableUploadResult> {
  const form = new FormData();
  form.append("file", file);
  if (opts?.productId) form.append("productId", opts.productId);
  if (opts?.orgId) form.append("orgId", opts.orgId);

  try {
    const res = await fetch("/api/photos/upload", { method: "POST", body: form });
    const json = (await res.json()) as {
      ok?: boolean;
      url?: string;
      id?: string;
      backend?: string;
      dataUrl?: string;
      error?: string;
    };
    if (res.ok && json.ok && json.url) {
      return {
        url: json.dataUrl && json.backend === "memory" ? json.dataUrl : json.url,
        id: json.id || "",
        backend: json.backend || "unknown",
        dataUrl: json.dataUrl,
      };
    }
  } catch {
    /* fall through to local data URL */
  }

  const [dataUrl] = await readFilesAsDataUrls([file]);
  return { url: dataUrl, id: `local-${Date.now()}`, backend: "client-data-url", dataUrl };
}

/** Upload many files; preserves order. */
export async function uploadDurablePhotos(
  files: FileList | File[],
  opts?: { productId?: string; orgId?: string }
): Promise<string[]> {
  const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
  const urls: string[] = [];
  for (const file of list) {
    const result = await uploadDurablePhoto(file, opts);
    urls.push(result.url);
  }
  return urls;
}

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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Fetch remote image and re-encode as data URL so canvas edits work (CORS-safe). */
export async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  if (url.startsWith("blob:")) {
    const res = await fetch(url);
    return blobToDataUrl(await res.blob());
  }

  // Prefer same-origin proxy — avoids browser CORS / tainted canvas.
  try {
    const proxy = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy);
    if (res.ok) {
      return blobToDataUrl(await res.blob());
    }
  } catch {
    /* fall through */
  }

  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
    return blobToDataUrl(await res.blob());
  } catch {
    // Last resort: draw via crossOrigin image (still may taint)
    const { loadImage } = await import("@/lib/image-edit");
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.drawImage(img, 0, 0);
    try {
      return canvas.toDataURL("image/jpeg", 0.92);
    } catch {
      throw new Error("CORS: image cannot be edited in the browser");
    }
  }
}
