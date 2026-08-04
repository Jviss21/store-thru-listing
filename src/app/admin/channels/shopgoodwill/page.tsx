"use client";

import { Badge, Button, Input, Textarea } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  FieldHelp,
  FieldLabel,
  SaveBar,
  SectionCard,
  SelectField,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminSgwChannelPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;
  const s = state.channels.shopgoodwill;

  function patch<K extends keyof typeof s>(key: K, value: (typeof s)[K]) {
    if (!state) return;
    setState({
      ...state,
      channels: { ...state.channels, shopgoodwill: { ...s, [key]: value } },
    });
  }

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "ShopGoodwill"]} />
      <AdminPageIntro
        title="ShopGoodwill"
        description="Connection status, API/queue actions, and default auction settings."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm">
              Sync queue
            </Button>
            <Button type="button" variant="outline" size="sm">
              Import orders
            </Button>
          </div>
        }
      />

      <SectionCard title="Account">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-medium text-ink">{s.accountName}</p>
          <Badge tone={s.connected ? "green" : "neutral"}>
            {s.connected ? "Connected" : "Disconnected"}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => patch("connected", !s.connected)}
          >
            {s.connected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Default Settings">
        <div className="max-w-xl space-y-4">
          <div>
            <FieldLabel>Default Handling Price</FieldLabel>
            <Input
              className="mt-1"
              type="number"
              step="0.01"
              value={s.defaultHandlingPrice}
              onChange={(e) => patch("defaultHandlingPrice", Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <FieldLabel>Default Starting Price</FieldLabel>
            <Input
              className="mt-1"
              value={s.defaultStartingPrice}
              onChange={(e) => patch("defaultStartingPrice", e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <FieldLabel>Default Shipping Price</FieldLabel>
            <Input
              className="mt-1"
              value={s.defaultShippingPrice}
              onChange={(e) => patch("defaultShippingPrice", e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <FieldLabel>Default Bid Increment</FieldLabel>
            <Input
              className="mt-1"
              type="number"
              step="0.1"
              value={s.defaultBidIncrement}
              onChange={(e) => patch("defaultBidIncrement", Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <FieldLabel>Default Auction Duration</FieldLabel>
            <Input
              className="mt-1"
              value={s.defaultAuctionDuration}
              onChange={(e) => patch("defaultAuctionDuration", e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Default End Times</FieldLabel>
            <Input
              className="mt-1"
              value={s.defaultEndTimes.join(", ")}
              onChange={(e) =>
                patch(
                  "defaultEndTimes",
                  e.target.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean)
                )
              }
            />
            <FieldHelp>Comma-separated (e.g. 18:00 PT, 19:00 PT)</FieldHelp>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.noCombineShipping}
              onChange={(e) => patch("noCombineShipping", e.target.checked)}
            />
            No Combine Shipping
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.listImmediately}
              onChange={(e) => patch("listImmediately", e.target.checked)}
            />
            List Immediately
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.autoPrivateDescSku}
              onChange={(e) => patch("autoPrivateDescSku", e.target.checked)}
            />
            Auto Set Seller Private Description to SKU
          </label>
          <div>
            <FieldLabel>Auction Start</FieldLabel>
            <SelectField value={s.auctionStart} onChange={(e) => patch("auctionStart", e.target.value)}>
              <option>Immediately</option>
              <option>Scheduled</option>
            </SelectField>
          </div>
          <div>
            <FieldLabel>Default Title Transform</FieldLabel>
            <SelectField
              value={s.titleTransform}
              onChange={(e) => patch("titleTransform", e.target.value)}
            >
              <option>To Title Case</option>
              <option>As Entered</option>
              <option>UPPERCASE</option>
            </SelectField>
          </div>
          <div>
            <FieldLabel>Order import settings</FieldLabel>
            <SelectField value={s.orderImport} onChange={(e) => patch("orderImport", e.target.value)}>
              <option>Import all</option>
              <option>Paid only</option>
              <option>Manual</option>
            </SelectField>
            <FieldHelp>
              This tells Lister what orders to import. You&apos;ll usually want to import all orders
              from this channel.
            </FieldHelp>
          </div>
          <div>
            <FieldLabel>Default Shipping Destinations</FieldLabel>
            <SelectField
              value={s.shippingDestinations}
              onChange={(e) => patch("shippingDestinations", e.target.value)}
            >
              <option>No International shipments (U.S. Only)</option>
              <option>Worldwide</option>
            </SelectField>
          </div>
          <div>
            <FieldLabel>Default Description Footer</FieldLabel>
            <Textarea
              className="mt-1 min-h-[100px]"
              value={s.descriptionFooter}
              onChange={(e) => patch("descriptionFooter", e.target.value)}
            />
          </div>
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, {
                action: "Updated ShopGoodwill defaults",
                resource: "ShopGoodwill",
              })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
