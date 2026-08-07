"use client";

import { RoleGate } from "@/components/RoleGate";
import { MasterEventLog } from "@/components/MasterEventLog";

/** Org-wide event log — any role with inventory access. */
export default function OrgEventLogPage() {
  return (
    <RoleGate path="/logs">
      <MasterEventLog
        title="Event log"
        description="Organization-wide activity across products, listings, orders, shipments, and admin. Filter by section or date, search by user or action, and download CSV when you need an offline copy."
        howTo={[
          "Open this page anytime from the sidebar Event log link.",
          "Filter by section or date range, or search user / action / resource.",
          "Follow resource links when present to jump back into the workflow.",
          "Download CSV for offline review or handoff.",
        ]}
      />
    </RoleGate>
  );
}
