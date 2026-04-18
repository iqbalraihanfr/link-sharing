import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin-dashboard";
import { hasAdminSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/config";
import { getAdminSnapshot } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }

  const snapshot = isDatabaseConfigured()
    ? await getAdminSnapshot()
    : { profiles: [], reports: [] };

  return (
    <main className="subpage-shell">
      <AdminDashboard snapshot={snapshot} />
    </main>
  );
}
