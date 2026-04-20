"use client";

import { useEffect, useRef, useState } from "react";
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
  instagramHandle: "iqbalrhaan",
  linkedinSlug: "iqbalraihanfr",
  githubUsername: "iqbalraihanfr",
  instagramUrl: "https://instagram.com/iqbalrhaan",
  linkedinUrl: "https://linkedin.com/in/iqbalraihanfr",
  githubUrl: "https://github.com/iqbalraihanfr",
  status: "active",
  reportCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString(),
};

export function AboutCreator() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  function openDialog() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    requestAnimationFrame(() => setIsOpen(true));
  }

  function closeDialog() {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open) return;

    setIsOpen(false);

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      dialog.close();
      closeTimerRef.current = null;
    }, 180);
  }

  return (
    <>
      <button
        type="button"
        // Force flex row, small text, low opacity, centered
        className="flex flex-row items-center justify-center gap-1.5 bg-transparent border-none p-2 mx-auto cursor-pointer opacity-30 hover:opacity-70 hover:-translate-y-px transition-all"
        onClick={openDialog}
      >
        <InfoIcon className="w-4 h-4 shrink-0 text-[var(--color-ink)]" />
        <span className="text-xs font-medium text-[var(--color-ink)]">about the creator</span>
      </button>

      <dialog
        ref={dialogRef}
        className={`creator-dialog ${isOpen ? "creator-dialog-open" : ""}`}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDialog();
        }}
        onCancel={(e) => {
          e.preventDefault();
          closeDialog();
        }}
      >
        <div className="creator-dialog-shell">
          <div className="creator-dialog-content">
            <button
              type="button"
              className="creator-dialog-close"
              onClick={closeDialog}
              aria-label="Close"
            >
              &times;
            </button>
            <ProfileCard
              profile={AUTHOR_PROFILE}
              showActions={false}
              className="creator-profile-card"
            />
          </div>
        </div>
      </dialog>
    </>
  );
}
