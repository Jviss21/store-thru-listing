import { redirect } from "next/navigation";

/** Legacy Auto-List URL — Infinity AI is the top-level section. */
export default function AutoListRedirectPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sku = typeof searchParams?.sku === "string" ? searchParams.sku : "";
  redirect(sku ? `/infinity-ai?sku=${encodeURIComponent(sku)}` : "/infinity-ai");
}
