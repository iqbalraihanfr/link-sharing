import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import { hasAdminSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await hasAdminSession()) {
    redirect("/admin");
  }

  return (
    <main className="subpage-shell">
      <AdminLoginForm />
    </main>
  );
}
