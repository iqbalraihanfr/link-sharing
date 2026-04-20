"use client";

import { useEffect, useState } from "react";

export function RelativeTime({
  date,
  type,
}: {
  date: string;
  type: "updated" | "expires";
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const d = new Date(date);
  const fallback = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);

  const fallbackStr = type === "updated" ? `Updated ${fallback}` : `Active until ${fallback}`;

  // SSR phase: return standard format to prevent mismatch
  if (!mounted) {
    return <span>{fallbackStr}</span>;
  }

  const now = new Date();

  if (type === "updated") {
    const diffMs = Math.max(0, now.getTime() - d.getTime());
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let text;
    if (diffMins < 1) text = "just now";
    else if (diffMins < 60) text = `${diffMins}m ago`;
    else if (diffHours < 24) text = `${diffHours}h ago`;
    else if (diffDays === 1) text = "yesterday";
    else if (diffDays <= 14) text = `${diffDays} days ago`;
    else text = fallback;

    return <span>Updated {text}</span>;
  }

  // Expires
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);

  let text;
  let isUrgent = false;

  if (diffMs <= 0) {
    text = "Expired";
    isUrgent = true;
  } else if (diffDays === 1) {
    text = "Expires today";
    isUrgent = true;
  } else {
    text = `Expires in ${diffDays} days`;
    if (diffDays <= 3) isUrgent = true;
  }

  if (isUrgent) {
    return (
      <span
        style={{
          background: "rgba(178, 58, 48, 0.08)",
          color: "var(--color-danger)",
          padding: "0.15rem 0.6rem",
          borderRadius: "999px",
          fontWeight: 600,
          marginLeft: "-0.4rem"
        }}
      >
        {text}
      </span>
    );
  }

  return <span>{text}</span>;
}
