import { redirect } from "next/navigation";

/** Old bulk multi-checkbox Generate Reports — replaced by per-report Downloads pages. */
export default function GenerateReportsRedirect() {
  redirect("/reports/downloads");
}
