"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  ListingEditorForm,
  applyFormToListing,
  listingToFormState,
  validateListingForm,
  type ListingFormState,
} from "@/components/ListingEditorForm";
import { ListingStatusBadge } from "@/components/StatusBadge";
import {
  SaveButton,
  SaveConfirmBar,
  SaveToast,
  useSaveFeedback,
} from "@/components/SaveFeedback";
import { Button } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import { getEbayAspectsClient } from "@/lib/api/ebay-aspects";
import { canEditListing, type Listing } from "@/lib/types";
import { getListing } from "@/lib/mock-data";
import { StrategyLifecyclePanel } from "@/components/StrategyLifecyclePanel";

export default function ListingEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = String(params.id ?? "");
  const { org, api, hydrated } = useOrg();
  const [listing, setListing] = useState<Listing | null>(null);
  const [form, setForm] = useState<ListingFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const { feedback, justSaved, announce } = useSaveFeedback();
  const statusFilter = searchParams.get("status");
  const from = searchParams.get("from");
  const backHref = useMemo(() => {
    if (from) return from;
    if (!listing) return "/listings";
    const base = listing.channel === "eBay" ? "/listings/ebay" : "/listings/shopgoodwill";
    return statusFilter ? `${base}?status=${encodeURIComponent(statusFilter)}` : base;
  }, [from, listing, statusFilter]);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      const res = await api.listings.get(org.id, id);
      let found = res.ok ? res.data : null;
      if (!found) found = getListing(id) ?? getListing(id.replace(/^.*?-(l\d+)$/, "$1")) ?? null;
      setListing(found);
      if (found) setForm(listingToFormState(found));
      setReady(true);
    })();
  }, [hydrated, org.id, api, id]);

  const editable = listing ? canEditListing(listing) : false;

  async function save() {
    if (!listing || !form || !editable) return;
    setSaving(true);
    let aspects: import("@/lib/api/ebay-aspects").EbayAspect[] = [];
    if (listing.channel === "eBay" && form.ebayCategoryId) {
      const aspectsRes = await getEbayAspectsClient().getEbayCategoryAspects(form.ebayCategoryId);
      if (aspectsRes.ok) aspects = aspectsRes.data.aspects;
    }
    const err = validateListingForm(form, aspects);
    if (err) {
      announce(err, { error: true });
      setSaving(false);
      return;
    }
    const next = applyFormToListing(listing, form);
    const updateRes = await api.listings.update(org.id, listing.id, next);
    if (updateRes.ok) {
      setListing(updateRes.data);
      setForm(listingToFormState(updateRes.data));
      const { logEvent } = await import("@/lib/event-log");
      logEvent({
        section: "listings",
        action: "Saved listing",
        resource: `Listing ${updateRes.data.sku} · ${updateRes.data.channel}`,
        resourceHref:
          updateRes.data.channel === "eBay" ? "/listings/ebay" : "/listings/shopgoodwill",
      });
      announce("Listing saved successfully.");
    } else {
      announce(updateRes.error || "Save failed", { error: true });
    }
    setSaving(false);
  }

  if (!ready) return <div className="p-8 text-sm text-muted">Loading listing…</div>;
  if (!listing || !form) {
    return (
      <div className="space-y-3 p-8">
        <p className="font-medium">Listing not found</p>
        <Link href="/listings" className="text-sm text-primary hover:underline">
          Back to listings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-white/95 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold">Edit {listing.channel} listing</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
              <ListingStatusBadge status={listing.status} />
              <span className="font-mono">{listing.sku}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" type="button" onClick={() => router.push(backHref)}>
            Cancel
          </Button>
          <SaveButton
            justSaved={justSaved}
            saving={saving}
            disabled={!editable}
            onClick={() => void save()}
          />
          {justSaved && (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-save-ok">
              ✓ Saved
            </span>
          )}
        </div>
      </div>
      <SaveToast feedback={feedback} />
      {!editable && (
        <div className="rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm">
          This listing can’t be edited
          {listing.status === "Sold"
            ? " because it is Sold."
            : listing.status === "Active" && (listing.bids ?? 0) > 0
              ? ` because it has ${listing.bids} bid(s).`
              : "."}
        </div>
      )}
      <StrategyLifecyclePanel listing={listing} strategyName={form.strategy} />
      <ListingEditorForm
        value={form}
        onChange={setForm}
        lockedChannel={listing.channel}
        readOnly={!editable}
        productId={listing.productId}
      />
      <SaveConfirmBar show={justSaved} message="Listing saved successfully" />
    </div>
  );
}
