"use client";

import { useState } from "react";
import { Button, Card, Input, PageHeader, Badge } from "@/components/ui";

export default function PrinterSettingsPage() {
  const [printer, setPrinter] = useState("Label Printer — Station 2");
  const [connected, setConnected] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Connect Printer"
        description="Barcode and packing-slip printers for the warehouse floor."
      />
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
          <Button type="button" onClick={() => setConnected(true)}>
            Connect
          </Button>
          <Button variant="outline" type="button" onClick={() => setConnected(false)}>
            Disconnect
          </Button>
          <Button variant="outline" type="button" disabled={!connected}>
            Print test label
          </Button>
        </div>
      </Card>
    </div>
  );
}
