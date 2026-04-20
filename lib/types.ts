export type ProfileStatus = "active" | "flagged" | "hidden" | "expired";

export type PlatformFilter = "all" | "instagram" | "linkedin" | "github";

export interface PublicProfile {
  id: string;
  displayName: string;
  instagramHandle: string | null;
  linkedinSlug: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  githubUsername: string | null;
  githubUrl: string | null;
  status: ProfileStatus;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface DirectoryFilters {
  q: string;
  platform: PlatformFilter;
  page: number;
  pageSize: number;
}

export interface DirectorySummary {
  activeCount: number;
  instagramCount: number;
  linkedinCount: number;
  githubCount: number;
}

export interface DirectoryResult {
  items: PublicProfile[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: DirectorySummary;
}

export interface CreateProfileInput {
  displayName: string;
  instagramInput?: string | null;
  linkedinInput?: string | null;
  githubInput?: string | null;
}

export type UpdateProfileInput = CreateProfileInput;

export interface NormalizedProfileInput {
  displayName: string;
  instagramHandle: string | null;
  linkedinSlug: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  githubUsername: string | null;
  githubUrl: string | null;
}

export interface AdminReport {
  id: string;
  profileId: string;
  profileName: string;
  reason: string | null;
  createdAt: string;
  reporterIpHash: string;
}

export interface AdminSnapshot {
  profiles: PublicProfile[];
  reports: AdminReport[];
}
