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
