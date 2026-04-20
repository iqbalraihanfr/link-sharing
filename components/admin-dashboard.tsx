"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminSnapshot, ProfileStatus, PublicProfile } from "@/lib/types";

function StatusChip({ status }: { status: ProfileStatus }) {
  const styles: Record<ProfileStatus, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    hidden: "bg-gray-100 text-gray-600 border-gray-200",
    expired: "bg-orange-100 text-orange-700 border-orange-200",
    flagged: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase border ${styles[status]}`}>
      {status}
    </span>
  );
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
      setError(payload.error ?? "Action failed.");
      return;
    }

    setBusyId("");
    setMessage("Changes saved.");
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
      setError(payload.error ?? "Merge failed.");
      return;
    }

    setBusyId("");
    setMergeSourceId("");
    setMergeTargetId("");
    setMessage("Profiles successfully merged.");
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
    <div className="max-w-[1200px] mx-auto flex flex-col gap-8 w-full font-sans pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">Dashboard</h1>
          <p className="text-sm text-black/60 mt-1">Manage profiles, reports, and directory configuration.</p>
        </div>
        <button 
          className="px-4 py-2 bg-white border border-black/10 rounded-md text-sm font-medium text-black hover:bg-black/5 transition-colors" 
          type="button" 
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      {/* Notifications */}
      {(notice || message || error) && (
        <div className="flex flex-col gap-2">
          {notice && <p className="text-sm text-yellow-800 bg-yellow-50 p-3 rounded-md border border-yellow-200">{notice}</p>}
          {message && <p className="text-sm text-green-800 bg-green-50 p-3 rounded-md border border-green-200">{message}</p>}
          {error && <p className="text-sm text-red-800 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Profiles" value={totalProfiles} />
        <MetricCard title="Active" value={activeProfiles} valueClass="text-green-600" />
        <MetricCard title="Needs Attention" value={needsAttention.length} valueClass={needsAttention.length > 0 ? "text-amber-600" : "text-black"} />
        <MetricCard title="Pending Reports" value={totalReports} valueClass={totalReports > 0 ? "text-red-500" : "text-black"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Needs Attention Table */}
          <section className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-black/5 flex justify-between items-center bg-black/[0.02]">
              <h2 className="font-medium text-black tracking-tight">Needs Attention</h2>
              <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{needsAttention.length}</span>
            </div>
            {needsAttention.length > 0 ? (
              <ProfileTable profiles={needsAttention} busyId={busyId} onMutate={mutateProfile} />
            ) : (
              <div className="p-8 text-center text-sm text-black/50">
                All clear. No profiles need attention currently.
              </div>
            )}
          </section>

          {/* All Cards Table */}
          <section className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
             <div className="px-5 py-4 border-b border-black/5 flex justify-between items-center bg-black/[0.02]">
              <h2 className="font-medium text-black tracking-tight">All Profiles Directory</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <ProfileTable profiles={snapshot.profiles} busyId={busyId} onMutate={mutateProfile} />
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="flex flex-col gap-8">
          {/* Recent Reports */}
          <section className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-black/5 bg-black/[0.02]">
              <h2 className="font-medium text-black tracking-tight">Recent Reports</h2>
            </div>
            <div className="p-0">
              {snapshot.reports.length ? (
                <div className="flex flex-col divide-y divide-black/5">
                  {snapshot.reports.map((report) => (
                    <article key={report.id} className="flex flex-col gap-1 p-4 text-sm hover:bg-black/[0.01]">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-black">{report.profileName}</p>
                        <span className="text-[10px] bg-black/5 text-black/60 px-1.5 py-0.5 rounded font-mono">
                          {report.profileId.split('-')[0]}
                        </span>
                      </div>
                      <p className="text-sm text-black/60 leading-relaxed">{report.reason || "No reason submitted."}</p>
                    </article>
                  ))}
                </div>
              ) : (
                 <div className="p-8 text-center text-sm text-black/50">
                  No pending reports.
                </div>
              )}
            </div>
          </section>

          {/* Merge Profiles */}
          <section className="bg-white border border-black/10 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-black/5 bg-black/[0.02]">
              <h2 className="font-medium text-black tracking-tight">Merge Duplicates</h2>
            </div>
            <div className="p-5">
              <p className="text-xs text-black/60 mb-5 leading-relaxed">
                Consolidate two profiles into one. The source profile will be deleted and its history merged into the target.
              </p>
              <form className="flex flex-col gap-4" onSubmit={handleMerge}>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-black/80 uppercase tracking-widest">Source ID</span>
                  <input
                    className="w-full px-3 py-2 text-sm border border-black/10 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-shadow"
                    value={mergeSourceId}
                    onChange={(event) => setMergeSourceId(event.target.value)}
                    required
                    placeholder="e.g. 123e4567-e89b-..."
                  />
                </label>
                <div className="h-4 flex items-center justify-center -my-2 relative z-0">
                  <div className="w-[1px] h-full bg-black/10"></div>
                  <div className="absolute text-[10px] bg-white px-2 text-black/40">INTO</div>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-black/80 uppercase tracking-widest">Target ID</span>
                  <input
                    className="w-full px-3 py-2 text-sm border border-black/10 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-shadow"
                    value={mergeTargetId}
                    onChange={(event) => setMergeTargetId(event.target.value)}
                    required
                    placeholder="e.g. 123e4567-e89b-..."
                  />
                </label>
                <button 
                  className="w-full mt-2 px-4 py-2.5 bg-black text-white hover:bg-black/80 text-sm font-medium rounded-md transition-colors disabled:opacity-50" 
                  type="submit" 
                  disabled={busyId === "merge"}
                >
                  {busyId === "merge" ? "Merging..." : "Confirm Merge"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, valueClass = "text-black" }: { title: string, value: number, valueClass?: string }) {
  return (
    <div className="bg-white border border-black/10 rounded-xl p-5 shadow-sm flex flex-col justify-between items-start gap-4">
      <p className="text-xs font-medium text-black/60 capitalize">{title}</p>
      <p className={`text-4xl font-semibold tracking-tight ${valueClass}`}>{value}</p>
    </div>
  );
}

function ProfileTable({
  profiles,
  busyId,
  onMutate,
}: {
  profiles: PublicProfile[];
  busyId: string;
  onMutate: (
    id: string,
    options: { method: "PATCH" | "DELETE"; status?: ProfileStatus }
  ) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-black/[0.01]">
          <tr className="border-b border-black/5 text-black/50 text-xs">
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Flags</th>
            <th className="px-5 py-3 font-medium">ID</th>
            <th className="px-5 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {profiles.map((profile) => (
            <tr key={profile.id} className="hover:bg-black/[0.02] transition-colors group">
              <td className="px-5 py-3 text-black font-medium max-w-[180px] truncate" title={profile.displayName}>
                {profile.displayName}
              </td>
              <td className="px-5 py-3">
                <StatusChip status={profile.status} />
              </td>
              <td className="px-5 py-3">
                {profile.reportCount > 0 ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                    {profile.reportCount}
                  </span>
                ) : (
                  <span className="text-black/30">-</span>
                )}
              </td>
              <td className="px-5 py-3 font-mono text-[11px] text-black/50">
                {profile.id.split('-')[0]}
              </td>
              <td className="px-5 py-3 text-right">
                {/* Horizontal Action Group */}
                <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  {profile.status !== 'active' && (
                    <button 
                      onClick={() => onMutate(profile.id, { method: "PATCH", status: "active" })} 
                      disabled={busyId === profile.id} 
                      className="px-2 py-1.5 bg-white border border-black/10 rounded-md text-[11px] font-medium text-black hover:bg-black/5 transition-colors disabled:opacity-50"
                    >
                      Active
                    </button>
                  )}
                  {profile.status !== 'hidden' && (
                    <button 
                      onClick={() => onMutate(profile.id, { method: "PATCH", status: "hidden" })} 
                      disabled={busyId === profile.id} 
                      className="px-2 py-1.5 bg-white border border-black/10 rounded-md text-[11px] font-medium text-black hover:bg-black/5 transition-colors disabled:opacity-50"
                    >
                      Hide
                    </button>
                  )}
                  {profile.status !== 'expired' && (
                    <button 
                      onClick={() => onMutate(profile.id, { method: "PATCH", status: "expired" })} 
                      disabled={busyId === profile.id} 
                      className="px-2 py-1.5 bg-white border border-black/10 rounded-md text-[11px] font-medium text-black hover:bg-black/5 transition-colors disabled:opacity-50"
                    >
                      Expire
                    </button>
                  )}
                  <div className="w-[1px] h-3 bg-black/10 mx-0.5"></div>
                  <button 
                    onClick={() => onMutate(profile.id, { method: "DELETE" })} 
                    disabled={busyId === profile.id} 
                    className="px-2 py-1.5 bg-red-50 border border-red-200 rounded-md text-[11px] font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
