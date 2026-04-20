"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EditIcon } from "@/components/icons";

export function OwnedEditButton({ profileId }: { profileId: string }) {
  const [editUrl, setEditUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("link_sharing_owned");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[profileId]) {
          setEditUrl(parsed[profileId]);
        }
      }
    } catch {}
  }, [profileId]);

  if (!editUrl) return null;

  return (
    <Link
      href={editUrl}
      className="report-icon-button"
      style={{ right: "3.2rem" }}
      title="Edit Card"
      aria-label="Edit Card"
    >
      <EditIcon className="report-icon-svg" />
    </Link>
  );
}
