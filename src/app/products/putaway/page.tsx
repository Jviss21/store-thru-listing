import { redirect } from "next/navigation";

/** Legacy putaway URL — static `/products/scan` avoids any `[id]` ambiguity. */
export default function PutawayRedirectPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const barcode =
    typeof searchParams?.barcode === "string" ? searchParams.barcode : "";
  redirect(
    barcode
      ? `/products/scan?barcode=${encodeURIComponent(barcode)}`
      : "/products/scan"
  );
}
