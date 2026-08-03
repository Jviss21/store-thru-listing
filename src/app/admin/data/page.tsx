"use client";

import { useState } from "react";
import { Button, Card, Badge } from "@/components/ui";
import { DEMO_LOCAL_STORAGE_KEYS } from "@/lib/admin-data";
import { clearAdminLocalStorage } from "@/lib/admin-settings";
import {
  exportAllDemoJson,
  exportEventsCsv,
  exportListingsCsv,
  exportOrdersCsv,
  exportProductsCsv,
} from "@/lib/demo-actions";

export default function AdminDataPage() {
  const [flash, setFlash] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  function note(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2400);
  }

  function resetDemo() {
    clearAdminLocalStorage();
    setConfirmReset(false);
    note("Demo localStorage cleared. Reload the page to see seed defaults.");
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Data & exports</h2>
        <p className="mt-1 text-sm text-muted">
          Trigger full demo exports or reset browser-persisted demo state. Seed mock data is never
          deleted from the build — only localStorage overlays.
        </p>
      </div>

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}

      <Card className="space-y-4 p-5">
        <h3 className="font-display text-lg font-bold text-ink">Exports</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => {
              exportAllDemoJson();
              note("Full demo JSON downloaded.");
            }}
          >
            Full demo JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              exportProductsCsv();
              note("Products CSV downloaded.");
            }}
          >
            Products CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              exportListingsCsv();
              note("Listings CSV downloaded.");
            }}
          >
            Listings CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              exportOrdersCsv();
              note("Orders CSV downloaded.");
            }}
          >
            Orders CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              exportEventsCsv();
              note("Event log CSV downloaded.");
            }}
          >
            Event log CSV
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-bold text-ink">Reset demo data</h3>
          <Badge tone="orange">Destructive (local only)</Badge>
        </div>
        <p className="text-sm text-muted">
          Clears these keys carefully:{" "}
          <span className="font-mono text-xs text-ink">{DEMO_LOCAL_STORAGE_KEYS.join(", ")}</span>
        </p>
        {!confirmReset ? (
          <Button type="button" variant="danger" onClick={() => setConfirmReset(true)}>
            Reset demo data…
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-coral/30 bg-coral/5 p-3">
            <p className="text-sm text-ink">Clear all demo localStorage overlays?</p>
            <Button type="button" variant="danger" size="sm" onClick={resetDemo}>
              Confirm reset
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
