"use client";

import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { WorkflowSnapshot } from "@/lib/workflow";
import { WORKFLOW_STAGES } from "@/lib/workflow";
import { cn } from "@/lib/utils";

const ECOM_STEPS = WORKFLOW_STAGES.filter((s) => s.id !== "retail");

function toneForStage(id: string): "green" | "blue" | "yellow" | "orange" | "neutral" | "red" {
  if (id === "sold") return "green";
  if (id === "listed" || id === "strategy") return "blue";
  if (id === "qa") return "yellow";
  if (id === "retail") return "neutral";
  if (id === "fulfill" || id === "ship") return "orange";
  return "blue";
}

type Props = {
  snapshot: WorkflowSnapshot;
  sku: string;
  compact?: boolean;
  onPrimaryAction?: () => void;
  primaryOverride?: { label: string; onClick: () => void };
};

export function ItemPipelinePanel({
  snapshot,
  sku,
  compact,
  onPrimaryAction,
  primaryOverride,
}: Props) {
  const { stage, triage, next, secondary, putawayLocation, channels } = snapshot;
  const order = stage.id === "retail" ? 0 : stage.order;

  return (
    <div
      className={cn(
        "rounded-xl border border-ink/10 bg-mist/40",
        compact ? "px-3 py-2.5" : "px-4 py-3.5"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <GitBranch className="h-4 w-4 shrink-0 text-ink" />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Item pipeline
            </p>
            <Badge tone={toneForStage(stage.id)}>{stage.shortLabel}</Badge>
            {triage !== "undecided" && (
              <Badge tone={triage === "retail" ? "neutral" : "blue"}>triage:{triage}</Badge>
            )}
          </div>
          <p className={cn("mt-1 font-semibold text-ink", compact ? "text-sm" : "text-base")}>
            {stage.label}
          </p>
          {!compact && (
            <p className="mt-0.5 text-sm text-muted">
              {stage.description}
              {putawayLocation ? ` · Shelf ${putawayLocation}` : ""}
              {channels.length ? ` · ${channels.join(" + ")}` : ""}
            </p>
          )}
          {!compact && (
            <ol className="mt-3 flex flex-wrap gap-1" aria-label="Pipeline stages">
              {ECOM_STEPS.map((s) => {
                const done = order > 0 && s.order < order;
                const current = s.id === stage.id;
                return (
                  <li
                    key={s.id}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      current
                        ? "bg-ink text-white"
                        : done
                          ? "bg-accent/25 text-ink"
                          : "bg-white/80 text-muted"
                    )}
                    title={s.label}
                  >
                    {s.order}.{s.shortLabel}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {primaryOverride ? (
            <Button type="button" variant="accent" size="sm" onClick={primaryOverride.onClick}>
              {primaryOverride.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : next ? (
            next.href.startsWith("http") ? (
              <a href={next.href} target="_blank" rel="noopener noreferrer">
                <Button type="button" variant={next.primary ? "accent" : "outline"} size="sm">
                  {next.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </a>
            ) : onPrimaryAction && next.primary ? (
              <Button type="button" variant="accent" size="sm" onClick={onPrimaryAction}>
                {next.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Link href={next.href}>
                <Button type="button" variant={next.primary ? "accent" : "outline"} size="sm">
                  {next.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )
          ) : null}
          {!compact &&
            secondary?.map((a) =>
              a.href.startsWith("http") ? (
                <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer">
                  <Button type="button" variant="ghost" size="sm">
                    {a.label}
                  </Button>
                </a>
              ) : (
                <Link key={a.href} href={a.href}>
                  <Button type="button" variant="ghost" size="sm">
                    {a.label}
                  </Button>
                </Link>
              )
            )}
        </div>
      </div>
      {next?.hint && !compact && (
        <p className="mt-2 text-xs text-muted">
          Next for <span className="font-mono font-semibold text-ink">{sku}</span>: {next.hint}
        </p>
      )}
    </div>
  );
}
