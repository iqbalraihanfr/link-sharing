import { InstagramIcon, LinkedInIcon } from "@/components/icons";
import { ReportButton } from "@/components/report-button";
import type { PublicProfile } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ProfileCard({ profile }: { profile: PublicProfile }) {
  return (
    <article className="profile-card">
      <div className="profile-card-top">
        <div>
          <p className="eyebrow">Card</p>
          <h3 className="profile-name">{profile.displayName}</h3>
        </div>
        <ReportButton profileId={profile.id} />
      </div>

      <div className="profile-links">
        {profile.instagramHandle ? (
          <a
            className="social-link"
            href={profile.instagramUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <InstagramIcon className="h-5 w-5" />
            <span>@{profile.instagramHandle}</span>
          </a>
        ) : null}

        {profile.linkedinSlug ? (
          <a
            className="social-link"
            href={profile.linkedinUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <LinkedInIcon className="h-5 w-5" />
            <span>{profile.linkedinSlug}</span>
          </a>
        ) : null}
      </div>

      <div className="profile-meta">
        <span>Updated {formatDate(profile.updatedAt)}</span>
        <span>Active until {formatDate(profile.expiresAt)}</span>
      </div>
    </article>
  );
}
