"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Download, Sparkles } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/ui";
import { InfinityBadge } from "@/components/Brand";
import { BRAND, ORG_SLUG, autoDraftQueue } from "@/lib/mock-data";
import { downloadCsv, stamp } from "@/lib/download";
import { formatCurrency } from "@/lib/utils";

export default function AutoDraftPage() {
  const [rows, setRows] = useState(autoDraftQueue);
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function approveSelected() {
    if (!selected.length) return;
    setRows((prev) => prev.filter((r) => !selected.includes(r.id)));
    setToast(`Approved ${selected.length} ${BRAND.autoDraft} item(s) — ready for ${BRAND.autoList}.`);
    setSelected([]);
  }

  function exportQueue() {
    downloadCsv(
      `${ORG_SLUG}-auto-draft-queue-${stamp()}.csv`,
      rows.map((r) => ({
        sku: r.sku,
        title: r.title,
        category: r.category,
        suggestedPrice: r.suggestedPrice,
        confidence: r.confidence,
        source: r.source,
        generatedAt: r.generatedAt,
      }))
    );
    setToast("Auto-Draft queue CSV downloaded.");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={BRAND.autoDraft}
        description={`${BRAND.ai} turns accepted intake into listing-ready drafts — titles, categories, and price suggestions.`}
        actions={
          <>
            <InfinityBadge />
            <Button variant="outline" type="button" onClick={exportQueue}>
              <Download className="h-4 w-4" /> Export queue
            </Button>
            <Link href="/products/auto-list">
              <Button variant="outline" type="button">
                Open {BRAND.autoList}
              </Button>
            </Link>
            <Button variant="accent" type="button" disabled={!selected.length} onClick={approveSelected}>
              <Check className="h-4 w-4" /> Approve selected
            </Button>
          </>
        }
      />

      {toast && (
        <div className="rounded-xl border border-teal/30 bg-teal/10 px-4 py-2 text-sm text-teal">
          {toast}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "In queue", value: String(rows.length) },
          {
            label: "Avg confidence",
            value: rows.length
              ? `${Math.round(rows.reduce((a, b) => a + b.confidence, 0) / rows.length)}%`
              : "—",
          },
          { label: "Powered by", value: BRAND.ai },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={selected.length === rows.length && rows.length > 0}
                  onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])}
                />
              </th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Suggested title</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b hover:bg-mist/40">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                </td>
                <td className="px-3 py-3 font-mono text-xs">{r.sku}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-teal" />
                    <span className="font-medium">{r.title}</span>
                  </div>
                </td>
                <td className="px-3 py-3">{r.category}</td>
                <td className="px-3 py-3">{formatCurrency(r.suggestedPrice)}</td>
                <td className="px-3 py-3 font-semibold text-teal">{r.confidence}%</td>
                <td className="px-3 py-3 text-muted">{r.source}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  Queue clear — Infinity AI has no pending Auto-Drafts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
