import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui";
import { notifications } from "@/lib/mock-data";
import { relativeTime } from "@/lib/utils";

export default function NotificationsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Alerts for failed listings, unfulfilled orders, and ops blockers."
      />
      <Card className="divide-y">
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={n.href}
            className="flex items-start gap-3 px-4 py-4 hover:bg-blue-50/40"
          >
            <div className="mt-1">
              {n.unread ? (
                <span className="block h-2.5 w-2.5 rounded-full bg-primary" />
              ) : (
                <span className="block h-2.5 w-2.5 rounded-full bg-gray-300" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{n.title}</p>
                {n.unread && <Badge tone="blue">New</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-muted">{n.body}</p>
              <p className="mt-1 text-xs text-muted">{relativeTime(n.at)}</p>
            </div>
          </Link>
        ))}
      </Card>
    </div>
  );
}
