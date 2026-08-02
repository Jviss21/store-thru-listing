"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const KEY = "stl-demo-banner-dismissed";

export default function DemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-ink/80">
      <p className="flex-1 leading-snug">
        <span className="font-semibold text-ink">Demo environment</span>
        <span className="text-muted"> — illustrative data for Test Goodwill. Not connected to live inventory or marketplaces.</span>
      </p>
      <button
        type="button"
        className="shrink-0 rounded-lg p-1 text-muted hover:bg-ink/5 hover:text-ink"
        aria-label="Dismiss demo banner"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {
            /* ignore */
          }
          setVisible(false);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
