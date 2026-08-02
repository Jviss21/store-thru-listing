"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { SUPPLIERS } from "@/lib/mock-data";

type Line = { id: string; title: string; sku: string };

export default function NewManifestPage() {
  const router = useRouter();
  const [supplier, setSupplier] = useState(SUPPLIERS[SUPPLIERS.length - 1]);
  const [barcode, setBarcode] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function addProduct() {
    if (!title.trim()) return;
    const idx = String(lines.length).padStart(2, "0");
    setLines((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        title: title.trim(),
        sku: barcode ? `${barcode}-${idx}` : "Click to scan or save to generate",
      },
    ]);
    setTitle("");
  }

  function save() {
    const next: string[] = [];
    if (!supplier) next.push("Supplier is required.");
    if (!barcode.trim()) next.push("Batch barcode is required.");
    else if (!/^[A-Za-z0-9-]+$/.test(barcode)) {
      next.push("Barcode can only contain letter, number, and dashes.");
    }
    setErrors(next);
    if (next.length) return;
    router.push("/manifests/m1");
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted">
        <Link href="/manifests" className="text-primary hover:underline">
          Item Creation
        </Link>{" "}
        &gt; Create Item
      </div>

      <Card className="p-6">
        <h1 className="text-xl font-semibold">Create Item</h1>

        {errors.length > 0 && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <ul className="list-disc pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">
              Supplier <span className="text-red-600">(required)</span>
            </label>
            <select
              className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            >
              {SUPPLIERS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">
              Batch barcode <span className="text-red-600">(required)</span>
            </label>
            <Input
              className="mt-1"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. BATCH-1001"
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2">
            <h2 className="font-medium">Products</h2>
            <span className="rounded-full bg-gray-100 px-2 text-xs font-medium">{lines.length}</span>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Red sweater, Lot of records, etc..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addProduct())}
            />
            <Button type="button" onClick={addProduct}>
              Add Product
            </Button>
          </div>

          {lines.length === 0 ? (
            <div className="mt-8 rounded-md border border-dashed py-12 text-center text-sm text-muted">
              This item batch is blank. Click &quot;Add product&quot; above or scan a barcode to get started.
            </div>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted">
                  <th className="py-2">Title</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-b">
                    <td className="py-2">{line.title}</td>
                    <td className="py-2 text-muted">{line.sku}</td>
                    <td className="py-2 text-right">
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => setLines((prev) => prev.filter((l) => l.id !== line.id))}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <Button className="mt-4" variant="success" type="button" onClick={save}>
            Create Item
          </Button>
        </div>

        <div className="mt-8">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            className="mt-1"
            rows={3}
            placeholder="Optional notes here."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Card>
    </div>
  );
}
