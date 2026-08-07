"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

export function AdminBreadcrumb({ trail }: { trail: string[] }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
      {trail.join(" › ")}
    </p>
  );
}

export function AdminPageIntro({
  title,
  description,
  howTo,
  actions,
}: {
  title: string;
  description?: string;
  howTo?: string[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
        {howTo && howTo.length > 0 ? (
          <ol className="mt-2 max-w-2xl list-decimal space-y-0.5 pl-4 text-sm text-muted">
            {howTo.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
      {children}
    </label>
  );
}

export function FieldHelp({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-muted">{children}</p>;
}

export function SelectField({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm outline-none focus:border-ink/30 focus:ring-2 focus:ring-accent/40",
        className
      )}
      {...props}
    />
  );
}

export function ToggleRow({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        {help ? <p className="mt-0.5 text-xs text-muted">{help}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border transition",
          checked
            ? "border-accent bg-accent"
            : "border-ink/35 bg-[#D1D5DB]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full shadow transition",
            checked
              ? "left-5 bg-white"
              : "left-0.5 border border-ink/25 bg-[#F3F4F6]"
          )}
        />
      </button>
    </div>
  );
}

export function SaveBar({
  onSave,
  saved,
  disabled,
  label = "Save",
}: {
  onSave: () => void;
  saved?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" onClick={onSave} disabled={disabled}>
        {label}
      </Button>
      {saved ? (
        <span className="text-sm font-medium text-mustard">Saved for this org on this device.</span>
      ) : null}
    </div>
  );
}

export function SectionCard({
  title,
  children,
  className,
  id,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-2xl border border-ink/8 bg-white/75 p-5 shadow-card backdrop-blur-md",
        className
      )}
    >
      {title ? <h3 className="mb-4 font-display text-lg font-bold text-ink">{title}</h3> : null}
      {children}
    </div>
  );
}

export function useSaveFlash(ms = 2200) {
  const [saved, setSaved] = useState(false);
  function flash() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), ms);
  }
  return { saved, flash };
}
