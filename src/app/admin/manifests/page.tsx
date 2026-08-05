import { redirect } from "next/navigation";

/** Legacy Admin Manifests → Donor Item Creation */
export default function AdminManifestsRedirectPage() {
  redirect("/admin/donor-item-creation");
}
