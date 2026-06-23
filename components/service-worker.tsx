"use client";

import { useEffect } from "react";

// Registers the offline service worker (production only — a SW in dev fights
// with hot reload). Safe no-op where service workers aren't supported.
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is a progressive enhancement; ignore failures.
    });
  }, []);

  return null;
}
