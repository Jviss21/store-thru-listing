"use client";

import { RoleGate } from "@/components/RoleGate";
import { MasterEventLog } from "@/components/MasterEventLog";
import { ReportPageFrame } from "@/components/reports/ReportChrome";

/** Master cross-system event log — Admin / Hammoq Ops only. */
export default function EventLogsPage() {
  return (
    <RoleGate requireMasterLog path="/reports/events">
      <ReportPageFrame>
        <MasterEventLog
          title="Master event log"
          description="Organization-wide audit trail (timestamp, user, section, action, resource). Restricted to Admin and Hammoq Ops. Filter by section and date range below."
        />
      </ReportPageFrame>
    </RoleGate>
  );
}
