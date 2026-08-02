import { Badge, Card, PageHeader, Button } from "@/components/ui";
import { shipments } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function ShipmentsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Shipments"
        description="Labels, carriers, and tracking for fulfilled orders."
        actions={<Button type="button">Create shipment</Button>}
      />

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-3 py-2">Carrier</th>
              <th className="px-3 py-2">Tracking</th>
              <th className="px-3 py-2">Cost</th>
              <th className="px-3 py-2">Shipped</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="border-b hover:bg-blue-50/40">
                <td className="px-4 py-3 font-medium text-primary">{s.orderNumber}</td>
                <td className="px-3 py-3">{s.carrier}</td>
                <td className="px-3 py-3 font-mono text-xs">{s.trackingNumber}</td>
                <td className="px-3 py-3">{formatCurrency(s.cost)}</td>
                <td className="px-3 py-3 text-muted">
                  {new Date(s.shippedAt).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <Badge
                    tone={
                      s.status === "Delivered"
                        ? "green"
                        : s.status === "In transit"
                          ? "blue"
                          : "neutral"
                    }
                  >
                    {s.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
