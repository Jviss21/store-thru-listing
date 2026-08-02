import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/mock-data";

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
