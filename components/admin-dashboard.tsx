"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminSnapshot, ProfileStatus, PublicProfile } from "@/lib/types";

function StatusChip({ status }: { status: ProfileStatus }) {
  return <span className={`status-chip status-${status}`}>{status}</span>;
}

export function AdminDashboard({
  snapshot,
  notice,
}: {
  snapshot: AdminSnapshot;
  notice?: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function mutateProfile(
    profileId: string,
    options: { method: "PATCH" | "DELETE"; status?: ProfileStatus },
  ) {
    setBusyId(profileId);
    setError("");
    setMessage("");

    const response = await fetch(`/api/admin/profiles/${profileId}`, {
      method: options.method,
      headers:
        options.method === "PATCH"
          ? {
              "Content-Type": "application/json",
            }
          : undefined,
      body: options.status ? JSON.stringify({ status: options.status }) : undefined,
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      setBusyId("");
      setError(payload.error ?? "Aksi admin gagal.");
      return;
    }

    setBusyId("");
    setMessage("Perubahan moderation tersimpan.");
    router.refresh();
  }

  async function handleMerge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("merge");
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/merge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceProfileId: mergeSourceId,
        targetProfileId: mergeTargetId,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      setBusyId("");
      setError(payload.error ?? "Merge gagal.");
      return;
    }

    setBusyId("");
    setMergeSourceId("");
    setMergeTargetId("");
    setMessage("Duplikasi berhasil di-merge ke target.");
    router.refresh();
  }

  async function handleLogout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  const needsAttention = snapshot.profiles.filter(
    (profile) => profile.status !== "active" || profile.reportCount > 0,
  );

  return (
    <div className="admin-grid">
      <section className="paper-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Moderation</p>
            <h1 className="panel-title">Flag queue dan directory control.</h1>
          </div>
          <button className="chip-link" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <p className="panel-copy">
          Cards flagged otomatis akan hilang dari daftar publik sampai statusnya
          diaktifkan lagi oleh admin.
        </p>

        {notice ? <p className="mt-4 text-sm text-[var(--color-muted)]">{notice}</p> : null}
        {message ? <p className="mt-4 text-sm text-[var(--color-success)]">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p> : null}
      </section>

      <section className="paper-panel">
        <p className="eyebrow">Merge Duplicates</p>
        <h2 className="panel-title">Gabungkan kartu lama ke kartu target.</h2>
        <form className="form-stack mt-5" onSubmit={handleMerge}>
          <label className="field">
            <span>Source profile ID</span>
            <input
              value={mergeSourceId}
              onChange={(event) => setMergeSourceId(event.target.value)}
              required
              placeholder="UUID source"
            />
          </label>

          <label className="field">
            <span>Target profile ID</span>
            <input
              value={mergeTargetId}
              onChange={(event) => setMergeTargetId(event.target.value)}
              required
              placeholder="UUID target"
            />
          </label>

          <button className="button-main" type="submit" disabled={busyId === "merge"}>
            {busyId === "merge" ? "Merging..." : "Merge now"}
          </button>
        </form>
      </section>

      <section className="paper-panel">
        <p className="eyebrow">Needs Attention</p>
        <div className="admin-list">
          {needsAttention.length ? (
            needsAttention.map((profile) => (
              <ProfileAdminRow
                key={profile.id}
                busy={busyId === profile.id}
                profile={profile}
                onDelete={() => mutateProfile(profile.id, { method: "DELETE" })}
                onSetStatus={(status) =>
                  mutateProfile(profile.id, { method: "PATCH", status })
                }
              />
            ))
          ) : (
            <p className="text-sm text-[var(--color-muted)]">
              Belum ada card yang butuh perhatian.
            </p>
          )}
        </div>
      </section>

      <section className="paper-panel">
        <p className="eyebrow">Recent Reports</p>
        <div className="admin-report-list">
          {snapshot.reports.length ? (
            snapshot.reports.map((report) => (
              <article key={report.id} className="admin-report-item">
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">
                    {report.profileName}
                  </p>
                  <p className="font-mono text-xs text-[var(--color-muted)]">
                    {report.profileId}
                  </p>
                </div>
                <p className="text-sm text-[var(--color-muted)]">
                  {report.reason || "No reason submitted."}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-[var(--color-muted)]">Belum ada report.</p>
          )}
        </div>
      </section>

      <section className="paper-panel">
        <p className="eyebrow">All Cards</p>
        <div className="admin-list">
          {snapshot.profiles.map((profile) => (
            <ProfileAdminRow
              key={profile.id}
              busy={busyId === profile.id}
              profile={profile}
              onDelete={() => mutateProfile(profile.id, { method: "DELETE" })}
              onSetStatus={(status) =>
                mutateProfile(profile.id, { method: "PATCH", status })
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfileAdminRow({
  profile,
  onSetStatus,
  onDelete,
  busy,
}: {
  profile: PublicProfile;
  onSetStatus: (status: ProfileStatus) => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <article className="admin-profile-row">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-[var(--color-ink)]">{profile.displayName}</p>
          <StatusChip status={profile.status} />
          {profile.reportCount > 0 ? (
            <span className="status-chip status-reports">{profile.reportCount} reports</span>
          ) : null}
        </div>
        <p className="font-mono text-xs text-[var(--color-muted)]">{profile.id}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="chip-link"
          onClick={() => onSetStatus("active")}
          disabled={busy}
        >
          Activate
        </button>
        <button
          type="button"
          className="chip-link"
          onClick={() => onSetStatus("hidden")}
          disabled={busy}
        >
          Hide
        </button>
        <button
          type="button"
          className="chip-link"
          onClick={() => onSetStatus("expired")}
          disabled={busy}
        >
          Expire
        </button>
        <button type="button" className="chip-link" onClick={onDelete} disabled={busy}>
          Delete
        </button>
      </div>
    </article>
  );
}
