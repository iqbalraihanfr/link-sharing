import { notFound, redirect } from "next/navigation";

import { EditProfileForm } from "@/components/edit-profile-form";
import { getEditSessionProfileIdFromCookies } from "@/lib/auth";
import { getProfileById } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditManagePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const authorizedProfileId = await getEditSessionProfileIdFromCookies();

  if (!authorizedProfileId || authorizedProfileId !== profileId) {
    redirect("/");
  }

  const profile = await getProfileById(profileId);

  if (!profile) {
    notFound();
  }

  return (
    <main className="subpage-shell">
      <EditProfileForm profile={profile} />
    </main>
  );
}
