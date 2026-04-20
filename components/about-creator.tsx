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
        // Force flex row, small text, low opacity, centered
        className="flex flex-row items-center justify-center gap-1.5 bg-transparent border-none p-2 mx-auto cursor-pointer opacity-30 hover:opacity-70 hover:-translate-y-px transition-all"
        onClick={() => dialogRef.current?.showModal()}
      >
        <InfoIcon className="w-4 h-4 shrink-0 text-[var(--color-ink)]" />
        <span className="text-xs font-medium text-[var(--color-ink)]">about the creator</span>
      </button>

      <dialog
        ref={dialogRef}
        // Force absolute centering
        className="creator-dialog m-auto p-0 border-0 bg-transparent w-[90vw] max-w-[400px] shadow-2xl rounded-[2rem]"
        onClick={(e) => {
          // close if clicking directly on the dialog backdrop
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="creator-dialog-content relative rounded-[2rem] bg-[var(--color-paper)]">
          <button
            type="button"
            className="creator-dialog-close absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center rounded-full border border-[rgba(82,68,48,0.12)] bg-white text-[var(--color-muted)] text-xl cursor-pointer z-10 shadow hover:text-[var(--color-danger)] hover:scale-110 transition-all"
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
