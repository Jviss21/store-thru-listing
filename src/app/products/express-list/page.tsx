import { redirect } from "next/navigation";

/** Legacy route — Express/Quick List consolidated into Auto-List. */
export default function ExpressListRedirectPage() {
  redirect("/products/auto-list");
}
