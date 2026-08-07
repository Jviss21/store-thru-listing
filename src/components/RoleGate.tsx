"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useOrg } from "@/components/OrgProvider";
import { Button, Card } from "@/components/ui";
import { canAccessPath, canViewMasterEventLog } from "@/lib/roles";

export function RoleGate({
  children,
  requireMasterLog,
  path,
}: {
  children: React.ReactNode;
  requireMasterLog?: boolean;
  path?: string;
}) {
  const { session, isOps, hydrated } = useOrg();

  if (!hydrated) {
    return <div className="p-8 text-sm text-muted">Checking access…</div>;
  }

  const pathname =
    path || (typeof window !== "undefined" ? window.location.pathname : "/");

  const allowed = requireMasterLog
    ? canViewMasterEventLog(session.role, isOps)
    : canAccessPath(pathname, session.role, isOps);

  if (allowed) return <>{children}</>;

  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <ShieldAlert className="mx-auto h-10 w-10 text-coral" />
      <h2 className="mt-3 font-display text-xl font-bold text-ink">Access restricted</h2>
      <p className="mt-2 text-sm text-muted">
        {requireMasterLog
          ? "The Admin master event log is limited to Admin and Hammoq Ops. Open Event log in the sidebar (/logs) for the org-wide activity trail."
          : `Your role (${session.role}) cannot open this area.`}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {requireMasterLog ? (
          <Link href="/logs">
            <Button type="button" variant="accent">
              View event log
            </Button>
          </Link>
        ) : null}
        <Link href="/">
          <Button type="button" variant={requireMasterLog ? "outline" : "accent"}>
            Back to home
          </Button>
        </Link>
      </div>
    </Card>
  );
}
