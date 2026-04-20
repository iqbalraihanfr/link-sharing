import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin-dashboard";
import { hasAdminSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/config";
import { ConfigurationError } from "@/lib/errors";
import { getAdminSnapshot } from "@/lib/store";
import type { AdminSnapshot } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }

  let snapshot: AdminSnapshot = { profiles: [], reports: [] };
  let notice = "";

  if (isDatabaseConfigured()) {
    try {
      snapshot = await getAdminSnapshot();
    } catch (error) {
      if (error instanceof ConfigurationError) {
        notice = error.message;
      } else {
        throw error;
      }
    }
  } else {
    notice = "Supabase belum dikonfigurasi di server ini.";
  }

  return (
    <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AdminDashboard snapshot={snapshot} notice={notice} />
    </main>
  );
}
