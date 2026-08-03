"use client";

import { RoleGate } from "@/components/RoleGate";
import { MasterEventLog } from "@/components/MasterEventLog";
import { SectionEventLog } from "@/components/SectionEventLog";

export default function AdminAuditPage() {
  return (
    <RoleGate requireMasterLog path="/admin/audit">
      <div className="space-y-6">
        <MasterEventLog
          title="Master event log"
          description="Full cross-system audit trail for this org. Admin and Hammoq Ops only — Ops Lead and listing roles use section activity panels instead."
        />
        <SectionEventLog section="admin" title="Admin console activity" limit={15} />
      </div>
    </RoleGate>
  );
}
