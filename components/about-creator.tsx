"use client";

import { useRef } from "react";
import { ProfileCard } from "@/components/profile-card";
import type { PublicProfile } from "@/lib/types";

// Adding icon inline here for simplicity but it could be in icons.tsx
function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="10" strokeWidth="1.8" />
      <path strokeWidth="1.8" strokeLinecap="round" d="M12 16v-4m0-4h.01" />
    </svg>
  );
}

const AUTHOR_PROFILE: PublicProfile = {
  id: "author-easter-egg",
  displayName: "Iqbal Raihan",
  instagramHandle: "iqbalehan",
  linkedinSlug: "iqbalraihan",
  githubUsername: "iqbalraihanfr",
  instagramUrl: "https://instagram.com/iqbalehan",
  linkedinUrl: "https://linkedin.com/in/iqbalraihan",
  githubUrl: "https://github.com/iqbalraihanfr",
  status: "active",
  reportCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString(),
};

export function AboutCreator() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="footer-creator-btn"
        onClick={() => dialogRef.current?.showModal()}
      >
        <InfoIcon />
        <span>about the creator</span>
      </button>

      <dialog
        ref={dialogRef}
        className="creator-dialog"
        onClick={(e) => {
          // close if clicking directly on the dialog backdrop
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="creator-dialog-content">
          <button
            type="button"
            className="creator-dialog-close"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
          >
            &times;
          </button>
          <ProfileCard profile={AUTHOR_PROFILE} />
        </div>
      </dialog>
    </>
  );
}
