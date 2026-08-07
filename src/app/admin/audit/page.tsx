"use client";

import { RoleGate } from "@/components/RoleGate";
import { MasterEventLog } from "@/components/MasterEventLog";

export default function AdminAuditPage() {
  return (
    <RoleGate requireMasterLog path="/admin/audit">
      <MasterEventLog
        title="Master event log"
        description="Full cross-system audit trail for this org (Admin and Hammoq Ops). Same data as Event log on the floor — filter by section, date, or search. Floor roles use /logs or section Event log panels."
      />
    </RoleGate>
  );
}
