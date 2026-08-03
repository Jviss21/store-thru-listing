"use client";

import { cn } from "@/lib/utils";
import { productPhotoUrl } from "@/lib/photos";

type Props = {
  src?: string | null;
  seed?: string;
  alt?: string;
  className?: string;
  fallbackColor?: string;
};

/** Thumbnail / hero image with picsum seed fallback. */
export function ProductImage({ src, seed, alt = "", className, fallbackColor }: Props) {
  const url = src || (seed ? productPhotoUrl(seed, 200) : null);
  if (!url) {
    return (
      <div
        className={cn("rounded border bg-mist", className)}
        style={fallbackColor ? { background: fallbackColor } : undefined}
        title={alt}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={cn("rounded border object-cover bg-mist", className)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
