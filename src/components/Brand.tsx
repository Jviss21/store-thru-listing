"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEventHandler, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BRAND,
  HAMMOQ_RETAIL_APP_STORE_URL,
  INFINITY_AI_UPLOAD_HREF,
  resolveInfinityAiUploadHref,
} from "@/lib/mock-data";

export function InfinityBadge({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-ink",
        className
      )}
    >
      <Sparkles className="h-3 w-3" />
      {label ?? BRAND.ai}
    </span>
  );
}

/**
 * Primary InfinityAI → Auto-List CTA.
 * Mobile → App Store (id 6746443451); desktop → in-app `/products/auto-list` demo.
 */
export function InfinityAiUploadLink({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const [href, setHref] = useState(INFINITY_AI_UPLOAD_HREF);
  useEffect(() => {
    setHref(resolveInfinityAiUploadHref());
  }, []);
  const external = href.startsWith("http");
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

/** Store triage CTA → Hammoq Retail App Store (id 6460302479). */
export function HammoqRetailLink({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <a
      href={HAMMOQ_RETAIL_APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  );
}

export function FeatureChip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-semibold text-ink/80",
        className
      )}
    >
      {children}
    </span>
  );
}
