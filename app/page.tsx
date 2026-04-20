import Link from "next/link";

import { Pagination } from "@/components/pagination";
import { ProfileCard } from "@/components/profile-card";
import { ProfileSubmitForm } from "@/components/profile-submit-form";
import { AboutCreator } from "@/components/about-creator";
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
      githubCount: 0,
    },
  };

  let databaseReady = isDatabaseConfigured();

  if (databaseReady) {
    try {
      directory = await listProfiles(filters);
    } catch (error) {
      if (error instanceof ConfigurationError) {
        databaseReady = false;
      } else {
        throw error;
      }
    }
  }

  const hasActiveFilter = !!(filters.q || filters.platform !== "all");

  return (
    <div className="min-h-screen">
      <main className="page-shell">
        <section className="hero-grid">
          <ProfileSubmitForm
            databaseReady={databaseReady}
            turnstileSiteKey={config.turnstileSiteKey}
          />

          <div className="hero-copy">
            <p className="eyebrow">Quick Intro Card</p>
            <h1 className="hero-title">Isi nama dan salah satu username.</h1>
            <p className="hero-text">
              Fokusnya cuma biar link orang tidak tenggelam di chat. Masukkan nama,
              Instagram, LinkedIn, atau GitHub, lalu orang lain bisa klik langsung ke profilmu.
            </p>
            <p className="hero-helper">
              <strong>{directory.summary.activeCount}</strong> kartu aktif,{" "}
              <strong>{directory.summary.instagramCount}</strong> Instagram,{" "}
              <strong>{directory.summary.linkedinCount}</strong> LinkedIn,{" "}
              <strong>{directory.summary.githubCount}</strong> GitHub.
            </p>
          </div>
        </section>

        <section className="directory-grid">
          <header className="section-header">
            <div>
              <p className="eyebrow">Public Cards</p>
              <h2 className="section-title">Find people by name or handle.</h2>
            </div>
          </header>

          <details className="filter-collapsible" open={hasActiveFilter || undefined}>
            <summary className="filter-toggle">
              <span className="filter-toggle-label">Filter &amp; Search</span>
              <span className="filter-toggle-icon" aria-hidden="true" />
            </summary>

            <div className="filter-content">
              <form className="filter-bar" method="GET">
                <label className="field filter-field">
                  <span>Search</span>
                  <input name="q" defaultValue={filters.q} placeholder="Nama, IG, LinkedIn, atau GitHub" />
                </label>

                <label className="field filter-field">
                  <span>Platform</span>
                  <select name="platform" defaultValue={filters.platform}>
                    <option value="all">All</option>
                    <option value="instagram">Instagram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="github">GitHub</option>
                  </select>
                </label>

                <button className="button-main filter-button" type="submit">
                  Apply
                </button>
              </form>
            </div>
          </details>

          <div className="filter-chips">
            {(["all", "instagram", "linkedin", "github"] as const).map((platform) => (
              <Link
                key={platform}
                className={`chip-link ${filters.platform === platform ? "chip-link-active" : ""}`}
                href={buildFilterHref(platform, filters.q)}
              >
                {platform === "all" ? "All cards" : platform === "github" ? "GitHub" : platform}
              </Link>
            ))}
          </div>

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

        <footer className="footer-subtle">
          <AboutCreator />
        </footer>
      </main>
    </div>
  );
}
