import Link from "next/link";

import { Pagination } from "@/components/pagination";
import { ProfileCard } from "@/components/profile-card";
import { ProfileSubmitForm } from "@/components/profile-submit-form";
import { ShieldIcon, SparkIcon } from "@/components/icons";
import { config, isDatabaseConfigured } from "@/lib/config";
import { ConfigurationError } from "@/lib/errors";
import { listProfiles } from "@/lib/store";
import { parseDirectoryFilters } from "@/lib/social";
import type { DirectoryResult, PlatformFilter } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildFilterHref(platform: PlatformFilter, q: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (platform !== "all") params.set("platform", platform);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDirectoryFilters(await searchParams);
  let directory: DirectoryResult = {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    summary: {
      activeCount: 0,
      instagramCount: 0,
      linkedinCount: 0,
    },
  };

  let databaseReady = isDatabaseConfigured();
  let databaseNotice =
    "`SUPABASE_URL` atau `SUPABASE_SECRET_KEY` belum diatur. UI sudah siap, tapi data publik dan submit baru aktif setelah server terkoneksi ke project Supabase.";

  if (databaseReady) {
    try {
      directory = await listProfiles(filters);
    } catch (error) {
      if (error instanceof ConfigurationError) {
        databaseReady = false;
        databaseNotice = error.message;
      } else {
        throw error;
      }
    }
  }

  return (
    <div className="min-h-screen">
      <main className="page-shell">
        <section className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Community Directory</p>
            <h1 className="hero-title">
              Stop losing intros in a noisy room chat.
            </h1>
            <p className="hero-text">
              Satu board publik untuk nama, Instagram, dan LinkedIn. Masuk cepat,
              cari nanti dengan tenang, lalu edit pakai secret link tanpa bikin akun.
            </p>

            <div className="stat-strip">
              <div className="stat-card">
                <span>Total cards</span>
                <strong>{directory.summary.activeCount}</strong>
              </div>
              <div className="stat-card">
                <span>Instagram linked</span>
                <strong>{directory.summary.instagramCount}</strong>
              </div>
              <div className="stat-card">
                <span>LinkedIn linked</span>
                <strong>{directory.summary.linkedinCount}</strong>
              </div>
            </div>

            <div className="hero-notes">
              <div className="note-pill">
                <ShieldIcon className="h-4 w-4" />
                Normalized links, honeypot, optional Turnstile, server-side Supabase
              </div>
              <div className="note-pill">
                <SparkIcon className="h-4 w-4" />
                Instant publish with report flow and admin moderation
              </div>
            </div>
          </div>

          <ProfileSubmitForm
            databaseReady={databaseReady}
            databaseNotice={databaseNotice}
            turnstileSiteKey={config.turnstileSiteKey}
          />
        </section>

        <section className="directory-grid">
          <header className="section-header">
            <div>
              <p className="eyebrow">Public Cards</p>
              <h2 className="section-title">Find people by name or handle.</h2>
            </div>

            <Link className="chip-link" href="/admin/login">
              Admin
            </Link>
          </header>

          <form className="filter-bar" method="GET">
            <label className="field filter-field">
              <span>Search</span>
              <input name="q" defaultValue={filters.q} placeholder="Nama, IG, atau LinkedIn" />
            </label>

            <label className="field filter-field">
              <span>Platform</span>
              <select name="platform" defaultValue={filters.platform}>
                <option value="all">All</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </label>

            <button className="button-main filter-button" type="submit">
              Apply
            </button>
          </form>

          <div className="filter-chips">
            {(["all", "instagram", "linkedin"] as const).map((platform) => (
              <Link
                key={platform}
                className={`chip-link ${filters.platform === platform ? "chip-link-active" : ""}`}
                href={buildFilterHref(platform, filters.q)}
              >
                {platform === "all" ? "All cards" : platform}
              </Link>
            ))}
          </div>

          {!databaseReady ? (
            <div className="notice-strip">
              <ShieldIcon className="h-4 w-4" />
              {databaseNotice}
            </div>
          ) : null}

          {directory.items.length ? (
            <div className="card-grid">
              {directory.items.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="empty-panel">
              <p className="eyebrow">No Matches Yet</p>
              <h3 className="panel-title">Belum ada card untuk filter ini.</h3>
              <p className="panel-copy">
                Coba cari nama lain, ubah platform filter, atau submit card baru di panel
                sebelah.
              </p>
            </div>
          )}

          <Pagination
            page={directory.page}
            totalPages={directory.totalPages}
            q={filters.q}
            platform={filters.platform}
          />
        </section>
      </main>
    </div>
  );
}
