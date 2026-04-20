"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminSnapshot, ProfileStatus, PublicProfile } from "@/lib/types";

function StatusChip({ status }: { status: ProfileStatus }) {
  return <span className={`status-chip status-${status} !px-2 !py-0.5 !text-[10px]`}>{status}</span>;
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
  
  const totalProfiles = snapshot.profiles.length;
  const totalReports = snapshot.reports.length;
  const activeProfiles = snapshot.profiles.filter((p) => p.status === "active").length;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 w-full">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin Area</p>
          <h1 className="panel-title">System Dashboard</h1>
        </div>
        <button className="chip-link !min-h-0 !py-2 !px-4" type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {(notice || message || error) && (
        <div className="flex flex-col gap-2">
          {notice && <p className="text-sm text-[var(--color-muted)] bg-[rgba(255,251,245,0.78)] p-3 rounded-lg border border-[rgba(95,73,45,0.14)]">{notice}</p>}
          {message && <p className="text-sm text-[var(--color-success)] bg-green-50 p-3 rounded-lg border border-green-200">{message}</p>}
          {error && <p className="text-sm text-[var(--color-danger)] bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="paper-panel !p-4 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-serif text-[var(--color-ink)]">{totalProfiles}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mt-1">Total Cards</p>
        </div>
        <div className="paper-panel !p-4 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-serif text-[var(--color-success)]">{activeProfiles}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mt-1">Active Cards</p>
        </div>
        <div className="paper-panel !p-4 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-serif text-[var(--color-accent-strong)]">{needsAttention.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent-strong)] mt-1">Needs Attention</p>
        </div>
        <div className="paper-panel !p-4 flex flex-col items-center justify-center text-center">
          <p className="text-3xl font-serif text-[var(--color-danger)]">{totalReports}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-danger)] mt-1">Total Reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="paper-panel !p-5 md:!p-6">
            <h2 className="text-xl font-serif text-[var(--color-ink)] mb-4">Needs Attention</h2>
            <div className="flex flex-col gap-2">
              {needsAttention.length ? (
                needsAttention.map((profile) => (
                  <ProfileAdminRow
                    key={profile.id}
                    busy={busyId === profile.id}
                    profile={profile}
                    onDelete={() => mutateProfile(profile.id, { method: "DELETE" })}
                    onSetStatus={(status) => mutateProfile(profile.id, { method: "PATCH", status })}
                  />
                ))
              ) : (
                <div className="py-4 text-center border border-dashed border-[var(--color-line)] rounded-xl bg-white/30">
                  <p className="text-sm text-[var(--color-muted)]">Belum ada card yang butuh perhatian.</p>
                </div>
              )}
            </div>
          </section>

          <section className="paper-panel !p-5 md:!p-6">
            <details className="group">
              <summary className="text-xl font-serif text-[var(--color-ink)] cursor-pointer select-none list-none flex justify-between items-center outline-none rounded-lg focus-visible:ring-2 ring-[var(--color-accent)] ring-offset-2">
                <span>All Cards <span className="text-sm font-sans text-[var(--color-muted)] font-normal ml-2">({totalProfiles})</span></span>
                <div className="w-6 h-6 rounded-full bg-[rgba(191,91,61,0.1)] flex items-center justify-center text-[var(--color-accent)] group-open:rotate-180 transition-transform">
                  ▼
                </div>
              </summary>
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[var(--color-line)] max-h-[600px] overflow-y-auto pr-1 pb-1">
                {snapshot.profiles.map((profile) => (
                  <ProfileAdminRow
                    key={profile.id}
                    busy={busyId === profile.id}
                    profile={profile}
                    onDelete={() => mutateProfile(profile.id, { method: "DELETE" })}
                    onSetStatus={(status) => mutateProfile(profile.id, { method: "PATCH", status })}
                  />
                ))}
              </div>
            </details>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="flex flex-col gap-6">
          <section className="paper-panel !p-5 md:!p-6">
            <h2 className="text-lg font-serif text-[var(--color-ink)] mb-4 flex items-center justify-between">
              Recent Reports
              {totalReports > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-sans">{totalReports}</span>}
            </h2>
            <div className="flex flex-col gap-2">
              {snapshot.reports.length ? (
                snapshot.reports.map((report) => (
                  <article key={report.id} className="flex flex-col gap-1 p-3 border border-[rgba(82,68,48,0.12)] rounded-xl bg-[rgba(255,252,246,0.7)] text-sm">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-[var(--color-ink)]">{report.profileName}</p>
                      <span className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded font-mono max-w-[90px] truncate" title={report.profileId}>
                        {report.profileId.split('-')[0]}..
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted)] mt-1">{report.reason || "No reason submitted."}</p>
                  </article>
                ))
              ) : (
                <div className="py-4 text-center border border-dashed border-[var(--color-line)] rounded-xl bg-white/30">
                  <p className="text-sm text-[var(--color-muted)]">Belum ada report.</p>
                </div>
              )}
            </div>
          </section>

          <section className="paper-panel !p-5 md:!p-6">
            <h2 className="text-lg font-serif text-[var(--color-ink)] mb-1">Merge Duplicates</h2>
            <p className="text-[11px] text-[var(--color-muted)] mb-4 leading-relaxed">Gabungkan kartu lama ke kartu target (menyatukan URL).</p>
            <form className="flex flex-col gap-3" onSubmit={handleMerge}>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--color-ink)]">Source ID</span>
                <input
                  className="!px-3 !py-2 text-sm !rounded-lg"
                  value={mergeSourceId}
                  onChange={(event) => setMergeSourceId(event.target.value)}
                  required
                  placeholder="ID profil lama"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[var(--color-ink)]">Target ID</span>
                <input
                  className="!px-3 !py-2 text-sm !rounded-lg"
                  value={mergeTargetId}
                  onChange={(event) => setMergeTargetId(event.target.value)}
                  required
                  placeholder="ID profil tujuan"
                />
              </label>
              <button className="button-main !min-h-0 !py-2.5 !text-sm mt-1 w-full" type="submit" disabled={busyId === "merge"}>
                {busyId === "merge" ? "Merging..." : "Merge profiles"}
              </button>
            </form>
          </section>
        </div>
      </div>
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
    <article className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-[rgba(82,68,48,0.12)] rounded-xl bg-[rgba(255,252,246,0.7)] hover:border-[rgba(159,64,37,0.2)] hover:shadow-sm transition-all relative overflow-hidden">
      {/* Visual indicator for reports */}
      {profile.reportCount > 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400" />}
      
      <div className="flex flex-col gap-1 ml-1 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-sm text-[var(--color-ink)] truncate max-w-[200px]" title={profile.displayName}>
            {profile.displayName}
          </p>
          <StatusChip status={profile.status} />
          {profile.reportCount > 0 ? (
            <span className="status-chip status-reports !px-2 !py-0.5 !text-[10px] bg-red-100 text-red-700">{profile.reportCount} reports</span>
          ) : null}
        </div>
        <p className="font-mono text-[10px] text-[var(--color-muted)] truncate max-w-[250px]" title={profile.id}>{profile.id}</p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        <button
          type="button"
          className="chip-link !min-h-0 !py-1.5 !px-3 !text-[11px]"
          onClick={() => onSetStatus("active")}
          disabled={busy || profile.status === "active"}
        >
          Active
        </button>
        <button
          type="button"
          className="chip-link !min-h-0 !py-1.5 !px-3 !text-[11px]"
          onClick={() => onSetStatus("hidden")}
          disabled={busy || profile.status === "hidden"}
        >
          Hide
        </button>
        <button
          type="button"
          className="chip-link !min-h-0 !py-1.5 !px-3 !text-[11px]"
          onClick={() => onSetStatus("expired")}
          disabled={busy || profile.status === "expired"}
        >
          Expire
        </button>
        <div className="w-[1px] h-4 bg-[var(--color-line)] mx-1"></div>
        <button 
          type="button" 
          className="chip-link !min-h-0 !py-1.5 !px-3 !text-[11px] !border-red-200 !text-red-700 hover:!bg-red-50 disabled:opacity-50" 
          onClick={onDelete} 
          disabled={busy}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
