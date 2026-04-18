import Link from "next/link";

import type { PlatformFilter } from "@/lib/types";

function buildHref(page: number, q: string, platform: PlatformFilter) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (platform !== "all") params.set("platform", platform);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function getVisiblePages(current: number, total: number) {
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((left, right) => left - right);
}

export function Pagination({
  page,
  totalPages,
  q,
  platform,
}: {
  page: number;
  totalPages: number;
  q: string;
  platform: PlatformFilter;
}) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(page, totalPages);

  return (
    <nav className="pagination-wrap" aria-label="Pagination">
      <Link
        className={`chip-link ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
        href={buildHref(page - 1, q, platform)}
      >
        Previous
      </Link>
      {pages.map((item) => (
        <Link
          key={item}
          className={`chip-link ${item === page ? "chip-link-active" : ""}`}
          href={buildHref(item, q, platform)}
        >
          {item}
        </Link>
      ))}
      <Link
        className={`chip-link ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
        href={buildHref(page + 1, q, platform)}
      >
        Next
      </Link>
    </nav>
  );
}
