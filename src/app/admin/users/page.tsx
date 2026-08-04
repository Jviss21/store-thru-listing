"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminUsersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/teammates");
  }, [router]);
  return <p className="text-sm text-muted">Redirecting to Teammates…</p>;
}
