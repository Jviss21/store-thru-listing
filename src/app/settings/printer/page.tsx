"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Card, Input, PageHeader, Badge } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import { SectionEventLog } from "@/components/SectionEventLog";
import { logEvent } from "@/lib/event-log";
import { loadAdminIms } from "@/lib/admin-ims";
import { isAdminCapable } from "@/lib/roles";
import { DEMO_LABEL, resolveLabelLines } from "@/lib/print-label";

export default function PrinterSettingsPage() {
  const { org, session } = useOrg();
  const [printer, setPrinter] = useState("Label Printer — Station 2");
  const [connected, setConnected] = useState(false);
  const print = useMemo(() => loadAdminIms(org.id).print, [org.id]);
  const canAdmin = isAdminCapable(session.role) || session.isOps;
  const fields = resolveLabelLines(print.labelFields, DEMO_LABEL);
  const profileLabel = print.activeProfile === "zebra" ? "Zebra (ZPL)" : "Dymo (PDF)";

  function connect() {
    setConnected(true);
    logEvent({
      section: "admin",
      action: "Connected printer",
      resource: printer,
      resourceHref: "/settings/printer",
      orgId: org.id,
    });
  }

  function disconnect() {
    setConnected(false);
    logEvent({
      section: "admin",
      action: "Disconnected printer",
      resource: printer,
      resourceHref: "/settings/printer",
      orgId: org.id,
    });
  }

  function printTest() {
    logEvent({
      section: "admin",
      action: "Printed test label",
      resource: printer,
      resourceHref: "/settings/printer",
      orgId: org.id,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Connect Printer"
        description="Station connection for the warehouse floor. Org label defaults are set in Admin Donor Item Creation."
      />

      <Card className="max-w-xl space-y-3 border-accent/25 bg-accent/10 p-5">
        <p className="text-sm font-bold text-ink">Org label defaults</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Active profile</dt>
          <dd className="font-semibold text-ink">{profileLabel}</dd>
          <dt className="text-muted">Lister Connect</dt>
          <dd className="font-semibold text-ink">{print.listerConnect ? "On" : "Off"}</dd>
          <dt className="text-muted">Label fields</dt>
          <dd className="font-semibold text-ink">
            SKU
            {fields.location ? ", location" : ""}
            {fields.supplier ? ", supplier" : ""}
            {fields.date ? ", date" : ""}
            {fields.title ? ", title" : ""}
          </dd>
        </dl>
        {canAdmin ? (
          <Link
            href="/admin/donor-item-creation#print"
            className="inline-flex text-sm font-semibold text-primary hover:underline"
          >
            Edit in Admin → Donor Item Creation
          </Link>
        ) : (
          <p className="text-xs text-muted">
            Ask an Admin to change Dymo/Zebra profiles or label fields under Donor Item Creation.
          </p>
        )}
      </Card>

      <Card className="max-w-xl space-y-4 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge tone={connected ? "green" : "red"}>
            {connected ? "Connected" : "Offline"}
          </Badge>
        </div>
        <div>
          <label className="text-sm font-medium">Printer</label>
          <Input className="mt-1" value={printer} onChange={(e) => setPrinter(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Paper size</label>
          <select className="mt-1 h-9 w-full rounded-md border px-3 text-sm" defaultValue="4x6">
            <option value="4x6">4×6 shipping label</option>
            <option value="2x1">2×1 barcode</option>
            <option value="letter">Letter sheet</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={connect}>
            Connect
          </Button>
          <Button variant="outline" type="button" onClick={disconnect}>
            Disconnect
          </Button>
          <Button variant="outline" type="button" disabled={!connected} onClick={printTest}>
            Print test label
          </Button>
        </div>
      </Card>

      <SectionEventLog section="admin" title="Event log" />
    </div>
  );
}
