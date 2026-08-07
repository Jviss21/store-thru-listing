import { redirect } from "next/navigation";

/** Print settings live on Donor Item Creation (Label print section). */
export default function AdminPrintSettingsRedirect() {
  redirect("/admin/donor-item-creation#print");
}
