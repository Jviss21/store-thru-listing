import { redirect } from "next/navigation";

/** Legacy route — Express/Quick List consolidated into Infinity AI / Auto-List. */
export default function ExpressListRedirectPage() {
  redirect("/infinity-ai");
}
