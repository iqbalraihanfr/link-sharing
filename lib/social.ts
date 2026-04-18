import { AppError } from "@/lib/errors";
import type {
  CreateProfileInput,
  DirectoryFilters,
  NormalizedProfileInput,
  PlatformFilter,
} from "@/lib/types";

const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);
const LINKEDIN_HOSTS = new Set(["linkedin.com", "www.linkedin.com"]);

const INSTAGRAM_HANDLE_PATTERN = /^[a-z0-9._]{1,30}$/;
const LINKEDIN_SLUG_PATTERN = /^[a-z0-9-]{3,100}$/;
const GENERIC_DISPLAY_NAME_TOKENS = new Set([
  "test",
  "testing",
  "tes",
  "coba",
  "dummy",
  "sample",
  "contoh",
  "trial",
]);
const GENERIC_DISPLAY_NAME_FILLER_TOKENS = new Set([
  "aja",
  "doang",
  "dulu",
  "dong",
  "nih",
  "1",
  "12",
  "123",
]);

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseMaybeUrl(input: string) {
  if (!input.includes("/") && !input.includes(".")) return null;

  const withProtocol =
    input.startsWith("http://") || input.startsWith("https://")
      ? input
      : `https://${input}`;

  try {
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

function cleanInput(value?: string | null) {
  if (!value) return "";
  return collapseWhitespace(value);
}

function isGenericDisplayName(value: string) {
  const tokens = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) return false;

  const allowedTokens = new Set([
    ...GENERIC_DISPLAY_NAME_TOKENS,
    ...GENERIC_DISPLAY_NAME_FILLER_TOKENS,
  ]);

  return (
    tokens.some((token) => GENERIC_DISPLAY_NAME_TOKENS.has(token)) &&
    tokens.every((token) => allowedTokens.has(token))
  );
}

export function buildInstagramUrl(handle: string) {
  return `https://www.instagram.com/${handle}/`;
}

export function buildLinkedInUrl(slug: string) {
  return `https://www.linkedin.com/in/${slug}/`;
}

export function normalizeDisplayName(value: string) {
  const normalized = collapseWhitespace(value);

  if (normalized.length < 2 || normalized.length > 80) {
    throw new AppError("Nama harus di antara 2 sampai 80 karakter.", {
      status: 422,
      code: "INVALID_NAME",
    });
  }

  // Reject obvious placeholder submissions before they reach storage.
  if (isGenericDisplayName(normalized)) {
    throw new AppError("Nama seperti test, tes, atau coba tidak boleh dipakai.", {
      status: 422,
      code: "GENERIC_NAME_BLOCKED",
    });
  }

  return normalized;
}

export function normalizeInstagramInput(input?: string | null) {
  const cleaned = cleanInput(input);
  if (!cleaned) return null;

  const url = parseMaybeUrl(cleaned);
  let candidate = cleaned;

  if (url) {
    if (!INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) {
      throw new AppError("Link Instagram harus memakai domain instagram.com.", {
        status: 422,
        code: "INVALID_INSTAGRAM",
      });
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length !== 1) {
      throw new AppError("Link Instagram harus menuju satu username.", {
        status: 422,
        code: "INVALID_INSTAGRAM",
      });
    }

    [candidate] = segments;
  }

  candidate = candidate.replace(/^@/, "").toLowerCase();

  if (!INSTAGRAM_HANDLE_PATTERN.test(candidate)) {
    throw new AppError(
      "Username Instagram hanya boleh berisi huruf, angka, titik, atau underscore.",
      {
        status: 422,
        code: "INVALID_INSTAGRAM",
      },
    );
  }

  return candidate;
}

export function normalizeLinkedInInput(input?: string | null) {
  const cleaned = cleanInput(input);
  if (!cleaned) return null;

  const url = parseMaybeUrl(cleaned);
  let candidate = cleaned;

  if (url) {
    if (!LINKEDIN_HOSTS.has(url.hostname.toLowerCase())) {
      throw new AppError("Link LinkedIn harus memakai domain linkedin.com.", {
        status: 422,
        code: "INVALID_LINKEDIN",
      });
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length !== 2 || segments[0] !== "in") {
      throw new AppError("LinkedIn hanya mendukung profil personal `/in/slug`.", {
        status: 422,
        code: "INVALID_LINKEDIN",
      });
    }

    candidate = segments[1];
  } else {
    candidate = candidate.replace(/^\/?in\//i, "");
  }

  candidate = candidate.toLowerCase();

  if (!LINKEDIN_SLUG_PATTERN.test(candidate)) {
    throw new AppError(
      "Slug LinkedIn hanya boleh berisi huruf, angka, dan tanda hubung.",
      {
        status: 422,
        code: "INVALID_LINKEDIN",
      },
    );
  }

  return candidate;
}

export function normalizeProfileInput(
  input: CreateProfileInput,
): NormalizedProfileInput {
  const displayName = normalizeDisplayName(input.displayName);
  const instagramHandle = normalizeInstagramInput(input.instagramInput);
  const linkedinSlug = normalizeLinkedInInput(input.linkedinInput);

  if (!instagramHandle && !linkedinSlug) {
    throw new AppError(
      "Isi minimal satu username Instagram atau LinkedIn sebelum submit.",
      {
        status: 422,
        code: "SOCIAL_REQUIRED",
      },
    );
  }

  return {
    displayName,
    instagramHandle,
    linkedinSlug,
    instagramUrl: instagramHandle ? buildInstagramUrl(instagramHandle) : null,
    linkedinUrl: linkedinSlug ? buildLinkedInUrl(linkedinSlug) : null,
  };
}

export function parseDirectoryFilters(
  searchParams: Record<string, string | string[] | undefined>,
): DirectoryFilters {
  const q = typeof searchParams.q === "string" ? collapseWhitespace(searchParams.q) : "";
  const rawPlatform =
    typeof searchParams.platform === "string" ? searchParams.platform : "all";
  const pageParam = typeof searchParams.page === "string" ? Number(searchParams.page) : 1;

  const platform: PlatformFilter =
    rawPlatform === "instagram" || rawPlatform === "linkedin"
      ? rawPlatform
      : "all";

  return {
    q,
    platform,
    page: Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1,
    pageSize: 20,
  };
}

export function normalizeReportReason(value?: string | null) {
  const cleaned = cleanInput(value);
  if (!cleaned) return null;

  return cleaned.slice(0, 280);
}
