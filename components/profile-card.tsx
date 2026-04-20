import { GitHubIcon, InstagramIcon, LinkedInIcon } from "@/components/icons";
import { ReportButton } from "@/components/report-button";
import { OwnedEditButton } from "@/components/owned-edit-button";
import { RelativeTime } from "@/components/relative-time";
import type { PublicProfile } from "@/lib/types";

function formatLinkedInLabel(slug: string, displayName: string) {
  const cleaned = slug.replace(/-\d{5,}$/u, "");

  if (cleaned !== slug && cleaned.includes("-")) {
    return cleaned
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  if (cleaned !== slug) {
    return displayName;
  }

  return slug;
}

export function ProfileCard({ profile }: { profile: PublicProfile }) {
  const linkedInLabel = profile.linkedinSlug
    ? formatLinkedInLabel(profile.linkedinSlug, profile.displayName)
    : null;

  return (
    <article className="profile-card">
      <ReportButton profileId={profile.id} />
      <OwnedEditButton profileId={profile.id} />

      <div className="profile-card-top">
        <div>
          <p className="eyebrow">Card</p>
          <h3 className="profile-name">{profile.displayName}</h3>
        </div>
      </div>

      <div className="profile-links">
        {profile.instagramHandle ? (
          <a
            className="social-link social-link-instagram"
            href={profile.instagramUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <InstagramIcon className="social-icon social-icon-instagram" />
            <span>@{profile.instagramHandle}</span>
          </a>
        ) : null}

        {profile.linkedinSlug ? (
          <a
            className="social-link social-link-linkedin"
            href={profile.linkedinUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer nofollow"
            title={profile.linkedinSlug}
          >
            <LinkedInIcon className="social-icon social-icon-linkedin" />
            <span>{linkedInLabel}</span>
          </a>
        ) : null}

        {profile.githubUsername ? (
          <a
            className="social-link social-link-github"
            href={profile.githubUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <GitHubIcon className="social-icon social-icon-github" />
            <span>{profile.githubUsername}</span>
          </a>
        ) : null}
      </div>

      <div className="profile-meta">
        <RelativeTime date={profile.updatedAt} type="updated" />
        <RelativeTime date={profile.expiresAt} type="expires" />
      </div>
    </article>
  );
}
