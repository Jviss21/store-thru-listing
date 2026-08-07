"use client";

import { RoleGate } from "@/components/RoleGate";
import { MasterEventLog } from "@/components/MasterEventLog";

export default function AdminAuditPage() {
  return (
    <RoleGate requireMasterLog path="/admin/audit">
      <MasterEventLog
        title="Master event log"
        description="Full cross-system audit trail for this org. Admin and Hammoq Ops only — Ops Lead and listing roles use section Event log panels at the bottom of each floor page."
      />
    </RoleGate>
  );
}
