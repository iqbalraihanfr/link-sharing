import "server-only";

import { randomUUID } from "node:crypto";

import type { PostgrestError } from "@supabase/supabase-js";

import { FLAG_THRESHOLD, PROFILE_TTL_DAYS } from "@/lib/config";
import { AppError, ConfigurationError } from "@/lib/errors";
import { normalizeProfileInput, normalizeReportReason } from "@/lib/social";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Database } from "@/lib/supabase-types";
import { createEditToken } from "@/lib/security";
import type {
  AdminReport,
  AdminSnapshot,
  CreateProfileInput,
  DirectoryFilters,
  DirectoryResult,
  PublicProfile,
  UpdateProfileInput,
} from "@/lib/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AdminProfileRow = Database["public"]["Views"]["admin_profiles"]["Row"];
type AdminReportRow = Database["public"]["Tables"]["reports"]["Row"];
const PUBLIC_VISIBLE_STATUSES: ProfileRow["status"][] = ["active", "flagged"];

function serializeProfile(row: ProfileRow): PublicProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    instagramHandle: row.instagram_handle,
    linkedinSlug: row.linkedin_slug,
    instagramUrl: row.instagram_url,
    linkedinUrl: row.linkedin_url,
    status: row.status,
    reportCount: row.report_count,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
  };
}

function serializeAdminReport(
  row: AdminReportRow,
  profileName: string,
): AdminReport {
  return {
    id: row.id,
    profileId: row.profile_id,
    profileName,
    reason: row.reason,
    createdAt: new Date(row.created_at).toISOString(),
    reporterIpHash: row.reporter_ip_hash,
  };
}

function getExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + PROFILE_TTL_DAYS);
  return date.toISOString();
}

function buildSearchClause(value: string) {
  const normalized = value
    .trim()
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  const pattern = `*${normalized}*`;

  return [
    `display_name.ilike.${pattern}`,
    `instagram_handle.ilike.${pattern}`,
    `linkedin_slug.ilike.${pattern}`,
  ].join(",");
}

function isSchemaMissingError(error: PostgrestError) {
  return (
    error.code === "PGRST202" ||
    error.code === "PGRST205" ||
    /Could not find the table/i.test(error.message) ||
    /Could not find the function/i.test(error.message) ||
    /relation .* does not exist/i.test(error.message)
  );
}

function throwSupabaseError(error: PostgrestError): never {
  if (isSchemaMissingError(error)) {
    throw new ConfigurationError(
      "Supabase schema belum siap. Jalankan file supabase/migrations/001_initial.sql di SQL Editor lalu coba lagi.",
    );
  }

  if (error.code === "401" || error.code === "403") {
    throw new ConfigurationError(
      "Supabase credentials tidak valid. Cek SUPABASE_URL dan SUPABASE_SECRET_KEY.",
    );
  }

  console.error(error);
  throw new AppError("Supabase request failed.", {
    status: 500,
    code: "SUPABASE_ERROR",
    expose: false,
  });
}

async function executeExpireProfiles() {
  const { data, error } = await getSupabaseAdmin().rpc("expire_profiles");

  if (error) {
    throwSupabaseError(error);
  }

  return Number(data ?? 0);
}

async function refreshExpiredProfiles() {
  await executeExpireProfiles();
}

async function findProfileRowById(profileId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    throwSupabaseError(error);
  }

  return data as ProfileRow | null;
}

export async function listProfiles(
  filters: DirectoryFilters,
): Promise<DirectoryResult> {
  await refreshExpiredProfiles();

  const nowIso = new Date().toISOString();
  const page = Math.max(1, filters.page);
  const from = (page - 1) * filters.pageSize;
  const to = from + filters.pageSize - 1;

  let profilesQuery = getSupabaseAdmin()
    .from("profiles")
    .select("*", { count: "exact" })
    .in("status", PUBLIC_VISIBLE_STATUSES)
    .gt("expires_at", nowIso)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.platform === "instagram") {
    profilesQuery = profilesQuery.not("instagram_handle", "is", null);
  }

  if (filters.platform === "linkedin") {
    profilesQuery = profilesQuery.not("linkedin_slug", "is", null);
  }

  const searchClause = buildSearchClause(filters.q);

  if (searchClause) {
    profilesQuery = profilesQuery.or(searchClause);
  }

  profilesQuery = profilesQuery.range(from, to);

  const [profilesResponse, activeResponse, instagramResponse, linkedinResponse] =
    await Promise.all([
      profilesQuery,
      getSupabaseAdmin()
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("status", PUBLIC_VISIBLE_STATUSES)
        .gt("expires_at", nowIso),
      getSupabaseAdmin()
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("status", PUBLIC_VISIBLE_STATUSES)
        .gt("expires_at", nowIso)
        .not("instagram_handle", "is", null),
      getSupabaseAdmin()
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("status", PUBLIC_VISIBLE_STATUSES)
        .gt("expires_at", nowIso)
        .not("linkedin_slug", "is", null),
    ]);

  if (profilesResponse.error) {
    throwSupabaseError(profilesResponse.error);
  }

  if (activeResponse.error) {
    throwSupabaseError(activeResponse.error);
  }

  if (instagramResponse.error) {
    throwSupabaseError(instagramResponse.error);
  }

  if (linkedinResponse.error) {
    throwSupabaseError(linkedinResponse.error);
  }

  const total = profilesResponse.count ?? 0;

  return {
    items: (profilesResponse.data ?? []).map((row) =>
      serializeProfile(row as ProfileRow),
    ),
    total,
    page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    summary: {
      activeCount: activeResponse.count ?? 0,
      instagramCount: instagramResponse.count ?? 0,
      linkedinCount: linkedinResponse.count ?? 0,
    },
  };
}

export async function createProfile(input: CreateProfileInput) {
  await refreshExpiredProfiles();
  const normalized = normalizeProfileInput(input);
  const token = createEditToken();
  const profileId = randomUUID();

  const { error } = await getSupabaseAdmin()
    .from("profiles")
    .insert({
      id: profileId,
      display_name: normalized.displayName,
      instagram_handle: normalized.instagramHandle,
      linkedin_slug: normalized.linkedinSlug,
      instagram_url: normalized.instagramUrl,
      linkedin_url: normalized.linkedinUrl,
      status: "active",
      expires_at: getExpiryDate(),
      edit_token_hash: token.hash,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new AppError(
        "Username Instagram atau LinkedIn itu sudah terdaftar sebagai kartu aktif.",
        {
          status: 409,
          code: "PROFILE_DUPLICATE",
        },
      );
    }

    throwSupabaseError(error);
  }

  return {
    profileId,
    editToken: token.raw,
  };
}

export async function findProfileByEditTokenHash(hash: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("edit_token_hash", hash)
    .maybeSingle();

  if (error) {
    throwSupabaseError(error);
  }

  return data ? serializeProfile(data as ProfileRow) : null;
}

export async function getProfileById(profileId: string) {
  const profile = await findProfileRowById(profileId);
  return profile ? serializeProfile(profile) : null;
}

export async function updateProfile(profileId: string, input: UpdateProfileInput) {
  const normalized = normalizeProfileInput(input);
  const current = await findProfileRowById(profileId);

  if (!current) {
    throw new AppError("Profil tidak ditemukan.", {
      status: 404,
      code: "PROFILE_NOT_FOUND",
    });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .update({
      display_name: normalized.displayName,
      instagram_handle: normalized.instagramHandle,
      linkedin_slug: normalized.linkedinSlug,
      instagram_url: normalized.instagramUrl,
      linkedin_url: normalized.linkedinUrl,
      expires_at: getExpiryDate(),
      updated_at: new Date().toISOString(),
      status: current.status === "expired" ? "active" : current.status,
    })
    .eq("id", profileId)
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      throw new AppError(
        "Username itu sudah dipakai oleh kartu aktif lain. Pakai username yang berbeda atau minta admin merge.",
        {
          status: 409,
          code: "PROFILE_DUPLICATE",
        },
      );
    }

    throwSupabaseError(error);
  }

  if (!data) {
    throw new AppError("Profil tidak ditemukan.", {
      status: 404,
      code: "PROFILE_NOT_FOUND",
    });
  }

  return serializeProfile(data as ProfileRow);
}

export async function deleteProfile(profileId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .delete()
    .eq("id", profileId)
    .select("*")
    .maybeSingle();

  if (error) {
    throwSupabaseError(error);
  }

  if (!data) {
    throw new AppError("Profil tidak ditemukan.", {
      status: 404,
      code: "PROFILE_NOT_FOUND",
    });
  }
}

export async function reportProfile(
  profileId: string,
  reporterIpHash: string,
  reason?: string | null,
) {
  const cleanReason = normalizeReportReason(reason);
  const { data, error } = await getSupabaseAdmin()
    .rpc("report_profile", {
      p_profile_id: profileId,
      p_report_id: randomUUID(),
      p_reason: cleanReason,
      p_reporter_ip_hash: reporterIpHash,
      p_flag_threshold: FLAG_THRESHOLD,
    })
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new AppError("Laporan untuk kartu ini sudah pernah dikirim dari koneksi ini.", {
        status: 409,
        code: "REPORT_DUPLICATE",
      });
    }

    if (error.message.includes("PROFILE_NOT_FOUND")) {
      throw new AppError("Kartu ini tidak tersedia untuk dilaporkan.", {
        status: 404,
        code: "PROFILE_NOT_FOUND",
      });
    }

    throwSupabaseError(error);
  }

  return serializeProfile(data as ProfileRow);
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  await refreshExpiredProfiles();

  const [profilesResponse, reportsResponse] = await Promise.all([
    getSupabaseAdmin()
      .from("admin_profiles")
      .select("*")
      .order("admin_priority", { ascending: true })
      .order("report_count", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(120),
    getSupabaseAdmin()
      .from("reports")
      .select("id, profile_id, reason, created_at, reporter_ip_hash")
      .order("created_at", { ascending: false })
      .limit(120),
  ]);

  if (profilesResponse.error) {
    throwSupabaseError(profilesResponse.error);
  }

  if (reportsResponse.error) {
    throwSupabaseError(reportsResponse.error);
  }

  const reports = (reportsResponse.data ?? []) as AdminReportRow[];
  const profileIds = Array.from(new Set(reports.map((report) => report.profile_id)));
  const profileNameMap = new Map<string, string>();

  if (profileIds.length) {
    const { data, error } = await getSupabaseAdmin()
      .from("profiles")
      .select("id, display_name")
      .in("id", profileIds);

    if (error) {
      throwSupabaseError(error);
    }

    for (const row of data ?? []) {
      profileNameMap.set(row.id as string, row.display_name as string);
    }
  }

  return {
    profiles: ((profilesResponse.data ?? []) as AdminProfileRow[]).map((row) =>
      serializeProfile(row),
    ),
    reports: reports.map((row) =>
      serializeAdminReport(row, profileNameMap.get(row.profile_id) ?? "Unknown"),
    ),
  };
}

export async function adminUpdateProfileStatus(
  profileId: string,
  status: PublicProfile["status"],
) {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select("*")
    .maybeSingle();

  if (error) {
    throwSupabaseError(error);
  }

  if (!data) {
    throw new AppError("Profil tidak ditemukan.", {
      status: 404,
      code: "PROFILE_NOT_FOUND",
    });
  }

  return serializeProfile(data as ProfileRow);
}

export async function adminDeleteProfile(profileId: string) {
  await deleteProfile(profileId);
}

export async function adminMergeProfiles(sourceProfileId: string, targetProfileId: string) {
  const { data, error } = await getSupabaseAdmin()
    .rpc("merge_profiles", {
      p_source_profile_id: sourceProfileId,
      p_target_profile_id: targetProfileId,
    })
    .single();

  if (error) {
    if (
      error.message.includes("MERGE_CONFLICT") ||
      error.message.includes("SAME_ID")
    ) {
      throw new AppError(
        "Merge otomatis ditolak karena kedua profil tidak kompatibel atau source dan target sama.",
        {
          status: 422,
          code: "MERGE_CONFLICT",
        },
      );
    }

    if (error.message.includes("PROFILE_NOT_FOUND")) {
      throw new AppError("Source atau target profile tidak ditemukan.", {
        status: 404,
        code: "PROFILE_NOT_FOUND",
      });
    }

    throwSupabaseError(error);
  }

  return serializeProfile(data as ProfileRow);
}

export async function expireProfiles() {
  return { expiredCount: await executeExpireProfiles() };
}
