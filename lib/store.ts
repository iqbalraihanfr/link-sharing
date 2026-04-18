import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { FLAG_THRESHOLD, PROFILE_TTL_DAYS } from "@/lib/config";
import { query, withTransaction } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { normalizeProfileInput, normalizeReportReason } from "@/lib/social";
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

interface ProfileRow {
  id: string;
  display_name: string;
  instagram_handle: string | null;
  linkedin_slug: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  status: PublicProfile["status"];
  report_count: number;
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
  edit_token_hash: string;
}

interface AdminReportRow {
  id: string;
  profile_id: string;
  profile_name: string;
  reason: string | null;
  created_at: Date;
  reporter_ip_hash: string;
}

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
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
  };
}

function serializeAdminReport(row: AdminReportRow): AdminReport {
  return {
    id: row.id,
    profileId: row.profile_id,
    profileName: row.profile_name,
    reason: row.reason,
    createdAt: row.created_at.toISOString(),
    reporterIpHash: row.reporter_ip_hash,
  };
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function getExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + PROFILE_TTL_DAYS);
  return date;
}

async function refreshExpiredProfiles() {
  await query(
    `UPDATE profiles
      SET status = 'expired', updated_at = NOW()
      WHERE status IN ('active', 'flagged') AND expires_at <= NOW()`,
  );
}

export async function listProfiles(
  filters: DirectoryFilters,
): Promise<DirectoryResult> {
  await refreshExpiredProfiles();

  const whereClauses = ["status = 'active'", "expires_at > NOW()"];
  const values: unknown[] = [];

  if (filters.platform === "instagram") {
    whereClauses.push("instagram_handle IS NOT NULL");
  }

  if (filters.platform === "linkedin") {
    whereClauses.push("linkedin_slug IS NOT NULL");
  }

  if (filters.q) {
    values.push(`%${escapeLike(filters.q.toLowerCase())}%`);
    const placeholder = `$${values.length}`;
    whereClauses.push(
      `(LOWER(display_name) LIKE ${placeholder} ESCAPE '\\'
        OR COALESCE(instagram_handle, '') LIKE ${placeholder} ESCAPE '\\'
        OR COALESCE(linkedin_slug, '') LIKE ${placeholder} ESCAPE '\\')`,
    );
  }

  const page = Math.max(1, filters.page);
  values.push(filters.pageSize);
  const limitPlaceholder = `$${values.length}`;
  values.push((page - 1) * filters.pageSize);
  const offsetPlaceholder = `$${values.length}`;

  const where = whereClauses.join(" AND ");

  const [itemsResult, totalResult, summaryResult] = await Promise.all([
    query<ProfileRow>(
      `SELECT *
        FROM profiles
        WHERE ${where}
        ORDER BY updated_at DESC, created_at DESC
        LIMIT ${limitPlaceholder}
        OFFSET ${offsetPlaceholder}`,
      values,
    ),
    query<{ total: string }>(
      `SELECT COUNT(*)::text AS total
        FROM profiles
        WHERE ${where}`,
      values.slice(0, values.length - 2),
    ),
    query<{
      active_count: string;
      instagram_count: string;
      linkedin_count: string;
    }>(`SELECT
          COUNT(*) FILTER (WHERE status = 'active' AND expires_at > NOW())::text AS active_count,
          COUNT(*) FILTER (WHERE status = 'active' AND expires_at > NOW() AND instagram_handle IS NOT NULL)::text AS instagram_count,
          COUNT(*) FILTER (WHERE status = 'active' AND expires_at > NOW() AND linkedin_slug IS NOT NULL)::text AS linkedin_count
        FROM profiles`),
  ]);

  const total = Number(totalResult.rows[0]?.total ?? 0);

  return {
    items: itemsResult.rows.map(serializeProfile),
    total,
    page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    summary: {
      activeCount: Number(summaryResult.rows[0]?.active_count ?? 0),
      instagramCount: Number(summaryResult.rows[0]?.instagram_count ?? 0),
      linkedinCount: Number(summaryResult.rows[0]?.linkedin_count ?? 0),
    },
  };
}

export async function createProfile(input: CreateProfileInput) {
  await refreshExpiredProfiles();
  const normalized = normalizeProfileInput(input);
  const token = createEditToken();
  const profileId = randomUUID();
  const expiresAt = getExpiryDate();

  try {
    await query(
      `INSERT INTO profiles (
        id,
        display_name,
        instagram_handle,
        linkedin_slug,
        instagram_url,
        linkedin_url,
        status,
        expires_at,
        edit_token_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8)`,
      [
        profileId,
        normalized.displayName,
        normalized.instagramHandle,
        normalized.linkedinSlug,
        normalized.instagramUrl,
        normalized.linkedinUrl,
        expiresAt,
        token.hash,
      ],
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new AppError(
        "Username Instagram atau LinkedIn itu sudah terdaftar sebagai kartu aktif.",
        {
          status: 409,
          code: "PROFILE_DUPLICATE",
        },
      );
    }

    throw error;
  }

  return {
    profileId,
    editToken: token.raw,
  };
}

export async function findProfileByEditTokenHash(hash: string) {
  const result = await query<ProfileRow>(
    `SELECT *
      FROM profiles
      WHERE edit_token_hash = $1
      LIMIT 1`,
    [hash],
  );

  return result.rows[0] ? serializeProfile(result.rows[0]) : null;
}

export async function getProfileById(profileId: string) {
  const result = await query<ProfileRow>(
    `SELECT *
      FROM profiles
      WHERE id = $1
      LIMIT 1`,
    [profileId],
  );

  return result.rows[0] ? serializeProfile(result.rows[0]) : null;
}

export async function updateProfile(profileId: string, input: UpdateProfileInput) {
  const normalized = normalizeProfileInput(input);
  const expiresAt = getExpiryDate();

  try {
    const result = await query<ProfileRow>(
      `UPDATE profiles
        SET
          display_name = $2,
          instagram_handle = $3,
          linkedin_slug = $4,
          instagram_url = $5,
          linkedin_url = $6,
          expires_at = $7,
          updated_at = NOW(),
          status = CASE WHEN status = 'expired' THEN 'active' ELSE status END
        WHERE id = $1
        RETURNING *`,
      [
        profileId,
        normalized.displayName,
        normalized.instagramHandle,
        normalized.linkedinSlug,
        normalized.instagramUrl,
        normalized.linkedinUrl,
        expiresAt,
      ],
    );

    if (!result.rows[0]) {
      throw new AppError("Profil tidak ditemukan.", {
        status: 404,
        code: "PROFILE_NOT_FOUND",
      });
    }

    return serializeProfile(result.rows[0]);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new AppError(
        "Username itu sudah dipakai oleh kartu aktif lain. Pakai username yang berbeda atau minta admin merge.",
        {
          status: 409,
          code: "PROFILE_DUPLICATE",
        },
      );
    }

    throw error;
  }
}

export async function deleteProfile(profileId: string) {
  const result = await query<ProfileRow>(
    `DELETE FROM profiles
      WHERE id = $1
      RETURNING *`,
    [profileId],
  );

  if (!result.rows[0]) {
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

  try {
    return await withTransaction(async (client) => {
      const profile = await getProfileRowForUpdate(client, profileId);

      if (!profile || profile.status === "hidden" || profile.status === "expired") {
        throw new AppError("Kartu ini tidak tersedia untuk dilaporkan.", {
          status: 404,
          code: "PROFILE_NOT_FOUND",
        });
      }

      await client.query(
        `INSERT INTO reports (id, profile_id, reason, reporter_ip_hash)
          VALUES ($1, $2, $3, $4)`,
        [randomUUID(), profileId, cleanReason, reporterIpHash],
      );

      const nextCount = profile.report_count + 1;
      const nextStatus = nextCount >= FLAG_THRESHOLD ? "flagged" : profile.status;

      const updated = await client.query<ProfileRow>(
        `UPDATE profiles
          SET report_count = $2, status = $3, updated_at = NOW()
          WHERE id = $1
          RETURNING *`,
        [profileId, nextCount, nextStatus],
      );

      return serializeProfile(updated.rows[0]);
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new AppError("Laporan untuk kartu ini sudah pernah dikirim dari koneksi ini.", {
        status: 409,
        code: "REPORT_DUPLICATE",
      });
    }

    throw error;
  }
}

async function getProfileRowForUpdate(client: PoolClient, profileId: string) {
  const result = await client.query<ProfileRow>(
    `SELECT *
      FROM profiles
      WHERE id = $1
      LIMIT 1
      FOR UPDATE`,
    [profileId],
  );

  return result.rows[0] ?? null;
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  await refreshExpiredProfiles();

  const [profilesResult, reportsResult] = await Promise.all([
    query<ProfileRow>(
      `SELECT *
        FROM profiles
        ORDER BY
          CASE
            WHEN status = 'flagged' THEN 0
            WHEN report_count > 0 THEN 1
            WHEN status = 'hidden' THEN 2
            WHEN status = 'expired' THEN 3
            ELSE 4
          END,
          report_count DESC,
          updated_at DESC
        LIMIT 120`,
    ),
    query<AdminReportRow>(
      `SELECT
          reports.id,
          reports.profile_id,
          profiles.display_name AS profile_name,
          reports.reason,
          reports.created_at,
          reports.reporter_ip_hash
        FROM reports
        INNER JOIN profiles ON profiles.id = reports.profile_id
        ORDER BY reports.created_at DESC
        LIMIT 120`,
    ),
  ]);

  return {
    profiles: profilesResult.rows.map(serializeProfile),
    reports: reportsResult.rows.map(serializeAdminReport),
  };
}

export async function adminUpdateProfileStatus(
  profileId: string,
  status: PublicProfile["status"],
) {
  const result = await query<ProfileRow>(
    `UPDATE profiles
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
    [profileId, status],
  );

  if (!result.rows[0]) {
    throw new AppError("Profil tidak ditemukan.", {
      status: 404,
      code: "PROFILE_NOT_FOUND",
    });
  }

  return serializeProfile(result.rows[0]);
}

export async function adminDeleteProfile(profileId: string) {
  await deleteProfile(profileId);
}

export async function adminMergeProfiles(sourceProfileId: string, targetProfileId: string) {
  if (sourceProfileId === targetProfileId) {
    throw new AppError("Source dan target merge harus berbeda.", {
      status: 422,
      code: "MERGE_CONFLICT",
    });
  }

  return withTransaction(async (client) => {
    const source = await getProfileRowForUpdate(client, sourceProfileId);
    const target = await getProfileRowForUpdate(client, targetProfileId);

    if (!source || !target) {
      throw new AppError("Source atau target profile tidak ditemukan.", {
        status: 404,
        code: "PROFILE_NOT_FOUND",
      });
    }

    if (
      source.instagram_handle &&
      target.instagram_handle &&
      source.instagram_handle !== target.instagram_handle
    ) {
      throw new AppError(
        "Kedua profil punya username Instagram berbeda, jadi tidak aman untuk di-merge otomatis.",
        {
          status: 422,
          code: "MERGE_CONFLICT",
        },
      );
    }

    if (
      source.linkedin_slug &&
      target.linkedin_slug &&
      source.linkedin_slug !== target.linkedin_slug
    ) {
      throw new AppError(
        "Kedua profil punya slug LinkedIn berbeda, jadi tidak aman untuk di-merge otomatis.",
        {
          status: 422,
          code: "MERGE_CONFLICT",
        },
      );
    }

    await client.query(
      `DELETE FROM reports
        WHERE profile_id = $1
          AND reporter_ip_hash IN (
            SELECT reporter_ip_hash
            FROM reports
            WHERE profile_id = $2
          )`,
      [sourceProfileId, targetProfileId],
    );

    await client.query(`UPDATE reports SET profile_id = $2 WHERE profile_id = $1`, [
      sourceProfileId,
      targetProfileId,
    ]);

    const nextInstagramHandle = target.instagram_handle ?? source.instagram_handle;
    const nextLinkedInSlug = target.linkedin_slug ?? source.linkedin_slug;
    const nextInstagramUrl = target.instagram_url ?? source.instagram_url;
    const nextLinkedInUrl = target.linkedin_url ?? source.linkedin_url;
    const nextExpiry =
      target.expires_at > source.expires_at ? target.expires_at : source.expires_at;

    const updatedTarget = await client.query<ProfileRow>(
      `UPDATE profiles
        SET
          instagram_handle = $2,
          instagram_url = $3,
          linkedin_slug = $4,
          linkedin_url = $5,
          expires_at = $6,
          updated_at = NOW(),
          report_count = (
            SELECT COUNT(*)
            FROM reports
            WHERE profile_id = $1
          )
        WHERE id = $1
        RETURNING *`,
      [
        targetProfileId,
        nextInstagramHandle,
        nextInstagramUrl,
        nextLinkedInSlug,
        nextLinkedInUrl,
        nextExpiry,
      ],
    );

    await client.query(`DELETE FROM profiles WHERE id = $1`, [sourceProfileId]);

    return serializeProfile(updatedTarget.rows[0]);
  });
}

export async function expireProfiles() {
  const result = await query<{ id: string }>(
    `UPDATE profiles
      SET status = 'expired', updated_at = NOW()
      WHERE status IN ('active', 'flagged') AND expires_at <= NOW()
      RETURNING id`,
  );

  return { expiredCount: result.rowCount ?? 0 };
}
