import { redirect } from "next/navigation";

/** Legacy route — Auto-Draft removed; Infinity AI keeps Auto-List only. */
export default function AutoDraftRedirectPage() {
  redirect("/products/auto-list");
}
